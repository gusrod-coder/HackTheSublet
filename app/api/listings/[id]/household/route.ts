import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { requireCompleteIncoming, requireLiveListing, toListingInput, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import { exclusionReasons, gap, scoreListing } from "@/lib/scoring";
import { QUESTIONS, type HouseholdResponse, type RequestStatus } from "@/lib/types";

/**
 * GET /api/listings/:id/household — side-by-side answers, per-stayer fit, talk-about list.
 * 403 PROFILE_INCOMPLETE until the incoming profile is complete (blind reveal, gate §2.3).
 * 404 unless the listing is live.
 */
export const GET = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const inc = await requireCompleteIncoming(u.id);
  const l = await requireLiveListing(id);
  const input = toListingInput(l);
  const fit = scoreListing(inc, input);
  const scoreOf = new Map(fit.perStayer.map((p) => [p.stayer.id, p.score]));
  const r = await prisma.request.findUnique({ where: { listingId_incomingId: { listingId: id, incomingId: u.id } } });
  return ok<HouseholdResponse>({
    listing: toSummary(l),
    fit,
    excludedReasons: exclusionReasons(inc, input),
    stayers: input.stayers.map((s) => ({ id: s.id, name: s.name, answers: s.answers, score: scoreOf.get(s.id)! })),
    you: { answers: inc.answers, weights: inc.weights },
    table: QUESTIONS.map((q) => ({
      index: q.index,
      key: q.key,
      short: q.short,
      you: inc.answers[q.index],
      weight: inc.weights[q.index],
      stayers: input.stayers.map((s) => ({ stayerId: s.id, answer: s.answers[q.index] })),
      mismatchWith:
        inc.weights[q.index] > 0
          ? input.stayers.filter((s) => gap(q.index, inc.answers[q.index], s.answers[q.index]) >= 0.5).map((s) => s.id)
          : [],
    })),
    request: r ? { id: r.id, status: r.status as RequestStatus } : null,
  });
});
