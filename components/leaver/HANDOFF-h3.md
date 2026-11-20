# h3 handoff (leaver + stayer + /requests/[id])

Branch: `h3/screens` (rebased on main). Read `CLAUDE.md` and `docs/LANES.md` first. Lane = h3.
Figma: HackTheLease `SbkaZ7f3ONHAKmdC3yLt7e`, frames 07 `10:431`, 08 `10:496`, 09 `10:537`, 10 `10:564`,
11 `10:663`, 11b `10:713`, 06 `10:281`, 06b `10:351`.

## Done (built, NOT yet typechecked or run, because this machine had no Node)
- `components/leaver/kit/`: lane kit (Page, Hero, StepDots, Icon via CSS mask, Status, cx, `kit` CSS module).
  Wraps the shared `components/shared/Persona`. Colours map to globals (`--brand`/`--accent` = teal, as the humans decided).
- `app/leaver/page.tsx`: my listings · `app/leaver/new`: create listing (map pin, furnished, flags) ·
  `app/leaver/listings/[id]`: invite + submit + status (the "nudge" was declined by h1, so it's left out).
- `app/stayer/page.tsx`: invite notification · `app/stayer/[listingId]/form`: shared HabitForm restyled to 2 columns ·
  `app/stayer/inbox`: fit, approve/pass, undo (`api.stayer.undoDecision`).
- `app/requests/[id]`: terms (agree per term), contact method + value, "agree to all", polls every 4s, simultaneous reveal.

## Next steps
1. `npm install && cp .env.example .env && npx prisma db push && npm run db:seed`, then `npm run typecheck && npm test`.
   Risk: static `.svg` imports in `kit/index.tsx` need `next-env.d.ts`, which `next dev` generates.
2. `npm run dev` and walk docs/DEMO.md steps 1 (Omar releases Hill St), 5 (Priya edits) and 6 (approve → terms → contacts).
3. Compare each screen against its Figma frame. Brand is teal, not the fox-blue the frames show.
4. Mail h1 that the branch is ready (mailbox: `docs/LANES.md`). h1 merges.
5. Check the mailbox: `curl -s "http://100.95.56.19:3000/api/mail?to=h3"`.
