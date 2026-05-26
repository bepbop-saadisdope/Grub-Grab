# Grub Grab

> Grab the goodness — a smart restaurant ordering platform.

Full-stack web app for a Lahore-based fast-food spot, built as a database course project at **FAST-NU Lahore (Spring 2026)**. Customers browse and order from a single page, riders track their assigned deliveries, and admins manage the menu, orders, riders, and sales — with a SuperAdmin role on top for sensitive actions like featuring items and approving removals.

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Project structure](#project-structure)
4. [Getting started](#getting-started)
5. [Routes](#routes)
6. [Default credentials](#default-credentials)
7. [API reference](#api-reference)
8. [Roles](#roles)
9. [Notes](#notes)

---

## Features

### Customer (no login — identified by phone)
- Hero homepage with brand tagline and admin-pinned **New Arrivals**.
- Full menu with sticky category navigation (click-to-jump + scrollspy).
- Persistent shopping cart (Zustand + `localStorage`) with line-item editing.
- Checkout form with Pakistani phone validation and atomic order placement.
- Order confirmation with retro success animation.

### Delivery Rider (`/delivery`)
- Phone + password login, in-memory token (no localStorage).
- Active deliveries view with one-tap **Pick up** and **Mark delivered** actions.
- Status updates restricted to `Out for Delivery` / `Delivered` per rider role.
- Click-to-call customer phone, full address with city, special instructions.

### Admin (`/admin`)
- Email + password login.
- **Orders** — filter by status, view detail, update status, assign rider.
- **Menu** CRUD with image URLs and soft-delete.
- **Categories** CRUD with display order.
- **Delivery** — add riders, toggle active/disabled.
- **Stats** — 30-day revenue chart, top items, status breakdown.

### SuperAdmin (extends Admin)
- **Featured items** — pin menu items as homepage New Arrivals.
- **Admins tab** — list and create other admin users.
- **Approvals tab** — review pending removal requests filed by regular admins, approve (atomic disable + status update) or deny with a note.
- CNIC capture for all newly created employees.

### Security
- HMAC-SHA256 signed tokens (`userId:role.HMAC`); admin/rider tokens **never persisted**.
- Server-side role enforcement on every protected route.
- Parameterized SQL queries everywhere; no string concatenation.
- Generic 500 errors surface only `"Internal server error"`.
- Rate limiting on all auth endpoints and orders.
- Input validation (phone, CNIC, email, prices) at both client and server.

---

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, Zustand, Axios, lucide-react |
| Backend | Node.js, Express 5, mssql, helmet, express-rate-limit, dotenvx |
| Database | SQL Server Express (default instance: `LEGION\SQLEXPRESS`) |
| Auth | HMAC-SHA256 Bearer tokens, SHA-256 password hashing |

No CSS-in-JS libraries, no UI component libraries, no chart libraries — pure Tailwind utilities throughout.

---

## Project structure

```
.
├── client/                          # React + Vite frontend
│   └── src/
│       ├── api/                     # axios instance, validators
│       ├── components/              # shared UI (Header)
│       └── features/
│           ├── home/                # landing page
│           ├── menu/                # customer menu + tabs
│           ├── cart/                # cart store + drawer + FAB
│           ├── orders/              # checkout flow
│           ├── admin/               # admin shell + tabs
│           │   ├── api/             # admin HTTP helpers
│           │   ├── components/      # admin shell
│           │   └── tabs/            # Orders, Menu, Categories, Delivery,
│           │                        # Admins, Approvals, Stats
│           └── delivery/            # rider shell + cards
├── server/                          # Node + Express backend
│   ├── config/                      # db pool
│   ├── db/
│   │   ├── schema.sql               # full DB definition
│   │   ├── seed.sql                 # categories + 66 menu items + sample rider
│   │   └── migrations/              # incremental migration scripts
│   ├── features/
│   │   ├── menu/                    # public menu endpoints
│   │   ├── orders/                  # customer order placement + history
│   │   ├── admin/                   # admin/superadmin endpoints
│   │   ├── delivery/                # rider endpoints
│   │   └── setup/                   # first-admin bootstrap
│   ├── middleware/                  # HMAC token verification
│   └── index.js                     # express entry
├── CLAUDE.md                        # in-repo working agreement
├── Grub-Grab.postman_collection.json
└── Grub_menu.jpeg                   # design reference
```

---

## Getting started

### Prerequisites
- Node.js 18+ and npm
- SQL Server Express with an instance you can connect to (default: `LEGION\SQLEXPRESS`)
- SQL Server Management Studio (SSMS) for running schema/migration scripts

### 1. Database

Connect to your SQL Server instance and run:

```sql
-- 1. Create the database, tables, indexes
:r server\db\schema.sql

-- 2. Seed categories, menu items, and a default rider
:r server\db\seed.sql

-- 3. Apply migrations (in order)
:r server\db\migrations\001_superadmin_cnic_featured.sql
:r server\db\migrations\002_removal_requests.sql
```

Or open each file in SSMS and execute it in turn.

### 2. Backend

```powershell
cd server
npm install
Copy-Item .env.example .env       # fill in DB credentials + JWT_SECRET
npm run dev                       # nodemon, port 5000
```

The server reads connection settings from `.env`. Defaults work for a local Windows-Authenticated SQL Server Express install.

**Bootstrap the first admin** (one-time, after the server is running):

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/setup/admin -Method Post -ContentType 'application/json' -Body (@{
  fullName    = 'Your Name'
  email       = '<your-email>'
  password    = '<choose-a-strong-password>'
  phoneNumber = '<11-digit phone>'
} | ConvertTo-Json)
```

To make that admin a **SuperAdmin**, run in SSMS:
```sql
USE Grub;
UPDATE Users SET Role = 'SuperAdmin' WHERE Email = '<your-email>';
```

### 3. Frontend

```powershell
cd client
npm install
Copy-Item .env.example .env       # VITE_API_BASE_URL=http://localhost:5000
npm run dev                       # Vite, port 3000
```

Both servers must run in parallel — open them in two terminals.

---

## Routes

| Path | Audience | Purpose |
|---|---|---|
| `/` | Customer | Hero homepage, menu, cart, checkout |
| `/admin` | Admin / SuperAdmin | Management dashboard |
| `/delivery` | Rider | Assigned deliveries + status updates |

The backend serves an API only — there is no server-rendered HTML. The Vite dev server hosts the customer/admin/delivery client at port 3000.

---

## Default credentials

| Role | Login at | Notes |
|---|---|---|
| SuperAdmin | `/admin` | Bootstrap your own via the setup endpoint above |
| Delivery Rider | `/delivery` | A test rider is seeded by [seed.sql](server/db/seed.sql) — see the `PRINT` lines at the bottom of that file for its phone + password |
| Customer | `/` | No login — identified by phone number at checkout |

Change a password by SHA-256-hashing the new value and running `UPDATE Users SET Password = '<hash>' WHERE UserID = ?;` in SSMS.

---

## API reference

The full Postman collection is at [Grub-Grab.postman_collection.json](Grub-Grab.postman_collection.json). Key endpoints:

### Public
- `GET /api/menu/categories`
- `GET /api/menu/items` (returns `IsFeatured` per item)
- `GET /api/menu/items/search?q=`
- `POST /api/orders`
- `GET /api/orders/history?phone=`
- `GET /api/orders/:orderId`

### Admin (Bearer token)
- `POST /api/admin/login`
- `GET /api/admin/orders` · `PATCH /api/admin/orders/:id/status` · `PATCH /api/admin/orders/:id/assign`
- `GET|POST|PUT|DELETE /api/admin/menu[/:id]`
- `GET|POST|PUT|DELETE /api/admin/categories[/:id]`
- `GET /api/admin/delivery-persons` · `POST /api/admin/users/delivery-person` · `PATCH /api/admin/users/:id/status`
- `GET /api/admin/stats`

### SuperAdmin only
- `POST /api/admin/users/admin` — create another admin
- `GET /api/admin/admins`
- `PATCH /api/admin/menu/:id/featured` — pin/unpin homepage items
- `GET /api/admin/removal-requests` · `PATCH /api/admin/removal-requests/:id/{approve,deny}`

### Removal request (any admin can file)
- `POST /api/admin/removal-requests` `{ targetUserId, reason }`

### Delivery (Bearer token)
- `POST /api/delivery/login`
- `GET /api/delivery/orders` · `GET /api/delivery/orders/active`
- `PATCH /api/delivery/orders/:id/status` (only `Out for Delivery` or `Delivered`)

All endpoints return:
```json
{ "success": true,  "data": ... }
{ "success": false, "error": "message" }
```

---

## Roles

| Role | Login at | Can do |
|---|---|---|
| Customer | _no login_ | Browse menu, place order, view own order history by phone |
| DeliveryPerson | `/delivery` | View assigned orders, mark Out for Delivery / Delivered |
| Admin | `/admin` | Manage orders, menu, categories, riders; view stats; file removal requests |
| SuperAdmin | `/admin` | Everything Admin can + create admins, feature items, approve/deny removal requests |

Roles are stored in `Users.Role` (CHECK-constrained). The login endpoint accepts both Admin and SuperAdmin; the response includes the role and the client filters tabs/actions accordingly.

---

## Notes

- This is a coursework project. Production hardening (HTTPS, secret rotation, audit logging, email notifications) is intentionally out of scope.
- The cart's "Single / Double" pricing for items like burgers is modeled as separate `MenuItems` rows rather than per-item variants — the simplest schema for the data we have.
- Featured items show on the homepage's **New Arrivals** strip; the homepage falls back to most-recently-added items when fewer than four are pinned.
- Phone numbers are validated to the Pakistani 11-digit `0XXXXXXXXXX` format on both client and server.
- The repo's working agreement and design tokens live in [CLAUDE.md](CLAUDE.md).
