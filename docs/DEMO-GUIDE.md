# burrow: demo-day guide (5 min demo + 5 min Q&A)

Main plan: **three of us live** (leaver, stayer, incoming), below. Backup: the one-laptop script further down.
The click-by-click reference for the sample data is `docs/DEMO.md`. This file is the **talk track**: what to say, what to point at, who
does what, and how to handle questions. Every number below comes from the sample data and is pinned by
`lib/scoring.test.ts`, so it will be the same on stage as in rehearsal.

---

## The one sentence

> **Finding a summer sublet in Ann Arbor is easy. Choosing the right household is hard, and the roommates who stay
> never get a say. burrow matches the incoming student with every roommate they'll actually live with, and
> nobody moves in until every one of them says yes.**

If a judge remembers only one thing, it should be **"household fit, not listing fit, with every stayer's
approval."** Say "household" a lot.

## Main version: three of us, live (leaver, stayer, incoming)

Each of us plays one role and does their own clicks. Nothing is pre-arranged except Alex's profile: the house is
created, the stayer is invited **by real email**, answers, and the house goes live, gets requested, approved and
unlocked in front of the judges. Dry-run on 2026-11-20: every step works end to end, and with the scripted answers
below the new house lands **#1 for Alex at 96 (Strong fit)**, above Packard St (94).

### Who plays what

| Role | Teammate | Demo login | Says |
|---|---|---|---|
| **Leaver** | ______ | **Morgan** (leaver, no listing yet) | Opens with the problem; lists the room; "I don't get a vote." |
| **Stayer** | ______ | **themselves**, created live when invited (real email) | "I get a say." Answers, approves, agrees to terms. |
| **Incoming** | ______ | **Alex** (profile already filled in: medical campus, May 15 – Aug 15, no smoking) | Browses, shows the ranking reacting, requests, closes. |

Pick the strongest speaker as **Incoming**: they hold the screen longest and do the close.

### What the judges see

They only see the projector. Use **one projected laptop with three browser windows side by side**:
**Leaver | Stayer | Incoming**, each a separate login (Chrome normal, Chrome incognito, Firefox; the login is a
cookie, so one browser = one person). Each of us stands at our own window and clicks our own part.

- The projected laptop should be **yogamat** (the h1 machine): it holds the Gmail sending setup in `.env`.
- Every window uses the **same address**: `http://100.95.56.19:3000` (don't mix with `localhost`: the email link
  signs you in on the address it points at).
- **Stayer window:** also open the stayer teammate's own webmail in a second tab of that same browser. When the
  invite arrives, they click the link there and it opens the form **already signed in as them**. That's the moment.
  (Alternative: they show the email on their phone, then pick their name in the role switcher.)

### Setup (15 minutes before)

