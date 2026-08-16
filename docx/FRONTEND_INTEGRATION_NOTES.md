# Frontend Integration Notes — from the zemlo-backend repo

Generated 2026-08-16, updated same day after shipping §5's breaking change,
for whoever is working on the `zemlo` frontend. Everything here is verified
against the actual backend code, not assumed. Give this whole file to the
frontend agent/session — it's self-contained.

**Read §5 first if you're short on time — it's the one that breaks the
build if ignored.**

---

## 1. Do this now — real permissions are already available, stop duplicating them

**Problem today (frontend-side):** `admin-permissions.ts` hardcodes a
**second copy** of "which permissions does this role have" for 7 roles
(`SUPER_ADMIN, ADMIN, CTO, MANAGER, PRODUCT_MANAGER, INVENTORY_MANAGER, CUSTOMER`).
The backend only has 4 roles (`CUSTOMER, STAFF, ADMIN, SUPER_ADMIN`) — the
other 4 don't exist server-side, so a real account meant to be e.g.
"INVENTORY_MANAGER" has to be faked as `ADMIN`/`STAFF` with manually-curated
overrides, and the frontend's hardcoded map has no guarantee of matching
that.

**Fix — already shippable today:**

`GET /auth/me` (bearer token required) already returns the real, resolved
permission list for the logged-in user:

```json
{
  "user": {
    "id": "...",
    "email": "...",
    "role": "ADMIN",
    "permissions": ["products.view", "products.update", "orders.view_all", "..."],
    "...": "..."
  }
}
```

`permissions` is computed server-side (role defaults ∪ per-user grants) —
it's the actual authorization data, not derived from `role` alone.

**What to change on the frontend:**

1. Swap `useAdminPermission()` (or wherever permission checks happen) to
   check membership in `user.permissions` (an array of strings like
   `"products.update"`) instead of looking up `role` in the local hardcoded
   map.
2. Delete `admin-permissions.ts` and its 7-role enum once nothing references
   it — one source of truth (the backend), not two.
3. Update whatever type represents the `/auth/me` response (likely
   `src/features/admin/auth/types/admin-auth.types.ts` or similar —
   `AdminMeResponse`) to include `permissions: string[]`.
4. Re-run `npm run api:generate` (or your typed-client generation step)
   against this backend so the typed client picks up the field if it's
   OpenAPI-driven.

This directly fixes UI role-gating being "cosmetic only" (anyone with a
valid session could already bypass the old UI-only gating via a direct API
call — the backend enforces the real permission server-side regardless of
what the frontend shows, but the frontend's *own* gating should now reflect
reality instead of a second guess).

---

## 2. Nothing about auth/routing behavior changed today — confirm, don't rebuild

The backend refactored *how* route protection is enforced internally
(global default guard instead of per-controller opt-in) but **no route's
public/private status changed**. Every endpoint that worked before still
works the same way — same auth requirement, same permission requirement,
same guest/optional-auth behavior on cart/checkout/payments. Nothing to fix
here; mentioned only so it's not mistaken for a breaking change.

---

## 3. Business model confirmed: single-merchant, not multi-vendor

2026-08-16: confirmed the store is single-merchant — Zemlo sources/stocks
products (including from other brands) and sells them directly. Brands are
**not** separate sellers with their own accounts, dashboards, or payouts.

