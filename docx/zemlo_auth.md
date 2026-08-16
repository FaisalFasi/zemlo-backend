# Zemlo Backend — Auth & Authorization

> **Rewritten 2026-08-16.** The previous version of this file was a rough
> pseudocode sketch (`register`/`login`/`validateUser` stubs with no
> session, permission, or guard logic) written before the real
> implementation existed. It no longer matched the code at all. This is
> what's actually implemented.

---

## 1. Login flow

1. `POST /auth/register` / `POST /auth/login` — public, rate-limited
   (`@Throttle`: 5/hour for register, 10/10min for login).
2. Password hashed/compared with `bcrypt` (`src/modules/auth/auth.service.ts`).
3. On success, a `Session` row is created (`sessionId`, `expiresAt`,
   `isRevoked: false`), and a JWT is issued embedding
   `{ userId, email, role, sessionId }` — the JWT is a *reference* to the
   session, not the sole source of truth.
4. The resolved permission list (`permissions: PermissionName[]`) is
   returned alongside the user in the response — the frontend gets the
   real, server-computed list, not just a role string.

## 2. Request authentication

Every request goes through the globally-registered `JwtAuthGuard`
(`app.module.ts`, via `APP_GUARD`) unless the route (or its controller) is
marked `@Public()`. When active:

1. `JwtStrategy.validate()` (`src/modules/auth/strategies/jwt.strategy.ts`)
   decodes the JWT, then looks up the `Session` row by `sessionId`.
2. Rejects (401) if: session doesn't exist, `userId` mismatch, session is
   `isRevoked`, session `expiresAt` has passed, or the user's `isActive` is
   false.
3. This is why **logout actually works** — `POST /auth/logout` sets
   `Session.isRevoked = true` in the database. A stolen/leaked JWT stops
   working immediately, not just when it naturally expires. Plain stateless
   JWT auth (no server-side session) can't do this — that tradeoff was
   deliberately avoided here.

`OptionalJwtAuthGuard` is used on routes that work for both guests and
logged-in users (cart, guest checkout with optional login, Stripe
create-intent) — it attempts the same validation but never rejects the
request; `request.user` is just `undefined` for guests.

## 3. Public vs protected routes

The default is **protected** — a new controller that adds no auth decorator
is rejected (401) by default, not silently open. Routes are explicitly
opted out with `@Public()` (`src/common/decorators/public.decorator.ts`):
catalog browsing, health checks, public settings, auth register/login,
guest checkout/cart/order-lookup, and the Stripe webhook (which
authenticates via Stripe's signature header instead of a JWT — see
`payments.controller.ts`).

## 4. Authorization (RBAC)

Authorization is a second, independent layer on top of authentication —
being logged in is not being allowed to do a specific thing.

- `Permission` — the catalog of checkable actions (`src/common/constants/permissions.ts`
  mirrors `prisma/seeds/permissions.seed.ts` — `scripts/audit-rbac.ts` fails
  CI if they drift apart).
- `RolePermission` — each `UserRole`'s default permission set
  (`prisma/seeds/role-permissions.seed.ts`).
- `UserPermission` — per-user grants/overrides on top of the role default
  (supports `expiresAt` for temporary grants).
- `PermissionResolverService.getUserPermissions()` — computes the actual
  union (role defaults ∪ user grants) for a given user. This is the single
  place that answers "what can this user actually do" — both the JWT
  strategy and `/auth/me` call it, so there's one source of truth, not two.
- `PermissionsGuard` + `@RequirePermissions(...)` — also globally registered
  (`APP_GUARD`), reads the required permissions off the route via
  `Reflector`, and checks them against the authenticated user's resolved
  set. Routes with no `@RequirePermissions()` just need to be authenticated
  (no specific permission check) — e.g. `/auth/me`, `/orders/my-orders`.

## 5. Roles today

```text
CUSTOMER     — default for public registration; store customer
STAFF        — internal team member, permission-scoped
ADMIN        — internal team member, broader default permissions
SUPER_ADMIN  — one-time bootstrap account (see BACKEND_DEV_PROD_GUIDE.md §13);
               public registration can never create this or escalate to it
```

There is no vendor/seller role — see `zemlo_db_design.md` for why (single-
merchant model, confirmed 2026-08-16).

## 6. Known gaps (tracked in `BACKEND-TODO.md`, not repeated here)

- No field-level permission split yet between "update stock" and "update
  everything" on products (§0b-ii).
- `staff.*` / `customers.*` / `analytics.view` permissions are seeded but
  unused — no controller checks them yet (§0b-iii).
- No password reset / forgot-password flow yet (§2).
