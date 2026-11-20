/**
 * Data access + gate enforcement (spec §2). OWNER: h1.
 * Route handlers stay thin; every gate rule lives here so it's enforced in one place.
 */
import type { IncomingProfile, Listing, Request as DbRequest, User } from "@prisma/client";
import { prisma } from "./db";
import { forbidden, notFound } from "./http";
import type { IncomingInput, ListingInput, StayerInput } from "../scoring";
import { generateTerms } from "../terms";
import {
  QUESTIONS,
  TERM_KEYS,
  type Answers,
  type ContactMethod,
  type DealBreakerKey,
  type HouseholdStatusResponse,
  type InviteStatus,
  type Destination,
  type FlexDays,
  type IncomingProfileResponse,
  type ListingStatus,
  type ListingSummary,
  type PublicUser,
  type RoomType,
  type Term,
  type TermKey,
  type TermsResponse,
  type Weights,
} from "../types";

// ─── Mapping ────────────────────────────────────────────────────────────────

export const pub = (u: Pick<User, "id" | "name">): PublicUser => ({ id: u.id, name: u.name });

/** "512 S State St" → "State St house" */
export function displayName(l: Pick<Listing, "name" | "address">): string {
  if (l.name.trim()) return l.name.trim();
  const street = l.address.replace(/^\s*\d+[A-Za-z]?\s+/, "").replace(/^[NSEW]\.?\s+/, "");
  return `${street} house`;
}

export function toSummary(l: Listing & { leaver: User }): ListingSummary {
  return {
    id: l.id,
    name: displayName(l),
    address: l.address,
    lat: l.lat,
    lng: l.lng,
    area: l.area,
    roomType: l.roomType as RoomType,
    startDate: l.startDate,
    endDate: l.endDate,
    houseRules: l.houseRules,
    flags: { smoking: l.flagSmoking, pets: l.flagPets },
    furnished: l.furnished,
    status: l.status as ListingStatus,
    isSample: l.isSample,
    leader: pub(l.leaver),
  };
}

const parse = <T>(s: string | null | undefined, fallback: T): T => (s ? (JSON.parse(s) as T) : fallback);

// ─── Listings ───────────────────────────────────────────────────────────────

const listingInclude = {
  leaver: true,
  memberships: { where: { role: "stayer" }, include: { user: true }, orderBy: { createdAt: "asc" as const } },
  profiles: true,
} as const;

type LoadedListing = Awaited<ReturnType<typeof loadListing>>;

export async function loadListing(id: string) {
  const l = await prisma.listing.findUnique({ where: { id }, include: listingInclude });
  if (!l) throw notFound("Listing");
  return l;
}

/** Stayers (in invite order) with answers, or null if they haven't answered. */
export function stayersOf(l: LoadedListing): Array<PublicUser & { answers: Answers | null; inviteStatus: string; email: string }> {
  return l.memberships.map((m) => {
    const p = l.profiles.find((p) => p.userId === m.userId);
    return { ...pub(m.user), email: m.user.email, inviteStatus: m.inviteStatus, answers: p ? parse<Answers>(p.answers, []) : null };
  });
}

/** Scoring input. Only valid when every stayer has answered (i.e. the listing is live). */
export function toListingInput(l: LoadedListing): ListingInput {
  const stayers: StayerInput[] = stayersOf(l)
    .filter((s) => s.answers !== null)
    .map((s) => ({ id: s.id, name: s.name, answers: s.answers! }));
  return {
    id: l.id,
    address: l.address,
    roomType: l.roomType as RoomType,
    flags: { smoking: l.flagSmoking, pets: l.flagPets },
    startDate: l.startDate,
    endDate: l.endDate,
    stayers,
  };
}

/** Gate §2.1: only `live` listings are ever shown to incoming users. */
export async function loadLiveListings() {
  return prisma.listing.findMany({ where: { status: "live" }, include: listingInclude, orderBy: { createdAt: "asc" } });
}

export async function requireLiveListing(id: string) {
  const l = await loadListing(id);
  // Same 404 as a missing listing: incoming users shouldn't learn unreleased listings exist.
  if (l.status !== "live") throw notFound("Listing");
  return l;
}

/**
 * Gate §2.1: draft stays draft until the leaver submits. After that the listing is
 * `live` iff it has ≥1 stayer and every stayer has answered, else `awaiting_household`.
 * Call after any change to submission, invites or stayer profiles.
 */
export async function syncListingStatus(listingId: string): Promise<ListingStatus> {
  const l = await loadListing(listingId);
  if (l.status === "draft") return "draft";
  const stayers = l.memberships;
  const next: ListingStatus =
    stayers.length > 0 && stayers.every((m) => m.inviteStatus === "answered") ? "live" : "awaiting_household";
  if (next !== l.status) await prisma.listing.update({ where: { id: listingId }, data: { status: next } });
  return next;
}

export async function requireLeader(userId: string, listingId: string) {
  const l = await loadListing(listingId);
  if (l.leaverId !== userId) throw forbidden("NOT_LEAVER", "Only the leaver who created this listing can do that.");
  return l;
}

export async function requireStayer(userId: string, listingId: string) {
  const l = await loadListing(listingId);
  if (!l.memberships.some((m) => m.userId === userId))
    throw forbidden("NOT_STAYER", "Only stayers on this listing can do that.");
  return l;
}

// ─── Incoming profile ───────────────────────────────────────────────────────

