<!--
═══════════════ EXPLANATION (is change ki wajah) ═══════════════
YE KYA HAI: Inventory-release scheduling ka naya item add kiya —
2026-07-20 ko backend code padh kar mila ek asal gap.
REASON: User ne poocha "reserved inventory release service better
kaise manage karein" — research se pata chala ye script hai, cron nahi.
RISK: Zero — documentation only.
═════════════════════════════════════════════════════════════════
-->

<!--
═══════════════ EXPLANATION (is change ki wajah) ═══════════════
YE KYA HAI: 2026-08-16 ko har item is file me actual code ke against
verify kiya gaya (grep + file reads, sirf claims par bharosa nahi
kiya), phir item 0 implement kiya gaya. Status tags (✅ DONE / ⏳ OPEN)
add kiye taake pata chale kya already shipped hai.
REASON: User ne kaha "duplication nahi chahiye, config centralize
karo" — implementation ke waqt pata chala TODO ka apna suggested cron
code (`inventoryLifecycle.releaseExpiredReservations()` seedha call
karna) manual script ki Stripe-reconciliation safety check bypass kar
deta (order paid ho chuka ho phir bhi stock release ho jata). Fix:
`ExpiredReservationReleaseService` (payments module) ab single source
of truth hai — cron aur manual script dono isi ko call karte hain, so
Stripe check kabhi do jagah drift nahi karega.
RISK: Low — item 0's code already build+lint+test clean hai (see
notes inline). Baaki items sirf status-tagged hain, unka code nahi
chhera gaya.
═════════════════════════════════════════════════════════════════
-->

# Backend TODO — features the frontend is waiting on

**Status legend:** ✅ DONE (shipped in this repo) · ⏳ OPEN (still needs work)

> Apply these in the `zemlo-backend` repo. After deploying, run
> `npm run api:generate` in the frontend so the typed client picks up
> the new params, then finish frontend Phase 5B (see ROADMAP.md).

---

## 0. Automate expired-inventory release ✅ DONE (2026-08-16)

> **Shipped** — `@nestjs/schedule` installed, `ScheduleModule.forRoot()` wired
> in `app.module.ts`. New `InventoryReleaseCron` (`src/modules/payments/services/inventory-release.cron.ts`)
> fires every 5 minutes, gated by `inventory.expiredReservationRelease.enabled`
> / `.batchLimit` (env: `INVENTORY_RELEASE_CRON_ENABLED`,
> `INVENTORY_RELEASE_BATCH_LIMIT` — see `configuration.ts` / `env.config.ts`).
>
> **Deviation from the fix suggested below — found during implementation:**
> the manual script (`scripts/release-expired-inventory-reservations.ts`) was
> *not* just calling `releaseExpiredReservations()` — it also reconciled each
> order's live Stripe `PaymentIntent` status first, to avoid releasing stock
> for an order Stripe had actually just succeeded/was still processing. The
> code sample below (calling `inventoryLifecycle.releaseExpiredReservations()`
> directly from the cron) would have **skipped that check** — a real
> oversell-risk bug, not just a style issue. Fix: extracted the Stripe
> reconciliation into `ExpiredReservationReleaseService`
> (`src/modules/payments/services/expired-reservation-release.service.ts`),
> which both the cron and the (now-thin) manual script call — one place owns
> the release policy, can't drift between the two call sites again.
>
> `OrderInventoryLifecycleService.releaseExpiredReservations()` now takes an
> optional `shouldRelease` callback so Orders module doesn't need to depend on
> Payments/Stripe (would've been circular — `PaymentsModule` already imports
> `OrdersModule`).
>
> Verified: `tsc --noEmit`, `npm run build`, `npm test` (13/13), `npm run lint`
> all clean after this change.
>
> **Correction to the gap analysis below, found while consolidating docs:**
> the "nothing calls this automatically" claim was only true for in-repo code
> (`@Cron`/`BullModule`/etc). `docx/RENDER_INVENTORY_CRON_GUIDE.md` (dated
> 6 July 2026 — before this gap was even written) shows a **separate Render
> Cron Job** (`zemlo-inventory-expiry-cleanup`) was already configured,
> running the same `npm run inventory:release-expired` every 5 minutes. It
> wasn't visible to a codebase grep because it's Render infra config, not
> code. **Net effect: production now has the release logic running from two
> places** — the pre-existing external Render Cron Job and the new in-process
> `InventoryReleaseCron` — both idempotent and safe to run concurrently, but
> redundant. Decide whether to keep both as a belt-and-suspenders setup or
> retire the Render Cron Job now that the app schedules itself (see
> `BACKEND_DEV_PROD_GUIDE.md` §15, updated with this note).

