import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { incomingView, loadListing, pub, toListingInput, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import { scoreListing } from "@/lib/scoring";
import type { Answers, Decision, Destination, RequestStatus, StayerInboxResponse } from "@/lib/types";

/**
 * GET /api/stayer/requests — inbox of requests to households I stay in, with fit.
 * The incoming's raw answers are revealed here because they requested this listing (gate §2.3).
 */
export const GET = handle(async () => {
  const u = await requireUser();
  const ms = await prisma.membership.findMany({ where: { userId: u.id, role: "stayer" } });
  const rows = await prisma.request.findMany({
    where: { listingId: { in: ms.map((m) => m.listingId) } },
    include: { incoming: { include: { incoming: true } }, approvals: true },
    orderBy: { createdAt: "desc" },
  });
  const requests = await Promise.all(
    rows.map(async (r) => {
      const l = await loadListing(r.listingId);
      const inc = incomingView(r.incoming.incoming);
      const answers = inc.answers as Answers;
      const fit = scoreListing(
        { answers, weights: inc.weights, dealBreakers: inc.dealBreakers, startDate: inc.startDate!, endDate: inc.endDate! },
        toListingInput(l),
        { incomingName: r.incoming.name },
      );
      const vote = (id: string) => (r.approvals.find((a) => a.stayerId === id)?.decision as Decision | undefined) ?? null;
      return {
        id: r.id,
        status: r.status as RequestStatus,
        createdAt: r.createdAt.toISOString(),
        listing: toSummary(l),
        incoming: {
          ...pub(r.incoming),
          startDate: inc.startDate!,
          endDate: inc.endDate!,
          destination: inc.destination as Destination,
          answers,
        },
        fit,
        sharedPhone: r.sharedPhone ?? null,
        myDecision: vote(u.id),
        approvals: l.memberships.map((m) => ({ stayer: pub(m.user), decision: vote(m.userId) })),
      };
    }),
  );
  return ok<StayerInboxResponse>({ requests });
});
