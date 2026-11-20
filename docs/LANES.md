# Lanes, ownership and how to ask for things

Three humans, each with a Claude agent. **h1 = lead** (owns the repo, contracts, backend, integration, demo).

## Lanes

| Lane | Owns (edit freely) | Screens |
|---|---|---|
| **h1** | `lib/**`, `prisma/**`, `app/api/**`, `components/shared/**`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/dev/**`, `scripts/**`, `docs/**`, config files | Role picker, demo switcher |
| **h2: Incoming** | `app/incoming/**`, `components/incoming/**` | Stay setup → Habit form + weights + deal-breakers → Browse (ranked list + map + excluded) → Household page → Request status |
| **h3: Leaver + Stayer** | `app/leaver/**`, `app/stayer/**`, `app/requests/**`, `components/leaver/**`, `components/stayer/**` | Create listing (form + map) → Invite stayers · Invite notification → Habit form → Request inbox → **Terms + contacts** (`/requests/[id]`, used by both stayers and incoming) |

Each stub page already loads its data from the API and lists its TODOs in the header comment.
Delete the `<DevJson>` dump once the real UI is in.

h2: when a request is approved, link the incoming to `/requests/[id]` (h3's screen). Don't build a second terms page.

## Rules

1. **Stay in your lane.** Don't edit files outside it. Need something? Send a request (below).
2. **Shared contracts are h1's:** `lib/types.ts`, `prisma/schema.prisma`, API response shapes, `components/shared/*`.
   Import from `@/lib/types` and call the API through `@/lib/api-client`. Never redefine types locally.
3. **Gates are enforced on the server** (spec §2). The UI should *explain* a gate (e.g. on
   `PROFILE_INCOMPLETE`, send the user to finish their profile) but never be the only thing enforcing it.
4. **Branch per lane, small PRs, h1 merges.** Branch names: `h2/<topic>`, `h3/<topic>`. Rebase on `main` often.
   The tailnet dev server runs `main`.
5. Before opening a PR: `npm run typecheck && npm test`. If you touched anything that calls the API, also run `npm run smoke` against your local dev server.
6. Styling: use the tokens and primitives in `app/globals.css` (`.card`, `.btn`, `.chip`, `.options`/`.option`, `.notice`, `.stack`, `.row`, `.grid-2`). Put screen-specific CSS in a `*.module.css` next to your page. Layout must collapse to one column under 640px.
7. Label sample data as sample data (`<SampleBadge show={listing.isSample} />`). Show `<OutsideAppNotice />` where money or agreements come up.

## Requests between agents (Tailscale messaging)

Use this for anything outside your lane: a new field, a new endpoint, a bug in someone else's code.

```
Subject: [REQ][from h2 → h1] Need `overnight` flag exposed on GET /api/incoming/matches

Domain:     backend API (owner: h1)
What:       Add `excludedReason` for overnight deal-breaker in matches response
Why:        Browse screen needs to show the reason in the excluded list
Contract:   { excluded: Array<{ listingId: string; name: string; reason: string }> }
Blocking?:  Yes, browse excluded section is stubbed until this lands
Needed by:  14:00
```

Response:

```
Subject: [RE][h1 → h2] Need `overnight` flag exposed …
Status:   done | in progress (ETA) | declined (reason) | needs info (question)
Details:  branch / PR / endpoint / type name
```

**Escalation:** blocked more than 30 minutes? Stub against the agreed contract with sample data, mark it
`// TODO(REQ-<short-name>)`, and keep moving.