**If any frontend planning (ROADMAP.md, old designs) assumed a multi-vendor
marketplace** (seller signup, seller dashboards, per-seller payouts, "sold
by X" with a seller-specific storefront) — **that's not the direction**.
`Brand` on the backend is just a taxonomy field (name/slug/logo) for
filtering/display, like "Shop by Brand" — not a tenant. Build catalog/brand
UI accordingly: brand is a filter and a display label, not an account
system.

---

## 4. Newly shipped (2026-08-16) — ready to consume now

| Endpoint | Purpose | Notes |
|---|---|---|
| `GET /admin/stats` | Orders today, revenue today, low-stock count | Bearer token + `analytics.view` permission. Optional `?lowStockThreshold=` (default 5). Response: `{ ordersToday, revenueToday, lowStockCount, lowStockThreshold }`. |
| `POST /cart/merge` | Merge guest cart into the logged-in user's cart | Bearer token required (401 without one). Send the `x-guest-id` header the guest cart was using — same header cart already sends on other requests. Safe to call unconditionally right after login; if there's no guest cart to merge, it's a no-op that just returns the current user cart. Replaces the old "replay items one-by-one after login" workaround — that workaround can be deleted now. |
| `POST /auth/forgot-password` | Request a password reset email | Public. Body: `{ email }`. **Always** returns the same generic `{ message }` regardless of whether the account exists — don't build UI that says "email not found," that would leak account existence. Rate-limited (3/hour/IP) and cooldown-limited (won't resend within 60s to the same address even from a different IP) — a rapid double-click won't send two emails, that's expected, not a bug to report. |
| `POST /auth/reset-password` | Complete a password reset | Public. Body: `{ token, newPassword }` — `token` is the value from the query string of the link in the email (`?token=...`). Same password strength rule as register (8+ chars, upper/lower/number/special). On success, **every session for that user is invalidated** — if you're testing this while also logged in elsewhere, expect that session to 401 on its next request; that's intentional. |
| `POST /admin/uploads/image` | Upload a product/variant image | Bearer token + `products.update` permission. `multipart/form-data`, field name **`file`**. Image only (jpeg/png/webp/gif), 5MB max. Returns `{ url, publicId }` — pass `url` into the existing `admin/products/:id/images` create/update calls, nothing changed there. |

---

## 5. ⚠️ Breaking change — catalog pagination is now LIVE, not upcoming

**This shipped in the backend code on 2026-08-16.** `GET /products` no
longer returns a plain array:

```diff
- Product[]
+ { items: Product[], total: number, page: number, limit: number, pageCount: number }
```

New query params (all optional): `page` (default 1), `limit` (default 24,
max 100), `search`, `category` (category slug), `brand` (brand slug, new —
matches the existing `category` filter shape), `sort`
(`featured|newest|price-asc|price-desc`, default `featured`).

**Do this before this backend is deployed to production — not after:**

1. Adapt `catalog-api.ts` (or wherever `GET /products` is called) to read
   `.items` instead of treating the response as the array directly.
2. Update the shop page to use `.total`/`.pageCount` for pagination UI.
3. Update sitemap generation if it iterates all products via this endpoint.
4. Re-run your typed-client generation (`npm run api:generate` or
   equivalent) against this backend — `openapi.json` in this repo already
   reflects the new shape (44 documented paths).

If the frontend isn't updated first, deploying this backend breaks the
shop page immediately (it will try to treat the response object as an
array). **Backend + frontend must ship together for this one.**

---

## 6. Still not built — nothing left from the original list

Every item that was tracked here (admin stats, cart merge, password reset,
image upload, catalog pagination) has shipped as of 2026-08-16. Nothing
currently outstanding on the "frontend is waiting on this" list — see
`BACKEND-TODO.md` for anything new that comes up later.

---

## 7. Quick reference — what's safe to build against right now

Stable, won't change shape without a deliberate breaking-change note in the
backend's `BACKEND-TODO.md`:

```text
Auth:      POST /auth/register, /auth/login, /auth/logout, GET /auth/me,
           POST /auth/forgot-password, /auth/reset-password  (see §4)
Catalog:   GET /products (paginated — see §5), /products/:slug, /categories, /brands
Cart:      GET/POST/PATCH/DELETE /cart/*, POST /cart/merge (see §4)  — guest via x-guest-id header, or bearer token
Checkout:  POST /checkout/guest, /checkout/auth, /checkout/from-cart
Payments:  POST /payments/stripe/create-intent
Orders:    GET /orders/my-orders, /orders/my-orders/:orderNumber, POST /orders/guest/lookup
Admin:     all /admin/* routes — bearer token + real permission required (see §1); GET /admin/stats,
           POST /admin/uploads/image (see §4)
```
