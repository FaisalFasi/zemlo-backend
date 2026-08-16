# Database Guide — which command to run, when

> Written 2026-08-17, right after a near-miss: `prisma migrate dev` was run
> against the Neon database used for local testing, and Prisma reported
> drift requiring a full reset (**all data would have been lost**). No data
> was actually lost — the migration had already applied cleanly, only the
> local migration file was missing — but the situation exposed the real
> issue: **local development and production were pointing at the same
> database.** This file exists so that never becomes a real incident.

---

## 1. The one rule that matters most

**Local development and production must never share a database.**

Why this matters, concretely — commands you run constantly during normal
local development (`prisma migrate dev`, `prisma migrate reset`, `db seed`,
even restarting the app repeatedly while testing) are all designed to
treat the connected database as **disposable**. `migrate dev` will drop and
recreate the schema the moment it detects drift, no confirmation beyond a
prompt. If that connection string happens to be production, a normal dev
session can delete real customer orders, payments, and accounts in
seconds — not through a mistake in application code, just through routine
local dev workflow.

**Current situation (2026-08-17): only test data exists, no real
customers yet.** This is the easiest this fix will ever be — do it now,
before it's a live store with real orders in it. See §5 for exact steps.

---

## 2. Quick reference — which command for which situation

| Situation | Command | Safe on production? |
|---|---|---|
| Check migration status (read-only, never changes anything) | `npx prisma migrate status --schema=prisma/schema` | ✅ Always safe |
| Validate schema file syntax (read-only) | `npx prisma validate --schema=prisma/schema` | ✅ Always safe |
| Regenerate the Prisma Client from schema (no DB connection needed) | `npx prisma generate --schema=prisma/schema` | ✅ Always safe |
| Apply pending migrations, in order, without touching existing data | `npx prisma migrate deploy --schema=prisma/schema` | ✅ **This is the only migration command that should ever run against production** |
| Create a new migration from a schema change **and apply it locally** | `npx prisma migrate dev --schema=prisma/schema --name descriptive_name` | ❌ **Never** — can trigger a full reset if it detects drift |
| Wipe the database, reapply every migration from scratch, reseed | `npx prisma migrate reset --schema=prisma/schema` | ❌ **Never** — deletes all data, no undo |
| Push schema changes without creating a migration file (prototyping only) | `npx prisma db push --schema=prisma/schema` | ❌ Never — also never commit this as your only record of a schema change; it leaves no migration history |
| Populate seed/demo data | `npm run db:seed` | ⚠️ Dev/test databases only |
| Browse or hand-edit rows in a GUI | `npx prisma studio --schema=prisma/schema` | ⚠️ Opens live read/write access — fine for a quick look, but a stray click can edit/delete a real row with no confirmation dialog beyond Studio's own UI |
| Run any of the above against a database that isn't the one in `.env` | prefix the command: `DATABASE_URL="..." npx prisma migrate status --schema=prisma/schema` | Use this for one-off checks against a different environment without editing `.env` |

**The pattern:** anything with "dev" or "reset" in the name assumes a
disposable database. Anything read-only (`status`, `validate`, `generate`)
is always safe. `deploy` is the one write operation that's safe everywhere
because it only ever adds forward — it never resets, drops, or diffs
against live drift.

---

## 3. Normal local development workflow

1. Change a `.prisma` file under `prisma/schema/`.
2. ```bash
   npx prisma migrate dev --schema=prisma/schema --name add_thing_here
   ```
   This creates `prisma/migrations/<timestamp>_add_thing_here/migration.sql`,
   applies it to your **local/dev** database, and regenerates the Prisma
   Client.
3. Commit the new migration folder along with your code change — the
   migration file is part of the change, not a generated artifact to
   ignore.
4. `git push`. CI (`.github/workflows/ci.yml`) runs the same migration
   against a throwaway Postgres container to confirm it applies cleanly.
