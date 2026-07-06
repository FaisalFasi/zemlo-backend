# Zemlo Render Inventory Expiry Cron Job Guide

> **Suggested repository path:** `docs/RENDER_INVENTORY_CRON_GUIDE.md`  
> **Verified setup date:** 6 July 2026  
> **Purpose:** Future deployment or recovery ke waqt expired inventory cleanup Cron Job ko quickly configure aur verify karna.

---

## 1. Cron Job kyun zaroori hai?

Zemlo checkout create hote waqt limited product ka stock temporarily reserve hota hai.

```text
Product stock: 1
Customer checkout creates order
Stock becomes reserved/unavailable
```

Agar customer payment complete na kare, order ki reservation expire ho jati hai. Lekin sirf `inventoryExpiresAt` timestamp pass hone se stock automatically database me wapas nahi aata.

Cron Job expired reservations ko regularly process karti hai:

```text
Expired reservation
→ Stripe PaymentIntent check
→ Unfinished PaymentIntent cancel
→ Inventory release
→ Stock restore
→ Order EXPIRED
→ Payment EXPIRED
```

Cron Job ke baghair abandoned checkouts stock ko unnecessarily reserved rakh sakte hain.

---

## 2. Kya Cron Job existing backend service ke andar chalti hai?

Nahi.

Render par do separate services hoti hain:

```text
zemlo-store
└── Web Service
    └── Customer/admin API requests handle karti hai

zemlo-inventory-expiry-cleanup
└── Cron Job
    └── Schedule par inventory cleanup script chalati hai
```

Dono services:

- same GitHub repository use karti hain;
- same `main` branch use karti hain;
- same Neon production database use karti hain;
- same Stripe environment use karti hain.

Cron Job ka koi public HTTP URL nahi hota. Ye command run karke exit ho jati hai.

---

## 3. Kaunsi file run hoti hai?

Actual TypeScript script:

```text
scripts/release-expired-inventory-reservations.ts
```

`package.json` me is script ka command:

```json
{
  "scripts": {
    "inventory:release-expired": "tsx scripts/release-expired-inventory-reservations.ts"
  }
}
```

Render Cron Job ye command chalati hai:

```bash
npm run inventory:release-expired -- --limit=100
```

### `--limit=100` ka matlab

Ek run me maximum 100 expired orders process honge.

Script default limit 50 use karti hai. Valid limit 1 se 500 ke darmiyan honi chahiye.

### Optional dry run

Database change kiye baghair sirf dekhna ho ke kaun se orders release honge:

```bash
npm run inventory:release-expired -- --dry-run --limit=100
```

Production scheduled command me `--dry-run` use nahi karna.

---

## 4. Script ke andar kya hota hai?

Har Cron run par script:

1. NestJS `AppModule` ko application context mode me start karti hai.
2. HTTP server start nahi karti.
3. Prisma ke through Neon production database connect karti hai.
4. Stripe service initialize karti hai.
5. Aise orders find karti hai jinka:
   - `inventoryStatus = RESERVED`
   - `paymentStatus = PENDING`
   - `inventoryExpiresAt <= current time`
6. Orders ko oldest expiry first process karti hai.
7. Stripe order ho aur PaymentIntent available ho to Stripe status retrieve karti hai.
8. PaymentIntent:
   - `succeeded` ho to order skip karti hai;
   - `processing` ho to order skip karti hai;
   - cancellable state me ho to cancel karti hai;
   - unknown/non-cancellable state ho to safety ke liye skip karti hai.
9. Database transaction ke andar:
   - reserved inventory release karti hai;
   - stock restore karti hai;
   - order status `EXPIRED` karti hai;
   - payment status `EXPIRED` karti hai;
   - status history note save karti hai.
10. Summary log karti hai.
11. Database connection close karke process exit karti hai.

### Cancellable Stripe states

```text
requires_payment_method
requires_capture
requires_confirmation
requires_action
```

### Safety behavior

```text
succeeded  → skip
processing → skip
```

Isse paid/processing order ka stock galti se restore nahi hota.

---

## 5. Render Cron Job configuration

Render Dashboard:

```text
New +
→ Cron Job
```

Use these settings:

### Name

```text
zemlo-inventory-expiry-cleanup
```

### Repository

```text
FaisalFasi/zemlo-backend
```

### Branch

```text
main
```

### Region

Existing `zemlo-store` web service wali same region.

### Runtime

```text
Node
```

### Build command

```bash
npm install --global npm@11.6.1 && npm ci --include=dev --no-audit --no-fund
```

`--include=dev` zaroori hai kyun ke cleanup command `tsx` use karti hai aur `tsx` dev dependency hai.

`npm ci` ke baad project ka `postinstall` Prisma Client generate karta hai.

### Command

```bash
npm run inventory:release-expired -- --limit=100
```

### Schedule

```cron
*/5 * * * *
```

Meaning:

```text
Har 5 minutes
```

Important:

```text
Cron frequency ≠ inventory reservation duration
```

Agar reservation duration 20 minutes ho aur Cron har 5 minutes chale, to stock approximately 20–25 minutes me release hoga.

### Instance type

```text
Starter
```

### Auto Deploy

```text
Yes
```

---

