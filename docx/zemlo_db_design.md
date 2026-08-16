# Database Design Documentation

> **Rewritten 2026-08-16.** The previous version of this file (schema v0.1,
> Jan 2026) described a multi-vendor marketplace design — `SellerProfile`,
> per-seller warehouses, seller payouts, seller reviews. **None of that was
> ever built**, and on 2026-08-16 the business model was explicitly decided:
> **single-merchant** (Zemlo sources/stocks products — including from other
> brands — and sells them directly; brands do not get their own seller
> accounts or payouts). This file now documents the schema that actually
> exists. If a multi-vendor marketplace is ever revisited, `Brand` is the
> natural entity to evolve into a vendor/tenant — see `TECH_STACK.md` §5 for
> the reasoning.

---

## 1. Core entities (as implemented today)

### User & auth

- **User** — `role`: `CUSTOMER | STAFF | ADMIN | SUPER_ADMIN`. One role per
  user; fine-grained access is layered on top via permissions, not more
  roles.
- **Session** — one row per login. `isRevoked` + `expiresAt` are checked on
  *every* authenticated request (not just at login), so logout actually
  revokes access server-side instead of just discarding a client token.
- **Permission / RolePermission / UserPermission** — `Permission` is the
  catalog of checkable actions (e.g. `products.update`). `RolePermission`
  defines each role's defaults; `UserPermission` grants/overrides
  permissions to a specific user (with optional `expiresAt`). A user's
  effective permission set = role defaults ∪ user-specific grants.
- **Address** — shared table for both shipping and billing; can belong to a
  registered `User` or be a standalone guest address (`isGuestAddress`).

### Catalog

- **Category** (self-referencing via `parentId`) — each category can define
  its own **CategoryAttribute**s (`AttributeType`: `TEXT | NUMBER | SELECT`,
  filterable/required flags), which is how "Electronics has RAM/Storage,
  Clothing has Size/Material" works without a schema change per category.
- **Brand** — plain taxonomy: name, slug, logo, description. No login, no
  ownership, no payout — it's a label a product can carry, not a tenant.
- **Product** — belongs to one `Category`, optionally one `Brand`. Carries
  its own price/stock/SEO fields. `hasVariants` flags whether stock is
  tracked on the product itself or delegated to `ProductVariant`.
- **ProductVariant** — SKU-level stock (size/color combinations), variant-
  specific price override, `options: Json` for the variant's attribute
  values.
- **ProductAttribute** — the actual value a product has for one of its
  category's `CategoryAttribute`s (e.g. this product's "Color" = "Red").
- **ProductImage** — ordered images per product.

### Cart & Wishlist

- **Cart / CartItem** — supports both a logged-in `userId` and an anonymous
  `guestId` (never both). `variantKey` defaults to `"default"` when a
  product has no variant, so the unique constraint
  `(cartId, productId, variantKey)` doesn't collide across variant-less
  products.
- **Wishlist / WishlistItem** — one wishlist per registered user.

### Orders, inventory & payments

- **Order** — one shipping `Address`, one billing `Address`, one `Payment`.
  Three independent status axes tracked separately (this is deliberate, not
  redundant):
  - `status: OrderStatus` (`PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`, or `CANCELLED`/`EXPIRED`)
  - `paymentStatus: PaymentStatus` (`PENDING → PAID`, or `FAILED`/`CANCELLED`/`EXPIRED`/`REFUNDED`)
  - `fulfillmentStatus: FulfillmentStatus` (`UNFULFILLED → PARTIALLY_FULFILLED → FULFILLED`)
  - Plus `inventoryStatus: OrderInventoryStatus` (`RESERVED → COMMITTED`, or `RELEASED`) — tracks whether stock decremented at checkout has been permanently committed (payment succeeded) or given back (payment failed/expired).
- **OrderItem** — snapshots product/variant data at time of purchase
  (`productSnapshot`), so editing or deleting a product later doesn't change
  historical order records.
- **OrderStatusHistory** — append-only audit trail of every status
  transition, with an optional `changedBy` and a human-readable note.
- **Payment** — one-to-one with `Order`. `method: PaymentMethod` enum lists
  `STRIPE | PAYPAL | CREDIT_CARD | DEBIT_CARD | BANK_TRANSFER | CASH_ON_DELIVERY | MANUAL`,
  but **only `STRIPE` has a real integration today** — the others are schema
  placeholders, not working payment paths.
- **StripeWebhookEvent** — logs every processed Stripe webhook by
  `stripeEventId` (unique), so a retried/duplicate webhook delivery is a
  no-op instead of double-processing a payment.

### Platform configuration

- **PlatformSettings**, **PaymentMethodSetting**, **CountrySetting** — admin-
  editable store-wide config (which payment methods are enabled, per-country
  shipping/tax rules, etc.), not per-tenant — there's one of each, store-wide.

---

## 2. What this schema deliberately does NOT have (and why that's correct for today)

- **No `SellerProfile` / `Vendor` model** — there is exactly one merchant
  (Zemlo itself). `Brand` is metadata on a product, not an account.
- **No `Warehouse` / multi-location inventory** — `stock` lives directly on
  `Product`/`ProductVariant`. One stock number, one location (or one
  logical pool), not tracked per-warehouse.
- **No `Shipment` model / multi-package orders** — `Order` carries a single
  `trackingNumber`/`shippingCarrier` pair. One order ships as one shipment.
- **No seller payout/commission tables** — nothing to pay out; all revenue
  is the merchant's own.

None of this is a gap to fix — it's the correct shape for a single-merchant
store. Adding these tables today, before there's a concrete need, would be
speculative schema complexity with nothing depending on it. If the business
model ever changes to multi-vendor (see the note at the top of this file),
this section is exactly where that redesign starts.

---

## 3. Indexes in place today

```text
User:            email, role
Session:         sessionId, userId, expiresAt, isRevoked
Category:        slug, parentId, isActive
Brand:            slug, isActive
Product:         slug, sku, categoryId, brandId, status, isFeatured
ProductVariant:  productId, sku, isActive
Cart:            userId, guestId
CartItem:        cartId, productId, variantId
Order:           userId, orderNumber, status, paymentStatus,
                 fulfillmentStatus, createdAt, inventoryStatus,
                 inventoryExpiresAt
Payment:         orderId, transactionId, paymentIntentId, status
Permission:      category
UserPermission:  userId, permissionId
RolePermission:  role
```

Missing-index gaps that matter at scale are tracked in `BACKEND-TODO.md`
(catalog pagination needs a compound `[status, isFeatured, createdAt]`
index and a `[price]` index once sort/filter/pagination ships) — not
repeated here to avoid the two docs drifting out of sync.
