# h3 handoff (leaver + stayer)

Read `CLAUDE.md`, `docs/LANES.md`, and the mailbox first. Lane = h3.
`h3/screens` was merged into main as `680f9c2`; new follow-ups start from current main.
Current follow-up branch: `h3/live-status` (based on `73c0d3e`).

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
  Wraps the shared `components/shared/Persona`. Colours map to globals (`--brand`/`--accent` = teal, as the humans decided).
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
- H1 explicitly waived Figma for these behavior-only fixes. A new visual review still needs Figma connected. Brand remains teal.

## Coordination
Check `curl.exe -s "http://100.95.56.19:3000/api/mail?to=h3"` at task start and about every 15 minutes.
H1 reviews and merges pushed branches; send the branch, commit, and validation results through the mailbox.
H2 is doing browser QA and will mail repro steps to H3 and H1.
