# Elaya - Multi-Role Flower Marketplace

Elaya is a flower marketplace mobile app operating in Biñan, Laguna, Philippines. It has three distinct roles with completely different dashboards:

- **Customer** — browse marketplace, customize bouquets in 3D Studio, cart, checkout, live delivery tracking
- **Flower Shop Owner** — manage their own shop, add flowers/bouquets/wrappings, receive & progress customer orders
- **Admin** — system-wide overview, manage users (customers + shop owners), shops, and all products

## Stack
- **Backend**: FastAPI + MongoDB (motor) with JWT auth (bcrypt hashing) and role-based access control
- **Frontend**: Expo Router (React Native), TanStack Query, expo-gl + three.js (real 3D bouquet studio), WebView + Leaflet/OSM for delivery tracking, expo-linear-gradient
- **Design**: Elegant editorial palette — pink floral brand (#FF758C / #FF7EB3) on ivory backgrounds

## Role-Based Routing
- Login checks the user's role from the JWT/DB and redirects:
  - customer → `/(customer)/home`
  - flower_owner → `/(owner)/dashboard`
  - admin → `/(admin)/overview`
- The root `AuthGate` prevents any user from entering another role's route group.

## Seeded Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@elaya.ph | Admin123! |
| Shop Owner (Bloom & Petal) | owner@elaya.ph | Owner123! |
| Shop Owner (Rosa Del Sol) | owner2@elaya.ph | Owner123! |
| Customer | customer@elaya.ph | Customer123! |

Plus 6 flowers, 3 bouquets, 5 wrappings across 2 shops.

## Key Features Delivered
### Customer
- Welcome → sign-in (Shopee-style bottom sheet with quick-fill demo buttons)
- Home with hero, curated bouquets carousel, local shop cards
- Marketplace with product-type filter chips
- Product detail with color/qty selectors and favorites
- **3D Bouquet Studio** — real WebGL scene (expo-gl + three.js) with live flower/wrap/ribbon/quantity customization
- Cart, checkout (COD/GCash), and live order tracking with WebView map + status stepper

### Flower Shop Owner
- Dashboard hero (shop image) with metric cards
- My Products (Flowers / Bouquets / Wrappings tabs, delete guarded to own products)
- Add Flower / Add Bouquet / Add Wrapping forms
- Customer Orders with one-tap status advancement pipeline

### Admin
- Overview cards: customers, owners, shops, products, orders, pending, completed, revenue
- Users list with role filter + enable/disable action
- Shops list with activate/deactivate
- All Products browser (Flowers / Bouquets / Wrappings tabs)

## Backend endpoints (prefixed `/api`)
- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Shops: `GET /shops`, `GET/PUT /shops/mine`, `PATCH /admin/shops/{id}/status`
- Products: `GET /products` (filter by type/shop), `GET /products/{id}`, `POST /owner/flowers|bouquets|wrappings`, `GET/PUT/DELETE /owner/products/{id}`
- Orders: `POST /orders`, `GET /orders/mine`, `GET /orders/{id}`, `GET /owner/orders`, `PATCH /owner/orders/{id}/status`, `PATCH /owner/orders/{id}/rider`
- Admin: `GET /admin/overview`, `GET /admin/users`, `PATCH /admin/users/{id}/status`, `GET /admin/orders`
- Favorites: `GET /favorites`, `POST/DELETE /favorites/{pid}`
