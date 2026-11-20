/**
 * Sample data for the demo (spec §6 "Seed data", §8 demo script). OWNER: h1.
 * IDs are stable so the demo-switcher cookie survives `npm run db:reset`.
 * Everything here is SAMPLE DATA and is flagged isSample in the DB.
 */
import type { PrismaClient } from "@prisma/client";
import type { Answers, DealBreakerKey, Destination, PracticeKey, RoomType, Weights } from "../lib/types";

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
  /** Monthly rent, USD (sample data). */
  rent: number;
  /** Stayers; answers null = invited but hasn't answered. */
  stayers: Array<{ userId: string; answers: Answers | null; practices?: PracticeKey[] }>;
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
  // ── More sample households (added Nov 20) ──
  { id: "u_avery", name: "Avery", email: "avery@example.edu", hint: "Leaver · Plymouth Rd" },
  { id: "u_jules", name: "Jules", email: "jules@example.edu", hint: "Leaver · E Washington St" },
  { id: "u_reese", name: "Reese", email: "reese@example.edu", hint: "Leaver · Wilmot St" },
  { id: "u_casey", name: "Casey", email: "casey@example.edu", hint: "Leaver · Lincoln Ave" },
  { id: "u_drew", name: "Drew", email: "drew@example.edu", hint: "Leaver · Prospect St (unreleased)" },
  { id: "u_parker", name: "Parker", email: "parker@example.edu", hint: "Leaver · Catherine St" },
  { id: "u_rowan", name: "Rowan", email: "rowan@example.edu", hint: "Leaver · Fuller Ct" },
  { id: "u_taylor", name: "Taylor", email: "taylor@example.edu", hint: "Leaver · Maynard St (draft)" },
  { id: "u_lena", name: "Lena", email: "lena@example.edu", hint: "Stayer · Plymouth Rd" },
  { id: "u_tariq", name: "Tariq", email: "tariq@example.edu", hint: "Stayer · Plymouth Rd" },
  { id: "u_wei", name: "Wei", email: "wei@example.edu", hint: "Stayer · Plymouth Rd" },
  { id: "u_diego", name: "Diego", email: "diego@example.edu", hint: "Stayer · E Washington St" },
  { id: "u_ana", name: "Ana", email: "ana@example.edu", hint: "Stayer · Wilmot St" },
  { id: "u_felix", name: "Felix", email: "felix@example.edu", hint: "Stayer · Wilmot St" },
  { id: "u_hugo", name: "Hugo", email: "hugo@example.edu", hint: "Stayer · Lincoln Ave (shared room)" },
  { id: "u_mei", name: "Mei", email: "mei@example.edu", hint: "Stayer · Prospect St (NOT answered)" },
  { id: "u_sofia", name: "Sofia", email: "sofia@example.edu", hint: "Stayer · Prospect St" },
  { id: "u_jonah", name: "Jonah", email: "jonah@example.edu", hint: "Stayer · Prospect St" },
  { id: "u_grace", name: "Grace", email: "grace@example.edu", hint: "Stayer · Catherine St (approved Noor)", contactMethod: "email", contactValue: "grace@example.edu" },
  { id: "u_ivan", name: "Ivan", email: "ivan@example.edu", hint: "Stayer · Fuller Ct" },
  { id: "u_zoe", name: "Zoe", email: "zoe@example.edu", hint: "Stayer · Fuller Ct" },
  { id: "u_noor", name: "Noor", email: "noor@example.edu", hint: "Incoming · approved at Catherine St" },
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
    rent: 950,
    stayers: [
      { userId: "u_priya", answers: [0, 1, 1, 0, 0, 0, 1, 0], practices: ["affirming"] },
      { userId: "u_sam", answers: [1, 1, 1, 0, 0, 0, 1, 0], practices: ["affirming"] },
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
    rent: 1100,
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
    rent: 875,
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
    rent: 800,
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
    rent: 1050,
    stayers: [
      { userId: "u_hana", answers: [0, 1, 2, 0, 0, 0, 1, 0], practices: ["affirming", "vegan"] },
      { userId: "u_rosa", answers: [0, 1, 2, 0, 0, 1, 1, 0], practices: ["affirming", "vegan"] },
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
    rent: 900,
    stayers: [{ userId: "u_kevin", answers: [1, 2, 3, 1, 1, 1, 2, 1] }],
  },
  // ── More sample households (added Nov 20). All land below the demo's top 3 for Alex. ──
  {
    id: "l_plymouth",
    name: "Plymouth Rd house",
    furnished: true,
    leaverId: "u_avery",
    address: "1607 Plymouth Rd",
    lat: 42.2992,
    lng: -83.7128,
    area: "North Campus",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "Six-person house: three of us leave for the summer, three stay. Sunday chore wheel.",
    flags: { smoking: false, pets: false },
    rent: 750,
    stayers: [
      { userId: "u_lena", answers: [0, 1, 2, 0, 1, 0, 2, 0], practices: ["halal", "alcoholFree"] },
      { userId: "u_tariq", answers: [1, 0, 1, 0, 1, 1, 1, 1], practices: ["halal", "alcoholFree"] },
      { userId: "u_wei", answers: [0, 2, 1, 1, 0, 0, 1, 0], practices: ["halal"] },
    ],
  },
  {
    id: "l_washington",
    name: "E Washington St apartment",
    furnished: true,
    leaverId: "u_jules",
    address: "425 E Washington St",
    lat: 42.2807,
    lng: -83.744,
    area: "Downtown",
    roomType: "private",
    startDate: "2027-06-01",
    endDate: "2027-08-31",
    houseRules: "Third-floor walk-up above the shops. Bike storage in the basement.",
    flags: { smoking: false, pets: false },
    rent: 1000,
    stayers: [{ userId: "u_diego", answers: [1, 2, 1, 1, 1, 1, 1, 1] }],
  },
  {
    id: "l_wilmot",
    name: "Wilmot St house",
    furnished: true,
    leaverId: "u_reese",
    address: "1330 Wilmot St",
    lat: 42.2689,
    lng: -83.7268,
    area: "Burns Park",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-25",
    houseRules: "Porch dinners when the weather's good. Partners stay over sometimes.",
    flags: { smoking: false, pets: false },
    rent: 850,
    stayers: [
      { userId: "u_ana", answers: [0, 1, 1, 0, 1, 1, 1, 1] },
      { userId: "u_felix", answers: [1, 1, 2, 2, 1, 1, 2, 1] }, // overnight weekly → excluded by that deal-breaker
    ],
  },
  {
    id: "l_lincoln",
    name: "Lincoln Ave house",
    furnished: true,
    leaverId: "u_casey",
    address: "910 Lincoln Ave",
    lat: 42.2671,
    lng: -83.7302,
    area: "Burns Park",
    roomType: "shared",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "You'd share the big front bedroom with Hugo. Cheapest room on the list.",
    flags: { smoking: false, pets: false },
    rent: 825,
    stayers: [{ userId: "u_hugo", answers: [1, 0, 0, 0, 1, 1, 0, 1] }],
  },
  {
    id: "l_prospect",
    name: "Prospect St house",
    furnished: true,
    leaverId: "u_drew",
    address: "1201 Prospect St",
    lat: 42.2679,
    lng: -83.7254,
    area: "Burns Park",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "Quiet street, big kitchen. Waiting on one roommate before it's released.",
    flags: { smoking: false, pets: false },
    rent: 780,
    stayers: [
      { userId: "u_sofia", answers: [0, 1, 1, 0, 0, 0, 1, 0] },
      { userId: "u_jonah", answers: [1, 1, 1, 1, 1, 1, 1, 0] },
      { userId: "u_mei", answers: null }, // second unreleased listing (Figma 08 "Waiting on Mei")
    ],
  },
  {
    id: "l_catherine",
    name: "Catherine St apartment",
    furnished: false,
    leaverId: "u_parker",
    address: "711 Catherine St",
    lat: 42.2826,
    lng: -83.7401,
    area: "Kerrytown",
    roomType: "private",
    startDate: "2027-05-10",
    endDate: "2027-08-20",
    houseRules: "Unfurnished room, five minutes' walk to the Medical Campus. Very quiet building.",
    flags: { smoking: false, pets: false },
    rent: 925,
    stayers: [{ userId: "u_grace", answers: [0, 0, 0, 0, 0, 1, 0, 2], practices: ["kosher", "alcoholFree"] }],
  },
  {
    id: "l_fuller",
    name: "Fuller Ct townhouse",
    furnished: true,
    leaverId: "u_rowan",
    address: "2250 Fuller Ct",
    lat: 42.2906,
    lng: -83.7214,
    area: "North Campus",
    roomType: "private",
    startDate: "2027-05-01",
    endDate: "2027-08-31",
    houseRules: "Vaping is fine on the balcony and in your own room.",
    flags: { smoking: true, pets: false },
    rent: 700,
    stayers: [
      { userId: "u_ivan", answers: [2, 2, 3, 2, 2, 2, 2, 2] },
      { userId: "u_zoe", answers: [1, 1, 2, 1, 1, 1, 2, 1] },
    ],
  },
];

