from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os, uuid, logging, bcrypt, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = os.environ.get("JWT_ALGO", "HS256")
ACCESS_MIN = int(os.environ.get("ACCESS_TOKEN_MINUTES", "1440"))

app = FastAPI(title="Elaya API")
api = APIRouter(prefix="/api")
oauth = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

Role = Literal["customer", "flower_owner", "admin"]

# ---------- Models ----------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = "customer"
    shop_name: Optional[str] = None
    location: Optional[str] = None

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    status: str = "active"
    created_at: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class ProductIn(BaseModel):
    name: str
    category: Optional[str] = None
    description: Optional[str] = ""
    image: Optional[str] = None
    price: float
    stock: int = 0
    availability: bool = True
    colors: Optional[List[str]] = None
    flowers_included: Optional[List[str]] = None
    number_of_flowers: Optional[int] = None
    wrapping: Optional[str] = None
    ribbon: Optional[str] = None
    style: Optional[str] = None

class ShopIn(BaseModel):
    shop_name: str
    description: Optional[str] = ""
    location: Optional[str] = "Biñan, Laguna"
    image: Optional[str] = None
    contact: Optional[str] = None

class OrderItemIn(BaseModel):
    product_id: str
    product_type: str
    shop_id: str
    name: str
    image: Optional[str] = None
    unit_price: float
    quantity: int = 1
    customization: Optional[dict] = None

class OrderIn(BaseModel):
    items: List[OrderItemIn]
    delivery_address: str
    delivery_lat: Optional[float] = 14.3419
    delivery_lng: Optional[float] = 121.0803
    notes: Optional[str] = ""
    payment_method: str = "cod"

class OrderStatusIn(BaseModel):
    status: Literal["pending", "confirmed", "preparing", "ready_for_delivery", "out_for_delivery", "completed", "cancelled"]

class RiderLocationIn(BaseModel):
    lat: float
    lng: float

# ---------- Utils ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_pw(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()

def verify_pw(p: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), h.encode())
    except Exception:
        return False

def make_token(user: dict) -> str:
    now = datetime.now(timezone.utc)
    payload = {"sub": user["id"], "role": user["role"], "iat": now, "exp": now + timedelta(minutes=ACCESS_MIN)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)

def public_user(u: dict) -> UserOut:
    return UserOut(id=u["id"], name=u["name"], email=u["email"], role=u["role"],
                   status=u.get("status", "active"), created_at=u.get("created_at", ""))

async def get_current_user(token: str = Depends(oauth)) -> dict:
    err = HTTPException(401, "Invalid or expired token", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        uid = payload.get("sub")
        if not uid: raise err
        user = await db.users.find_one({"id": uid}, {"_id": 0})
        if not user or user.get("status") != "active": raise err
        return user
    except jwt.PyJWTError:
        raise err

def require(*roles: str):
    async def dep(u: dict = Depends(get_current_user)) -> dict:
        if u["role"] not in roles:
            raise HTTPException(403, "Insufficient role")
        return u
    return dep

# ---------- Auth ----------
@api.post("/auth/register", response_model=TokenOut)
async def register(data: RegisterIn):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Email already registered")
    uid = str(uuid.uuid4())
    user = {"id": uid, "name": data.name, "email": email, "password_hash": hash_pw(data.password),
            "role": data.role, "status": "active", "created_at": now_iso()}
    await db.users.insert_one(user)
    if data.role == "flower_owner":
        shop = {"id": str(uuid.uuid4()), "owner_id": uid,
                "shop_name": data.shop_name or f"{data.name}'s Flowers",
                "description": "Fresh floral arrangements crafted with love",
                "location": data.location or "Biñan, Laguna",
                "image": "https://images.unsplash.com/photo-1771856558087-80f35365c3bb?w=800",
                "contact": "", "status": "active", "created_at": now_iso()}
        await db.shops.insert_one(shop)
    return TokenOut(access_token=make_token(user), user=public_user(user))

@api.post("/auth/login", response_model=TokenOut)
async def login(data: LoginIn):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    if user.get("status") != "active":
        raise HTTPException(403, "Account disabled")
    return TokenOut(access_token=make_token(user), user=public_user(user))

@api.get("/auth/me", response_model=UserOut)
async def me(u=Depends(get_current_user)):
    return public_user(u)

# ---------- Shops ----------
@api.get("/shops")
async def list_shops():
    shops = await db.shops.find({}, {"_id": 0}).to_list(500)
    for s in shops:
        s["product_count"] = await db.products.count_documents({"shop_id": s["id"]})
    return shops

@api.get("/shops/mine")
async def my_shop(u=Depends(require("flower_owner"))):
    shop = await db.shops.find_one({"owner_id": u["id"]}, {"_id": 0})
    if not shop: raise HTTPException(404, "Shop not found")
    return shop

@api.put("/shops/mine")
async def update_my_shop(data: ShopIn, u=Depends(require("flower_owner"))):
    await db.shops.update_one({"owner_id": u["id"]}, {"$set": data.model_dump()})
    return await db.shops.find_one({"owner_id": u["id"]}, {"_id": 0})

@api.patch("/admin/shops/{shop_id}/status")
async def admin_shop_status(shop_id: str, new_status: str, u=Depends(require("admin"))):
    await db.shops.update_one({"id": shop_id}, {"$set": {"status": new_status}})
    return {"ok": True}

# ---------- Products ----------
@api.get("/products")
async def list_products(product_type: Optional[str] = None, shop_id: Optional[str] = None):
    q = {}
    if product_type: q["product_type"] = product_type
    if shop_id: q["shop_id"] = shop_id
    return await db.products.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)

