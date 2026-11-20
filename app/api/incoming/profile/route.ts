import { prisma } from "@/lib/server/db";
import { badRequest, handle, ok, parseBody } from "@/lib/server/http";
import { incomingView } from "@/lib/server/repo";
import { incomingProfileSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";
import type { IncomingProfileResponse } from "@/lib/types";

/** GET /api/incoming/profile — my incoming profile (empty defaults if never started). */
export const GET = handle(async () => {
  const u = await requireUser();
  const p = await prisma.incomingProfile.findUnique({ where: { userId: u.id } });
  return ok<IncomingProfileResponse>(incomingView(p));
});

/**
 * PUT /api/incoming/profile — partial update; send any subset of fields. The server
 * computes `complete` and `missing`. Matching unlocks when complete (gate §2.2).
 */
export const PUT = handle(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, incomingProfileSchema);
  const cur = await prisma.incomingProfile.findUnique({ where: { userId: u.id } });
  const start = b.startDate ?? cur?.startDate;
  const end = b.endDate ?? cur?.endDate;
  if (start && end && start >= end) throw badRequest("INVALID_DATES", "Move-in must be before move-out.");
  const data = {
    startDate: b.startDate,
    endDate: b.endDate,
    destination: b.destination,
    flexDays: b.flexDays,
    answers: b.answers ? JSON.stringify(b.answers) : undefined,
    weights: b.weights ? JSON.stringify(b.weights) : undefined,
    dealBreakers: b.dealBreakers ? JSON.stringify([...new Set(b.dealBreakers)]) : undefined,
    maxRent: b.maxRent,
  };
  const saved = await prisma.incomingProfile.upsert({ where: { userId: u.id }, create: { userId: u.id, ...data }, update: data });
  const v = incomingView(saved);
  if (v.complete !== saved.complete) await prisma.incomingProfile.update({ where: { userId: u.id }, data: { complete: v.complete } });
  return ok<IncomingProfileResponse>(v);
});
