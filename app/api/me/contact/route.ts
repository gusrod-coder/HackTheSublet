import { prisma } from "@/lib/server/db";
import { handle, ok, parseBody } from "@/lib/server/http";
import { contactSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";

/** PUT /api/me/contact { method, value } — preferred contact, revealed only after §2.5 gates pass. */
export const PUT = handle(async (req) => {
  const u = await requireUser();
  const { method, value } = await parseBody(req, contactSchema);
  await prisma.user.update({ where: { id: u.id }, data: { contactMethod: method, contactValue: value } });
  return ok({ method, value });
});
