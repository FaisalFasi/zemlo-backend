# Zemlo Backend — Development, CI & Production Guide

This file is the practical reference for running, testing, releasing, and deploying the Zemlo backend.

> **Branch model**
>
> - `develop` = daily development branch
> - `main` = stable production branch
> - Work and push normally on `develop`
> - Create a Pull Request from `develop` to `main` when a release is ready
> - Render deploys only `main`

---

## 1. Required local versions

The project is configured for:

```text
Node.js: 22.x
npm: 11.6.1
```

Check your current versions:

```bash
node --version
npm --version
```

Expected:

```text
v22.x.x
11.6.1
```

If NVM is installed:

```bash
nvm use 22
npm install --global npm@11.6.1
```

### Why matching versions matters

Using different Node/npm versions can produce a different `package-lock.json`, optional dependency mismatches, or `npm ci` failures in GitHub Actions and Render.

---

## 2. `npm install` vs `npm ci`

### Use `npm install` when dependencies change

```bash
npm install
```

Purpose:

- Installs dependencies
- Updates `package-lock.json` when required
- Use after adding, removing, upgrading, or overriding packages

Examples:

```bash
npm install helmet
npm install @nestjs/terminus
npm uninstall some-package
```

### Use `npm ci` for clean verification and deployments

```bash
npm ci --no-audit --no-fund
```

Purpose:

- Deletes the current dependency tree and installs exact lockfile versions
- Does not update `package-lock.json`
- Fails when `package.json` and `package-lock.json` are out of sync
- Used by GitHub Actions and production builds

### Rule

```text
Changed dependencies?  → npm install
Testing exact CI state? → npm ci
```

---

## 3. Daily development

Stay on the `develop` branch for normal work.

Confirm branch:

```bash
git branch --show-current
```

Expected:

```text
develop
```

Start the backend in watch mode:

```bash
npm run start:dev
```

The application normally runs on:

```text
http://localhost:3000
```

Swagger is available only when:

```env
SWAGGER_ENABLED=true
```

Then open:

```text
http://localhost:3000/api
```

---

## 4. Local environment variables

Keep local secrets in `.env`. Never commit `.env`.

Example local configuration:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

JWT_SECRET="replace-with-at-least-32-characters"
JWT_REFRESH_SECRET="replace-with-a-different-32-character-secret"
JWT_EXPIRES_IN=15m
SESSION_EXPIRES_DAYS=7

CORS_ORIGINS=http://localhost:3000
SWAGGER_ENABLED=true
TRUST_PROXY_HOPS=0

RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=120

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Important rules:

- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be different
- Both JWT secrets must be at least 32 characters
- Never use `CORS_ORIGINS=*`
- Separate multiple origins with commas and no spaces
- Do not add a trailing slash to origins

Example:

```env
CORS_ORIGINS=http://localhost:3000,https://zemlo.shop,https://www.zemlo.shop
```

---

## 5. Commands used during normal development

### Format code

```bash
npm run format
```

Purpose:

- Formats TypeScript, Prisma support files, scripts, workflow YAML, and `package.json`

### Lint code

```bash
npm run lint
```

Purpose:

- Checks TypeScript and project coding rules
- Does not modify code

Auto-fix lint issues where possible:

```bash
npm run lint -- --fix
```

### Run all unit tests

```bash
npm test -- --runInBand
```

Purpose:

- Runs all Jest unit tests serially
- Serial mode is more stable for CI and database-adjacent tests

### Run a specific test file

```bash
npm test -- --runTestsByPath src/config/env.config.spec.ts --runInBand
```

### Run a specific test by name

```bash
npm test -- --runTestsByPath src/config/env.config.spec.ts -t "rejects wildcard CORS configuration"
```

### Watch tests during development

```bash
npm test -- --watch
```

### Build production JavaScript

```bash
npm run build
```

Purpose:

- Generates Prisma Client
- Compiles NestJS into `dist/`

### Run compiled production build locally

```bash
npm run build
npm run start:prod
```

Stop with:

```text
Ctrl + C
```

---

## 6. Complete local verification before pushing

Run:

```bash
npm run verify
```

This command currently runs:

1. Production build
2. ESLint
3. Jest unit tests
4. RBAC audit
5. DTO contract audit
6. Swagger DTO audit
7. API contract audit
8. OpenAPI export
9. OpenAPI quality audit
10. Inventory lifecycle audit

Expected final output:

```text
✅ Backend verification passed.
```

### Check dependency security

```bash
npm audit --audit-level=high
```

Do not use this without carefully reviewing the result:

```bash
npm audit fix --force
```

`--force` can install breaking dependency versions.

### Check that generated OpenAPI is committed

```bash
git diff --exit-code -- openapi.json
```

If a legitimate OpenAPI change appears:

```bash
git diff -- openapi.json
git add openapi.json
```

---

## 7. Recommended pre-push command order

For normal source-code changes:

```bash
npm run verify
git status --short
git add .
git commit -m "feat: describe the change"
git push
```

For dependency changes:

