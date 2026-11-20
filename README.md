# Householdfit

Ann Arbor summer sublets matched to the **household you'll actually live with**. Stayers describe their
household, incoming students describe themselves with the same 8 questions, listings are ranked by fit with
*every* stayer, and every stayer must approve before anyone moves in.

Built for Hack the Lease (Nov 19–20, 2026). Full spec: [`HOUSEHOLDFIT_BUILD_SPEC.md`](HOUSEHOLDFIT_BUILD_SPEC.md) ·
Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt

## Quick start

Node 20+ required. No database server: SQLite is a file at `prisma/dev.db`.

```bash
git clone https://github.com/gusrod-coder/HackTheSublet.git && cd HackTheSublet
npm install
cp .env.example .env
npm run setup        # creates prisma/dev.db and loads sample data
npm run dev          # http://localhost:3000 (also reachable on the tailnet)
```

Pick a user from the **Demo user** menu in the top bar. **Reset** restores the demo starting state.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on `0.0.0.0:3000` |
| `npm test` | Unit tests for scoring + terms (`lib/scoring.test.ts`) |
| `npm run smoke` | End-to-end API test of every gate and demo step. **Needs `npm run dev` running. Resets the DB.** |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Sync schema + reseed sample data |
| `npm run db:studio` | Browse the DB in Prisma Studio |
| `npx tsx scripts/demo-scenarios.ts` | Print rankings for each §8 demo scenario |

If a schema change ever refuses to apply: `rm prisma/dev.db && npm run setup`.

## Shared dev server (tailnet)

h1's machine runs `main`: **http://yogamat:3000** (or `http://100.95.56.19:3000`).
Each lane can also run its own copy locally, since everything is self-contained.

## Layout

```
lib/types.ts            shared contract: habit form, enums, every API request/response type   (h1)
lib/scoring.ts          pure scoring, spec §5, unit-tested                                    (h1)
lib/terms.ts            generated house terms                                                  (h1)
lib/api-client.ts       typed fetch client for every route: use this from pages              (h1)
lib/use-api.ts          tiny data-loading hook                                                 (h1)
lib/server/*            db, session, gates (repo.ts), zod schemas, error handling             (h1)
app/api/**              route handlers                                                         (h1)
prisma/                 schema + sample data                                                   (h1)
components/shared/*     DemoSwitcher, HabitForm, ListingMap, FitBadge, notices                (h1)
app/incoming/**         incoming screens                                                       (h2)
app/leaver/**           leaver screens                                                         (h3)
app/stayer/**           stayer screens                                                         (h3)
app/requests/[id]       terms + contacts, shared by incoming and stayers                       (h3)
```

Read [`docs/LANES.md`](docs/LANES.md) before you change anything. API reference: [`docs/API.md`](docs/API.md).
Demo script: [`docs/DEMO.md`](docs/DEMO.md). Shared components live at `/dev/components`.