5. On deploy, Render's pre-deploy command runs
   `npx prisma migrate deploy --schema=prisma/schema` against production —
   applying only the new migration(s), touching nothing else.

If step 2 ever reports drift or asks to reset **and you're not certain
this is the disposable dev database**, stop and check `DATABASE_URL`
before answering the prompt. See §6 for how to check safely.

---

## 4. Checking data without risk

Prisma's CLI query commands (`db execute`) don't print `SELECT` results to
the terminal — they're built for running scripts, not for inspecting rows.
For a quick read-only look at data, either:

**Option A — Prisma Studio** (visual, easiest, but has edit/delete buttons
— be careful which database it's pointed at):
```bash
npx prisma studio --schema=prisma/schema
```

**Option B — a one-off read-only script** (safer when you specifically
want to guarantee nothing can be written, e.g. checking production):
```bash
node -e "
require('dotenv/config');
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
(async () => {
  await client.connect();
  const res = await client.query('SELECT id, email, role FROM users LIMIT 5;');
  console.table(res.rows);
  await client.end();
})();
"
```
Change the `SELECT` to whatever you need to check. This never runs an
`UPDATE`/`DELETE`/migration — it's exactly what was used tonight to confirm
the near-miss hadn't actually lost anything before touching anything else.

---

## 5. Setting up separate dev and production databases (do this now)

Current state: one Neon database, holding only test data, used by both
local `.env` and (eventually) Render production. Cleanest fix, since
there's no real data to preserve yet:

1. **Keep the current Neon database as your local dev database.** Nothing
   changes for local work — `.env` keeps pointing at it, keep testing,
   resetting, and seeding it freely.
2. **Create a second, separate database for production:**
   - Easiest: in the Neon console, create a **new branch** off the current
     project (Neon branches are cheap, instant, and isolated — this is
     the standard Neon way to separate environments without paying for a
     second project). Name it something like `production`.
   - Alternative: create a brand-new Neon project entirely, if you'd
     rather production live in a fully separate project instead of a
     branch of the same one.
   - Either way, copy that branch/project's connection string.
3. **Point Render's `DATABASE_URL` at the new production
   database/branch** (Render → Service → Environment).
4. **Build the schema fresh on it:**
   ```bash
   DATABASE_URL="<production connection string>" npx prisma migrate deploy --schema=prisma/schema
   ```
   This runs all 11 migrations in order against the empty production
   database — no drift possible, since it's brand new.
5. From now on: local `.env` → dev database (safe to reset anytime).
   Render → production database (only ever touched via `migrate deploy`,
   never `migrate dev`/`migrate reset`).

After this, the only way local dev work can affect production is a
deliberate `git push` → CI → Render deploy — never an accidental local
command.

---

## 6. Before running any migrate command — one habit to build

Run this first if there's ever doubt about which database `.env` points
at:

```bash
npx prisma migrate status --schema=prisma/schema
```

The output's first line always names the actual database and host
(`Datasource "db": PostgreSQL database "X" at "Y"`) — read it before
answering any prompt, every time, especially right after switching
branches or pulling a teammate's `.env` changes.

---

## 7. What actually happened tonight (for the record)

`npx prisma migrate dev --schema=prisma/schema --name add_catalog_and_auth_indexes`
was run against the Neon database in `.env` (misconfigured as a file named
`env` instead of `.env` right before this, since fixed). Prisma reported
schema drift and asked to reset. Before answering, the database was
checked directly (read-only query — see §4 Option B): all 3 new indexes
were already present, and `_prisma_migrations` already had a clean,
successfully-finished row for that exact migration. The only actual
problem was that the local `prisma/migrations/` folder for it never got
written to disk. Fix: the folder was reconstructed by hand from the real
index definitions already in the database (`pg_indexes`), so local files
now match what's actually deployed — no data was ever at risk, and no
reset was run. This file exists so that next time, the answer to "is this
safe to reset" doesn't depend on getting lucky.