@api.get("/products/{pid}")
async def get_product(pid: str):
    p = await db.products.find_one({"id": pid}, {"_id": 0})
    if not p: raise HTTPException(404, "Not found")
    return p

async def _add_product(kind: str, data: ProductIn, u: dict):
    shop = await db.shops.find_one({"owner_id": u["id"]})
    if not shop: raise HTTPException(400, "No shop")
    p = {"id": str(uuid.uuid4()), "shop_id": shop["id"], "owner_id": u["id"], "product_type": kind,
         **data.model_dump(), "status": "active", "created_at": now_iso()}
    await db.products.insert_one(p)
    p.pop("_id", None)
    return p

@api.post("/owner/flowers")
async def add_flower(data: ProductIn, u=Depends(require("flower_owner"))):
    return await _add_product("flower", data, u)

@api.post("/owner/bouquets")
async def add_bouquet(data: ProductIn, u=Depends(require("flower_owner"))):
    return await _add_product("bouquet", data, u)

@api.post("/owner/wrappings")
async def add_wrapping(data: ProductIn, u=Depends(require("flower_owner"))):
    return await _add_product("wrapping", data, u)

@api.get("/owner/products")
async def my_products(u=Depends(require("flower_owner"))):
    return await db.products.find({"owner_id": u["id"]}, {"_id": 0}).to_list(1000)

@api.put("/owner/products/{pid}")
async def update_product(pid: str, data: ProductIn, u=Depends(require("flower_owner"))):
    p = await db.products.find_one({"id": pid})
    if not p: raise HTTPException(404, "Not found")
    if p["owner_id"] != u["id"]: raise HTTPException(403, "Not your product")
    await db.products.update_one({"id": pid}, {"$set": data.model_dump()})
    return await db.products.find_one({"id": pid}, {"_id": 0})

@api.delete("/owner/products/{pid}")
async def delete_product(pid: str, u=Depends(require("flower_owner"))):
    p = await db.products.find_one({"id": pid})
    if not p: raise HTTPException(404, "Not found")
    if p["owner_id"] != u["id"]: raise HTTPException(403, "Not your product")
    await db.products.delete_one({"id": pid})
    return {"ok": True}

# ---------- Orders ----------
@api.post("/orders")
async def create_order(data: OrderIn, u=Depends(require("customer"))):
    total = sum(i.unit_price * i.quantity for i in data.items)
    oid = str(uuid.uuid4())
    order = {"id": oid, "order_no": f"ELY-{oid[:6].upper()}",
             "customer_id": u["id"], "customer_name": u["name"],
             "items": [i.model_dump() for i in data.items],
             "shop_ids": list({i.shop_id for i in data.items}),
             "delivery_address": data.delivery_address,
             "delivery_lat": data.delivery_lat, "delivery_lng": data.delivery_lng,
             "notes": data.notes, "payment_method": data.payment_method,
             "payment_status": "unpaid", "status": "pending",
             "total": total, "created_at": now_iso(),
             "rider_lat": 14.3419, "rider_lng": 121.0803}
    await db.orders.insert_one(order)
    order.pop("_id", None)
    return order

