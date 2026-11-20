# Householdfit: build spec and agent workflow

**For:** h1 (lead Claude agent, owns the repo). h2 and h3 work in lanes h1 assigns.
**Event:** Hack the Lease, Nov 19–20, 2026. Judged on a working technical artifact.
**Prototype:** https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt (clickable reference for every screen below)

---

## 1. What we're building, in one paragraph

A sublet platform for Ann Arbor where the incoming student is matched with the **household they'll actually live with**, not just the person leaving. Today's sublet apps connect the leaver and the incoming. The leaver wants the room filled and won't live there; the roommates who stay never get a say, and the incoming can't see their habits until move-in. Householdfit makes the stayers describe their own household, makes the incoming describe themselves with the same questions, ranks listings by fit with every stayer, and requires every stayer to approve before anyone moves in.

**The decision we support:** an incoming student choosing which sublet (which household) to live in for 2–4 months.

---

## 2. The three users (read this first)

The app has **three distinct users per listing**. Every screen, API route and permission check depends on which one is acting.

| User | Who they are | What they do | Hard gates |
|---|---|---|---|
| **Leaver** | The current tenant leaving for the summer | Lists the apartment: address, dates, room type, house rules. Invites the stayers. | Cannot answer the habit form for the stayers. Cannot edit the stayers' answers. Cannot approve an incoming. |
| **Stayers** | Roommates who remain in the unit all summer | Fill out the habit form. Review requests. Approve or pass. | **The listing is not released (not visible to incoming) until every stayer has completed the form.** Every stayer must approve before a request is accepted. |
| **Incoming** | Student arriving for an internship, research or classes | Enters dates and destination, fills out the habit form with priorities and deal-breakers, browses ranked listings, requests to join, agrees to terms. | **Must complete the form before matching:** no fit scores, no household answers, no requests until their profile is complete. |

### Gate rules (enforce on the server, not just the UI)

1. **Listing release.** `Listing.status` moves `draft → awaiting_household → live` only when the leaver has submitted the listing **and** every invited stayer has a completed habit profile. Only `live` listings are returned to incoming users.
2. **Incoming matching.** Fit scores, stayer answers and the request endpoint return `403` until the incoming's profile (dates, 8 answers, weights, deal-breakers) is complete.
3. **Blind reveal.** Stayers' raw answers are visible to an incoming only after the incoming's profile is complete. The incoming's raw answers are visible to stayers only once the incoming sends a request to that listing.
4. **Unanimous approval.** A request becomes `approved` only when every stayer on the listing approves. Any single pass makes it `declined`. The leaver has no vote.
5. **Contact exchange.** Contact details are revealed only after the request is approved, every party has agreed to every term, and each party has set a preferred contact method. Reveal is simultaneous: both sides see each other's at the same moment.
6. **No in-app messaging. No payments.** Rent, deposit and the sublease agreement happen outside the app (state this in the UI).

---

## 3. Feature list

### Leaver
- Create listing: address (with map pin), available from/until, room type (private / shared bedroom), house rules, household flags (indoor smoking, pets).
- Invite stayers by email; see each stayer's status (invited / answered).
- Listing shows "Waiting on N roommates" until released.

### Stayers
- Invite notification explaining why to answer and what's protected.
- Habit form: the same 8 questions as the incoming (answers only, no weights).
- Request inbox: see an incoming's household fit, per-stayer fit, matches and mismatches; approve or pass.
- Agree to generated terms; set preferred contact method.

### Incoming
- Stay setup: move-in date, move-out date, where they'll spend their days (Medical Campus, Central Campus, North Campus, Downtown).
- Habit form: 8 questions, each with a "matters to me" weight (a lot / some / not at all), plus deal-breakers.
- Browse: ranked list + map, fit label per listing, date coverage line, top 2 matches and top 2 mismatches, collapsed "excluded by your deal-breakers" section with reasons.
- Household page: profile card per stayer, side-by-side answer table with highlighted mismatches, "talk about this" list, request button.
- Request status: sent → approved / declined.
- Terms: agree to each generated house term; pick preferred contact; see household contacts once unlocked.

---

## 4. The habit form (shared by stayers and incoming)

Answers are stored as integer indexes. Order matters: scoring uses the index.

| # | Key | Question | Options (index 0 → n) |
|---|---|---|---|
| 0 | `bedtime` | On a weeknight, when do your lights go out? | Before 11pm · 11pm–1am · After 1am |
| 1 | `home` | On weekdays, how much are you home? | Mostly out · Mixed · Home most of the day |
| 2 | `guests` | Nights a week you have people over | None · 1 · 2–3 · 4+ |
| 3 | `overnight` | Overnight guests in the last month | None · 1–2 nights · Weekly or more |
| 4 | `noise` | Which is closer to you? | Steady low noise all week · Quiet weeknights, livelier weekends · Lively most nights |
| 5 | `dishes` | After you cook, dishes get washed… | Right away · Same day · Next day or later |
| 6 | `social` | What do you want from housemates this summer? | Keep to ourselves · Friendly but separate · Hang out often |
| 7 | `issues` | How do you bring up a problem with a roommate? | In person · By text · Let it slide |

