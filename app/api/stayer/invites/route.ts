import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { loadListing, stayersOf, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { InviteStatus, StayerInvitesResponse } from "@/lib/types";

/** GET /api/stayer/invites — listings I've been invited to as a stayer (invite notification screen). */
export const GET = handle(async () => {
  const u = await requireUser();
  const ms = await prisma.membership.findMany({ where: { userId: u.id, role: "stayer" }, orderBy: { createdAt: "asc" } });
  const invites = await Promise.all(
    ms.map(async (m) => {
      const l = await loadListing(m.listingId);
      return {
        listing: toSummary(l),
        inviteStatus: m.inviteStatus as InviteStatus,
        otherStayers: stayersOf(l)
          .filter((s) => s.id !== u.id)
          .map((s) => ({ id: s.id, name: s.name, inviteStatus: s.inviteStatus as InviteStatus })),
      };
    }),
  );
  return ok<StayerInvitesResponse>({ invites });
});
