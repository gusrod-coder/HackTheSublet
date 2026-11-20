/**
 * Sample data for the demo (spec §6 "Seed data", §8 demo script). OWNER: h1.
 * IDs are stable so the demo-switcher cookie survives `npm run db:reset`.
 * Everything here is SAMPLE DATA and is flagged isSample in the DB.
 */
import type { PrismaClient } from "@prisma/client";
import type { Answers, DealBreakerKey, Destination, RoomType, Weights } from "../lib/types";

export interface SampleUser {
  id: string;
  name: string;
  email: string;
  hint: string;
  contactMethod?: "email" | "phone" | "text" | "instagram";
  contactValue?: string;
}

export interface SampleListing {
  id: string;
  name: string;
  furnished: boolean;
  leaverId: string;
  address: string;
  lat: number;
  lng: number;
  area: string;
  roomType: RoomType;
  startDate: string;
  endDate: string;
  houseRules: string;
  flags: { smoking: boolean; pets: boolean };
  /** Stayers; answers null = invited but hasn't answered. */
  stayers: Array<{ userId: string; answers: Answers | null }>;
}

export interface SampleIncoming {
  userId: string;
  startDate: string;
  endDate: string;
  destination: Destination;
  answers: Answers;
  weights: Weights;
  dealBreakers: DealBreakerKey[];
}

//                     bed home guests overnight noise dishes social issues
// option counts:       3    3     4       3       3     3      3      3

export const USERS: SampleUser[] = [
  // Leavers
  { id: "u_jordan", name: "Jordan", email: "jordan@example.edu", hint: "Leaver · Packard St" },
  { id: "u_maya", name: "Maya", email: "maya@example.edu", hint: "Leaver · State St" },
  { id: "u_leo", name: "Leo", email: "leo@example.edu", hint: "Leaver · Hill St (unreleased)" },
  { id: "u_chris", name: "Chris", email: "chris@example.edu", hint: "Leaver · Church St" },
  { id: "u_dana", name: "Dana", email: "dana@example.edu", hint: "Leaver · Geddes Ave" },
  { id: "u_eli", name: "Eli", email: "eli@example.edu", hint: "Leaver · Division St" },
  { id: "u_morgan", name: "Morgan", email: "morgan@example.edu", hint: "Leaver · no listing yet" },
  // Stayers
  { id: "u_priya", name: "Priya", email: "priya@example.edu", hint: "Stayer · Packard St", contactMethod: "text", contactValue: "(734) 555-0141" },
  { id: "u_sam", name: "Sam", email: "sam@example.edu", hint: "Stayer · Packard St", contactMethod: "email", contactValue: "sam@example.edu" },
  { id: "u_marcus", name: "Marcus", email: "marcus@example.edu", hint: "Stayer · State St" },
  { id: "u_tasha", name: "Tasha", email: "tasha@example.edu", hint: "Stayer · State St" },
  { id: "u_nina", name: "Nina", email: "nina@example.edu", hint: "Stayer · Hill St (answered)" },
  { id: "u_omar", name: "Omar", email: "omar@example.edu", hint: "Stayer · Hill St (NOT answered)" },
  { id: "u_ben", name: "Ben", email: "ben@example.edu", hint: "Stayer · Church St" },
  { id: "u_hana", name: "Hana", email: "hana@example.edu", hint: "Stayer · Geddes Ave" },
  { id: "u_rosa", name: "Rosa", email: "rosa@example.edu", hint: "Stayer · Geddes Ave" },
  { id: "u_kevin", name: "Kevin", email: "kevin@example.edu", hint: "Stayer · Division St" },
  // Incoming
  { id: "u_alex", name: "Alex", email: "alex@example.edu", hint: "Incoming · profile complete (demo)" },
  { id: "u_jamie", name: "Jamie", email: "jamie@example.edu", hint: "Incoming · requested Packard St", contactMethod: "email", contactValue: "jamie@example.edu" },
  { id: "u_riley", name: "Riley", email: "riley@example.edu", hint: "Incoming · new, no profile" },
];

