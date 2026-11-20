import { prisma } from "@/lib/server/db";
import { emailMode } from "@/lib/server/email";
import { handle, ok } from "@/lib/server/http";
import type { EmailStatus, OutboxResponse } from "@/lib/types";

/** GET /api/dev/outbox?to=<email>&limit=50 — notification emails, newest first. OWNER: h1. */
export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const to = q.get("to");
  const limit = Math.min(Number(q.get("limit") ?? 50) || 50, 200);
  const rows = await prisma.emailOutbox.findMany({
    where: to ? { to } : {},
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  const names = new Map(
    (await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.toUserId).filter((x): x is string => !!x) } } })).map(
      (u) => [u.id, u.name],
    ),
  );
  return ok<OutboxResponse>({
    mode: emailMode(),
    emails: rows.map((r) => ({
      id: r.id,
      to: r.to,
      toName: r.toUserId ? names.get(r.toUserId) ?? null : null,
      kind: r.kind,
      subject: r.subject,
      text: r.text,
      link: r.link,
      status: r.status as EmailStatus,
      error: r.error,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});
