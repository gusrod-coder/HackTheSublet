import { prisma } from "@/lib/server/db";
import { conflict, forbidden, handle, ok } from "@/lib/server/http";
import { requireCompleteIncoming, requireLiveListing } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { RequestRef, RequestStatus } from "@/lib/types";

/**
 * POST /api/listings/:id/requests — incoming asks to join this household. No body.
 * 403 PROFILE_INCOMPLETE until profile complete; 404 unless live; 409 if already requested.
 * Sending reveals the incoming's answers to this listing's stayers (gate §2.3).
 */
export const POST = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  await requireCompleteIncoming(u.id);
  const l = await requireLiveListing(id);
  if (l.leaverId === u.id || l.memberships.some((m) => m.userId === u.id))
    throw forbidden("OWN_LISTING", "You're already part of this household.");
  const existing = await prisma.request.findUnique({ where: { listingId_incomingId: { listingId: id, incomingId: u.id } } });
  if (existing) throw conflict("ALREADY_REQUESTED", "You've already sent a request to this household.");
  const r = await prisma.request.create({ data: { listingId: id, incomingId: u.id, status: "sent" } });
  return ok<RequestRef>({ id: r.id, status: r.status as RequestStatus }, 201);
});