**Weights (incoming only):** a lot = 3, some = 1, not at all = 0. Default: some (1).

**Deal-breakers (incoming only):**

| Key | Label | Excludes a listing when |
|---|---|---|
| `smoke` | Indoor smoking or vaping | `listing.flags.smoking === true` |
| `pets` | Pets | `listing.flags.pets === true` |
| `overnight` | Overnight guests weekly or more | any stayer has `overnight === 2` |
| `shared` | Shared bedroom | `listing.roomType === 'shared'` |

Habits only. **Never collect demographics, politics or religion.** Practices (alcohol-free home, dietary kitchen rules) can be added later as optional deal-breakers.

---

## 5. Scoring spec (rule-based, no AI, every number explainable)

Put this in one pure, unit-tested module: `lib/scoring.ts`.

```ts
gap(i, a, b)       = |a - b| / (options[i].length - 1)          // 0..1
stayerScore(s)     = round(100 * Σ w[i]·(1 - gap(i, inc[i], s[i])) / Σ w[i])   // 100 if Σw = 0
householdScore     = min(stayerScore over all stayers)
average            = mean(stayerScore)                           // shown for comparison
label              = ≥75 "Strong fit" · ≥55 "Okay fit" · else "Weak fit"
limitingStayer     = stayer with the min score
```

- **Exclusion first:** any matching deal-breaker removes the listing from the ranking and adds it to `excluded` with the reason.
- **Mismatches:** for each stayer and question where `w[i] > 0` and `gap ≥ 0.5`, rank by `gap × w[i]`; return the top 2 distinct questions as plain text ("Bedtime: you before 11pm, Sam after 1am").
- **Matches:** questions where `w[i] > 0` and every stayer's answer equals the incoming's; top 2.
- **Talk about this:** one line per top mismatch ("Ask Sam about sleep schedules").
- **Date coverage:** `uncoveredNights = max(0, listing.start − inc.start) + max(0, inc.end − listing.end)`. Show "Covers your dates" or "Leaves N nights uncovered". Display only; not part of the score.
- **Sort:** household score desc, then average desc.

**Why the minimum, not the average:** you live with every stayer; one bad match ruins the summer even if the others are great. Show the average next to it.

### Generated terms (after approval)
| Key | Term | Source |
|---|---|---|
| `dates` | Dates: inc.start to inc.end | incoming + listing |
| `quiet` | Quiet after 11pm on weeknights | earliest bedtime in the house |
| `guests` | Text the house before an overnight guest | overnight answers |
| `kitchen` | Dishes washed the same day | middle of everyone's dish answers |
| `issues` | Raise problems in person within a day or two | majority `issues` answer |

h1 may make term text rule-driven from answers; keep each term's "why" visible.

---

## 6. Tech stack and architecture

- **Next.js (App Router) + TypeScript** for the web app. Responsive: one-column layout under 640px so it works on mobile; demo runs on desktop.
- **Node API** (Next.js route handlers or a separate Node/Express service; h1 decides) with a real database.
- **Database:** Postgres via Prisma recommended (SQLite acceptable for speed on a single host). Seed script required.
- **Auth:** minimal and fast. Suggested: email sign-in creating a session cookie, plus a seeded demo-user switcher for the live demo. h1 decides.
- **Hosting for the demo:** one machine on the tailnet runs app + DB; teammates test against it.

### Suggested data model (Prisma-style)

```
User            id, name, email, contactMethod?, contactValue?
Listing         id, leaverId → User, address, lat, lng, area, roomType ('private'|'shared'),
                startDate, endDate, houseRules, flags {smoking, pets}, status ('draft'|'awaiting_household'|'live')
Membership      id, listingId, userId, role ('leaver'|'stayer'), inviteStatus ('invited'|'answered')
HabitProfile    id, userId, listingId?, answers int[8]          // stayer profile is per listing
IncomingProfile id, userId, startDate, endDate, destination, answers int[8], weights int[8], dealBreakers string[], complete bool
Request         id, listingId, incomingId → User, status ('sent'|'approved'|'declined')
Approval        id, requestId, stayerId → User, decision ('approve'|'pass')
TermAgreement   id, requestId, userId, termKey, agreed bool
```

### API surface (suggested)

