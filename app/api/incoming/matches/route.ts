import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { loadLiveListings, requireCompleteIncoming, toListingInput, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import { rankListings } from "@/lib/scoring";
import type { MatchesResponse, RequestStatus } from "@/lib/types";

/**
 * GET /api/incoming/matches — ranked live listings + excluded-by-deal-breaker list.
 * 403 PROFILE_INCOMPLETE until the incoming profile is complete (gate §2.2).
 * Only `live` listings are considered (gate §2.1).
 */
export const GET = handle(async () => {
  const u = await requireUser();
  const inc = await requireCompleteIncoming(u.id);
  const listings = (await loadLiveListings()).filter(
    (l) => l.leaverId !== u.id && !l.memberships.some((m) => m.userId === u.id),
  );
  const { ranked, excluded } = rankListings(inc, listings.map(toListingInput));
  const reqs = await prisma.request.findMany({ where: { incomingId: u.id } });
  const byId = new Map(listings.map((l) => [l.id, l]));
  return ok<MatchesResponse>({
    ranked: ranked.map((fit) => {
      const r = reqs.find((x) => x.listingId === fit.listingId);
      return {
        listing: toSummary(byId.get(fit.listingId)!),
        fit,
        request: r ? { id: r.id, status: r.status as RequestStatus } : null,
      };
    }),
    excluded,
  });
});