```bash
npm install
npm ci --no-audit --no-fund
npm run verify
npm audit --audit-level=high
git status --short
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

### Why run `npm ci` after dependency changes?

It verifies that a completely clean machine can install the committed lockfile exactly as GitHub Actions and Render will.

---

## 8. Git branch and release workflow

### Daily work

Remain on `develop`:

```bash
git add .
git commit -m "feat: describe the change"
git push
```

GitHub Actions should run automatically on every pushed branch.

### Release to production

On GitHub:

```text
Pull Requests
→ New Pull Request
→ base: main
→ compare: develop
```

Create the PR and wait for:

```text
Verify backend
```

to pass.

Then merge the PR into `main`.

Do not delete the permanent `develop` branch after merging.

### Main branch ruleset

Recommended ruleset:

```text
Name: Protect main
Target: main / default branch
Enforcement: Active
```

Enabled rules:

```text
✓ Restrict deletions
✓ Require a pull request before merging
✓ Require status checks to pass
✓ Required check: Verify backend
✓ Block force pushes
```

For a solo developer, required approvals can remain `0`.

---

## 9. GitHub Actions behavior

The CI workflow runs on:

```yaml
on:
  push:
  pull_request:
```

Therefore it handles:

- `develop`
- `main`
- Any temporary feature/fix branch
- Pull requests

The CI job uses:

- Node 22
- npm 11.6.1
- Temporary PostgreSQL 16
- `npm ci`
- Prisma validation and migrations
- `npm run verify`
- OpenAPI sync check
- Dependency audit

### Deprecation warnings

Warnings such as old `glob` or `inflight` packages do not automatically mean the build failed. Always read the final `npm error` or failed command.

### Temporary network errors

Examples:

```text
ECONNRESET
ETIMEDOUT
EAI_AGAIN
```

These are often registry/network failures rather than source-code errors. Re-run the failed GitHub job once before changing code.

---

## 10. Prisma commands

### Generate Prisma Client

```bash
npx prisma generate --schema=prisma/schema
```

Normally this runs automatically during installation and build.

### Validate Prisma schema

```bash
npx prisma validate --schema=prisma/schema
```

### Create a development migration

Use only while developing a schema change:

```bash
npx prisma migrate dev --schema=prisma/schema --name meaningful_migration_name
```

Example:

```bash
npx prisma migrate dev --schema=prisma/schema --name add_wishlist
```

Commit generated migration files.

### Apply committed migrations in production

```bash
npx prisma migrate deploy --schema=prisma/schema
```

Do not run `migrate dev` on Render/production.

---

## 11. Render production configuration

Render service should deploy:

```text
Branch: main
```

### Build command

Recommended when pre-deploy commands are available:

```bash
npm ci --include=dev --no-audit --no-fund && npm run build
```

### Pre-deploy command

```bash
npx prisma migrate deploy --schema=prisma/schema
```

### Start command

```bash
npm run start:prod
```

Current production script runs:

```bash
node dist/src/main.js
```

### Health check path

```text
/health/ready
```

Available health endpoints:

```text
/health/live  → process is running
/health/ready → application and database are ready
```

### Port

Do not hardcode a Render production port. Render supplies `PORT`, and the backend listens on `0.0.0.0`.

---

## 12. Render production environment variables

Set these in Render → Service → Environment:

```env
NODE_ENV=production

DATABASE_URL=<Neon production database URL>

JWT_SECRET=<strong random value, minimum 32 characters>
JWT_REFRESH_SECRET=<different strong random value, minimum 32 characters>
JWT_EXPIRES_IN=15m
SESSION_EXPIRES_DAYS=7

CORS_ORIGINS=https://zemlo.shop,https://www.zemlo.shop
SWAGGER_ENABLED=false
TRUST_PROXY_HOPS=1

RATE_LIMIT_TTL_MS=60000
RATE_LIMIT_MAX=120

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

During frontend development, localhost may temporarily be included:

```env
CORS_ORIGINS=http://localhost:3000,https://zemlo.shop,https://www.zemlo.shop
```

Do not commit these values to Git.

---

## 13. Create the first production super-admin

### Important rule

The super-admin bootstrap is a **one-time production operation**.

- Run it only when the production database does not yet contain a `SUPER_ADMIN`.
- The backend intentionally refuses to create a second `SUPER_ADMIN`.
- Public registration always creates a normal customer.
- Future admin/staff accounts should be created from the protected staff-management API/admin dashboard, not by rerunning the bootstrap.

### Why the compiled command is used

The direct TypeScript script can fail to inject `PrismaService` correctly in some local `tsx` runs. Build the backend first, then execute the compiled CLI.

### Create the production super-admin from the local backend terminal

1. Copy the production `DATABASE_URL` from Render or Neon.
2. Replace the two placeholders below.
3. Run this command from the Zemlo backend project root.