```
POST   /api/listings                         leaver creates listing
POST   /api/listings/:id/invites             leaver invites stayers
GET    /api/listings/:id/household-status    leaver sees who has answered
POST   /api/stayer/:listingId/profile        stayer submits answers → may release listing
GET    /api/stayer/requests                  stayer inbox (with fit summary)
POST   /api/requests/:id/decision            stayer approve | pass
PUT    /api/incoming/profile                 incoming dates, answers, weights, deal-breakers
GET    /api/incoming/matches                 403 until profile complete; ranked + excluded
GET    /api/listings/:id/household           403 until profile complete; side-by-side + talk list
POST   /api/listings/:id/requests            incoming requests to join
GET    /api/requests/:id/terms               generated terms + agreement state
POST   /api/requests/:id/terms/:key          agree to a term
PUT    /api/me/contact                       set preferred contact
GET    /api/requests/:id/contacts            403 until all gates in §2 rule 5 pass
```

### Seed data
At least 6 listings, matching the prototype: Packard St (2 stayers, covers dates), State St (lively household), Hill St (one stayer **not answered**, so it must stay unreleased), Church St (indoor smoking), Geddes Ave (pets), Division St (shared bedroom). Label all seed data as sample data in the UI.

---

## 7. Screens (mirror the prototype)

| Role | Screens in order |
|---|---|
| Entry | Role picker (or sign in → role per listing) |
| Leaver | Create listing (form + map) → Invite stayers (status list) |
| Stayer | Invite notification → Habit form → Request inbox (approve / pass) → Terms + contact |
| Incoming | Stay setup → Habit form + weights + deal-breakers → Browse (ranked list + map + excluded) → Household page → Request status → Terms + contact |

---

## 8. Demo requirements (section 07 of the brief)

The demo must show these working, live:

1. **Gate:** Hill St is not visible to the incoming because a stayer hasn't answered. Have the stayer answer, and it appears.
2. **Decision sensitivity (habit):** change the incoming's "guests per week" from 1 to 4+. Rankings and mismatches change.
3. **Decision sensitivity (priority):** set bedtime to "matters a lot" or "not at all". Order changes.
4. **Decision sensitivity (deal-breaker):** turn on "Pets". Geddes Ave moves to excluded with the reason.
5. **Stayer side:** Priya changes one answer; the incoming's fit with Packard St changes.
6. **Approval → terms → contact reveal:** all stayers approve, terms are agreed, contacts appear for both sides at once.

Keep scoring explainable: be ready to show `lib/scoring.ts` and walk one score by hand.

---

## 9. Agent workflow over Tailscale

Three humans each run a Claude agent: **h1 (lead)**, **h2**, **h3**. h1 owns the repo, shared types, integration and the demo build, and assigns h2's and h3's lanes.

### Rules
- **Stay in your lane.** Don't edit files outside your assigned area. If you need something outside it, send a request (below) instead of changing it yourself.
- **Shared contracts are h1's.** `lib/types.ts`, the Prisma schema and API response shapes change only through h1.
- **Use Tailscale messaging (email between agents)** for any information or feature request outside your domain.
- **Branch per lane**, small PRs, h1 merges. The tailnet dev server runs `main`.

### Request format (subject and body)

```
Subject: [REQ][from h2 → h1] Need `overnight` flag exposed on GET /api/incoming/matches

Domain:     backend API (owner: h1)
What:       Add `excludedReason` for overnight deal-breaker in matches response
Why:        Browse screen needs to show the reason in the excluded list
Contract:   { excluded: Array<{ listingId: string; name: string; reason: string }> }
Blocking?:  Yes, browse excluded section is stubbed until this lands
Needed by:  14:00
```

### Response format

```
Subject: [RE][h1 → h2] Need `overnight` flag exposed …
Status:   done | in progress (ETA) | declined (reason) | needs info (question)
Details:  branch / PR / endpoint / type name
```

### Escalation
If a request blocks you for more than 30 minutes, stub against the agreed contract with sample data, mark it `TODO(REQ-…)`, and keep moving.

---

## 10. Out of scope (say so in Q&A)

Payments, deposits, lease documents, in-app messaging, commute-time scoring, combining two sublets to cover dates, a post-move-in accuracy check (mention as future work), and any identity-based matching.

---

## 11. Pitch facts the build should support

- Finding a summer sublet in Ann Arbor isn't the hard part; U-M's own research program tells incoming fellows it's usually easy. **Choosing the right household is.**
- Many sublets mean joining existing roommates (for example, a 6-person house with 4 leaving and 2 staying).
- Leases often already require roommates' consent to a sublease, so stayer approval formalizes an existing step.
- Simultaneous (blind) reveal improves honesty; Airbnb's experiment found people left more honest feedback when both sides' reviews were revealed at the same time.
- Limitations to state up front: no Ann Arbor data on sublet roommate-conflict rates, self-reports can still be inflated, weights are our judgment, and listings are sample data.
