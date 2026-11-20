import { prisma } from "@/lib/server/db";
import { badRequest, handle, ok, parseBody } from "@/lib/server/http";
import { householdStatus, requireLeader, syncListingStatus } from "@/lib/server/repo";
import { notifyInvited } from "@/lib/server/notify";
import { inviteSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

const nameFromEmail = (email: string) => {
  const local = email.split("@")[0].replace(/[._-]+/g, " ");
  return local.charAt(0).toUpperCase() + local.slice(1);
};

/**
 * POST /api/listings/:id/invites { invites: [{ email, name? }] } — leaver invites stayers.
 * Creates the user if the email is new (demo: no real email is sent). Inviting a new
 * stayer to a live listing pulls it back to awaiting_household until they answer.
 * Returns HouseholdStatusResponse.
 */
export const POST = handle<{ id: string }>(async (req, { id }) => {
  const u = await requireUser();
  const listing = await requireLeader(u.id, id);
  const { invites } = await parseBody(req, inviteSchema);
  for (const inv of invites) {
    if (inv.email === u.email) throw badRequest("CANNOT_INVITE_SELF", "The leaver can't be a stayer on their own listing.");
    const user =
      (await prisma.user.findUnique({ where: { email: inv.email } })) ??
      (await prisma.user.create({ data: { email: inv.email, name: inv.name ?? nameFromEmail(inv.email) } }));
    if (user.id === listing.leaverId) throw badRequest("CANNOT_INVITE_SELF", "The leaver can't be a stayer on their own listing.");
    const existing = await prisma.membership.findUnique({ where: { listingId_userId: { listingId: id, userId: user.id } } });
    if (!existing) {
      const answered = await prisma.habitProfile.findUnique({ where: { userId_listingId: { userId: user.id, listingId: id } } });
      await prisma.membership.create({
        data: { listingId: id, userId: user.id, role: "stayer", inviteStatus: answered ? "answered" : "invited" },
      });
      if (!answered) await notifyInvited(id, user.id);
    }
  }
  await syncListingStatus(id);
  return ok(await householdStatus(id), 201);
});
