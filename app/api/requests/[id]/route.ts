import { handle, ok } from "@/lib/server/http";
import { loadRequest, partyRole, pub, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { RequestDetailResponse, RequestStatus } from "@/lib/types";

/** GET /api/requests/:id — status + parties. Incoming or stayers of the listing only. */
export const GET = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const { request, listing } = await loadRequest(id);
  const viewerRole = partyRole(u.id, request, listing);
  return ok<RequestDetailResponse>({
    id: request.id,
    status: request.status as RequestStatus,
    listing: toSummary(listing),
    incoming: pub(request.incoming),
    stayers: listing.memberships.map((m) => pub(m.user)),
    viewerRole,
  });
});
