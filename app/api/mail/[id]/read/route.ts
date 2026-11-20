import { prisma } from "@/lib/server/db";
import { handle, notFound, ok } from "@/lib/server/http";

/** POST /api/mail/:id/read — mark a message read. OWNER: h1. */
export const POST = handle<{ id: string }>(async (_req, { id }) => {
  const m = await prisma.mail.findUnique({ where: { id } });
  if (!m) throw notFound("Mail");
  await prisma.mail.update({ where: { id }, data: { readAt: m.readAt ?? new Date() } });
  return ok({ id, read: true });
});