<details>
<summary>Original investigation notes (2026-07-20)</summary>

**Investigated while answering: "reserved inventory release ko better manage kaise karein — cart se release karne ke bajaye checkout par sold-out dikhayein?"**

**What we found (good news — the reservation design itself is solid):**
- `checkout-inventory.service.ts` decrements stock with an **atomic conditional update**
  (`updateMany({ where: { stock: { gte: quantity } }, data: { decrement } })`) at the
  moment checkout starts — this is race-safe; two concurrent checkouts for the last
  unit cannot both succeed.
- Reservation TTL: `checkout.inventoryReservationMinutes` (default **20 min**) for
  card payments, **48h** for bank transfer.
- `order-inventory-lifecycle.service.ts`'s `releaseExpiredReservations()` finds
  expired `RESERVED`+`PENDING` orders and restores stock.
- **The frontend does NOT need a "sold out at checkout" feature** — since stock is
  decremented the moment checkout starts (not at payment success), `product.stock`
  already reflects live availability everywhere the frontend already reads it
  (shop grid, product detail out-of-stock state). This already works today.

**The actual gap:** `releaseExpiredReservations()` is only exposed as a manual
script — `npm run inventory:release-expired` (see `scripts/release-expired-inventory-reservations.ts`).
**Nothing in the codebase calls it automatically** (no `@Cron`, `@Interval`,
`BullModule`, or `node-cron` found anywhere). If nobody runs this script
periodically, stock from abandoned/never-completed checkouts stays locked
forever — real inventory silently "disappears" from sale over time.

**Fix — wire it to `@nestjs/schedule` inside the running app (simplest, zero
extra infrastructure, right-sized for a single Render instance):**

```bash
npm install @nestjs/schedule
```

```ts
// src/app.module.ts
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ...existing imports
  ],
})
export class AppModule {}
```

```ts
// src/modules/orders/services/inventory-release.cron.ts (new file)
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderInventoryLifecycleService } from './order-inventory-lifecycle.service';

@Injectable()
export class InventoryReleaseCron {
  private readonly logger = new Logger(InventoryReleaseCron.name);

  constructor(
    private readonly inventoryLifecycle: OrderInventoryLifecycleService,
  ) {}

  // Every 5 minutes is plenty against a 20-minute reservation window.
  @Cron(CronExpression.EVERY_5_MINUTES)
  async releaseExpired() {
    const result = await this.inventoryLifecycle.releaseExpiredReservations();

    if (result.releasedCount > 0) {
      this.logger.log(
        `Released ${result.releasedCount}/${result.checkedCount} expired reservations`,
      );
    }
  }
}
```

Register `InventoryReleaseCron` as a provider in the orders module. Keep the
manual npm script too (useful for a one-off manual run / debugging).

**Only revisit this if you ever run more than one backend instance** — in-process
`@Cron` fires per-instance, so N instances would attempt the same release
N times (harmless here since `releaseReservedInventory` only acts on rows still
`RESERVED`, so duplicate runs are no-ops — but worth a DB-level advisory lock or
a dedicated worker if you scale out later).

</details>

---

## 0b. RBAC: 3 gaps found in a security audit (2026-08-16)

