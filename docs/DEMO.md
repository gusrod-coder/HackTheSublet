# Demo script (spec §8)

Start from a clean state: **Reset** in the top bar (or `POST /api/demo/reset`). Demo users are in the switcher.
Numbers below come from the sample data and are pinned by `lib/scoring.test.ts`.

| # | Show | Do | Expect |
|---|---|---|---|
| 0 | Gate §2.2 | Switch to **Riley** → Browse | Sent to finish the profile; no scores visible |
| 1 | Release gate | **Alex** → Browse | Hill St absent. Church St under *Excluded* (smoking). Packard St first (94, avg 97) |
|   |   | **Leo** (leaver) → Hill St | "Waiting on 1 roommate"; leaver sees status, not answers |
|   |   | **Omar** → Hill St form → submit | Listing goes live |
|   |   | **Alex** → Browse | Hill St appears |
| 2 | Habit sensitivity | Alex: guests per week 1 → 4+ | Geddes overtakes Packard; Packard's top mismatch becomes "Guests: you 4+ nights, Priya 1 night" |
| 3 | Priority sensitivity | Alex: bedtime → *matters a lot* | Order changes (Packard drops: Sam is 11pm–1am) |
| 4 | Deal-breaker | Alex: turn on *Pets* | Geddes Ave → Excluded: "Pets in the home" |
| 5 | Stayer side | **Priya**: bedtime → *After 1am* | Alex's Packard fit 94 → 88; Geddes moves ahead |
| 6 | Approval → terms → contacts | Alex requests Packard → **Priya** approves → **Sam** approves → each party agrees to all 5 terms + sets a contact | Contacts appear for everyone at the same moment |

Undo steps 2–5 between runs, or just hit Reset.

**Walk one score by hand (Alex vs Sam, default weights):** only bedtime differs (before 11pm vs 11pm–1am),
gap = 1/2 = 0.5. Σ w·(1−gap) = 7 × 1 + 0.5 = 7.5; Σ w = 8; 100 × 7.5 / 8 = 93.75 → **94**. Priya matches Alex
exactly → 100. Household = min = **94**, average = 97.

**Out of scope (say so in Q&A):** payments, deposits, lease documents, in-app messaging, commute scoring,
combining sublets, post-move-in accuracy check (future work), any identity-based matching.
