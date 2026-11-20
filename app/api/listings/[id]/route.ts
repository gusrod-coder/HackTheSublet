import { prisma } from "@/lib/server/db";
import { badRequest, handle, notFound, ok, parseBody } from "@/lib/server/http";
import { loadListing, requireLeader, toSummary } from "@/lib/server/repo";
import { updateListingSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";
import type { ListingResponse } from "@/lib/types";

/** GET /api/listings/:id — leaver and stayers always; anyone else only once live. */
export const GET = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const l = await loadListing(id);
  const isMember = l.leaverId === u.id || l.memberships.some((m) => m.userId === u.id);
  if (!isMember && l.status !== "live") throw notFound("Listing");
  return ok<ListingResponse>({ listing: toSummary(l) });
});

/** PATCH /api/listings/:id — leaver edits listing details. Status is never set directly. */
export const PATCH = handle<{ id: string }>(async (req, { id }) => {
  const u = await requireUser();
  const cur = await requireLeader(u.id, id);
  const b = await parseBody(req, updateListingSchema);
  const start = b.startDate ?? cur.startDate;
  const end = b.endDate ?? cur.endDate;
  if (start >= end) throw badRequest("INVALID_DATES", "startDate must be before endDate.");
  const l = await prisma.listing.update({
    where: { id },
    data: {
      name: b.name,
      furnished: b.furnished,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      area: b.area,
      roomType: b.roomType,
      startDate: b.startDate,
      endDate: b.endDate,
      houseRules: b.houseRules,
      flagSmoking: b.flags?.smoking,
      flagPets: b.flags?.pets,
      rent: b.rent,
    },
    include: { leaver: true },
  });
  return ok<ListingResponse>({ listing: toSummary(l) });
});
