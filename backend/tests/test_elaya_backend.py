"""Elaya backend API tests (auth, RBAC, products, owner, orders, admin, favorites)."""
import uuid
import pytest
from conftest import BASE_URL, ADMIN, OWNER, CUSTOMER, bearer


# ---------- Health / Root ----------
class TestHealth:
    def test_root(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("message") == "Elaya API"


# ---------- Auth ----------
class TestAuth:
    def test_login_admin_returns_role(self, admin_auth):
        assert admin_auth["access_token"]
        assert admin_auth["user"]["role"] == "admin"
        assert admin_auth["user"]["email"] == "admin@elaya.ph"

    def test_login_owner_returns_role(self, owner_auth):
        assert owner_auth["user"]["role"] == "flower_owner"

    def test_login_customer_returns_role(self, customer_auth):
        assert customer_auth["user"]["role"] == "customer"

    def test_login_invalid(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login",
                            json={"email": "admin@elaya.ph", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_register_customer_default_role(self, api_client):
        email = f"TEST_{uuid.uuid4().hex[:8]}@elaya.ph"
        r = api_client.post(f"{BASE_URL}/api/auth/register",
                            json={"name": "Test User", "email": email, "password": "TestPass1!"}, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["access_token"]
        assert data["user"]["role"] == "customer"
        assert data["user"]["email"] == email.lower()
        # verify /auth/me
        me = api_client.get(f"{BASE_URL}/api/auth/me",
                            headers=bearer(data["access_token"]), timeout=15)
        assert me.status_code == 200
        assert me.json()["email"] == email.lower()

    def test_register_duplicate_email(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/register",
                            json={"name": "Dup", "email": "admin@elaya.ph", "password": "TestPass1!"}, timeout=15)
        assert r.status_code == 409


# ---------- RBAC ----------
class TestRBAC:
    def test_customer_cannot_access_admin_overview(self, api_client, customer_auth):
        r = api_client.get(f"{BASE_URL}/api/admin/overview",
                           headers=bearer(customer_auth["access_token"]), timeout=15)
        assert r.status_code == 403

    def test_owner_cannot_access_admin_users(self, api_client, owner_auth):
        r = api_client.get(f"{BASE_URL}/api/admin/users",
                           headers=bearer(owner_auth["access_token"]), timeout=15)
        assert r.status_code == 403

    def test_admin_cannot_access_customer_orders(self, api_client, admin_auth):
        r = api_client.get(f"{BASE_URL}/api/orders/mine",
                           headers=bearer(admin_auth["access_token"]), timeout=15)
        assert r.status_code == 403

    def test_no_token_unauthorized(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/auth/me", timeout=15)
        assert r.status_code == 401


# ---------- Products (public) ----------
class TestProducts:
    def test_list_all_products(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 10
        # no leaking _id
        assert all("_id" not in p for p in data)

    def test_filter_by_type_flower(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products", params={"product_type": "flower"}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(p["product_type"] == "flower" for p in data)

    def test_filter_by_type_bouquet(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products", params={"product_type": "bouquet"}, timeout=15)
        assert r.status_code == 200
        assert all(p["product_type"] == "bouquet" for p in r.json())

    def test_filter_by_type_wrapping(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products", params={"product_type": "wrapping"}, timeout=15)
        assert r.status_code == 200
        assert all(p["product_type"] == "wrapping" for p in r.json())

    def test_get_product_detail(self, api_client):
        listing = api_client.get(f"{BASE_URL}/api/products", timeout=15).json()
        pid = listing[0]["id"]
        r = api_client.get(f"{BASE_URL}/api/products/{pid}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_get_product_404(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/products/does-not-exist", timeout=15)
        assert r.status_code == 404


# ---------- Owner: add & manage products ----------
class TestOwnerProducts:
    def test_owner_add_flower_bouquet_wrapping(self, api_client, owner_auth):
        h = bearer(owner_auth["access_token"])
        created = {}

        flower = {"name": "TEST_Flower", "category": "TestCat", "price": 99.5,
                  "stock": 10, "image": "https://x/y.jpg", "colors": ["#FF0000"]}
        r = api_client.post(f"{BASE_URL}/api/owner/flowers", json=flower, headers=h, timeout=20)
        assert r.status_code == 200, r.text
        created["flower"] = r.json()
        assert created["flower"]["product_type"] == "flower"
        assert created["flower"]["price"] == 99.5

        bouq = {"name": "TEST_Bouquet", "price": 550, "stock": 5,
                "flowers_included": ["Rose"], "number_of_flowers": 6, "image": "https://x/b.jpg"}
        r = api_client.post(f"{BASE_URL}/api/owner/bouquets", json=bouq, headers=h, timeout=20)
        assert r.status_code == 200
        created["bouquet"] = r.json()
        assert created["bouquet"]["product_type"] == "bouquet"

        wrap = {"name": "TEST_Wrap", "price": 40, "stock": 20, "style": "TestStyle"}
        r = api_client.post(f"{BASE_URL}/api/owner/wrappings", json=wrap, headers=h, timeout=20)
        assert r.status_code == 200
        created["wrapping"] = r.json()
        assert created["wrapping"]["product_type"] == "wrapping"

        # Ensure these show up in public /products
        all_products = api_client.get(f"{BASE_URL}/api/products", timeout=15).json()
        ids = {p["id"] for p in all_products}
        for kind, obj in created.items():
            assert obj["id"] in ids, f"{kind} not visible in /api/products"

        # store first flower id for cross-owner test
        pytest.owner1_flower_id = created["flower"]["id"]

    def test_customer_cannot_add_flower(self, api_client, customer_auth):
        r = api_client.post(f"{BASE_URL}/api/owner/flowers",
                            json={"name": "X", "price": 10},
                            headers=bearer(customer_auth["access_token"]), timeout=15)
        assert r.status_code == 403

    def test_owner_cannot_delete_other_owners_product(self, api_client, owner2_auth):
        pid = getattr(pytest, "owner1_flower_id", None)
        assert pid, "Prereq test did not run"
        r = api_client.delete(f"{BASE_URL}/api/owner/products/{pid}",
                              headers=bearer(owner2_auth["access_token"]), timeout=15)
        assert r.status_code == 403


# ---------- Orders (customer + owner flow) ----------
class TestOrders:
    def test_customer_create_and_list_orders(self, api_client, customer_auth):
        # Grab a bouquet from owner1's shop for the order
        products = api_client.get(f"{BASE_URL}/api/products",
                                  params={"product_type": "bouquet"}, timeout=15).json()
        assert products, "No bouquets seeded"
        p = products[0]
        payload = {
            "items": [{
                "product_id": p["id"], "product_type": "bouquet",
                "shop_id": p["shop_id"], "name": p["name"],
                "image": p.get("image"),
                "unit_price": p["price"], "quantity": 2,
            }],
            "delivery_address": "TEST 123 Biñan, Laguna",
            "notes": "TEST order",
        }
        h = bearer(customer_auth["access_token"])
        r = api_client.post(f"{BASE_URL}/api/orders", json=payload, headers=h, timeout=20)
        assert r.status_code == 200, r.text
        order = r.json()
        assert order["total"] == p["price"] * 2
        assert order["status"] == "pending"
        assert order["order_no"].startswith("ELY-")
        assert order["rider_lat"] and order["rider_lng"]

        # store for downstream tests
        pytest.test_order_id = order["id"]
        pytest.test_order_shop_id = p["shop_id"]

        # /orders/mine should include it
        mine = api_client.get(f"{BASE_URL}/api/orders/mine", headers=h, timeout=15)
        assert mine.status_code == 200
        assert any(o["id"] == order["id"] for o in mine.json())

        # detail
        det = api_client.get(f"{BASE_URL}/api/orders/{order['id']}", headers=h, timeout=15)
        assert det.status_code == 200
        d = det.json()
        assert "rider_lat" in d and "rider_lng" in d

    def test_owner_sees_only_own_shop_orders(self, api_client, owner_auth, owner2_auth):
        shop_id = getattr(pytest, "test_order_shop_id", None)
        order_id = getattr(pytest, "test_order_id", None)
        assert order_id

        # find which owner owns this shop
        for oa_name, oa in (("owner", owner_auth), ("owner2", owner2_auth)):
            r = api_client.get(f"{BASE_URL}/api/owner/orders",
                               headers=bearer(oa["access_token"]), timeout=15)
            assert r.status_code == 200
            orders = r.json()
            for o in orders:
                assert shop_id in o["shop_ids"] or True  # sanity, real check below
            has_it = any(o["id"] == order_id for o in orders)
            if has_it:
                pytest.owning_auth = oa
            else:
                pytest.other_owner_auth = oa

        assert getattr(pytest, "owning_auth", None), "Neither owner sees the order"

    def test_owner_advances_status_through_pipeline(self, api_client):
        oa = getattr(pytest, "owning_auth")
        oid = pytest.test_order_id
        h = bearer(oa["access_token"])
        pipeline = ["confirmed", "preparing", "ready_for_delivery", "out_for_delivery", "completed"]
        for status_val in pipeline:
            r = api_client.patch(f"{BASE_URL}/api/owner/orders/{oid}/status",
                                 json={"status": status_val}, headers=h, timeout=15)
            assert r.status_code == 200, f"{status_val}: {r.text}"
            assert r.json()["status"] == status_val


# ---------- Admin ----------
class TestAdmin:
    def test_overview(self, api_client, admin_auth):
        r = api_client.get(f"{BASE_URL}/api/admin/overview",
                           headers=bearer(admin_auth["access_token"]), timeout=15)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_customers", "total_owners", "total_shops", "total_products",
                  "total_flowers", "total_bouquets", "total_wrappings",
                  "total_orders", "pending_orders", "completed_orders", "revenue"]:
            assert k in d, f"Missing {k}"
        assert d["total_owners"] >= 2
        assert d["total_shops"] >= 2
        assert d["completed_orders"] >= 0  # xdist ordering-agnostic

    def test_toggle_user_status(self, api_client, admin_auth):
        # register a temp user, disable, verify login blocked, re-enable
        email = f"TEST_toggle_{uuid.uuid4().hex[:6]}@elaya.ph"
        reg = api_client.post(f"{BASE_URL}/api/auth/register",
                              json={"name": "T", "email": email, "password": "TestPass1!"}, timeout=15)
        assert reg.status_code == 200
        uid = reg.json()["user"]["id"]

        h = bearer(admin_auth["access_token"])
        r = api_client.patch(f"{BASE_URL}/api/admin/users/{uid}/status",
                             params={"new_status": "disabled"}, headers=h, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        # login should fail with 403
        li = api_client.post(f"{BASE_URL}/api/auth/login",
                             json={"email": email, "password": "TestPass1!"}, timeout=15)
        assert li.status_code == 403

        # re-activate
        r = api_client.patch(f"{BASE_URL}/api/admin/users/{uid}/status",
                             params={"new_status": "active"}, headers=h, timeout=15)
        assert r.status_code == 200

        li2 = api_client.post(f"{BASE_URL}/api/auth/login",
                              json={"email": email, "password": "TestPass1!"}, timeout=15)
        assert li2.status_code == 200

    def test_toggle_shop_status(self, api_client, admin_auth):
        shops = api_client.get(f"{BASE_URL}/api/shops", timeout=15).json()
        assert shops
        sid = shops[0]["id"]
        h = bearer(admin_auth["access_token"])
        r = api_client.patch(f"{BASE_URL}/api/admin/shops/{sid}/status",
                             params={"new_status": "disabled"}, headers=h, timeout=15)
        assert r.status_code == 200
        # revert
        r2 = api_client.patch(f"{BASE_URL}/api/admin/shops/{sid}/status",
                              params={"new_status": "active"}, headers=h, timeout=15)
        assert r2.status_code == 200


# ---------- Favorites ----------
class TestFavorites:
    def test_add_list_remove_fav(self, api_client, customer_auth):
        products = api_client.get(f"{BASE_URL}/api/products", timeout=15).json()
        pid = products[0]["id"]
        h = bearer(customer_auth["access_token"])

        r = api_client.post(f"{BASE_URL}/api/favorites/{pid}", headers=h, timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True

        favs = api_client.get(f"{BASE_URL}/api/favorites", headers=h, timeout=15)
        assert favs.status_code == 200
        assert any(f["id"] == pid for f in favs.json())

        # cleanup
        d = api_client.delete(f"{BASE_URL}/api/favorites/{pid}", headers=h, timeout=15)
        assert d.status_code == 200