@api.get("/orders/mine")
async def my_orders(u=Depends(require("customer"))):
    return await db.orders.find({"customer_id": u["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.get("/orders/{oid}")
async def order_detail(oid: str, u=Depends(get_current_user)):
    o = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not o: raise HTTPException(404, "Not found")
    if u["role"] == "customer" and o["customer_id"] != u["id"]:
        raise HTTPException(403)
    if u["role"] == "flower_owner":
        shop = await db.shops.find_one({"owner_id": u["id"]})
        if not shop or shop["id"] not in o["shop_ids"]:
            raise HTTPException(403)
    return o

@api.get("/owner/orders")
async def owner_orders(u=Depends(require("flower_owner"))):
    shop = await db.shops.find_one({"owner_id": u["id"]})
    if not shop: return []
    return await db.orders.find({"shop_ids": shop["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.patch("/owner/orders/{oid}/status")
async def update_status(oid: str, data: OrderStatusIn, u=Depends(require("flower_owner"))):
    shop = await db.shops.find_one({"owner_id": u["id"]})
    if not shop: raise HTTPException(400)
    o = await db.orders.find_one({"id": oid})
    if not o or shop["id"] not in o["shop_ids"]: raise HTTPException(403)
    await db.orders.update_one({"id": oid}, {"$set": {"status": data.status, "updated_at": now_iso()}})
    return await db.orders.find_one({"id": oid}, {"_id": 0})

@api.patch("/owner/orders/{oid}/rider")
async def update_rider(oid: str, data: RiderLocationIn, u=Depends(require("flower_owner"))):
    await db.orders.update_one({"id": oid}, {"$set": {"rider_lat": data.lat, "rider_lng": data.lng}})
    return {"ok": True}

# ---------- Admin ----------
@api.get("/admin/overview")
async def admin_overview(u=Depends(require("admin"))):
    revenue_docs = await db.orders.find({"status": "completed"}, {"_id": 0, "total": 1}).to_list(10000)
    return {
        "total_customers": await db.users.count_documents({"role": "customer"}),
        "total_owners": await db.users.count_documents({"role": "flower_owner"}),
        "total_shops": await db.shops.count_documents({}),
        "total_products": await db.products.count_documents({}),
        "total_flowers": await db.products.count_documents({"product_type": "flower"}),
        "total_bouquets": await db.products.count_documents({"product_type": "bouquet"}),
        "total_wrappings": await db.products.count_documents({"product_type": "wrapping"}),
        "total_orders": await db.orders.count_documents({}),
        "pending_orders": await db.orders.count_documents({"status": "pending"}),
        "completed_orders": await db.orders.count_documents({"status": "completed"}),
        "revenue": sum(o.get("total", 0) for o in revenue_docs),
    }

@api.get("/admin/users")
async def admin_users(u=Depends(require("admin"))):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)

@api.patch("/admin/users/{uid}/status")
async def admin_user_status(uid: str, new_status: str, u=Depends(require("admin"))):
    await db.users.update_one({"id": uid}, {"$set": {"status": new_status}})
    return {"ok": True}

@api.get("/admin/orders")
async def admin_orders(u=Depends(require("admin"))):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)

# ---------- Favorites ----------
@api.post("/favorites/{pid}")
async def add_fav(pid: str, u=Depends(require("customer"))):
    await db.favorites.update_one({"user_id": u["id"], "product_id": pid},
                                  {"$setOnInsert": {"user_id": u["id"], "product_id": pid, "created_at": now_iso()}}, upsert=True)
    return {"ok": True}

@api.delete("/favorites/{pid}")
async def rm_fav(pid: str, u=Depends(require("customer"))):
    await db.favorites.delete_one({"user_id": u["id"], "product_id": pid})
    return {"ok": True}

@api.get("/favorites")
async def list_favs(u=Depends(require("customer"))):
    favs = await db.favorites.find({"user_id": u["id"]}, {"_id": 0}).to_list(1000)
    ids = [f["product_id"] for f in favs]
    return await db.products.find({"id": {"$in": ids}}, {"_id": 0}).to_list(1000)

@api.get("/")
async def root():
    return {"message": "Elaya API"}

# ---------- Seed ----------
async def seed():
    if await db.users.count_documents({}) > 0:
        return
    admin = {"id": str(uuid.uuid4()), "name": "Admin", "email": "admin@elaya.ph", "password_hash": hash_pw("Admin123!"), "role": "admin", "status": "active", "created_at": now_iso()}
    customer = {"id": str(uuid.uuid4()), "name": "Maria Santos", "email": "customer@elaya.ph", "password_hash": hash_pw("Customer123!"), "role": "customer", "status": "active", "created_at": now_iso()}
    owner = {"id": str(uuid.uuid4()), "name": "Ana Reyes", "email": "owner@elaya.ph", "password_hash": hash_pw("Owner123!"), "role": "flower_owner", "status": "active", "created_at": now_iso()}
    owner2 = {"id": str(uuid.uuid4()), "name": "Bea Cruz", "email": "owner2@elaya.ph", "password_hash": hash_pw("Owner123!"), "role": "flower_owner", "status": "active", "created_at": now_iso()}
    await db.users.insert_many([admin, customer, owner, owner2])

    shop1 = {"id": str(uuid.uuid4()), "owner_id": owner["id"], "shop_name": "Bloom & Petal", "description": "Handcrafted bouquets in Biñan", "location": "Biñan, Laguna", "image": "https://images.unsplash.com/photo-1771856558087-80f35365c3bb?w=800", "contact": "0917-100-2001", "status": "active", "created_at": now_iso()}
    shop2 = {"id": str(uuid.uuid4()), "owner_id": owner2["id"], "shop_name": "Rosa Del Sol", "description": "Sun-kissed roses & lilies", "location": "Biñan, Laguna", "image": "https://images.pexels.com/photos/6720583/pexels-photo-6720583.jpeg?w=800", "contact": "0917-100-2002", "status": "active", "created_at": now_iso()}
    await db.shops.insert_many([shop1, shop2])

    flowers = [
        {"name": "Red Rose", "category": "Roses", "colors": ["#B91C1C", "#E11D48"], "price": 50, "stock": 200, "image": "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600"},
        {"name": "White Lily", "category": "Lilies", "colors": ["#FFFFFF", "#F5F5F5"], "price": 65, "stock": 120, "image": "https://images.unsplash.com/photo-1587304975230-2ce70e2f8a25?w=600"},
        {"name": "Pink Tulip", "category": "Tulips", "colors": ["#FF7EB3", "#FF758C"], "price": 75, "stock": 90, "image": "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=600"},
        {"name": "Sunflower", "category": "Sunflowers", "colors": ["#FBBF24", "#F59E0B"], "price": 55, "stock": 150, "image": "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=600"},
        {"name": "Baby's Breath", "category": "Fillers", "colors": ["#FFFFFF"], "price": 30, "stock": 300, "image": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600"},
        {"name": "Purple Orchid", "category": "Orchids", "colors": ["#A855F7", "#C084FC"], "price": 120, "stock": 40, "image": "https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600"},
    ]
    bouquets = [
        {"name": "Romantic Red Roses", "flowers_included": ["Red Rose"], "number_of_flowers": 12, "wrapping": "White Wrapper", "ribbon": "Red Ribbon", "price": 850, "stock": 15, "image": "https://images.unsplash.com/photo-1561848355-890d054dc55a?w=800", "description": "Classic dozen red roses for love"},
        {"name": "Pink Blush Bouquet", "flowers_included": ["Pink Tulip", "Baby's Breath"], "number_of_flowers": 15, "wrapping": "Kraft Paper", "ribbon": "Pink Ribbon", "price": 950, "stock": 10, "image": "https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=800", "description": "Soft pastel arrangement"},
        {"name": "Sunny Delight", "flowers_included": ["Sunflower"], "number_of_flowers": 8, "wrapping": "Cream Wrapper", "ribbon": "Yellow Ribbon", "price": 780, "stock": 12, "image": "https://images.pexels.com/photos/20278829/pexels-photo-20278829.jpeg?w=800", "description": "Bright sunflowers to brighten any day"},
    ]
    wrappings = [
        {"name": "Kraft Paper", "style": "Rustic", "colors": ["#B8845C"], "price": 40, "stock": 100, "image": "https://images.unsplash.com/photo-1513521319767-8b7a0d21e7d8?w=400"},
        {"name": "White Wrapper", "style": "Elegant", "colors": ["#FFFFFF"], "price": 45, "stock": 100, "image": "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400"},
        {"name": "Pink Wrapper", "style": "Romantic", "colors": ["#FF7EB3"], "price": 50, "stock": 80, "image": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400"},
        {"name": "Cream Wrapper", "style": "Vintage", "colors": ["#F5E6D3"], "price": 45, "stock": 90, "image": "https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=400"},
        {"name": "Transparent Wrap", "style": "Modern", "colors": ["#FFFFFF"], "price": 35, "stock": 120, "image": "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400"},
    ]
    shops = [shop1, shop2]
    for i, f in enumerate(flowers):
        s = shops[i % 2]
        await db.products.insert_one({"id": str(uuid.uuid4()), "shop_id": s["id"], "owner_id": s["owner_id"], "product_type": "flower", "description": f"Fresh {f['name']}", "availability": True, "status": "active", "created_at": now_iso(), **f})
    for i, b in enumerate(bouquets):
        s = shops[i % 2]
        await db.products.insert_one({"id": str(uuid.uuid4()), "shop_id": s["id"], "owner_id": s["owner_id"], "product_type": "bouquet", "availability": True, "status": "active", "created_at": now_iso(), **b})
    for i, w in enumerate(wrappings):
        s = shops[i % 2]
        await db.products.insert_one({"id": str(uuid.uuid4()), "shop_id": s["id"], "owner_id": s["owner_id"], "product_type": "wrapping", "description": f"{w['style']} wrap", "availability": True, "status": "active", "created_at": now_iso(), **w})
    logger.info("Seeded demo data")

app.include_router(api)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_start():
    await seed()

@app.on_event("shutdown")
async def on_stop():
    client.close()
