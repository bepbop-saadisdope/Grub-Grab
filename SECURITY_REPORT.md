# Security Review — Grub-Grab Backend

Scope: `server/` directory. Static review, no dynamic fuzzing. Findings are grouped by severity.

---

## HIGH

### H1. Public order-history endpoint leaks any customer's orders by phone
`GET /api/orders/history?phone=03001111111` in [orders.routes.js:12](server/features/orders/orders.routes.js#L12) has **no authentication**. Because customers are identified only by phone number (no login), anyone who knows or guesses a phone can pull that customer's entire order history — names, addresses, delivery instructions, totals.

**Fix:** require proof of ownership of the phone before returning history. Options: SMS OTP, signed phone-bound token issued at order placement, or an "order lookup code" printed on the receipt that must be supplied alongside the phone.

---

### H2. Public order-detail endpoint is IDOR-vulnerable
`GET /api/orders/:orderId` in [orders.routes.js:13](server/features/orders/orders.routes.js#L13) is also unauthenticated. Sequential `OrderID`s mean an attacker can enumerate `?orderId=1,2,3,…` and harvest every order's delivery address, phone, and line items.

**Fix:** same as H1 — gate on ownership. As a quick partial mitigation, switch `OrderID` to a random UUID or add a short `accessToken` returned only to the placing client.

---

### H3. Passwords hashed with unsalted SHA-256
`hashPassword()` is duplicated across [setup.controller.js:4-6](server/features/setup/setup.controller.js#L4-L6), [admin.controller.js:7-9](server/features/admin/admin.controller.js#L7-L9), [delivery.controller.js:5-7](server/features/delivery/delivery.controller.js#L5-L7). It uses `crypto.createHash('sha256')` with **no salt and no work factor**. SHA-256 is a fast general-purpose hash — billions of guesses per second on a GPU — and because there is no salt, rainbow tables and cross-account hash-collision lookups both work.

**Fix:** migrate to `bcrypt` (or `argon2`). Example:
```js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(input, hash);
```
Plan a migration: on next successful login of a legacy user, re-hash and update the row.

---

### H4. HMAC token comparison is not timing-safe
[middleware/auth.js:26](server/middleware/auth.js#L26) compares HMACs with `!==`. String equality short-circuits on the first mismatched character, which leaks byte-by-byte timing information an attacker could exploit to forge a token.

**Fix:**
```js
const a = Buffer.from(hmac, 'hex');
const b = Buffer.from(expected, 'hex');
if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
```

---

### H5. Tokens never expire
`signToken()` in [middleware/auth.js:11-15](server/middleware/auth.js#L11-L15) embeds only `userId:role`. A stolen token is valid forever — there is no `iat`, no `exp`, no revocation list. CLAUDE.md already flags this as a production TODO; it's called out here for completeness because combined with H3/H4 the blast radius is large.

**Fix:** include an issued-at timestamp in the payload, reject tokens older than N hours in `decodeToken`.

---

## MEDIUM

### M1. Weak `JWT_SECRET`
The previous value was 20 lowercase chars (`grub-grab-dev-secret`) — brute-forceable. HMAC security depends entirely on secret entropy.

**Fix:** generate a real one:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```
Paste the output into `.env` as `JWT_SECRET`. Rotating the secret invalidates all existing tokens (intended side-effect).

---

### M2. Database connection uses `sa` (SQL Server superuser)
`DB_USER=sa` in the old `.env` — full DBA rights for the web app. SQL injection or an app compromise gives an attacker the whole SQL Server instance, not just the `Grub` database. Already listed as a TODO in CLAUDE.md.

**Fix:** create a least-privilege login:
```sql
CREATE LOGIN GrubUser WITH PASSWORD = '<strong random>';
USE Grub;
CREATE USER GrubUser FOR LOGIN GrubUser;
-- minimal: CRUD on the app tables, EXEC on any procs
ALTER ROLE db_datareader ADD MEMBER GrubUser;
ALTER ROLE db_datawriter ADD MEMBER GrubUser;
```
Switch `.env` to `DB_USER=GrubUser`.

---

### M3. `toggleUserStatus` lets admin deactivate anyone, including self / other admins
[admin.controller.js:438-457](server/features/admin/admin.controller.js#L438-L457) updates `Users.IsActive` by `UserID` with no guard. An admin can lock themselves out, and one admin can silently disable another.

**Fix:** reject `userId === req.user.userId`, and if target `Role = 'Admin'` require an additional confirmation field (e.g. `{ confirm: true }`). Optionally require at least one active admin to remain.

---

### M4. No password strength or length validation
`createFirstAdmin`, `createDeliveryPerson`, and login endpoints accept any non-empty password. `""`, `"a"`, `"password"` all pass.

**Fix:** require `password.length >= 8` on creation routes, ideally also reject a common-password list. Return 400 on failure before hitting the DB.

---

### M5. `placeOrder` has no per-item or total-size cap
[orders.controller.js:25-113](server/features/orders/orders.controller.js#L25-L113) iterates `items[]` with no limit. A request with 10,000 items passes validation, enters a transaction, and hammers the DB inside a `for` loop — each item is a separate round-trip.

**Fix:** add guards before `transaction.begin()`:
```js
if (items.length > 50) return res.status(400).json(...);
for (const it of items) {
  if (+it.quantity > 99) return res.status(400).json(...);
}
```

---

### M6. `assignDeliveryPerson` doesn't verify the target is actually a delivery person
[admin.controller.js:93-113](server/features/admin/admin.controller.js#L93-L113) sets `Orders.DeliveryPersonID = @DeliveryPersonID` without checking the target user's `Role`. An admin could assign a Customer or another Admin as the delivery person.

**Fix:** add `AND EXISTS (SELECT 1 FROM Users WHERE UserID = @DeliveryPersonID AND Role = 'DeliveryPerson' AND IsActive = 1)` to the update, return 400 if no row updated due to invalid target.

---

## LOW

### L1. `/api/setup/admin` has no rate limit
It can only succeed once, but an attacker can flood it with requests to burn CPU hashing passwords. Low impact, trivial to add `loginLimiter`.

---

### L2. CORS reflects a single origin with no credentials flag
[index.js:11](server/index.js#L11) — fine as-is, just noting that if you ever add cookie-based auth you must set `credentials: true` and ensure origin is never `*`.

---

### L3. `searchItems` allows SQL `LIKE` wildcard injection
[menu.controller.js:55-74](server/features/menu/menu.controller.js#L55-L74) — user-supplied `q` is parameterized (safe from SQL injection) but `%` and `_` in `q` alter the match pattern. Submitting `%` returns every item. Not a security issue, but a minor abuse vector for wider scans than intended.

**Fix:** `q.replace(/[%_\[]/g, c => '[' + c + ']')` before binding.

---

### L4. `console.error(err)` on every catch block may log secrets
The error object from `mssql` can include the connection string fragment and sometimes the failed SQL. If logs are shipped to a third party, that's a minor leak. For local dev it's fine.

**Fix (later):** use a logger that scrubs known-sensitive fields, or log only `err.message` + `err.code`.

---

### L5. No HTTPS enforcement
Tokens travel in the `Authorization` header. On HTTP, anyone on the same LAN can capture them. Only a concern once this leaves localhost — noted for deployment.

---

## What was changed in this review

1. **`.env` redacted** — real values replaced with `***REDACTED***`. The server will fail to start until you restore them. To restore for local dev, copy structure from [server/.env.example](server/.env.example) and use a fresh strong `JWT_SECRET` (see M1).
2. **`.gitignore` added** at project root — blocks `.env`, `node_modules/`, build dirs, editor/OS junk.

No code was modified; all findings above are recommendations.

---

## Suggested priority order

1. **Fix H1 + H2** — biggest real-world impact, simplest to reason about.
2. **Rotate `JWT_SECRET` (M1) and switch hashing to bcrypt (H3)** together — both touch auth.
3. **Fix H4 + H5** — small diffs, big hardening.
4. **Create `GrubUser` DB login (M2)** before ever deploying.
5. Medium items as you touch the relevant files.
6. Low items before production.