1. **Allow real email to the stayer.** In `.env` on yogamat: `EMAIL_ALLOW="<your sending Gmail>,<stayer's email>"`,
   then restart the server (h1 knows how; it's `npm run dev`). Everyone else stays blocked.
2. **Send a test** at least once at the venue: Gmail usually delivers in under 10 seconds, sometimes slower.
3. Gear (top right) → **Reset demo**. This removes any test houses and test roommates.
4. Windows:
   - **Leaver:** switch to **Morgan** → `/leaver` (shows "no listings yet" + "List your room").
   - **Stayer:** signed out on the home page; webmail tab open.
   - **Incoming:** switch to **Alex** → `/incoming/browse`. "Try a change" closed.
5. Zoom each window to ~90% so three fit side by side, or 110% if you go two-and-one.
6. Do Not Disturb on, notifications off, other tabs closed.

### Scripted inputs (rehearse these exactly)

**Leaver (Morgan) → List your room**
- As **Morgan**, the form **fills itself in** (pin included); **Fill demo listing** re-fills it. Then **Next**.
- The invite form opens pre-filled with the stayer from `.env` (`NEXT_PUBLIC_DEMO_STAYER_NAME` / `_EMAIL`, restart the server after changing). Just **Send invite**.
- Address: `1020 Oakland Ave, Ann Arbor` · Area: `Central Campus`
- Available from **May 10, 2027** until **Aug 20, 2027** (covers Alex's May 15 – Aug 15)
- Click the map near central campus to drop the pin
- Room: **Private** · House facts: leave **No indoor smoking** and **No pets** on (Alex has smoking as a deal-breaker)
- **Next: invite your roommates →** → Name: stayer's first name · Email: stayer's real address → **Send invite**
- **Submit listing** → page says "Not visible to incoming students yet. Waiting on <name>."

**Stayer → habit form** (from the email link)
Before 11pm · Mixed · 2–3 · None · Steady low noise all week · Right away · Friendly but separate · In person
→ **Save my answers →** → "…is now live for incoming students."

These match Alex everywhere except people-over nights (2–3 vs 1), so the result is **Oakland Ave house: 96, Strong
fit, #1**, with "where you match: Bedtime: everyone before 11pm · Time at home: everyone mixed" and
"Covers your dates". (Any other answers also work; the rank will just differ.)

### The script (5:00)

| Time | Leaver | Stayer | Incoming |
|---|---|---|---|
| **0:00–0:40** | **Hook** (no clicking): "Every summer thousands of students sublet a room in Ann Arbor. Finding one is easy. But you're not renting a room, you're joining a household. I'm leaving for the summer; I list the room, but I won't live there. My roommate who stays never gets a say, and the new person can't see how we live until they move in. burrow fixes that. Three of us, three roles, all live." | | |
| **0:40–1:20** | *List your room* → **Fill demo listing** (or type the scripted inputs) → *invite* the stayer → *Submit*. **"I list it and invite whoever's staying. But it doesn't go live yet."** → point at "Waiting on <name>". | | **"I'm Alex, coming for a summer at the medical campus. I answered the same eight habit questions everyone answers: bedtime, guests, dishes, how you raise problems. Habits only, never identity."** → point at Browse: Packard St #1 at 94; Church St excluded "because of smoking". **"No Oakland Ave. It isn't live."** |
| **1:20–2:30** | | → **The invite email arrives** in their real inbox. *Hold up / click it.* **"I'm staying, so I get the email. The link signs me straight in."** *Answer the 8 scripted questions* → **Save my answers →**. **"Nobody sees our house until everyone who stays has answered."** | Meanwhile, *open "Try a change"*: guests 1 → **4+** ("Geddes overtakes Packard"; top mismatch becomes guests) → back to **1**. Bedtime **A lot** → order changes → back to **Some**. **Pets** on → Geddes Ave excluded "pets in the home" → **off**. **"Every number moves for a reason you can check by hand. No AI."** |
| **2:30–2:50** | → page flips to **Live** by itself. **"Live the moment my roommate answered."** | → "…is now live." | *Reload Browse* → **Oakland Ave house #1, 96, Strong fit.** **"There it is, at the top. And the score is set by the roommate I fit worst, because I live with all of them."** |
| **2:50–3:20** | | | *Open it* → point at where we match / differ, and covers my dates → **Request to join this household**. |
| **3:20–3:50** | **"I don't get a vote. I won't live there."** | *Inbox* (email "Alex wants to join" also arrives) → shows Alex's answers → **"I only see Alex's answers once Alex asks. Blind until then, both ways."** → **Approve ✓** | Card flips to **Approved → Continue to terms →**. **"Every stayer has to say yes. One pass and it's declined."** |
| **3:50–4:30** | | **Agree on house terms →** → pick **Email** pill, type address → **Agree to all and share my contact** | **Continue to terms →** → **"House terms are written from everyone's answers, each with a why."** → pick **Text** pill FIRST, type `734-555-0100` → **Agree to all and share my contact** |
| **4:30** | | **Contacts appear** | **Contacts appear, same moment.** **"Contacts unlock only when everyone has said yes and agreed to every term, and then for everyone at once."** |
| **4:30–5:00** | | | **Close:** "The house can't go live until the household describes itself. You can't see anyone until you've described yourself. You're ranked by your worst fit, not your average. And nobody moves in until every roommate says yes. Rent and the lease stay outside the app. All the other houses you saw are sample data; this one we made just now. Thank you." |

Not shown live in this version: "a stayer changes an answer and the incoming's fit changes" (spec §8.5). If a
judge asks, the stayer edits one answer from their form (**Save changes →**) and Alex reloads Browse.

### Live-version recovery

| Problem | Do this |
|---|---|
| Invite email hasn't arrived after ~20 s | Stayer picks their name in **Switch role** (it's listed as "Stayer · Oakland Ave (NOT answered)") → the form. Say "the email's on its way" and keep going. |
| Request/approval doesn't show up | Reload that window. Pages poll every few seconds. |
| Oakland Ave not #1 | Someone's answers differ, or a "Try a change" setting wasn't put back. It still appears, just ranked differently; say "and there it is". |
| Contacts don't appear | Someone hasn't picked a contact pill + typed a value, or hasn't agreed to all. |
| Network/Tailscale/Gmail down | Switch to the **one-laptop version** below. Reset first. |

---

## Backup: one-laptop version (if the network or email fails)

Same story with sample households only, one driver, no email needed. Pinned numbers, fully offline except the map.

### Roles on stage

| Person | Job |
|---|---|
| **Narrator** | Talks the whole 5 minutes. Faces the judges, not the screen. Owns the hook and the close. |
| **Driver** | Clicks. Never talks over the narrator. Has `docs/DEMO.md` open on a phone/second screen. |
| **Backup / timekeeper** | Holds up fingers at 4:00 and 4:30. Takes technical Q&A (scoring, gates, stack). Handles recovery if something breaks. |

Rehearse at least twice with a timer. The script below fits in **4:45** if the driver is fast; there is no slack
for exploring.

---

### Setup (one laptop)

1. **Run it on the presenting laptop, not over the tailnet.** Venue Wi-Fi + Tailscale is a risk you don't need.
   ```bash
   git pull && npm ci && npm run setup     # first time only
   npm run build && npm start              # production mode: faster page loads than npm run dev
   ```
   Map tiles (OpenStreetMap) still need internet. Everything else is local. If there's no internet, the map is
   blank but the demo still works; say "map tiles need Wi-Fi" and move on.
2. **Three browser windows with three separate cookie jars** (the demo login is a cookie, so one browser = one
   person). This is what makes the simultaneous contact reveal visible.
   - Window A, Chrome normal: **Alex** (incoming)
   - Window B, Chrome incognito: **Priya** (stayer)
   - Window C, Firefox (or a second Chrome profile): **Sam** (stayer)
   Arrange them so A is big and B + C are stacked on the right. Zoom to 110–125% so judges can read it.
3. **Reset demo** (gear icon, top-right of the header → Reset demo) in any window. Then:
   - Window A → switch to **Alex** → open `/incoming/browse`. Leave the "Try a change" panel closed.
   - Window B → **Priya** → `/stayer/inbox`.
   - Window C → **Sam** → `/stayer/inbox`.
   - Have a 4th tab in window A ready on the switcher for **Omar** (or just switch Alex → Omar → Alex; it's 2 clicks).
4. Close Slack, notifications, other tabs. Turn on Do Not Disturb.
5. Open `lib/scoring.ts` in an editor in the background, scrolled to `stayerScore`, for Q&A.

---

### The 5-minute script (one laptop)

Timings are cumulative. **Bold** = say it. *Italics* = what the driver does. → = what to point at.

#### 0:00–0:35 · The problem (no clicking)

**"Every summer, thousands of students come to Ann Arbor for internships, research and classes, and they sublet a
room. Finding a room is the easy part. The hard part is that you're not renting a room, you're joining a household.
The person leaving lists the place, but they won't be living there. The roommates who stay never get a say, and you
can't see their habits until you've moved in. That's how you end up with a roommate who has people over four nights
a week when you need to be up at 6."**

**"burrow has three users per listing: the leaver who lists it, the stayers who live there, and the incoming
student. We built the whole loop."**

#### 0:35–1:35 · Gate: no listing goes live until every stayer has answered

*Window A (Alex) on Browse.*

**"This is Alex, coming for a summer at the medical campus. Alex filled out the same eight habit questions every
roommate answers: bedtime, guests, cleanliness, how you raise problems. Habits only. We never ask about identity."**

→ Point at Packard St at the top: **Strong fit, 94.**
→ Point at Church St under *Excluded*: **"Alex said smoking is a deal-breaker, so Church St is out, and it tells
you why, instead of just hiding it."**

**"Notice what's missing: Hill St. Its leaver listed it, but one roommate, Omar, hasn't answered yet. Until every
stayer describes the household, nobody can see it. That's enforced on the server, not just hidden in the UI."**

*Switch to **Omar** → Hill St form → answer: After 1am · Mixed · 2–3 · 1–2 nights · Quiet weeknights, livelier weekends · Right
away · Friendly but separate · In person → **Save my answers →**.* (Practice this; it's 8 clicks.)

→ The confirmation: **"…Hill St house is now live."**

*Switch back to **Alex** → Browse.*

→ Hill St appears **3rd: 71, Okay fit, "limited by your fit with Omar"**.

**"Here's the key design choice. Alex is a 94 with Nina but a lot lower with Omar. We don't average them, because
you live with both. The household score is the *minimum*, and we show you who's limiting it. One bad match ruins
the summer."**

#### 1:35–2:35 · Decision sensitivity: change the inputs, the answer changes

*Open "Try a change" on Browse.*

1. *Guests: 1 → 4+.*
   **"If Alex actually has people over most nights…"** → Geddes overtakes Packard; Packard's top mismatch becomes
   **"Guests: you 4+ nights, Priya 1 night."** *Set it back to 1.*
2. *Bedtime matters: A lot.*
   **"Priorities matter too. If bedtime is a big deal for Alex…"** → Packard drops, because Sam stays up till 1.
   *Set it back to Some.*
3. *Deal-breaker: Pets on.*
   → Geddes Ave moves to Excluded: **"Pets in the home."** *Turn Pets off.*

**"Every one of those numbers is a rule you can check by hand. No AI, no black box. We'll walk one in Q&A if you
want."**

#### 2:35–3:05 · Stayers shape the match too

*Window B (Priya) → Packard St habit form → bedtime: After 1am → **Save changes →**.*

**"It goes both ways. Priya, a stayer at Packard, updates her bedtime."**

*Window A → reload Browse.* → Packard: **94 → 88**, and Geddes moves ahead.

**"Alex's ranking just changed because a roommate changed, not because Alex did."**

#### 3:05–4:20 · Unanimous approval → house terms → simultaneous contact reveal

*Window A (Alex): open Packard St → "Request to join this household."*

**"Alex asks to join Packard. The leaver doesn't get a vote; they won't be living there. Every stayer does."**

→ Window B and C inboxes show the request within a few seconds (no reload). Point at what stayers see: Alex's
answers, the fit, "where you match / where you differ." **"Stayers only see Alex's answers once Alex asks to join.
Blind until then, in both directions."**

*Window B: Priya → Approve ✓. Window C: Sam → Approve ✓.*

**"It takes everyone. One pass and it's declined."**

→ Windows B and C flip to **"Agree on house terms."** Window A (Alex, on My requests) flips to **Approved → "Continue to terms →"** within a few seconds.

*Open the terms page in all three (A: "Continue to terms →"; B, C: "Agree on house terms").*

**"burrow writes the house terms from everyone's answers: quiet hours from the earliest sleeper, a guest policy,
dishes, how to raise problems. Each one says why."** → point at one "why".

*Window A: click the **Text** pill FIRST (the input only appears after a pill is picked), type 734-555-0100, then
"Agree to all and share my contact." Window B: Agree to all. Window C: Agree to all.* (Priya and Sam already have
contacts saved. If Alex clicks Agree before entering a contact, it agrees to the terms and asks for the contact:
enter it and you're done.)

→ **Contacts appear in all three windows at the same moment.**

**"Contacts unlock only when everyone has approved and agreed to every term, and then they unlock for everyone
at once. No one shares more than anyone else. Rent, deposit and the lease happen outside the app. We don't take
payments or host chat."**

#### 4:20–5:00 · Close

**"So: the listing can't go live until the household describes itself. You can't see anyone until you've
described yourself. Your ranking is by your worst fit, not your average. And nobody moves in until every roommate
says yes."**

**"It's a real working app. Next.js, a real database, every rule enforced on the server, 40 automated tests plus an
end-to-end test that walks this exact demo. Every listing and person you saw is sample data."**

**"Leases already require roommates to consent to a sublet. burrow turns that signature into an actual
decision. Thank you."**

---

## If something goes wrong

| Problem | Recovery (backup person handles it; narrator keeps talking) |
|---|---|
| Anything gets into a weird state | **Reset demo** (gear icon, top-right), re-switch to Alex. Skip to the next section; don't redo. |
| Omar's answers differ from the script | Hill St still appears, just at a different rank. Say "and there it is" and keep going. |
| Inbox doesn't update after the request | Reload the tab. It polls every few seconds. |
| Contacts don't appear | Someone hasn't agreed to every term or set a contact. Check each window's terms page. |
| Out of time at 3:05 | Skip the terms clicks. Say "after unanimous approval, they agree on generated house terms and contacts unlock for everyone at the same moment," then close. |
| Laptop / server dies | Second laptop runs the shared server: http://100.95.56.19:3000 (tailnet), or `npm run dev` locally. |
| Map blank | No internet for tiles. "Map tiles need Wi-Fi." Move on. |

Backup shortcut for step 6: **Noor** is already approved at **Catherine St** with terms half agreed. Switch to
Noor → `/incoming/requests` → Catherine St → set a contact → "Agree to all and share my contact" → contacts unlock
(Grace has already agreed to everything).

---

## Q&A prep (5 minutes)

Keep answers to 2–3 sentences. Backup person takes technical questions; narrator takes product and why.

### Scoring and design

**"How is the score calculated? Walk me through one."**
Each question's difference is normalized 0–1: `gap = |a − b| / (options − 1)`. A stayer's score is the weighted
share of agreement: `100 × Σ w·(1 − gap) / Σ w`, with weights Matters a lot = 3, Some = 1, Not at all = 0. Alex vs Sam:
only bedtime differs, by one step of two, so gap 0.5. With every weight at 1 that's (7 + 0.5) / 8 = 93.75 → **94**.
Priya matches exactly → 100. Household = **min = 94**, average 97. (Open `lib/scoring.ts`.)

**"Why the minimum and not the average?"**
You live with every stayer. A 100 and a 40 averages to 70, which looks fine and hides the person you'll fight with.
We show the average too, and we name the limiting roommate.

**"Why not use AI / ML for matching?"**
We have no outcome data to train on, and people deserve to see why they were ranked. Rules are explainable,
testable and can't drift. The next step is a post-move-in check: "was this accurate?" That gives us the data to tune
weights later.

**"Where do the weights come from?"**
The incoming chooses how much each habit matters (a lot / some / not at all). The scale (3/1/0) and the label
thresholds (75 strong, 55 okay) are our judgment, and we say so.

**"Why these 8 questions?"**
They're the things roommates actually clash over: sleep, guests, cleanliness, noise, how you handle problems. Every
question is about behaviour, none about who you are.

**"Do dates or distance affect the score?"**
No, on purpose. They're shown on every card ("covers your dates", "leaves 10 nights uncovered, outside your ±3
days", "1.2 mi to Medical Campus"), but the score is only about the people. Dates are a filter you can see, not a
hidden penalty.

### Trust, honesty, safety

**"What stops people from lying on the form?"**
Nothing fully, and that's a stated limitation. Two things help: the blind reveal (you can't see the household's
answers until you've committed yours, so you can't tailor them), and stayers see the incoming's answers before
approving. Airbnb found people were more honest when both sides' reviews were revealed simultaneously; same idea.

**"Isn't roommate matching a fair-housing problem?"**
That's exactly why we never ask about demographics, politics or religion: habits only. The stayers approve a
roommate based on how they live, which is what roommates already do informally.

**"What if a stayer never fills out the form?"**
The listing stays unreleased and the leaver sees exactly who they're waiting on ("Waiting on Omar"). The stayer
gets an email with a direct link. That pressure is the point: the household has to show up.

**"What if one roommate just says no to everyone?"**
Then that household isn't a fit for anyone, and that's information the incoming would otherwise learn after
moving in. Leases typically already require roommate consent; we just make it explicit and early.

**"Why no in-app messaging?"**
Scope, and safety. Contacts unlock only after mutual approval and agreed terms, then people talk on their own
channels. No harassment surface, no moderation burden.

### Product and market

**"Isn't finding a sublet the hard part?"**
In Ann Arbor, not really. U-M's own research program tells incoming fellows it's usually easy. What's hard is
choosing the household. (Have the source link ready.)

**"Who's it for, and how would it grow?"**
Students arriving for summer internships, research and classes, and the houses with roommates who stay. Many
sublets are a room in a shared house (e.g. 6 people, 4 leaving, 2 staying). Start with one campus where the
summer influx is predictable, list through leavers who already need to fill a room.

**"How would you make money?"** *(don't invent numbers)*
Not in this prototype. We don't touch payments. A sensible path is a small listing fee for leavers, or partnering
with universities and research programs that already help incoming students find housing.

**"What's missing / what's next?"**
Post-move-in accuracy check to tune the weights; commute-time scoring; combining two sublets to cover your dates.
Out of scope on purpose: payments, deposits, lease documents, in-app chat, any identity-based matching.

### Technical

**"Is this real or a mockup?"**
Real. Next.js 15 + React 19, Prisma with SQLite, a typed API. Every gate (release, profile-complete, blind
reveal, unanimous approval, contact unlock) is enforced on the server, so you can't skip it by calling the API
directly. 40 unit tests pin the scoring and the demo numbers; an end-to-end smoke test walks this whole demo over
HTTP. Notification emails are real (see the Outbox page); we just don't send to the sample addresses.

**"How did three people build this in a day?"**
Three lanes with a shared typed contract: one person owned the backend, scoring and API types; one the incoming
flow; one the leaver and stayer flow. Each worked with a Claude agent, and the agents coordinated through a small
mailbox we built into the dev server: requests, reviews, merges. The design came from our Figma file.

**"Does it scale?"**
Scoring is pure arithmetic over 8 numbers per person; ranking hundreds of listings is milliseconds. SQLite is the
hackathon choice; the Prisma schema moves to Postgres by changing one line.

### Limitations to say up front if asked "what are the weaknesses?"

- No Ann Arbor data on sublet roommate-conflict rates; we can't yet prove fewer conflicts.
- Self-reports can be inflated.
- Weights and thresholds are our judgment.
- All listings and people are sample data.

---

## Rehearsal checklist

- [ ] Two full timed run-throughs of the **live three-person version** from **Reset**, with real email. Under 4:50 both times.
- [ ] One run-through of the one-laptop backup.
- [ ] Stayer's email added to `EMAIL_ALLOW`; test email received at the venue.
- [ ] Leaver can type the scripted address/dates and drop the pin without looking.
- [ ] Stayer can do the 8 scripted answers without looking (and the backup driver can do Omar's).
- [ ] Narrator can say the one sentence and the close from memory.
- [ ] Backup can walk Alex vs Sam = 94 out loud in 20 seconds.
- [ ] Three windows set up, three separate logins, zoomed in.
- [ ] Production build running on the presenting laptop; tested on venue Wi-Fi.
- [ ] Hit **Reset demo** right before walking up.