```bash
npm run build

DATABASE_URL='PASTE_PRODUCTION_DATABASE_URL' \
ADMIN_EMAIL='admin@example.com' \
ADMIN_PASSWORD='PASTE_STRONG_ADMIN_PASSWORD' \
ADMIN_FIRST_NAME='Faisal' \
ADMIN_LAST_NAME='Rehman' \
node dist/src/cli/admin.js bootstrap
```

Password requirements:

```text
At least 12 characters
At least one uppercase letter
At least one lowercase letter
At least one number
At least one special character
```

Expected result:

```text
✅ SUPER_ADMIN created successfully
```

The temporary values apply only to this command and are not written into the repository.

Never commit or share:

```text
DATABASE_URL
ADMIN_PASSWORD
JWT secrets
Stripe secrets
```

---

## 14. Stripe webhook setup

Stripe webhook endpoint:

```text
https://YOUR-BACKEND-DOMAIN/payments/stripe/webhook
```

Required events:

```text
payment_intent.succeeded
payment_intent.payment_failed
payment_intent.canceled
```

Copy the webhook signing secret to Render:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Start with Stripe test keys. Replace them with live keys only when real payments are ready.

---

## 15. Expired inventory reservation cleanup

Command:

```bash
npm run inventory:release-expired -- --limit=100
```

Recommended production schedule:

```text
Every 10 minutes
```

Cron expression:

```text
*/10 * * * *
```

This releases inventory for expired or abandoned payment reservations according to the backend lifecycle rules.

---

## 16. Production smoke-test checklist

After deployment, check:

### Health

```text
GET /health/live
GET /health/ready
```

### Authentication

```text
Customer registration
Customer login
JWT-authenticated /auth/me
Logout/session invalidation
```

### Catalog and cart

```text
Public products/categories/brands
Guest cart using x-guest-id
Authenticated cart
Product and variant stock checks
```

### Checkout and payments

```text
Guest checkout
Authenticated checkout
Inventory reservation
Stripe PaymentIntent creation
Webhook success
Webhook failure/cancellation
Duplicate webhook idempotency
```

### Orders and admin

```text
Customer order access
Admin permission checks
Valid order status transitions
Blocked invalid status transitions
Inventory release on failure/expiry
```

---

## 17. Common errors and fixes

### `Missing script: start:prod`

Confirm `package.json` contains:

```json
"start:prod": "node dist/src/main.js"
```

### `CORS_ORIGINS is required when NODE_ENV=production`

Add an explicit trusted frontend origin in Render:

```env
CORS_ORIGINS=https://zemlo.shop,https://www.zemlo.shop
```

For local frontend access during development:

```env
CORS_ORIGINS=http://localhost:3000,https://zemlo.shop,https://www.zemlo.shop
```

### `npm ci can only install packages when package.json and package-lock.json are in sync`

Use the project Node/npm versions, then run:

```bash
rm -rf node_modules
npm install
npm ci --no-audit --no-fund
```

Commit both dependency files when changed:

```bash
git add package.json package-lock.json
```

### Thousands of Prisma/TypeScript lint errors

Generate Prisma Client first:

```bash
npx prisma generate --schema=prisma/schema
npm run lint
```

### Prisma TLS error in local/CI PostgreSQL

CI/local PostgreSQL URL should disable SSL:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/zemlo_ci?schema=public&sslmode=disable
```

Neon production URLs should use the SSL settings provided by Neon.

### `package.json` JSON parse error

Validate:

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json valid')"
```

Common cause: missing comma between properties.

### GitHub `ECONNRESET` during `npm ci`

This is usually a temporary network issue. Re-run the failed job once. Change code only if the same deterministic error repeats.

---

## 18. Quick command reference

### Start development

```bash
npm run start:dev
```

### Format

```bash
npm run format
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm test -- --runInBand
```

### Complete verification

```bash
npm run verify
```

### Clean install test

```bash
npm ci --no-audit --no-fund
```

### Build

```bash
npm run build
```

### Run production build locally

```bash
npm run start:prod
```

### Apply production migrations

```bash
npx prisma migrate deploy --schema=prisma/schema
```

### Dependency audit

```bash
npm audit --audit-level=high
```

### Push daily development

```bash
git add .
git commit -m "feat: describe the change"
git push
```

### Release

```text
GitHub PR: develop → main
Wait for Verify backend
Merge after green checks
Render deploys main
```

---

## 19. Final release checklist

Before merging `develop` into `main`:

```text
[ ] Correct Node/npm versions
[ ] npm ci passes
[ ] npm run verify passes
[ ] npm audit has no unresolved high/critical runtime issue
[ ] openapi.json is up to date
[ ] Prisma migration files are committed
[ ] No .env or secrets are staged
[ ] GitHub Verify backend check is green
```

Before accepting the Render deployment:

```text
[ ] Production environment variables exist
[ ] Database migrations applied
[ ] /health/live is healthy
[ ] /health/ready is healthy
[ ] Swagger disabled in production
[ ] CORS contains only trusted frontend domains
[ ] Stripe webhook secret configured
[ ] Super-admin created securely
[ ] Inventory cleanup schedule configured
[ ] Core checkout/payment smoke test passed
```