/** Drafts: created by a leaver but never submitted, so invisible to everyone else. */
export const DRAFTS: Array<Omit<SampleListing, "stayers">> = [
  {
    id: "l_maynard",
    name: "Maynard St studio share",
    furnished: true,
    leaverId: "u_taylor",
    address: "335 Maynard St",
    lat: 42.2786,
    lng: -83.742,
    area: "Downtown",
    roomType: "private",
    startDate: "2027-05-15",
    endDate: "2027-08-15",
    houseRules: "",
    flags: { smoking: false, pets: false },
    rent: 1150,
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
  {
    userId: "u_noor",
    startDate: "2027-05-20",
    endDate: "2027-08-15",
    destination: "medical",
    answers: [0, 0, 0, 0, 0, 0, 0, 1],
    weights: [3, 1, 1, 3, 3, 1, 1, 1],
    dealBreakers: ["smoke", "pets"],
  },
];

/**
 * Requests at seed time:
 * - Jamie → Packard St: sent, no votes yet (Priya/Sam inbox has work; also the decline path in smoke).
 * - Noor → Plymouth Rd: sent, Lena approved, Tariq + Wei still to vote.
 * - Noor → Catherine St: approved by Grace; Grace agreed to every term, Noor to two. Shows terms mid-way.
 */
export const REQUESTS: Array<{
  id: string;
  listingId: string;
  incomingId: string;
  status: "sent" | "approved";
  approvals: string[];
  agreed: Array<{ userId: string; keys: string[] }>;
}> = [
  { id: "r_jamie_packard", listingId: "l_packard", incomingId: "u_jamie", status: "sent", approvals: [], agreed: [] },
  { id: "r_noor_plymouth", listingId: "l_plymouth", incomingId: "u_noor", status: "sent", approvals: ["u_lena"], agreed: [] },
  {
    id: "r_noor_catherine",
    listingId: "l_catherine",
    incomingId: "u_noor",
    status: "approved",
    approvals: ["u_grace"],
    agreed: [
      { userId: "u_grace", keys: ["dates", "quiet", "guests", "kitchen", "issues"] },
      { userId: "u_noor", keys: ["dates", "quiet"] },
    ],
  },
];

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
        rent: l.rent,
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
            .map((s) => ({ userId: s.userId, answers: JSON.stringify(s.answers), practices: JSON.stringify(s.practices ?? []) })),
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

  for (const d of DRAFTS) {
    await prisma.listing.create({
      data: {
        id: d.id,
        name: d.name,
        furnished: d.furnished,
        leaverId: d.leaverId,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        area: d.area,
        roomType: d.roomType,
        startDate: d.startDate,
        endDate: d.endDate,
        houseRules: d.houseRules,
        flagSmoking: d.flags.smoking,
        flagPets: d.flags.pets,
        status: "draft",
        isSample: true,
        memberships: { create: [{ userId: d.leaverId, role: "leaver", inviteStatus: "answered" }] },
      },
    });
  }

  for (const r of REQUESTS) {
    await prisma.request.create({
      data: {
        id: r.id,
        listingId: r.listingId,
        incomingId: r.incomingId,
        status: r.status,
        approvals: { create: r.approvals.map((stayerId) => ({ stayerId, decision: "approve" })) },
        terms: { create: r.agreed.flatMap((a) => a.keys.map((termKey) => ({ userId: a.userId, termKey, agreed: true }))) },
      },
    });
  }
}
