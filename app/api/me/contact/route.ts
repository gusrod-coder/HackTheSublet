import { prisma } from "@/lib/server/db";
import { handle, ok, parseBody } from "@/lib/server/http";
import { contactSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";
import { checkContactsUnlocked } from "@/lib/server/repo";

/** PUT /api/me/contact { method, value } — preferred contact, revealed only after §2.5 gates pass. */
export const PUT = handle(async (req) => {
  const u = await requireUser();
  const { method, value } = await parseBody(req, contactSchema);
  await prisma.user.update({ where: { id: u.id }, data: { contactMethod: method, contactValue: value } });
  // Setting a contact can be the last step of gate §2.5 on any approved request this user is part of.
  const approved = await prisma.request.findMany({
    where: {
      status: "approved",
      contactsNotifiedAt: null,
      OR: [{ incomingId: u.id }, { listing: { memberships: { some: { userId: u.id, role: "stayer" } } } }],
    },
    select: { id: true },
  });
  for (const r of approved) await checkContactsUnlocked(r.id);
  return ok({ method, value });
});
