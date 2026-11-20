/**
 * When to send which notification. OWNER: h1. Uses prisma directly (no repo import, to avoid cycles).
 * Each function is called right after the state change it describes.
 */
import { prisma } from "./db";
import { sendEmail } from "./email";

const listingName = (l: { name: string; address: string }) => l.name.trim() || l.address;

/** A leaver invited a stayer. */
export async function notifyInvited(listingId: string, stayerId: string) {
  const [l, u] = await Promise.all([
    prisma.listing.findUnique({ where: { id: listingId }, include: { leaver: true } }),
    prisma.user.findUnique({ where: { id: stayerId } }),
  ]);
  if (!l || !u) return;
  await sendEmail({
    to: { email: u.email, id: u.id, name: u.name },
    kind: "invite",
    subject: `${l.leaver.name} listed your place on Householdfit. Describe your household`,
    body:
      `${l.leaver.name} is subletting their room at ${l.address} this summer. You're staying, so you get a say in who moves in.\n\n` +
      `Answer 8 quick habit questions (bedtime, guests, dishes…). The listing stays hidden from incoming students until every roommate who stays has answered, ` +
      `and nobody moves in without your approval. Your answers are only shown to incoming students who've answered the same questions themselves.`,
    path: `/stayer/${l.id}/form`,
  });
}

/** Listing just went live (every stayer answered). */
export async function notifyListingLive(listingId: string) {
  const l = await prisma.listing.findUnique({ where: { id: listingId }, include: { leaver: true } });
  if (!l) return;
  await sendEmail({
    to: { email: l.leaver.email, id: l.leaver.id, name: l.leaver.name },
    kind: "listing_live",
    subject: `${listingName(l)} is live`,
    body: `Every roommate who's staying has answered, so ${l.address} is now visible to incoming students, ranked by how well they fit the household.`,
    path: `/leaver/listings/${l.id}`,
  });
}

async function requestContext(requestId: string) {
  const r = await prisma.request.findUnique({
    where: { id: requestId },
    include: { incoming: true, listing: { include: { memberships: { where: { role: "stayer" }, include: { user: true } } } } },
  });
  if (!r) return null;
  return { r, stayers: r.listing.memberships.map((m) => m.user), name: listingName(r.listing) };
}

/** An incoming student requested to join. Tell every stayer. */
export async function notifyRequestReceived(requestId: string) {
  const c = await requestContext(requestId);
  if (!c) return;
  for (const s of c.stayers) {
    await sendEmail({
      to: { email: s.email, id: s.id, name: s.name },
      kind: "request_received",
      subject: `${c.r.incoming.name} wants to join ${c.name}`,
      body:
        `${c.r.incoming.name} asked to sublet at ${c.r.listing.address}. You can now see their answers and how well they fit each of you.\n\n` +
        `Every roommate who stays has to approve. One pass declines the request.`,
      path: `/stayer/inbox`,
    });
  }
}

/** Request just became approved or declined. */
export async function notifyRequestDecided(requestId: string, status: "approved" | "declined") {
  const c = await requestContext(requestId);
  if (!c) return;
  if (status === "declined") {
    await sendEmail({
      to: { email: c.r.incoming.email, id: c.r.incoming.id, name: c.r.incoming.name },
      kind: "request_declined",
      subject: `${c.name} passed this time`,
      body: `The household at ${c.r.listing.address} decided not to go ahead. Your other matches are still ranked for you.`,
      path: `/incoming/browse`,
    });
    return;
  }
  for (const p of [c.r.incoming, ...c.stayers]) {
    await sendEmail({
      to: { email: p.email, id: p.id, name: p.name },
      kind: "request_approved",
      subject: `Everyone said yes: ${c.r.incoming.name} + ${c.name}`,
      body:
        `Every roommate who stays approved ${c.r.incoming.name} for ${c.r.listing.address}. ` +
        `Next: agree on the house terms (quiet hours, guests, dishes…) and pick how you'd like to be contacted. ` +
        `Contact details unlock for everyone at the same moment once all of you are done.`,
      path: `/requests/${c.r.id}`,
    });
  }
}

/** Contacts just unlocked. Sent once per request (Request.contactsNotifiedAt). */
export async function notifyContactsUnlocked(requestId: string) {
  const claimed = await prisma.request.updateMany({
    where: { id: requestId, contactsNotifiedAt: null },
    data: { contactsNotifiedAt: new Date() },
  });
  if (claimed.count === 0) return; // already sent
  const c = await requestContext(requestId);
  if (!c) return;
  for (const p of [c.r.incoming, ...c.stayers]) {
    await sendEmail({
      to: { email: p.email, id: p.id, name: p.name },
      kind: "contacts_unlocked",
      subject: `Contacts unlocked for ${c.name}`,
      body:
        `Everyone agreed to the house terms. You can now see each other's preferred contact in Householdfit. ` +
        `Rent, deposit and the sublease agreement happen outside the app.`,
      path: `/requests/${c.r.id}`,
    });
  }
}
