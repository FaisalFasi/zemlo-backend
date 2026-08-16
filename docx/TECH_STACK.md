# Zemlo Backend — Tech Stack

What the backend is actually built with, why each piece was chosen, and
whether something better exists. Verified against `package.json` on
2026-08-16 — not a guess.

---

## 1. At a glance

```text
Language     TypeScript 5.9 (strict)
Runtime      Node.js 22
Framework    NestJS 11 (Express adapter)
Database     PostgreSQL, via Prisma 7 (driver-adapter mode: @prisma/adapter-pg + pg)
Auth         Passport + JWT + server-side session revocation (custom)
Authorization Custom RBAC (permissions table, not a library)
Validation   class-validator + class-transformer
API docs     @nestjs/swagger (OpenAPI, auto-generated)
Payments     Stripe (official SDK)
Email        Resend (transactional — password reset)
File storage Cloudinary (product/variant images)
Scheduling   @nestjs/schedule (in-process cron)
Rate limit   @nestjs/throttler
Security     helmet, explicit CORS allowlist
Testing      Jest + ts-jest + supertest + @nestjs/testing
Lint/format  ESLint (flat config, typescript-eslint) + Prettier
CI/Deploy    GitHub Actions → Render (PaaS, no Docker/K8s)
```

---

## 2. Framework — NestJS 11

**Why:** structured modules, dependency injection, and guards/pipes/interceptors
are built in — this is what makes "clean architecture, no re-structuring
later" realistic instead of aspirational. Controllers, services, DTOs, and
guards already follow one consistent shape across ~20 modules in this repo,
which is what NestJS enforces by default. It also ships first-party
integrations this backend already leans on: `@nestjs/swagger`,
`@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/terminus`,
`@nestjs/passport` — all from the same team, so they compose without glue
code.

**Alternative worth knowing:** raw Express or Fastify (less overhead, more
manual wiring) or Fastify *through* NestJS (`@nestjs/platform-fastify` instead
of `platform-express` — same Nest code, faster raw HTTP throughput). Not
worth switching now — no evidence this app is HTTP-throughput-bound, and the
migration would touch every controller's request/response typing for a
speed gain that isn't the current bottleneck.

**Verdict:** right choice for the stated goal (clean architecture, small
team, avoid re-structuring).

---

## 3. Database & ORM — PostgreSQL + Prisma 7 (driver adapter)

**Why Postgres:** relational data with real constraints (orders, inventory,
payments, RBAC) benefits from foreign keys, transactions, and `SERIALIZABLE`-
grade guarantees that a document store doesn't give for free. This is not a
close call for a commerce backend.

**Why Prisma:** schema-first migrations (`prisma/migrations/`, 11 so far),
a fully typed query client (no hand-written SQL, no string-based query
building), and it already generates the types every service in this repo
relies on. The `@prisma/adapter-pg` driver-adapter pattern (Prisma 7,
`prisma/adapter/prismaPGAdapter.ts`) hands Prisma a `pg.Pool` directly instead
of Prisma's own bundled engine — this is the newer, leaner Prisma
architecture, and it's what makes the Neon/serverless-Postgres setup work
cleanly.

**Alternative worth knowing:** Drizzle ORM — lighter runtime (no generated
client binary, closer to raw SQL), a common recommendation right now for
teams that find Prisma's generated-client step and cold-start cost annoying.
**Not worth switching today** — this is a large, low-value migration unless
a concrete pain point shows up (e.g., cold-start latency on serverless,
generated-client size). Prisma's migration tooling and DX are still solid
for current team size and velocity.

**Verdict:** solid, modern choice. Re-evaluate only if a specific Prisma
pain point (not a vague "newer tool exists") shows up.

---

## 4. Authentication & sessions — Passport + JWT + a real session table

**What's actually implemented:** `passport-jwt` validates the JWT, but
`JwtStrategy.validate()` *also* checks a server-side `Session` row
(`isRevoked`, `expiresAt`) on every request (`src/modules/auth/strategies/jwt.strategy.ts`).
Logout sets `isRevoked = true` in the database — it isn't just "the client
discards the token."

**Why this matters:** plain stateless JWT (the more common "quick" setup)
can't actually revoke a token before it expires — a stolen token stays valid
until it times out, full stop. This backend already avoids that failure
mode. This is above what a lot of backends this size bother to build.

**Alternative worth knowing:** none needed here — this is already the more
correct pattern (JWT for stateless verification + a DB-backed session as the
source of truth for revocation), not a place where reaching for a bigger
library (e.g., a hosted auth provider like Auth0/Clerk) would clearly win.
Those trade control and this level of custom session logic for less
infrastructure to run — worth considering only if auth becomes a
maintenance burden, not because anything is currently wrong with it.

**Verdict:** good as-is.

