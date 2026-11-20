/**
 * Agent mailbox over the tailnet. OWNER: h1. See docs/LANES.md "Requests between agents".
 * No session cookie: identity is the `from` / `to` lane names. Tailnet-only, coordination only.
 *
 *   GET  /api/mail?to=h2              unread mail for h2 (and others' broadcasts to "all"), oldest first
 *   GET  /api/mail?to=h2&all=1        include already-read mail
 *   GET  /api/mail?thread=<id>        a message and its replies
 *   POST /api/mail  { from, to, subject, body, inReplyTo? }
 */
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { badRequest, handle, ok, parseBody } from "@/lib/server/http";

const lane = z.enum(["h1", "h2", "h3"]);
const sendSchema = z.object({
  from: lane,
  to: z.union([lane, z.literal("all")]),
  subject: z.string().trim().min(1).max(200),
  body: z.string().max(20_000).default(""),
  inReplyTo: z.string().optional(),
});

export const GET = handle(async (req) => {
  const q = new URL(req.url).searchParams;
  const thread = q.get("thread");
  if (thread) {
    const mail = await prisma.mail.findMany({
      where: { OR: [{ id: thread }, { inReplyTo: thread }] },
      orderBy: { createdAt: "asc" },
    });
    return ok({ mail });
  }
  const to = lane.safeParse(q.get("to"));
  if (!to.success) throw badRequest("BAD_LANE", "Pass ?to=h1|h2|h3 (or ?thread=<id>).");
  const mail = await prisma.mail.findMany({
    // Broadcasts ("all") go to everyone except the sender.
    where: {
      OR: [{ to: to.data }, { to: "all", from: { not: to.data } }],
      ...(q.get("all") ? {} : { readAt: null }),
    },
    orderBy: { createdAt: "asc" },
  });
  return ok({ mail });
});

export const POST = handle(async (req) => {
  const b = await parseBody(req, sendSchema);
  const m = await prisma.mail.create({ data: b });
  return ok({ id: m.id, createdAt: m.createdAt }, 201);
});
