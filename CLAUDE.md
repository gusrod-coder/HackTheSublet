# Householdfit: agent instructions

Read `docs/LANES.md` first. Ask your human which lane you are (h1 / h2 / h3) if it isn't clear.

- **Frontend reference: consult the Figma MCP.** Your human will give you Figma link(s) in chat; read them with
  the Figma MCP before building or changing a screen, and match that design. If no link has been given yet, ask
  for it. Need data the design shows but the API lacks? `[REQ]` to h1.
- **Check the agent mailbox** at the start of each task and every ~15 min: `curl -s "http://100.95.56.19:3000/api/mail?to=<your lane>"`.
  Send `[REQ]`/`[RE]` messages the same way (POST). Format and commands: `docs/LANES.md` → "Mailbox".
- Only edit files in your lane. Anything else, including `lib/types.ts`, `prisma/`, `app/api/`, and
  `components/shared/`, goes through a `[REQ]` to h1 using the format in `docs/LANES.md`.
- Import types from `@/lib/types`. Call the backend via `api` in `@/lib/api-client` (typed). Don't hand-roll fetch.
- Gates (spec §2) are enforced server-side. The UI handles error codes (`PROFILE_INCOMPLETE`, `NOT_APPROVED`,
  `CONTACTS_LOCKED`, …) by explaining and redirecting, never by hiding a check the server doesn't make.
- Never collect demographics, politics or religion. Habits only.
- Before a PR: `npm run typecheck && npm test`. `npm run smoke` (with `npm run dev` running) covers the whole API.
- Map: `dynamic(() => import("@/components/shared/ListingMap"), { ssr: false })`. Habit form: `components/shared/HabitForm`.
  See `/dev/components` for live examples.
- Client pages under `app/` are `"use client"` and use `useApi()` from `@/lib/use-api`. Route params: `useParams()`.
- Stack: Next.js 15 App Router, React 19, TypeScript 5, Prisma 6 + SQLite, zod 3, Leaflet, Vitest.
