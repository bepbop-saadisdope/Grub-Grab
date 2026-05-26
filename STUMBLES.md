# Stumbles & Fixes

A log of the main things that bit us during setup, so we don't repeat them.

## 1. SQL Server Browser service was disabled
**Symptom:** Backend couldn't connect to `localhost\SQLEXPRESS`. Connection attempts hung or failed with a generic network error.

**Cause:** Named instances (like `SQLEXPRESS`) are resolved to a dynamic TCP port by the **SQL Server Browser** service. If Browser is stopped, clients can't discover the instance port and the connection never lands.

**Fix:** Open `services.msc` → start **SQL Server Browser** → set startup type to Automatic so it survives reboots.

**Alternative (if Browser can't be enabled):** Configure SQLEXPRESS to listen on a fixed TCP port via SQL Server Configuration Manager and connect using `localhost,1433` (no instance name) in `.env`.

---

## 2. Seed hash didn't match the documented password
**Symptom:** `POST /api/delivery/login` returned `Invalid credentials` even with the exact phone + password the seed file advertised (`03001234567` / `delivery@123`).

**Cause:** The hash stored in `server/db/seed.sql` for the test delivery user was for a different plaintext than the one in the comment. The comment said `delivery@123` but the SHA-256 value belonged to another string — a copy/paste mismatch.

**Fix:** Recomputed `SHA-256('delivery@123')` → `135c67ffb9282acbfe5f2a66dcc90f6b60d4d213c213346f08169f69830e8be6`, patched `seed.sql`, and ran the same UPDATE against the live `Grub` DB so we didn't need a full re-seed.

**Takeaway:** When seeding hashed credentials, always regenerate the hash from the actual plaintext — never trust a copied hex string. A one-liner is safer than hand-maintaining hashes:
```js
require('crypto').createHash('sha256').update('delivery@123').digest('hex')
```

---

## 3. Field-name mismatches between docs and controllers
**Symptom:** Early requests to `POST /api/setup/admin` and `POST /api/orders` returned 400s complaining about missing fields we *thought* we were sending.

**Cause:** Controllers expect specific keys that weren't all obvious from memory:
- Setup admin needs `fullName`, `email`, `password`, `phoneNumber` (not `username`).
- Place order needs `fullName` (not `customerName`) plus `phoneNumber`, `deliveryAddress`, `items[]`.
- Admin login uses `email` + `password` (not `username`).

**Fix:** Treat each controller's destructuring line as the source of truth. When in doubt, grep the controller for `req.body` before crafting a request.
