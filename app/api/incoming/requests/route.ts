import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { loadListing, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { IncomingRequestsResponse, RequestStatus } from "@/lib/types";

/** GET /api/incoming/requests — my sent requests and their status. Votes are counted, not attributed. */
export const GET = handle(async () => {
  const u = await requireUser();
  const rows = await prisma.request.findMany({ where: { incomingId: u.id }, include: { approvals: true }, orderBy: { createdAt: "desc" } });
  const requests = await Promise.all(
    rows.map(async (r) => {
      const l = await loadListing(r.listingId);
      return {
        id: r.id,
        status: r.status as RequestStatus,
        createdAt: r.createdAt.toISOString(),
        listing: toSummary(l),
        approvals: { approved: r.approvals.filter((a) => a.decision === "approve").length, total: l.memberships.length },
      };
    }),
  );
  return ok<IncomingRequestsResponse>({ requests });
});
