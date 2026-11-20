# burrow: demo-day guide (5 min demo + 5 min Q&A)

The click-by-click reference is `docs/DEMO.md`. This file is the **talk track**: what to say, what to point at, who
does what, and how to handle questions. Every number below comes from the sample data and is pinned by
`lib/scoring.test.ts`, so it will be the same on stage as in rehearsal.

---

## The one sentence

> **Finding a summer sublet in Ann Arbor is easy. Choosing the right household is hard, and the roommates who stay
> never get a say. burrow matches the incoming student with every roommate they'll actually live with, and
> nobody moves in until every one of them says yes.**

If a judge remembers only one thing, it should be **"household fit, not listing fit, with every stayer's
approval."** Say "household" a lot.

---

## Roles on stage

| Person | Job |
|---|---|
| **Narrator** | Talks the whole 5 minutes. Faces the judges, not the screen. Owns the hook and the close. |
| **Driver** | Clicks. Never talks over the narrator. Has `docs/DEMO.md` open on a phone/second screen. |
| **Backup / timekeeper** | Holds up fingers at 4:00 and 4:30. Takes technical Q&A (scoring, gates, stack). Handles recovery if something breaks. |

Rehearse at least twice with a timer. The script below fits in **4:45** if the driver is fast; there is no slack
for exploring.

---

## Setup (do this 15 minutes before)

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
3. **Reset demo** (sun icon, top-right of the header → Reset demo) in any window. Then:
   - Window A → switch to **Alex** → open `/incoming/browse`. Leave the "Try a change" panel closed.
   - Window B → **Priya** → `/stayer/inbox`.
   - Window C → **Sam** → `/stayer/inbox`.
   - Have a 4th tab in window A ready on the switcher for **Omar** (or just switch Alex → Omar → Alex; it's 2 clicks).
4. Close Slack, notifications, other tabs. Turn on Do Not Disturb.
5. Open `lib/scoring.ts` in an editor in the background, scrolled to `stayerScore`, for Q&A.

---

## The 5-minute script

Timings are cumulative. **Bold** = say it. *Italics* = what the driver does. → = what to point at.

### 0:00–0:35 · The problem (no clicking)

**"Every summer, thousands of students come to Ann Arbor for internships, research and classes, and they sublet a
room. Finding a room is the easy part. The hard part is that you're not renting a room, you're joining a household.
The person leaving lists the place, but they won't be living there. The roommates who stay never get a say, and you
can't see their habits until you've moved in. That's how you end up with a roommate who has people over four nights
a week when you need to be up at 6."**

**"burrow has three users per listing: the leaver who lists it, the stayers who live there, and the incoming
student. We built the whole loop."**

### 0:35–1:35 · Gate: no listing goes live until every stayer has answered

*Window A (Alex) on Browse.*

**"This is Alex, coming for a summer at the medical campus. Alex filled out the same eight habit questions every
roommate answers: bedtime, guests, cleanliness, how you raise problems. Habits only. We never ask about identity."**

→ Point at Packard St at the top: **Strong fit, 94.**
→ Point at Church St under *Excluded*: **"Alex said smoking is a deal-breaker, so Church St is out, and it tells
you why, instead of just hiding it."**

**"Notice what's missing: Hill St. Its leaver listed it, but one roommate, Omar, hasn't answered yet. Until every
stayer describes the household, nobody can see it. That's enforced on the server, not just hidden in the UI."**

*Switch to **Omar** → Hill St form → answer: After 1am · Mixed · 2–3 · 1–2 nights · Quiet weeknights · Right
away · Friendly but separate · In person → Submit.* (Practice this; it's 8 clicks.)

→ The confirmation: **"…Hill St house is now live."**

*Switch back to **Alex** → Browse.*

→ Hill St appears **3rd: 71, Okay fit, "limited by your fit with Omar"**.

**"Here's the key design choice. Alex is a 94 with Nina but a lot lower with Omar. We don't average them, because
you live with both. The household score is the *minimum*, and we show you who's limiting it. One bad match ruins
the summer."**

### 1:35–2:35 · Decision sensitivity: change the inputs, the answer changes

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

### 2:35–3:05 · Stayers shape the match too

*Window B (Priya) → Packard St habit form → bedtime: After 1am → Save.*

**"It goes both ways. Priya, a stayer at Packard, updates her bedtime."**

*Window A → reload Browse.* → Packard: **94 → 88**, and Geddes moves ahead.

**"Alex's ranking just changed because a roommate changed, not because Alex did."**

### 3:05–4:20 · Unanimous approval → house terms → simultaneous contact reveal

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

### 4:20–5:00 · Close

**"So: the listing can't go live until the household describes itself. You can't see anyone until you've
described yourself. Your ranking is by your worst fit, not your average. And nobody moves in until every roommate
says yes."**

**"It's a real working app. Next.js, a real database, every rule enforced on the server, 34 automated tests plus an
end-to-end test that walks this exact demo. Every listing and person you saw is sample data."**

**"Leases already require roommates to consent to a sublet. burrow turns that signature into an actual
decision. Thank you."**

---

## If something goes wrong

| Problem | Recovery (backup person handles it; narrator keeps talking) |
|---|---|
| Anything gets into a weird state | **Reset demo** (sun icon menu, top-right), re-switch to Alex. Skip to the next section; don't redo. |
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
directly. 34 unit tests pin the scoring and the demo numbers; an end-to-end smoke test walks this whole demo over
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

- [ ] Two full timed run-throughs from **Reset**. Under 4:50 both times.
- [ ] Driver can do Omar's 8 answers without looking.
- [ ] Narrator can say the one sentence and the close from memory.
- [ ] Backup can walk Alex vs Sam = 94 out loud in 20 seconds.
- [ ] Three windows set up, three separate logins, zoomed in.
- [ ] Production build running on the presenting laptop; tested on venue Wi-Fi.
- [ ] Hit **Reset demo** right before walking up.
