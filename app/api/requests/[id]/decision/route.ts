import { prisma } from "@/lib/server/db";
import { conflict, forbidden, handle, ok, parseBody } from "@/lib/server/http";
import { loadRequest, resolveRequestStatus } from "@/lib/server/repo";
import { decisionSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";
import type { RequestRef, RequestStatus } from "@/lib/types";

/**
 * POST /api/requests/:id/decision { decision: 'approve' | 'pass' } — stayers only; the leaver
 * has no vote. Unanimous approve → approved; any pass → declined (gate §2.4).
 * 409 REQUEST_CLOSED once approved/declined. A stayer may change their vote while still "sent".
 */
export const POST = handle<{ id: string }>(async (req, { id }) => {
  const u = await requireUser();
  const { decision } = await parseBody(req, decisionSchema);
  const { request, listing } = await loadRequest(id);
  if (!listing.memberships.some((m) => m.userId === u.id))
    throw forbidden("NOT_STAYER", "Only stayers on this listing can approve or pass.");
  if (request.status !== "sent") throw conflict("REQUEST_CLOSED", `This request is already ${request.status}.`);
  await prisma.approval.upsert({
    where: { requestId_stayerId: { requestId: id, stayerId: u.id } },
    create: { requestId: id, stayerId: u.id, decision },
    update: { decision },
  });
  const status = (await resolveRequestStatus(id)) as RequestStatus;
  return ok<RequestRef>({ id, status });
});

/**
 * DELETE /api/requests/:id/decision — stayer retracts their own vote ("Undo"). Only while the
 * request is still "sent" (409 REQUEST_CLOSED after). No-op if they hadn't voted.
 */
export const DELETE = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const { request, listing } = await loadRequest(id);
  if (!listing.memberships.some((m) => m.userId === u.id))
    throw forbidden("NOT_STAYER", "Only stayers on this listing can change their vote.");
  if (request.status !== "sent") throw conflict("REQUEST_CLOSED", `This request is already ${request.status}.`);
  await prisma.approval.deleteMany({ where: { requestId: id, stayerId: u.id } });
  return ok<RequestRef>({ id, status: "sent" });
});
