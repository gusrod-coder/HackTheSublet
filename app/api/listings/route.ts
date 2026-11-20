import { prisma } from "@/lib/server/db";
import { handle, ok, parseBody } from "@/lib/server/http";
import { toSummary } from "@/lib/server/repo";
import { createListingSchema } from "@/lib/server/schemas";
import { requireUser } from "@/lib/server/session";
import type { ListingResponse, MyListingsResponse } from "@/lib/types";

/** GET /api/listings — listings I lead (leaver dashboard). */
export const GET = handle(async () => {
  const u = await requireUser();
  const rows = await prisma.listing.findMany({
    where: { leaverId: u.id },
    include: { leaver: true, memberships: { where: { role: "stayer" } } },
    orderBy: { createdAt: "asc" },
  });
  return ok<MyListingsResponse>({
    listings: rows.map((l) => ({
      ...toSummary(l),
      stayerCount: l.memberships.length,
      waitingOn: l.memberships.filter((m) => m.inviteStatus !== "answered").length,
    })),
  });
});

/** POST /api/listings — leaver creates a listing in `draft`. Submit it with POST /api/listings/:id/submit. */
export const POST = handle(async (req) => {
  const u = await requireUser();
  const b = await parseBody(req, createListingSchema);
  const l = await prisma.listing.create({
    data: {
      leaverId: u.id,
      address: b.address,
      lat: b.lat,
      lng: b.lng,
      area: b.area,
      roomType: b.roomType,
      startDate: b.startDate,
      endDate: b.endDate,
      houseRules: b.houseRules,
      flagSmoking: b.flags.smoking ?? false,
      flagPets: b.flags.pets ?? false,
      status: "draft",
      memberships: { create: { userId: u.id, role: "leaver", inviteStatus: "answered" } },
    },
    include: { leaver: true },
  });
  return ok<ListingResponse>({ listing: toSummary(l) }, 201);
});
