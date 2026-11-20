import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { loadListing, requireLeader, syncListingStatus, toSummary } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { ListingResponse } from "@/lib/types";

/**
 * POST /api/listings/:id/submit — leaver submits the listing: draft → awaiting_household,
 * and straight to live if every invited stayer has already answered (gate §2.1).
 */
export const POST = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const l = await requireLeader(u.id, id);
  if (l.status === "draft") await prisma.listing.update({ where: { id }, data: { status: "awaiting_household" } });
  await syncListingStatus(id);
  return ok<ListingResponse>({ listing: toSummary(await loadListing(id)) });
});
