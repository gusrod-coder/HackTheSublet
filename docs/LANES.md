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

## Frontend reference: Figma

h1, h2 and h3 should each **consult the Figma MCP for frontend reference** before and while building screens.
Each human gets their own Figma link(s) in their chat; use the link you were given rather than guessing at
layouts. Match its layout, hierarchy and copy, built with the primitives in `app/globals.css`. If the Figma
design needs data the API doesn't return, send a `[REQ]` to h1; don't invent fields. The clickable prototype
(https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt) is a secondary reference for flow.

## Rules

1. **Stay in your lane.** Don't edit files outside it. Need something? Send a request (below).
2. **Shared contracts are h1's:** `lib/types.ts`, `prisma/schema.prisma`, API response shapes, `components/shared/*`.
   Import from `@/lib/types` and call the API through `@/lib/api-client`. Never redefine types locally.
3. **Gates are enforced on the server** (spec §2). The UI should *explain* a gate (e.g. on
   `PROFILE_INCOMPLETE`, send the user to finish their profile) but never be the only thing enforcing it.
4. **Branch per lane, small PRs, h1 merges.** Branch names: `h2/<topic>`, `h3/<topic>`. Rebase on `main` often.
   The tailnet dev server runs `main`.
5. Before opening a PR: `npm run typecheck && npm test`. If you touched anything that calls the API, also run `npm run smoke` against your local dev server.
6. Styling: use the tokens and primitives in `app/globals.css` (Figma design system: `.card` + `.mint`/`.butter`/`.peach`/`.blush`, `.btn` + `.secondary`/`.dark`, `.pill`, `.chip`, `.options`/`.option`, `.notice` + `.warn`/`.info`, `.stack`, `.row`, `.grid-2`, `.display`; fonts via `--font-display`/`--font-heading`/`--font-body`). Don't redefine tokens in your lane: ask h1. Put screen-specific CSS in a `*.module.css` next to your page. Layout must collapse to one column under 640px.
7. Label sample data as sample data (`<SampleBadge show={listing.isSample} />`). Show `<OutsideAppNotice />` where money or agreements come up.

## Requests between agents (Tailscale messaging)

Use this for anything outside your lane: a new field, a new endpoint, a bug in someone else's code.

### Mailbox (how messages travel)

Taildrop can't cross Tailscale accounts, so agents message each other through a mailbox on h1's dev server,
reachable from anywhere on the tailnet. No repo checkout needed, just `curl`.

```bash
MAIL=http://100.95.56.19:3000/api/mail          # yogamat:3000

# Check your inbox (unread, includes mail to "all"). Do this at the start of each task and every ~15 min.
curl -s "$MAIL?to=h2"

# Send (from/to: h1 | h2 | h3; to may also be "all"). Put the [REQ]/[RE] subject + body below in the fields.
curl -s -X POST $MAIL -H 'Content-Type: application/json' -d '{
  "from": "h2", "to": "h1",
  "subject": "[REQ][from h2 → h1] …",
  "body": "Domain: …\nWhat: …\nWhy: …\nContract: …\nBlocking?: …\nNeeded by: …"
}'

# Reply in a thread: add "inReplyTo": "<id of the message you're answering>"
# Mark read after handling it:
curl -s -X POST "$MAIL/<id>/read"
# Whole thread:      curl -s "$MAIL?thread=<id>"
# Include read mail: curl -s "$MAIL?to=h2&all=1"
```

The mailbox is coordination only: no secrets, no personal data. The demo Reset doesn't touch it.

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
