# Grub-Grab — Smart Restaurant Ordering Platform
FAST-NU Lahore | Spring 2026 | Database Course Project

## Stack
- **Frontend**: React (`/client`) — port 3000
- **Backend**: Node.js + Express (`/server`) — port 5000
- **Database**: SQL Server Express — `LEGION\SQLEXPRESS` / DB: `Grub`

## Roles
- **Customer** — no login, identified by phone number
- **DeliveryPerson** — phone-number login, sees their assigned orders
- **Admin** — email login, manages orders, menu, categories, riders
- **SuperAdmin** — same login flow as Admin; additionally manages other admins, pins featured items, approves removal requests

## Client Features
`menu` | `cart` | `orders` | `admin`
- `menu`, `cart`, `orders` are already built — read before touching.
- `admin` dashboard is currently in progress.

## Frontend Rules
Palette tokens come from `client/tailwind.config.js`. Use the Tailwind class — the hex is for reference.
- **BG**: `bg-blush-50` (#f6eef0)
- **Body text**: `text-raspberry-900` (#2d061b) · **Form labels**: `text-coffee-900` (#1f141a)
- **Primary CTAs**: `bg-raspberry-600` (#b4186b) — Checkout, Confirm Order
- **Secondary actions**: `bg-raspberry-700` (#871250) — Add, FAB, qty +
- **Accent**: `bg-berry-500` (#cd3287) — price chips, badges, line totals
- **Dark panel**: `bg-raspberry-900` (#2d061b) — alternating menu sections
- **Border + hard shadow**: `border-coffee-800` (#3e2833) + `shadow-retro`
- **Display font**: `font-display` (Lilita One) — H1, section headers, primary CTAs

- Zustand for cart state/persistence — cart clears after successful checkout
- Admin token stored in memory/Zustand only — never localStorage
- API base URL always from env variable — never hardcoded
- Feature-based component structure: `client/src/features/{name}/`
- Reference `Grub_menu.jpeg` for menu item visual alignment

## Auth (frontend side)
- Admin and delivery login returns a Bearer token — store in Zustand, attach as `Authorization: Bearer <token>` header
- Customers have no login — phone number is their identifier

## API Reference (server is done — these are the exact endpoints to call)

### Menu (public)
- `GET /api/menu/categories`
- `GET /api/menu/items`
- `GET /api/menu/items/search?q=`
- `GET /api/menu/items/:categoryId`

### Orders (public)
- `POST /api/orders`
- `GET /api/orders/history?phone=`
- `GET /api/orders/:orderId`

### Admin (Bearer token)
- `POST /api/admin/login`
- `GET /api/admin/orders` | `PATCH /api/admin/orders/:id/status` | `PATCH /api/admin/orders/:id/assign`
- `GET /api/admin/menu` | `POST /api/admin/menu` | `PUT /api/admin/menu/:id` | `DELETE /api/admin/menu/:id`
- `GET /api/admin/categories` | `POST /api/admin/categories` | `PUT /api/admin/categories/:id` | `DELETE /api/admin/categories/:id`
- `GET /api/admin/delivery-persons`
- `POST /api/admin/users/delivery-person`
- `PATCH /api/admin/users/:id/status`
- `GET /api/admin/stats`

### Delivery (Bearer token)
- `POST /api/delivery/login`
- `GET /api/delivery/orders` | `GET /api/delivery/orders/active`
- `PATCH /api/delivery/orders/:id/status` — only `Out for Delivery` or `Delivered`

## API Response Format (all endpoints return this)
```json
{ "success": true, "data": ... }
{ "success": false, "error": "message" }
```

## Self-Audit — After Every Component
Only report ⚠️ gaps — skip ✅ to save tokens. Fix ⚠️ before moving on.

- API URL from env variable, not hardcoded?
- Loading state shown during API calls?
- Error state handled and shown to user?
- Token in Zustand only — not localStorage?
- Cart cleared in Zustand after successful checkout?
- No direct `/server` file modifications?

## Before Writing Any Code
1. Read existing files in the feature folder first.
2. Check if the component already exists — never duplicate.
3. State what you're about to build before writing anything.