import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { incomingView } from "@/lib/server/repo";
import { currentUser } from "@/lib/server/session";
import type { ContactMethod, InviteStatus, ListingStatus, MeResponse } from "@/lib/types";

/** GET /api/me — who am I and which roles do I have. user is null when signed out. */
export const GET = handle(async () => {
  const u = await currentUser();
  if (!u) return ok<MeResponse>({ user: null, leading: [], staying: [], incoming: null });
  const [leading, staying, inc] = await Promise.all([
    prisma.listing.findMany({ where: { leaverId: u.id }, orderBy: { createdAt: "asc" } }),
    prisma.membership.findMany({ where: { userId: u.id, role: "stayer" }, include: { listing: true } }),
    prisma.incomingProfile.findUnique({ where: { userId: u.id } }),
  ]);
  return ok<MeResponse>({
    user: { id: u.id, name: u.name, email: u.email, contactMethod: u.contactMethod as ContactMethod | null, contactValue: u.contactValue },
    leading: leading.map((l) => ({ listingId: l.id, address: l.address, status: l.status as ListingStatus })),
    staying: staying.map((m) => ({ listingId: m.listingId, address: m.listing.address, inviteStatus: m.inviteStatus as InviteStatus })),
    incoming: inc ? { complete: incomingView(inc).complete } : null,
  });
});