---

## 5. Authorization — custom RBAC, not a library

**What's implemented:** `PermissionsGuard` + `@RequirePermissions(...)` +
`PermissionResolverService.getUserPermissions()`, which unions each role's
default permissions with per-user `UserPermission` overrides
(`prisma/seeds/role-permissions.seed.ts`). A dedicated script
(`scripts/audit-rbac.ts`) fails CI if a permission constant, seed, and
controller usage ever drift apart.

**Why hand-rolled instead of a library** (e.g., CASL, AccessControl-node):
permissions here are simple string checks (`products.update`,
`orders.view_all`, …), not conditional/attribute-based rules (e.g., "edit
only orders you created"). A generic ABAC library adds an abstraction layer
this app doesn't need yet.

**Alternative worth knowing:** CASL — worth adopting *if* permission rules
ever need to become conditional (row-level: "a STAFF user can only view
orders in their assigned region"). Not needed for the current flat
role→permission model.

**Verdict:** right-sized for what's actually being enforced today.

---

## 6. Validation — class-validator + class-transformer

**Why:** this is the NestJS-native approach — decorator-based DTOs
(`@IsString()`, `@IsInt()`, …) double as the source for the Swagger schema,
so the API docs and the actual validation can't silently drift apart. Global
`ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
in `main.ts` means unexpected fields are rejected outright, not silently
ignored.

**Alternative worth knowing:** Zod — increasingly popular, arguably better
TypeScript-first inference (`z.infer<>` instead of maintaining a class +
decorators). **Not worth migrating** — every DTO, every Swagger annotation,
and the whole validation pipeline in this repo is already built around
class-validator; switching is a full-repo rewrite for ergonomics, not
correctness.

**Verdict:** correct default for a NestJS + Swagger codebase.

---

## 7. Payments — Stripe (official SDK)

Official `stripe` npm package, webhook signature verification
(`stripe-signature` header + `STRIPE_WEBHOOK_SECRET`), PaymentIntent-based
flow. This is the standard, correct way to integrate Stripe server-side —
there isn't a "better" alternative library here; the only real choice is
which payment processor to use at all, which is a business decision, not a
tech one.

---

## 7b. Transactional email — Resend

Added 2026-08-16 for password reset. **Why Resend over Nodemailer+Gmail
SMTP** (the alternative considered): Gmail SMTP is capped at 500
emails/day on a free account (2,000/day on Google Workspace) — not
unlimited — and using personal/Workspace Gmail for automated app email
risks poor deliverability (landing in spam) and account suspension, since
it's outside Gmail's intended use. Resend's free tier (100/day,
3,000/month) comfortably covers password-reset volume at this stage, with
inexpensive paid tiers if that's ever outgrown.

Degrades gracefully: with no `RESEND_API_KEY` configured, `EmailService`
logs the reset URL instead of sending — useful for local dev, doesn't
crash the request either way (the API response is intentionally identical
whether or not the email actually sent, to avoid leaking account
existence — see `BACKEND-TODO.md` §3).

**Alternative worth knowing:** Nodemailer — only makes sense if there's
already an SMTP relay to point it at (e.g., an existing transactional-email
vendor's SMTP endpoint, or AWS SES SMTP). Nodemailer itself is just the
client library, not a sending service — it doesn't remove the need for one.

---

## 7c. Image storage — Cloudinary

Added 2026-08-16 for product/variant image uploads
(`POST /admin/uploads/image`). Chosen over raw S3 because it's
image-specific: automatic optimization, CDN delivery, and transformation
are built in rather than needing separate services bolted on. Upload-time
transformation caps stored images at 2000×2000 (`crop: 'limit'`, never
upscales) and applies `quality: 'auto:good'` compression — direct storage
and bandwidth cost control, not just a nice-to-have.

**Alternative worth knowing:** AWS S3 (+ a separate CDN/resize layer) —
more control, marginally cheaper at very large scale, but you build the
optimization/CDN pieces yourself instead of getting them by default.

---

## 8. Scheduling — @nestjs/schedule (in-process cron)

Added 2026-08-16 for expired-inventory-reservation cleanup
(`InventoryReleaseCron`). Zero extra infrastructure — no Redis, no separate
worker process — appropriate for a single Render web-service instance.

**Alternative worth knowing:** BullMQ (Redis-backed job queue) — the right
upgrade *if* this ever runs on more than one instance (in-process `@Cron`
fires once per instance, so N instances = N redundant runs — harmless here
since the release logic is idempotent, but wasteful) or if jobs need
retries/backoff/observability beyond a log line. Not needed at current
scale (see `BACKEND-TODO.md` §0 for the exact tradeoff already documented).

**Verdict:** right-sized for one instance; revisit only when scaling
horizontally.

---

## 9. Rate limiting — @nestjs/throttler

In-memory, per-instance counters via `ThrottlerGuard` registered globally.
**Caveat:** in-memory means limits are per-instance, not shared — running
more than one backend instance would let a client get N× the intended limit
(one allowance per instance). Not an issue today (single instance); would
need `@nestjs/throttler`'s Redis storage adapter if the app ever scales
horizontally.

---

## 10. Security headers & CORS — helmet + explicit allowlist

`helmet()` in `main.ts`, plus a CORS origin-check callback (not a wildcard,
not a static array — an explicit allowlist function) and
`credentials: false`. `CORS_ORIGINS=*` is rejected at env-validation time
(`src/config/env.config.ts`), and required outright when
`NODE_ENV=production`. No changes recommended here — this is already
the safe default, not the common shortcut.

---

## 11. Testing — Jest + ts-jest + supertest + @nestjs/testing

Standard NestJS testing stack. Current coverage is thin (13 tests across 5
suites) relative to how business-critical the checkout/payment/inventory
paths are — this is a gap in *how much* is tested, not in *which tools* are
used. The tools are the right ones; more tests should be written with them,
not a different framework adopted.

---

## 12. Code quality — ESLint (flat config) + Prettier + TypeScript strict

`typescript-eslint` flat config, Prettier for formatting, `tsc --noEmit` as
a separate check. This is the current standard combination for a
TypeScript/Node project — no meaningfully better alternative exists right
now (Biome is the one contender worth knowing about: a single faster
Rust-based tool replacing both ESLint+Prettier, but it's less mature for
NestJS/decorator-heavy codebases — not worth migrating for speed alone).

---

## 13. CI/CD & hosting — GitHub Actions + Render

CI runs against a real ephemeral Postgres 16 container, not a mock database
— `npm run verify` (build, lint, tests, RBAC audit, OpenAPI contract audit)
gates every PR. Render is a PaaS: no Dockerfile, no Kubernetes, deploys
straight from `main`. This fits a small team well — zero infrastructure
ops burden. The tradeoff is less portability (Render-specific env var
setup, a Render Cron Job already configured alongside the in-process cron —
see `BACKEND_DEV_PROD_GUIDE.md` §15) and less control than a
container-based deploy would give. Worth reconsidering only if/when
infra needs (multi-region, custom networking, cost at scale) outgrow a
PaaS — not a near-term concern.

---

## 14. Gaps worth knowing about (not wrong, just not built yet)

- **No structured logging library** (winston/pino) — currently just
  NestJS's built-in `Logger`, readable in Render's log viewer. Fine at
  current scale; a structured logger (JSON logs) becomes worth it once logs
  need to be searched/aggregated somewhere other than Render's own viewer.
- **No error tracking / APM** (e.g., Sentry) — unhandled exceptions are
  logged, not aggregated or alerted on anywhere. Worth adding before/soon
  after real customer traffic, since right now a recurring 500 error has no
  automatic surfacing beyond someone noticing.
- **`ws` (WebSocket) is an installed dependency with no code using it** —
  present in `package.json` but no `@nestjs/websockets`/`WebSocketGateway`
  usage anywhere in `src/`. Either it's intended for a planned real-time
  feature (e.g., live order-status push) or it's a leftover from an
  experiment. Worth confirming which, and removing it if it's dead weight —
  an unused dependency is a small but real instance of exactly the kind of
  untracked surface area this stack otherwise avoids.
- **`tsx` (used to run standalone scripts — seeds, the inventory-release
  CLI, OpenAPI export) has incomplete `emitDecoratorMetadata` support
  compared to `tsc`.** Found 2026-08-16: a service injecting `ConfigService`
  (or, in one case, a plain custom service — not fully predictable which)
  without an explicit `@Inject(Token)` can silently receive `undefined` for
  that constructor parameter when the app is bootstrapped via a `tsx`
  script, even though the exact same code works fine in the compiled
  production build (`nest build` → `tsc` → `node dist/src/main.js`, which
  emits this metadata correctly). Not a reason to drop `tsx` — it's still
  the fastest way to run one-off scripts — just: **any new service reached
  by a `tsx`-executed script should use explicit `@Inject()` on every
  constructor parameter**, not rely on implicit type-based DI. See
  `BACKEND-TODO.md` §3 for exactly which files this hit and the fix.

---

## 15. Bottom line

Nothing in this stack is a wrong choice for a NestJS + Postgres + Stripe
commerce backend at this team size and traffic level. The two genuinely
open questions are operational, not technological: (1) decide whether the
in-process cron or the separate Render Cron Job (or both) owns inventory
cleanup going forward, and (2) add basic error tracking before scaling up
traffic. Everything else listed as an "alternative" above is a valid
future option, not a current mistake.
