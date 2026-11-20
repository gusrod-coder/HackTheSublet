# h3 handoff (leaver + stayer)

Read `CLAUDE.md`, `docs/LANES.md`, and the mailbox first. Lane = h3.
`h3/screens` was merged into main as `680f9c2`; new follow-ups start from current main.
`h3/live-status` was merged as `fa85094`.
`h3/expanded-data-qa` was merged as `2d3b463`.
`h3/burrow-brand` was merged as `4e9c54a`.
Current follow-up branch: `h3/figma-review` (based on `306943e`).

## H2 Figma review (frames 07–11b)
- H1 assigned the bounded review items in mail `cmwopndwo008vl9sm1yy43k82`, using H2's Figma report `cmwopmavw008rl9sm0q303r4z` as reference.
- Inbox 1–6: one pending request gets the incoming fox + Figma hero, with a combined viewer/house caption above it and no duplicate incoming heading. Multiple requests keep one page heading and separate fox/request sections. Match headings/icons use leaf ink, fit rows have no divider, and the chip displays the fit label only (score remains in the accessible description and per-stayer rows).
- State 11b: an approved personal vote on a still-pending request retains the sky Your call card, You approved, named waiting roommates, and ghost Undo. The render regression covers the single-request state; browser screenshot review remains H2's.
- Form 8–10: uses shared HabitForm compactTitles (H1's `7fdc769`) and QUESTIONS.title, with numbered legends, borderless soft-lift cards and 12/16 semibold options padded 8×14. No shared form fork.
- New listing 11–13: cream borderless inputs, optional House rules disclosure, API-required Area retained, unselected room choices use plain text styling.
- Invite 14–16: emails removed from roommate rows; lede ends at That's the whole point. Address/sample context retained; no nudge/messaging added.
- Notification 17: action precedes sample/house context and a plain roommate-status caption. Optional background-circle item 18 omitted.
- DEMO-GUIDE sanity check sent to H1 in `cmwoq1bhs0000l9jbks0kn1nu`: initial Save my answers →, edit Save changes →, full Quiet weeknights option. H1 corrected the guide on main.
- Validation: typecheck, all 38 tests (including the new single-request/pending-vote render case), optimized production build, and full local production-server API smoke pass. Local sample data restored; H2 screenshot review remains pending.

## Current brand follow-up
- Humans now chose **burrow**, fox-blue, and the shared sketch outline (H1 mail `cmwop9lcj008gl9smo94a6rdn`). This supersedes the earlier teal decision.
- `--hf-sky` maps to `--sky`; match panels use `--match-bg`. No runtime H3 styles use the legacy teal/mint aliases.
- Lane buttons and pills compose global `btn` / `option` classes, with global secondary/ghost modifiers, so the shared Figma fills, selected/disabled states, reduced-motion behavior, and sketch outlines apply. All `kit` exports are retained for H2's terms page.
- Sticker surfaces and the new map frame compose `sketch`; the map's inner straight border is removed to avoid double outlines. Stayer options no longer override the shared selected state; soft question-card sketches use `--line-soft`.
- Persona code/layout inspection: shared artwork still occupies 88×120; the lane's half-size row wrapper stays 44×60, scale .5, top-left origin. Hero and invite placements keep those boxes, with no new persona background cards. H2 screenshot review requested in mail `cmwopd25m008jl9smprbgahlk`; local browser URL safeguard remains in place.
- Validation: typecheck, all 34 tests, optimized production build (including H2 terms consumers), and the full API smoke against the production server pass. Production listing HTML includes the composed `btn`, `option`, and `sketch` classes.

## Expanded-data QA and visual fixes
- H1 assigned V1–V4 from H2's browser QA and explicitly approved using H2's report plus existing incoming/terms styles. H2 now owns Figma fidelity and screenshot review.
- V1: one inbox page heading and viewer label; each request has its own incoming name, listing, sample label, dates, and decision controls.
- V2: lane form fieldsets reset the inherited border and padding.
- V3: Page uses the app's existing content edge with no extra horizontal/top padding or clipped background blobs. `.page`, `.warmTop`, all kit exports and `--hf-*` aliases remain available to H2's terms page.
- V4: match panels use shared match-background/brand colors (originally the mint alias, now semantic `--match-bg`).
- `npx tsx components/leaver/qa/expanded-states.ts` runs 30 checks against **localhost:3000 only**, using the typed API client. It resets the local sample DB before and after. Covers Taylor's draft/submission/invite, listing-specific answers, Mei's release gate, three-person approvals/undo, and Grace's partially agreed terms/contact lock.
- Validation: 30 expanded-state checks, typecheck, all 34 unit/render tests, and full local smoke pass. Two render tests cover multiple-request heading/action separation and the empty inbox.
- Local browser QA was blocked by the Chrome URL-identification safeguard. No browser workaround used. H2 screenshot review is requested with this branch; do not claim local visual verification.

## Current ownership (H1 mailbox, November 20)
- H3 owns `app/leaver/**`, `app/stayer/**`, `components/leaver/**`, `components/stayer/**`.
- **Terms + contacts (`app/requests/**`) now belong to H2.** The original H3 page shipped in the merge.
- H2 imports `components/leaver/kit`; coordinate before renaming or removing its exports.
- H1's priorities: inbox polling while any request is `sent`, invite-status polling while `waitingOn > 0`, then H2 browser-QA findings.
- Contact-fetch retry bug sent to H2 (mail `cmwoo9ej900ugl9xm3giog8rx`): after unlock, a failed contacts GET never retries because terms polling stops. H3 has no terms edits.

## Follow-ups on h3/live-status
- Inbox refreshes about every 4 seconds while any request is pending and the tab is visible.
- Invite status and the leaver listings overview refresh while roommates' answers are outstanding.
- Polling waits for each response before scheduling another and clears timers on cleanup.
- Empty submitted households explain that at least one stayer must be invited.
- Six timer tests cover cadence, inactive/hidden tabs, slow requests, and cleanup.

Figma: HackTheLease `SbkaZ7f3ONHAKmdC3yLt7e`, frames 07 `10:431`, 08 `10:496`, 09 `10:537`, 10 `10:564`,
11 `10:663`, 11b `10:713`, 06 `10:281`, 06b `10:351`.

## Original screens (merged; H1 verified typecheck, 22 tests, build, smoke, and seven pages)
- `components/leaver/kit/`: lane kit (Page, Hero, StepDots, Icon via CSS mask, Status, cx, `kit` CSS module).
  Wraps the shared `components/shared/Persona`. Colours map to the current global `--brand`/`--accent` tokens.
- `app/leaver/page.tsx`: my listings · `app/leaver/new`: create listing (map pin, furnished, flags) ·
  `app/leaver/listings/[id]`: invite + submit + status (the "nudge" was declined by h1, so it's left out).
- `app/stayer/page.tsx`: invite notification · `app/stayer/[listingId]/form`: shared HabitForm restyled to 2 columns ·
  `app/stayer/inbox`: fit, approve/pass, undo (`api.stayer.undoDecision`).
- `app/requests/[id]`: terms (agree per term), contact method + value, "agree to all", polls every 4s, simultaneous reveal.

## Local setup and verification
- Portable Node 22.23.5 is at `$env:TEMP/h3-node-runtime/node-v22.23.5-win-x64` (official archive checksum verified). Add it to the command's PATH; no system install needed.
- `npm ci` and `npm run setup` completed. Existing `.env` preserved. `npm run dev` generates ignored `next-env.d.ts`.
- Follow-up typecheck passes; all 28 tests pass (22 existing + 6 polling tests); full local API smoke passes, including demo steps 1, 5, and 6.
- The managed Windows sandbox blocks npm network access, Vitest's parent-directory reads, and tsx's OS user-info lookup. Use approved elevated commands for dependency setup, tests, and smoke.
- H1 explicitly waived Figma for the polling fixes, then assigned bounded visual fixes from H2's report. H2 owns Figma fidelity and visual review. Current brand is burrow/fox-blue.

## Coordination
Check `curl.exe -s "http://100.95.56.19:3000/api/mail?to=h3"` at task start and about every 15 minutes.
H1 reviews and merges pushed branches; send the branch, commit, and validation results through the mailbox.
H2 is doing browser QA and will mail repro steps to H3 and H1.