**Context:** the frontend added per-role UI gating (buttons/forms hidden
based on the admin's role) — that's UX only, NOT a security boundary; anyone
with a valid session cookie could bypass it via `curl`/Postman. So we cloned
`zemlo-backend` and audited whether the real, server-side boundary actually
holds.

**Good news — the core mechanism is solid:** every mutating admin route
(categories, brands, products, variants, orders controllers) already carries
`JwtAuthGuard` + `PermissionsGuard` + an explicit `@RequirePermissions(...)`
naming a specific permission — not a blanket "is this any admin" check. The
old role-only `AdminGuard` is `@deprecated` and unused (an audit script,
`scripts/audit-rbac.ts`, already fails the build if anyone reintroduces it).
No gap of "zero guard beyond JWT" was found on any of the 5 controller
groups checked.

Three real gaps did turn up:

### 0b-i. Frontend roles don't exist on the backend (fix: stop duplicating the permission map on the frontend) ✅ Backend DONE — frontend consumption still ⏳ OPEN

> **Verified 2026-08-16:** step 1 of the fix below is already shipped —
> `/auth/me` (`auth.controller.ts`) already returns the resolved
> `permissions: PermissionName[]` array (`AuthUserResponseDto.permissions`,
> populated in `auth.service.ts` via `PermissionResolverService.getUserPermissions()`).
> No backend change needed here. What's left is step 2 — the frontend
> switching `useAdminPermission()` to read this array instead of its
> hardcoded role→permission map — which is explicitly frontend/ROADMAP.md
> scope, not this repo.

Frontend `admin-permissions.ts` hardcodes a **second copy** of "which
permissions does this role have" for 7 roles (`SUPER_ADMIN, ADMIN, CTO,
MANAGER, PRODUCT_MANAGER, INVENTORY_MANAGER, CUSTOMER`). The backend's
`UserRole` enum (`prisma/schema/User.prisma`) only has 4
(`CUSTOMER, STAFF, ADMIN, SUPER_ADMIN`) — `CTO`/`MANAGER`/`PRODUCT_MANAGER`/
`INVENTORY_MANAGER` have no seeded row in
`prisma/seeds/role-permissions.seed.ts` at all. In practice a real account
meant to be "INVENTORY_MANAGER" has to be stored as `ADMIN`/`STAFF` with
manually-curated `UserPermission` overrides, and nothing guarantees that
curation actually matches the narrower persona the frontend assumes.

**Root cause: two sources of truth for the same thing.** The backend
already computes the real, resolved permission list per user
(`PermissionResolverService.getUserPermissions()`, unions role defaults +
per-user `UserPermission` grants) — that's the actual authorization data.
The frontend re-derives its own copy from a `role` string instead of
reading that resolved list, so the two can silently drift.

**Fix:**

1. Return the resolved `permissions: PermissionName[]` array (the same
   shape `PermissionResolverService` already builds for the JWT strategy)
   on whatever endpoint the admin frontend calls for "who am I" (`/auth/me`
   or an admin-specific equivalent — check `AdminMeResponse` shape on the
   frontend, `src/features/admin/auth/types/admin-auth.types.ts`).
2. Frontend follow-up (tracked in ROADMAP.md, not this repo): swap
   `useAdminPermission()` to check membership in that real `permissions`
   array instead of looking up a locally-hardcoded role→permission map.
   `admin-permissions.ts` and its 7-role enum can then be deleted — one
   source of truth (this backend), not two.

### 0b-ii. No field-level granularity between "update stock" and "update everything" ⏳ OPEN (verified 2026-08-16, still accurate)

`PRODUCTS_UPDATE` is the only permission gating `PATCH /admin/products/:id`
and the variant update/delete routes — but the DTOs
(`UpdateAdminProductDto`, `UpdateProductVariantDto`) accept every field
(name, price, category, SKU, images, SEO, not just stock). An account
intended to be inventory-only (granted `PRODUCTS_UPDATE` so it can adjust
stock counts) can therefore also rewrite price/name/category via a direct
API call — the UI never shows those fields to that role, but the backend
doesn't stop it either.

**Fix — a dedicated stock-only endpoint, separately permissioned** (mirrors
how variants already have their own controller instead of overloading the
product one):

```ts
// New permission constant — src/common/constants/permissions.ts
PRODUCTS_UPDATE_STOCK: 'products.update_stock',
```

```ts
// src/modules/admin/admin-products/dto/update-product-stock.dto.ts (new)
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateProductStockDto {
  @ApiProperty({ example: 42, minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;
}
```

```ts
// admin-products.controller.ts — new route, narrower permission
@Patch(':id/stock')
@RequirePermissions(PERMISSIONS.PRODUCTS_UPDATE_STOCK)
updateStock(@Param('id') id: string, @Body() dto: UpdateProductStockDto) {
  return this.adminProductsService.updateStock(id, dto.stock);
}
```

Grant `PRODUCTS_UPDATE_STOCK` (not full `PRODUCTS_UPDATE`) to whatever role
is meant to be inventory-only, in `role-permissions.seed.ts`. Same pattern
applies to the variant stock field if variants need the same split.

### 0b-iii. `staff.*` / `customers.*` / `analytics.view` permissions are defined but unused ⏳ PARTIALLY OPEN (`analytics.view` fixed 2026-08-16)

These are all in `permissions.ts` and seeded in `role-permissions.seed.ts`
(granted to `ADMIN`/`SUPER_ADMIN`).

- **`analytics.view` ✅ now used** — gates the new `GET /admin/stats`
  (§2). `admin.controller.ts` is no longer an empty stub.
- **`staff.*` / `customers.*` — still ⏳ unused.** No controller in the
  repo checks them yet. If the frontend's `users:read`/`users:manage` UI
  ever calls a real endpoint, confirm that endpoint exists and is actually
  permission-gated before treating that surface as safe — right now
  there's nothing to protect because there's nothing built.

### Structural note: no global guard backstop ✅ DONE (2026-08-16)

> **Shipped** — `JwtAuthGuard` and `PermissionsGuard` are now registered
> globally via `APP_GUARD` in `app.module.ts` (order: `ThrottlerGuard` →
> `JwtAuthGuard` → `PermissionsGuard`). `JwtAuthGuard` was made
> reflector-aware (`src/modules/auth/guards/jwt-auth.guard.ts`) so a new
> `@Public()` decorator (`src/common/decorators/public.decorator.ts`) can opt
> a route/controller out. Every genuinely-public route (`catalog`, `health`,
> `public/settings`, `auth` register/login, guest checkout/cart/order-lookup,
> Stripe webhook + create-intent) is now explicitly marked `@Public()` instead
> of just "never had a guard attached." All the now-redundant per-controller
> `@UseGuards(JwtAuthGuard, PermissionsGuard)` boilerplate was removed from
> the 8 admin controllers + orders/checkout/auth controllers — one global
> default instead of copy-pasted per file.
>
> A future controller that forgets any auth decorator is now **rejected by
> default** (401) instead of silently open — the failure mode flipped from
> fail-open to fail-closed.
>
> Verified: `tsc --noEmit`, `npm run build`, `npm test` (13/13), `npm run lint`,
> `scripts/audit-rbac.ts`, and a full `AppModule` DI-graph compile all clean.

`app.module.ts` registers only `ThrottlerGuard` via `APP_GUARD` (rate
limiting) — `JwtAuthGuard`/`PermissionsGuard` are opt-in per controller,
with no framework-level default. Every current controller opts in
correctly, but a future controller that forgets `@UseGuards(...)` would be
completely unprotected and nothing would catch it. **Recommend flipping the
default:** apply `JwtAuthGuard` (or a combined auth+permissions guard)
globally via `APP_GUARD`, and add a `@Public()` decorator (reflector-based,
same mechanism `PermissionsGuard` already uses) for the genuinely public
routes (`health`, `catalog`, `auth` login/register, guest checkout/cart).
"Secure by default, opt out for public" fails safer than the reverse.

---

## 1. Catalog: server-side pagination + search + filter + sort ✅ Backend DONE (2026-08-16)

> **Shipped** — `catalog.controller.ts`'s `findProducts()` now accepts
> `page`/`limit`/`search`/`category`/`brand`/`sort` query params
> (`CatalogQueryDto`) and returns `PaginatedProductsResponseDto`
> (`{ items, total, page, limit, pageCount }`). A `brand` slug filter was
> added alongside `category` (same shape, essentially free given the
> existing `Brand` relation).
>
> **⚠️ This is the breaking change warned about below — it is now live in
> the code.** `GET /products` no longer returns a plain array. **Do not
> deploy this backend without the frontend adapting in the same release** —
> see `FRONTEND_INTEGRATION_NOTES.md` §5.
>
> **One manual step still needed before this is fully done:** the two new
> Prisma indexes (`Product.prisma`: `@@index([status, isFeatured, createdAt])`,
> `@@index([price])`) are in the schema file, but **no migration was
> generated** — this sandbox has no reachable database to run
> `prisma migrate dev` against. Run this locally, where a real dev database
> is reachable:
> ```bash
> npx prisma migrate dev --schema=prisma/schema --name add_catalog_pagination_indexes
> ```
> Verified otherwise: `tsc --noEmit`, `npm run build`, `npm test` (13/13),
> `npm run lint`, and `npm run verify` steps 1–9 (build, lint, tests, RBAC
> audit, DTO contract audit, Swagger DTO audit, API contract audit, OpenAPI
> export — 44 paths, OpenAPI quality audit) all pass. Step 10 (inventory
> lifecycle audit) needs a live database and wasn't run for the same reason
> as the migration above — unrelated to this change, it needs a real DB to
> query real orders.

**Problem (original, now fixed):** `GET /products` returned every active
product with no params (`catalog.controller.ts` — no `@Query`). The
frontend filtered in memory, which wouldn't scale past ~100 products.

<details>
<summary>Original implementation plan (now shipped — kept for reference)</summary>

### 1a. New DTO — `src/modules/catalog/dto/catalog-query.dto.ts`

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CATALOG_SORT_OPTIONS = [
  'featured',
  'newest',
  'price-asc',
  'price-desc',
] as const;

export type CatalogSortOption = (typeof CATALOG_SORT_OPTIONS)[number];

export class CatalogQueryDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 24, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 24;

  @ApiPropertyOptional({ example: 'candle' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'home-decor', description: 'category slug' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: CATALOG_SORT_OPTIONS, example: 'newest' })
  @IsOptional()
  @IsIn(CATALOG_SORT_OPTIONS)
  sort?: CatalogSortOption = 'featured';
}
```

### 1b. Paginated response DTO — add to catalog dto/

```ts
import { ApiProperty } from '@nestjs/swagger';
import { PublicProductListItemResponseDto } from './public-product-list-item-response.dto';

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [PublicProductListItemResponseDto] })
  items: PublicProductListItemResponseDto[];

  @ApiProperty({ example: 137 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 24 })
  limit: number;

  @ApiProperty({ example: 6 })
  pageCount: number;
}
```

### 1c. Controller — replace `findProducts()`

```ts
@Get('products')
@ApiOperation({ summary: 'Public: get active products (paginated)' })
@ApiOkResponse({ type: PaginatedProductsResponseDto })
findProducts(@Query() query: CatalogQueryDto) {
  return this.catalogService.findProducts(query);
}
```

### 1d. Service — `findProducts(query)` with Prisma

```ts
async findProducts(query: CatalogQueryDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;

  const where: Prisma.ProductWhereInput = {
    ...this.getActiveProductWhere(),
    ...(query.category
      ? { category: { slug: query.category } }
      : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { shortDescription: { contains: query.search, mode: 'insensitive' } },
            { keywords: { has: query.search.toLowerCase() } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === 'newest'
      ? [{ createdAt: Prisma.SortOrder.desc }]
      : query.sort === 'price-asc'
        ? [{ price: Prisma.SortOrder.asc }]
        : query.sort === 'price-desc'
          ? [{ price: Prisma.SortOrder.desc }]
          : [
              { isFeatured: Prisma.SortOrder.desc },
              { createdAt: Prisma.SortOrder.desc },
            ];

  const [total, products] = await this.prisma.$transaction([
    this.prisma.product.count({ where }),
    this.prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: publicProductListSelect,
    }),
  ]);

  return {
    items: products.map((p) => this.toPublicProductListItem(p)),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}
```

**⚠️ Breaking change note:** the response shape changes from `Product[]`
to `{ items, total, page, limit, pageCount }`. Deploy backend + update
frontend together (frontend Phase 5B adapts `catalog-api.ts`, the shop
page, sitemap, and adds pagination UI).

**DB indexes** (Prisma schema) for scale:
`@@index([status, isFeatured, createdAt])`, `@@index([price])`, and an
index on `category.slug` if not already present.

</details>

---

## 2. Smaller items the frontend flagged

- **Admin dashboard stats endpoint** ✅ **DONE (2026-08-16)** — `GET /admin/stats`
  (`admin.controller.ts`), gated by `PERMISSIONS.ANALYTICS_VIEW` (this
  permission existed and was seeded but unused before this — see §0b-iii,
  now partially resolved). Returns `ordersToday`, `revenueToday` (sum of
  today's `PAID` orders), `lowStockCount` (active + tracked products at or
  below `?lowStockThreshold=`, default 5), and the threshold used.
- **Cart merge endpoint** ✅ **DONE (2026-08-16)** — `POST /cart/merge`
  (`cart.controller.ts` / `CartService.mergeGuestCartIntoUser`). Requires a
  logged-in user (401 without one); merges the `x-guest-id` guest cart's
  items into the user's cart (summing quantities, capped at stock and the
  999-per-item max), then deletes the guest cart. Items that are no longer
  addable (product/variant gone inactive or deleted since being added to
  the guest cart) are silently skipped rather than failing the whole merge.
  No `x-guest-id` header, or no guest cart found → no-op, just returns the
  current user cart (safe to call unconditionally after every login).
- **Password reset endpoints** ✅ **DONE (2026-08-16)** — `POST /auth/forgot-password`
  + `POST /auth/reset-password`, email sent via **Resend**. See §3 for the
  security/cost hardening details (per-email cooldown, configurable expiry,
  session revocation on reset).
- **Image upload** ✅ **DONE (2026-08-16)** — `POST /admin/uploads/image`,
  stores to **Cloudinary**. See §3.

All four shipped items verified: `tsc --noEmit`, `npm run build`, `npm test`
(13/13), `npm run lint`, and `npm run verify` steps 1–9 all pass (see §1
for the one step that needs a live DB and wasn't run in this sandbox).

---

## 3. Password reset (Resend) + image upload (Cloudinary) ✅ DONE (2026-08-16)

### Password reset

- `POST /auth/forgot-password` (`ForgotPasswordDto: { email }`) — always
  returns the same generic message regardless of whether the email exists
  (`auth.service.ts`'s `forgotPassword()`), to avoid account enumeration.
  Rate-limited 3/hour per IP (`@Throttle`).
- `POST /auth/reset-password` (`ResetPasswordDto: { token, newPassword }`)
  — validates the token (SHA-256 hash comparison, not stored in plaintext)
  and expiry, updates the password, then **revokes every existing session**
  for that user (same "assume compromised" reasoning as logout — see
  `zemlo_auth.md`). Rate-limited 10/hour per IP.
- **Expiry: 60 minutes by default**, configurable via
  `PASSWORD_RESET_TOKEN_TTL_MINUTES` (`email.passwordResetTokenTtlMinutes`
  in `configuration.ts`). This intentionally does **not** default to 24
  hours — OWASP/NIST guidance treats password-reset links as high-risk and
  recommends minutes-to-an-hour, not a day+; 24h leaves a much bigger window
  for a compromised inbox or shared/public device to be used to hijack the
  account. Change the env var if a different tradeoff is wanted; the code
  doesn't need to change.
- **Spam/cost control:** a second `forgot-password` request for the same
  email within 60 seconds of the last one is silently ignored (still
  returns the generic success message, just doesn't send another email or
  issue a new token) — protects the recipient's inbox from being spammed
  from different IPs (which the per-IP throttle alone can't stop) and avoids
  paying Resend for emails nobody will read.
- Email sending is optional at the infra level: with no `RESEND_API_KEY`
  configured, `EmailService` logs the reset URL instead of sending (useful
  for local dev) rather than crashing the request.
- New env vars (see `BACKEND_DEV_PROD_GUIDE.md` §4/§12 for the full list):
  `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `FRONTEND_PASSWORD_RESET_URL`,
  `PASSWORD_RESET_TOKEN_TTL_MINUTES`.
- New Prisma index: `User.resetPasswordToken` (needed migration — see the
  manual step below).

### Image upload

- `POST /admin/uploads/image` (`multipart/form-data`, field name `file`),
  gated by `PRODUCTS_UPDATE` (same permission as the existing
  product-images mutation routes). Returns `{ url, publicId }` — the
  frontend then uses that `url` with the *existing*
  `CreateProductImageDto`/`UpdateProductImageDto` (`admin/products/:id/images`),
  which already just take a URL string — no change needed there.
- Validation: image mimetypes only (`jpeg|png|webp|gif`), 5MB max, both
  enforced via Nest's `ParseFilePipeBuilder` (422 on violation).
- **Cost control:** upload-time transformation caps stored images at
  2000×2000 (`crop: 'limit'` — only shrinks, never upscales) and applies
  Cloudinary's `quality: 'auto:good'` compression, so a full-resolution
  admin upload doesn't sit in storage (and get served over bandwidth) at
  full size indefinitely.
- If Cloudinary isn't configured (`CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET`
  missing), the endpoint returns `503` rather than crashing at boot.

### ⚠️ A real bug this surfaced — worth knowing about, not just for these two features

While wiring `EmailService`/`UploadsService` (both inject `ConfigService`),
`npm run inventory:release-expired` and `scripts/export-openapi.ts` (both
run via `tsx`, not the compiled `dist/` build) started throwing
`UndefinedDependencyException` / silent `undefined` constructor params —
**not just for the new code, but for the pre-existing
`OrderInventoryLifecycleService` too**, once its file was touched. Root
cause: `tsx`/esbuild's decorator-metadata (`emitDecoratorMetadata`) support
is incomplete compared to `tsc` — it can fail to capture a constructor
parameter's type for automatic DI, especially for library classes
(`ConfigService`) and apparently for other classes too, in ways that aren't
fully predictable. **This only affects `tsx`-executed scripts** (the manual
inventory-release script, seed scripts, `export-openapi.ts`,
`audit-*.ts`) — the actual compiled production server (`nest build` → `tsc`
→ `node dist/src/main.js`) is unaffected, since `tsc` emits this metadata
correctly.

**Fix applied:** explicit `@Inject(Token)` on every constructor parameter in
`EmailService`, `UploadsService`, `InventoryReleaseCron`,
`ExpiredReservationReleaseService`, and `OrderInventoryLifecycleService` —
matching the defensive pattern already established elsewhere in this
codebase (`StripeService`, `JwtStrategy` already did this; now it's clear
why). **If you add a new `tsx`-reachable service, use explicit `@Inject()`
for every constructor parameter rather than relying on implicit
type-based injection** — confirmed safe by re-running
`npm run inventory:release-expired --dry-run` end-to-end after the fix (it
now reaches a real Prisma query instead of failing on `undefined`).

### One manual step still needed (same reason as §1 — no live DB in this sandbox)

```bash
npx prisma migrate dev --schema=prisma/schema --name add_catalog_and_auth_indexes
```

This picks up both pending schema changes at once: the catalog pagination
indexes from §1 and `User.resetPasswordToken` from this section.

### Email provider decision (2026-08-16)

Considered Resend vs. Nodemailer+Gmail SMTP. **Resend was kept.** Gmail SMTP
is capped at 500 emails/day on a free account (2,000/day on Google
Workspace) — not unlimited — and using personal/Workspace Gmail for
transactional app email risks poor deliverability (spam-foldered) and
account suspension, since it's outside Gmail's intended use. Resend's free
tier (100/day, 3,000/month) comfortably covers password-reset volume at
this stage, and paid tiers are inexpensive if that's ever outgrown
(~$20/month for 50,000 emails).

### Config consolidation (2026-08-16) — found while wiring the above

Two places were reading env vars directly instead of through
`configuration.ts` (the intended single source of truth for all runtime
config):

- `prisma.service.ts` read `process.env.DATABASE_URL` /
  `process.env.NODE_ENV` directly — now reads `database.url` /
  `app.environment` via injected `ConfigService`, like every other service.
- `auth.service.ts`'s `createSessionAndToken()` read the raw
  `SESSION_EXPIRES_DAYS` / `JWT_EXPIRES_IN` env var names via
  `configService.get()` instead of the already-defined `session.expiresDays` /
  `jwt.expiresIn` paths — now consistent with the rest of the codebase.

Also: `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY`/`STRIPE_WEBHOOK_SECRET`
had **no** presence/type validation in `env.config.ts` at all (unlike
everything else) — added, alongside the new Resend/Cloudinary vars, so
every external-service credential is now validated the same way. None of
these are hard-required at boot (matching the existing pattern: each
service throws its own clear error only when actually used without being
configured, rather than blocking the whole app from starting) — see
`BACKEND_DEV_PROD_GUIDE.md` §4 for the full current env var list and which
features degrade gracefully without them.

**Net result: `src/config/configuration.ts` + `src/config/env.config.ts`
are genuinely the one place that defines and validates every env var this
app reads** — no other file should read `process.env.*` directly. Verified
by re-grepping the whole `src/` tree after these fixes.