## 6. Required environment variables

Cron Job ek separate Render service hai. Existing `zemlo-store` web service ke environment variables automatically inherit nahi hote.

Safest setup:

> Existing production web service ke user-defined environment variables Cron Job me same names aur same values ke saath copy karo.

At minimum current application startup aur cleanup ke liye:

```env
NODE_ENV=production

DATABASE_URL=<same Neon production database URL>

JWT_SECRET=<same production value>
JWT_EXPIRES_IN=<same production value>
JWT_REFRESH_SECRET=<same production value>
SESSION_EXPIRES_DAYS=<same production value>

CORS_ORIGINS=<same production trusted origins>

STRIPE_SECRET_KEY=<same Stripe environment secret key>
```

Because complete `AppModule` boot hota hai, current backend ke remaining user-defined variables copy karna safest hai, including:

```env
SWAGGER_ENABLED=<same value>
TRUST_PROXY_HOPS=<same value>
RATE_LIMIT_TTL_MS=<same value>
RATE_LIMIT_MAX=<same value>
STRIPE_PUBLISHABLE_KEY=<same value>
STRIPE_WEBHOOK_SECRET=<same value>
```

### `PORT`

Cron Job ko HTTP port ki zaroorat nahi. `PORT` manually add karna necessary nahi.

### Security

- Secret values GitHub me commit na karo.
- Secrets documentation me paste na karo.
- Production database aur Stripe keys sirf Render Environment section me rakho.
- Future central management ke liye Render Environment Group use kiya ja sakta hai.

---

## 7. First manual test

Cron Job create aur build successful hone ke baad:

```text
Cron Job page
→ Trigger Run
```

No expired orders par expected logs:

```text
DataBase connected
Found 0 expired reserved orders. dryRun=false
Expired reservation cleanup complete. released=0, skipped=0
Database connection closed
Cron job run finished successfully
```

Successful status:

```text
Succeeded
```

Current confirmed Zemlo run:

```text
Found 0 expired reserved orders. dryRun=false
Expired reservation cleanup complete. released=0, skipped=0
Cron job run finished successfully
```

---

## 8. Normal production flow

```text
Customer checkout creates order
→ Inventory RESERVED
→ Payment pending

Case A: Payment succeeds
→ Stripe webhook received
→ Payment PAID
→ Inventory COMMITTED
→ Cron does nothing

Case B: Payment attempt fails but retry possible
→ Payment attempt FAILED
→ Order still payable
→ Inventory remains RESERVED
→ Customer can retry

Case C: Customer abandons checkout
→ Reservation expiry reached
→ Next Cron run finds order
→ Stripe PaymentIntent cancelled when possible
→ Inventory RELEASED
→ Stock restored
→ Order EXPIRED
→ Payment EXPIRED
```

---

## 9. Future redeployment checklist

If Cron Job needs to be recreated:

1. Confirm script exists:

   ```text
   scripts/release-expired-inventory-reservations.ts
   ```

2. Confirm `package.json` command exists:

   ```json
   "inventory:release-expired": "tsx scripts/release-expired-inventory-reservations.ts"
   ```

3. Create separate Render Cron Job.
4. Use repository `FaisalFasi/zemlo-backend`.
5. Use branch `main`.
6. Use same region as production backend.
7. Add build command.
8. Add cleanup command.
9. Set schedule `*/5 * * * *`.
10. Select Starter.
11. Copy production environment variables.
12. Enable Auto Deploy.
13. Create Cron Job.
14. Trigger one manual run.
15. Confirm status `Succeeded`.

---

## 10. Updating the script later

```bash
git checkout develop
git pull origin develop

# update code

npm run format
npm run verify
git diff --check

git add scripts/release-expired-inventory-reservations.ts package.json
git commit -m "fix: update expired inventory cleanup"
git push origin develop
```

Then:

```text
develop
→ Pull Request
→ main
→ Render Auto Deploy
```

Cron Job recreate karne ki zaroorat nahi, jab tak repository, branch aur Auto Deploy same hain.

Environment variable changes Cron Job me bhi update karni hongi, unless Environment Group use ho raha ho.

---

## 11. Troubleshooting

### `DATABASE_URL missing`

Cron Job environment me `DATABASE_URL` missing hai.

### `JWT_SECRET must be at least 32 characters`

Required auth variable missing ya invalid hai.

### `CORS_ORIGINS is required when NODE_ENV=production`

Production environment me `CORS_ORIGINS` missing hai.

### `Stripe is not configured`

`STRIPE_SECRET_KEY` missing hai.

### `Cannot find package 'tsx'`

Build command me `--include=dev` missing hai.

### Database authentication error

Neon URL incomplete, expired, wrong ya incorrectly copied hai.

### Order skipped because Stripe status is `succeeded`

Payment successful hai; inventory release na karna correct behavior hai.

### Order skipped because Stripe status is `processing`

Payment processing me hai; inventory release na karna correct behavior hai.

---

## 12. Current Zemlo status

As of 6 July 2026:

```text
Render Cron Job created
Manual run succeeded
Production database connection succeeded
Expired reservations found: 0
Released: 0
Skipped: 0
```

Cron Job deployment and automatic expired-inventory cleanup configuration are complete.