export const LISTINGS: SampleListing[] = [
  {
    id: "l_packard",
    name: "Packard St house",
    furnished: true,
    leaverId: "u_jordan",
    address: "1021 Packard St",
    lat: 42.2712,
    lng: -83.7365,
    area: "Central Campus South",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "Shoes off inside. Shared groceries for basics, split monthly.",
    flags: { smoking: false, pets: false },
    stayers: [
      { userId: "u_priya", answers: [0, 1, 1, 0, 0, 0, 1, 0] },
      { userId: "u_sam", answers: [1, 1, 1, 0, 0, 0, 1, 0] },
    ],
  },
  {
    id: "l_state",
    name: "State St apartment",
    furnished: true,
    leaverId: "u_maya",
    address: "512 S State St",
    lat: 42.2738,
    lng: -83.7402,
    area: "South U",
    roomType: "private",
    startDate: "2027-05-20",
    endDate: "2027-08-10",
    houseRules: "Friday dinners are a house thing. Quiet hours are flexible.",
    flags: { smoking: false, pets: false },
    stayers: [
      { userId: "u_marcus", answers: [2, 2, 3, 2, 2, 2, 2, 1] },
      { userId: "u_tasha", answers: [2, 1, 2, 1, 2, 1, 2, 0] },
    ],
  },
  {
    id: "l_hill",
    name: "Hill St house",
    furnished: false,
    leaverId: "u_leo",
    address: "815 Hill St",
    lat: 42.2704,
    lng: -83.7318,
    area: "Burns Park",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-20",
    houseRules: "Garden out back is shared; water it if you're last home.",
    flags: { smoking: false, pets: false },
    stayers: [
      { userId: "u_nina", answers: [0, 0, 1, 0, 0, 0, 1, 0] },
      { userId: "u_omar", answers: null }, // ← keeps Hill St unreleased (demo §8.1)
    ],
  },
  {
    id: "l_church",
    name: "Church St house",
    furnished: false,
    leaverId: "u_chris",
    address: "706 Church St",
    lat: 42.2745,
    lng: -83.733,
    area: "East U",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "Smoking and vaping on the back porch or in rooms with the window open.",
    flags: { smoking: true, pets: false },
    stayers: [{ userId: "u_ben", answers: [0, 1, 1, 0, 0, 1, 1, 0] }],
  },
  {
    id: "l_geddes",
    name: "Geddes Ave house",
    furnished: true,
    leaverId: "u_dana",
    address: "1410 Geddes Ave",
    lat: 42.2778,
    lng: -83.7247,
    area: "Geddes / Arb",
    roomType: "private",
    startDate: "2027-05-10",
    endDate: "2027-08-25",
    houseRules: "Two friendly cats live here. Keep the basement door closed.",
    flags: { smoking: false, pets: true },
    stayers: [
      { userId: "u_hana", answers: [0, 1, 2, 0, 0, 0, 1, 0] },
      { userId: "u_rosa", answers: [0, 1, 2, 0, 0, 1, 1, 0] },
    ],
  },
  {
    id: "l_division",
    name: "Division St apartment",
    furnished: true,
    leaverId: "u_eli",
    address: "330 N Division St",
    lat: 42.2832,
    lng: -83.7443,
    area: "Kerrytown",
    roomType: "shared",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "Shared bedroom with Kevin. Bunk beds, separate desks.",
    flags: { smoking: false, pets: false },
    stayers: [{ userId: "u_kevin", answers: [1, 2, 3, 1, 1, 1, 2, 1] }],
  },
];

export const INCOMING: SampleIncoming[] = [
  {
    userId: "u_alex",
    startDate: "2027-05-15",
    endDate: "2027-08-15",
    destination: "medical",
    answers: [0, 1, 1, 0, 0, 0, 1, 0],
    weights: [1, 1, 1, 1, 1, 1, 1, 1],
    dealBreakers: ["smoke"],
  },
  {
    userId: "u_jamie",
    startDate: "2027-06-01",
    endDate: "2027-08-15",
    destination: "central",
    answers: [1, 0, 1, 1, 1, 1, 1, 0],
    weights: [3, 1, 1, 1, 1, 1, 0, 1],
    dealBreakers: [],
  },
];

/** Pending requests at seed time: Jamie → Packard St, no votes yet (stayer inbox has work). */
export const REQUESTS = [{ id: "r_jamie_packard", listingId: "l_packard", incomingId: "u_jamie" }];

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  // Wipe in dependency order.
  await prisma.emailOutbox.deleteMany();
  await prisma.termAgreement.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.request.deleteMany();
  await prisma.habitProfile.deleteMany();
  await prisma.incomingProfile.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();

  for (const u of USERS) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        contactMethod: u.contactMethod ?? null,
        contactValue: u.contactValue ?? null,
        isSample: true,
      },
    });
  }

  for (const l of LISTINGS) {
    const allAnswered = l.stayers.every((s) => s.answers !== null);
    await prisma.listing.create({
      data: {
        id: l.id,
        name: l.name,
        furnished: l.furnished,
        leaverId: l.leaverId,
        address: l.address,
        lat: l.lat,
        lng: l.lng,
        area: l.area,
        roomType: l.roomType,
        startDate: l.startDate,
        endDate: l.endDate,
        houseRules: l.houseRules,
        flagSmoking: l.flags.smoking,
        flagPets: l.flags.pets,
        status: allAnswered ? "live" : "awaiting_household",
        isSample: true,
        memberships: {
          create: [
            { userId: l.leaverId, role: "leaver", inviteStatus: "answered" },
            ...l.stayers.map((s) => ({
              userId: s.userId,
              role: "stayer",
              inviteStatus: s.answers ? "answered" : "invited",
            })),
          ],
        },
        profiles: {
          create: l.stayers
            .filter((s) => s.answers !== null)
            .map((s) => ({ userId: s.userId, answers: JSON.stringify(s.answers) })),
        },
      },
    });
  }

  for (const p of INCOMING) {
    await prisma.incomingProfile.create({
      data: {
        userId: p.userId,
        startDate: p.startDate,
        endDate: p.endDate,
        destination: p.destination,
        answers: JSON.stringify(p.answers),
        weights: JSON.stringify(p.weights),
        dealBreakers: JSON.stringify(p.dealBreakers),
        complete: true,
      },
    });
  }

  for (const r of REQUESTS) {
    await prisma.request.create({ data: { ...r, status: "sent" } });
  }
}
