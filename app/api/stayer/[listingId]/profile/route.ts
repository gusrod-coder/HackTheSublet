import { prisma } from "@/lib/server/db";
import { handle, ok, parseBody } from "@/lib/server/http";
import { requireStayer, syncListingStatus } from "@/lib/server/repo";
import { stayerProfileSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";
import type { Answers, InviteStatus, ListingStatus, PracticeKey, StayerProfileResponse } from "@/lib/types";

async function view(userId: string, listingId: string): Promise<StayerProfileResponse> {
  const [p, m, l] = await Promise.all([
    prisma.habitProfile.findUnique({ where: { userId_listingId: { userId, listingId } } }),
    prisma.membership.findUniqueOrThrow({ where: { listingId_userId: { listingId, userId } } }),
    prisma.listing.findUniqueOrThrow({ where: { id: listingId } }),
  ]);
  return {
    listingId,
    answers: p ? (JSON.parse(p.answers) as Answers) : null,
    practices: p ? (JSON.parse(p.practices) as PracticeKey[]) : [],
    inviteStatus: m.inviteStatus as InviteStatus,
    listingStatus: l.status as ListingStatus,
  };
}

/** GET /api/stayer/:listingId/profile — my answers for this household (null if not answered). */
export const GET = handle<{ listingId: string }>(async (_req, { listingId }) => {
  const u = await requireUser();
  await requireStayer(u.id, listingId);
  return ok<StayerProfileResponse>(await view(u.id, listingId));
});

/**
 * POST /api/stayer/:listingId/profile { answers } — only the stayer themself can write this
 * (the leaver can't answer for them). May release the listing (gate §2.1). Re-submitting
 * later updates answers and immediately changes incoming fit scores (demo §8.5).
 */
export const POST = handle<{ listingId: string }>(async (req, { listingId }) => {
  const u = await requireUser();
  await requireStayer(u.id, listingId);
  const { answers, practices } = await parseBody(req, stayerProfileSchema);
  const json = JSON.stringify(answers);
  const prac = practices ? JSON.stringify([...new Set(practices)]) : undefined;
  await prisma.habitProfile.upsert({
    where: { userId_listingId: { userId: u.id, listingId } },
    create: { userId: u.id, listingId, answers: json, practices: prac ?? "[]" },
    update: { answers: json, ...(prac !== undefined ? { practices: prac } : {}) },
  });
  await prisma.membership.update({
    where: { listingId_userId: { listingId, userId: u.id } },
    data: { inviteStatus: "answered" },
  });
  await syncListingStatus(listingId);
  return ok<StayerProfileResponse>(await view(u.id, listingId));
});