export function incomingView(p: IncomingProfile | null): IncomingProfileResponse {
  const answers = parse<Array<number | null>>(p?.answers, Array(QUESTIONS.length).fill(null));
  const weights = parse<Weights>(p?.weights, [1, 1, 1, 1, 1, 1, 1, 1]);
  const dealBreakers = parse<DealBreakerKey[]>(p?.dealBreakers, []);
  const missing: string[] = [];
  if (!p?.startDate) missing.push("startDate");
  if (!p?.endDate) missing.push("endDate");
  if (p?.startDate && p?.endDate && p.startDate >= p.endDate) missing.push("endDate");
  if (!p?.destination) missing.push("destination");
  answers.forEach((a, i) => a === null && missing.push(`answers.${i}`));
  return {
    startDate: p?.startDate ?? null,
    endDate: p?.endDate ?? null,
    destination: (p?.destination as Destination) ?? null,
    flexDays: ((p?.flexDays ?? 7) as FlexDays),
    answers,
    weights,
    dealBreakers,
    complete: missing.length === 0,
    missing: [...new Set(missing)],
  };
}

/** Gate §2.2: 403 PROFILE_INCOMPLETE until dates, destination and all 8 answers are in. */
export async function requireCompleteIncoming(
  userId: string,
): Promise<IncomingInput & { destination: Destination; flexDays: FlexDays }> {
  const p = await prisma.incomingProfile.findUnique({ where: { userId } });
  const v = incomingView(p);
  if (!v.complete)
    throw forbidden("PROFILE_INCOMPLETE", "Finish your stay details and habit form to see households.");
  return {
    answers: v.answers as Answers,
    weights: v.weights,
    dealBreakers: v.dealBreakers,
    startDate: v.startDate!,
    endDate: v.endDate!,
    destination: v.destination!,
    flexDays: v.flexDays,
  };
}

// ─── Requests ───────────────────────────────────────────────────────────────

export async function loadRequest(id: string) {
  const r = await prisma.request.findUnique({
    where: { id },
    include: { incoming: { include: { incoming: true } }, approvals: true, terms: true },
  });
  if (!r) throw notFound("Request");
  const listing = await loadListing(r.listingId);
  return { request: r, listing };
}

/** The current user must be the incoming or a stayer on the request's listing. */
export function partyRole(userId: string, r: DbRequest, l: LoadedListing): "incoming" | "stayer" {
  if (r.incomingId === userId) return "incoming";
  if (l.memberships.some((m) => m.userId === userId)) return "stayer";
  throw forbidden("NOT_A_PARTY", "Only the incoming and the stayers can see this request.");
}

/** Gate §2.4: any pass → declined; every stayer approves → approved. */
export async function resolveRequestStatus(requestId: string) {
  const { request, listing } = await loadRequest(requestId);
  const stayerIds = listing.memberships.map((m) => m.userId);
  const votes = request.approvals.filter((a) => stayerIds.includes(a.stayerId));
  let status = "sent";
  if (votes.some((v) => v.decision === "pass")) status = "declined";
  else if (stayerIds.length > 0 && stayerIds.every((id) => votes.some((v) => v.stayerId === id && v.decision === "approve")))
    status = "approved";
  if (status !== request.status) await prisma.request.update({ where: { id: requestId }, data: { status } });
  return status;
}

// ─── Terms + contact reveal ─────────────────────────────────────────────────

export function termsFor(req: Awaited<ReturnType<typeof loadRequest>>): Term[] {
  const { request, listing } = req;
  const inc = incomingView(request.incoming.incoming);
  const stayers = stayersOf(listing)
    .filter((s) => s.answers)
    .map((s) => ({ id: s.id, name: s.name, answers: s.answers! }));
  return generateTerms({
    incoming: { ...pub(request.incoming), answers: inc.answers as Answers, startDate: inc.startDate!, endDate: inc.endDate! },
    stayers,
    listing,
  });
}

export function termsState(req: Awaited<ReturnType<typeof loadRequest>>): TermsResponse {
  const { request, listing } = req;
  const parties = [
    { user: request.incoming, role: "incoming" as const },
    ...listing.memberships.map((m) => ({ user: m.user, role: "stayer" as const })),
  ].map(({ user, role }) => ({
    ...pub(user),
    role,
    agreed: request.terms.filter((t) => t.userId === user.id && t.agreed).map((t) => t.termKey as TermKey),
    hasContactMethod: Boolean(user.contactMethod && user.contactValue),
  }));
  const allAgreed = parties.every((p) => TERM_KEYS.every((k) => p.agreed.includes(k)));
  // Gate §2.5: approved + every party agreed to every term + every party has a contact method.
  const contactsUnlocked = request.status === "approved" && allAgreed && parties.every((p) => p.hasContactMethod);
  return { requestId: request.id, terms: termsFor(req), parties, allAgreed, contactsUnlocked };
}

export function contactOf(u: User): { method: ContactMethod; value: string } | null {
  return u.contactMethod && u.contactValue ? { method: u.contactMethod as ContactMethod, value: u.contactValue } : null;
}

// ─── Leaver view ────────────────────────────────────────────────────────────

/** Leaver's view: who has answered — never what they answered. */
export async function householdStatus(id: string): Promise<HouseholdStatusResponse> {
  const l = await loadListing(id);
  const stayers = stayersOf(l).map((s) => ({ id: s.id, name: s.name, email: s.email, inviteStatus: s.inviteStatus as InviteStatus }));
  return { listing: toSummary(l), stayers, waitingOn: stayers.filter((s) => s.inviteStatus !== "answered").length };
}
