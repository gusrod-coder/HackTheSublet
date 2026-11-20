import { prisma } from "@/lib/server/db";
import { badRequest, conflict, forbidden, handle, ok } from "@/lib/server/http";
import { requireCompleteIncoming, requireLiveListing } from "@/lib/server/repo";
import { notifyRequestReceived } from "@/lib/server/notify";
import { requireUser } from "@/lib/server/session";
import { requestToJoinSchema } from "@/lib/server/schemas";
import type { RequestRef, RequestStatus } from "@/lib/types";

/**
 * POST /api/listings/:id/requests — incoming asks to join this household.
 * Optional body { sharePhone } (RequestToJoinBody): a number the incoming chooses to show this household's stayers.
 * 403 PROFILE_INCOMPLETE until profile complete; 404 unless live; 409 if already requested.
 * Sending reveals the incoming's answers to this listing's stayers (gate §2.3).
 */
export const POST = handle<{ id: string }>(async (req, { id }) => {
  const u = await requireUser();
  // Body is optional (older clients send none).
  const text = await req.text();
  let raw: unknown = {};
  if (text.trim()) {
    try {
      raw = JSON.parse(text);
    } catch {
      throw badRequest("INVALID_JSON", "Body must be JSON.");
    }
  }
  const body = requestToJoinSchema.parse(raw ?? {});
  await requireCompleteIncoming(u.id);
  const l = await requireLiveListing(id);
  if (l.leaverId === u.id || l.memberships.some((m) => m.userId === u.id))
    throw forbidden("OWN_LISTING", "You're already part of this household.");
  const existing = await prisma.request.findUnique({ where: { listingId_incomingId: { listingId: id, incomingId: u.id } } });
  if (existing) throw conflict("ALREADY_REQUESTED", "You've already sent a request to this household.");
  const r = await prisma.request.create({ data: { listingId: id, incomingId: u.id, status: "sent", sharedPhone: body.sharePhone ?? null } });
  await notifyRequestReceived(r.id);
  return ok<RequestRef>({ id: r.id, status: r.status as RequestStatus }, 201);
});
