/**
 * Householdfit shared contract. OWNER: h1.
 *
 * Everything the UI and the API agree on lives here: the habit form, deal-breakers,
 * terms, and the JSON shape of every API response. h2/h3: import from here, never
 * redefine. Need a change? Send a [REQ] to h1 (see docs/LANES.md).
 */

// ─── Enums ──────────────────────────────────────────────────────────────────

export type Role = "leaver" | "stayer" | "incoming";
export type RoomType = "private" | "shared";
export type ListingStatus = "draft" | "awaiting_household" | "live";
export type InviteStatus = "invited" | "answered";
export type RequestStatus = "sent" | "approved" | "declined";
export type Decision = "approve" | "pass";
export type ContactMethod = "email" | "phone" | "text" | "instagram";
export type Destination = "medical" | "central" | "north" | "downtown";
export type DealBreakerKey = "smoke" | "pets" | "overnight" | "shared";
export type TermKey = "dates" | "quiet" | "guests" | "kitchen" | "issues";
/** Date flexibility in days (±). Display-only: never affects the score or ranking. */
export type FlexDays = 0 | 3 | 7 | 14;
/** a lot = 3, some = 1, not at all = 0 */
export type Weight = 0 | 1 | 3;
export type FitLabel = "Strong fit" | "Okay fit" | "Weak fit";

/** Dates on the wire and in the DB are "YYYY-MM-DD". */
export type ISODate = string;

// ─── Habit form (spec §4) — ORDER MATTERS, scoring uses the index ─────────

export type QuestionKey =
  | "bedtime"
  | "home"
  | "guests"
  | "overnight"
  | "noise"
  | "dishes"
  | "social"
  | "issues";

export interface HabitQuestion {
  index: number;
  key: QuestionKey;
  /** Full question as shown on the form. */
  question: string;
  /** Short label used in mismatch lines: "Bedtime: you before 11pm, Sam after 1am". */
  short: string;
  /** Option labels, index 0 → n, shown on the form. */
  options: string[];
  /** Lower-case phrasing of each option for generated sentences. */
  phrases: string[];
  /** Used in "Ask Sam about …" talk-about-this lines. */
  topic: string;
}

export const QUESTIONS: readonly HabitQuestion[] = [
  {
    index: 0,
    key: "bedtime",
    question: "On a weeknight, when do your lights go out?",
    short: "Bedtime",
    options: ["Before 11pm", "11pm–1am", "After 1am"],
    phrases: ["before 11pm", "11pm–1am", "after 1am"],
    topic: "sleep schedules",
  },
  {
    index: 1,
    key: "home",
    question: "On weekdays, how much are you home?",
    short: "Time at home",
    options: ["Mostly out", "Mixed", "Home most of the day"],
    phrases: ["mostly out", "mixed", "home most of the day"],
    topic: "time at home",
  },
  {
    index: 2,
    key: "guests",
    question: "Nights a week you have people over",
    short: "Guests",
    options: ["None", "1", "2–3", "4+"],
    phrases: ["none", "1 night", "2–3 nights", "4+ nights"],
    topic: "having people over",
  },
  {
    index: 3,
    key: "overnight",
    question: "Overnight guests in the last month",
    short: "Overnight guests",
    options: ["None", "1–2 nights", "Weekly or more"],
    phrases: ["none", "1–2 nights", "weekly or more"],
    topic: "overnight guests",
  },
  {
    index: 4,
    key: "noise",
    question: "Which is closer to you?",
    short: "Noise",
    options: [
      "Steady low noise all week",
      "Quiet weeknights, livelier weekends",
      "Lively most nights",
    ],
    phrases: ["low noise all week", "quiet weeknights", "lively most nights"],
    topic: "noise levels",
  },
  {
    index: 5,
    key: "dishes",
    question: "After you cook, dishes get washed…",
    short: "Dishes",
    options: ["Right away", "Same day", "Next day or later"],
    phrases: ["right away", "same day", "next day or later"],
    topic: "kitchen cleanup",
  },
  {
    index: 6,
    key: "social",
    question: "What do you want from housemates this summer?",
    short: "Social",
    options: ["Keep to ourselves", "Friendly but separate", "Hang out often"],
    phrases: ["keep to ourselves", "friendly but separate", "hang out often"],
    topic: "how social the house is",
  },
  {
    index: 7,
    key: "issues",
    question: "How do you bring up a problem with a roommate?",
    short: "Raising problems",
    options: ["In person", "By text", "Let it slide"],
    phrases: ["in person", "by text", "let it slide"],
    topic: "how you raise problems",
  },
] as const;

export const QUESTION_COUNT = 8;

/** int[8]; every entry is a valid option index for its question. */
export type Answers = number[];
/** Weight[8] */
export type Weights = Weight[];

export const WEIGHT_OPTIONS: ReadonlyArray<{ value: Weight; label: string }> = [
  { value: 3, label: "Matters a lot" },
  { value: 1, label: "Some" },
  { value: 0, label: "Not at all" },
];
export const DEFAULT_WEIGHTS: Weights = [1, 1, 1, 1, 1, 1, 1, 1];

export const DEAL_BREAKERS: ReadonlyArray<{ key: DealBreakerKey; label: string }> = [
  { key: "smoke", label: "Indoor smoking or vaping" },
  { key: "pets", label: "Pets" },
  { key: "overnight", label: "Overnight guests weekly or more" },
  { key: "shared", label: "Shared bedroom" },
];

export const DESTINATIONS: ReadonlyArray<{
  key: Destination;
  label: string;
  lat: number;
  lng: number;
}> = [
  { key: "medical", label: "Medical Campus", lat: 42.2837, lng: -83.7285 },
  { key: "central", label: "Central Campus", lat: 42.2766, lng: -83.7382 },
  { key: "north", label: "North Campus", lat: 42.2931, lng: -83.7146 },
  { key: "downtown", label: "Downtown", lat: 42.2808, lng: -83.7485 },
];

export const FLEX_OPTIONS: ReadonlyArray<{ value: FlexDays; label: string }> = [
  { value: 0, label: "Exact dates" },
  { value: 3, label: "±3 days" },
  { value: 7, label: "±1 week" },
  { value: 14, label: "±2 weeks" },
];
export const DEFAULT_FLEX_DAYS: FlexDays = 7;

export const CONTACT_METHODS: ReadonlyArray<{ key: ContactMethod; label: string }> = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone call" },
  { key: "text", label: "Text message" },
  { key: "instagram", label: "Instagram" },
];

export const TERM_KEYS: readonly TermKey[] = ["dates", "quiet", "guests", "kitchen", "issues"];

// ─── API: errors ────────────────────────────────────────────────────────────

/** Every non-2xx response body. */
export interface ApiError {
  error: {
    /** Stable machine code, e.g. "PROFILE_INCOMPLETE", "NOT_STAYER", "NOT_FOUND". */
    code: string;
    message: string;
  };
}

// ─── API: users / session ───────────────────────────────────────────────────

export interface PublicUser {
  id: string;
  name: string;
}

export interface DemoUser extends PublicUser {
  email: string;
  /** Human hint for the switcher, e.g. "Stayer · Packard St". */
  hint: string;
}

/** GET /api/demo/users */
export interface DemoUsersResponse {
  users: DemoUser[];
  currentUserId: string | null;
}

/** GET /api/me */
export interface MeResponse {
  user: (PublicUser & {
    email: string;
    contactMethod: ContactMethod | null;
    contactValue: string | null;
  }) | null;
  /** Listings I lead. */
  leading: Array<{ listingId: string; address: string; status: ListingStatus }>;
  /** Listings I'm a stayer on. */
  staying: Array<{ listingId: string; address: string; inviteStatus: InviteStatus }>;
  /** null if I've never started an incoming profile. */
  incoming: { complete: boolean } | null;
}

// ─── API: listings ──────────────────────────────────────────────────────────

export interface ListingFlags {
  smoking: boolean;
  pets: boolean;
}

export interface ListingSummary {
  id: string;
  /** Display name, e.g. "Packard St house". Always non-empty (derived from address if unset). */
  name: string;
  address: string;
  lat: number;
  lng: number;
  area: string;
  roomType: RoomType;
  startDate: ISODate;
  endDate: ISODate;
  houseRules: string;
  flags: ListingFlags;
  furnished: boolean;
  status: ListingStatus;
  isSample: boolean;
  leader: PublicUser;
}

/** POST /api/listings body. Creates a draft. */
export interface CreateListingBody {
  /** Optional display name; defaults to "<street> house". */
  name?: string;
  address: string;
  lat: number;
  lng: number;
  area: string;
  roomType: RoomType;
  startDate: ISODate;
  endDate: ISODate;
  houseRules?: string;
  flags?: Partial<ListingFlags>;
  furnished?: boolean;
}

/** GET /api/listings — listings the current user leads. */
export interface MyListingsResponse {
  listings: Array<ListingSummary & { stayerCount: number; waitingOn: number }>;
}

/** GET /api/listings/:id, POST /api/listings, PATCH /api/listings/:id, POST /api/listings/:id/submit */
export interface ListingResponse {
  listing: ListingSummary;
}

/** PATCH /api/listings/:id body (leaver only). */
export type UpdateListingBody = Partial<CreateListingBody>;

/** POST /api/listings/:id/invites body */
export interface InviteBody {
  invites: Array<{ email: string; name?: string }>;
}

/** GET /api/listings/:id/household-status (leaver only) */
export interface HouseholdStatusResponse {
  listing: ListingSummary;
  stayers: Array<PublicUser & { email: string; inviteStatus: InviteStatus }>;
  /** Stayers still "invited". 0 + submitted ⇒ live. */
  waitingOn: number;
}

// ─── API: stayer ────────────────────────────────────────────────────────────

/** GET /api/stayer/invites — the invite notification list for the current user. */
export interface StayerInvitesResponse {
  invites: Array<{
    listing: ListingSummary;
    inviteStatus: InviteStatus;
    otherStayers: Array<PublicUser & { inviteStatus: InviteStatus }>;
  }>;
}

/** GET/POST /api/stayer/:listingId/profile */
export interface StayerProfileResponse {
  listingId: string;
  answers: Answers | null;
  inviteStatus: InviteStatus;
  listingStatus: ListingStatus;
}
export interface StayerProfileBody {
  answers: Answers;
}

// ─── API: scoring results (shared by browse, household and stayer inbox) ───

export interface StayerFit {
  stayer: PublicUser;
  score: number; // 0–100
}

export interface ListingFit {
  listingId: string;
  householdScore: number; // min over stayers
  average: number; // mean over stayers
  label: FitLabel;
  limitingStayer: PublicUser | null;
  perStayer: StayerFit[];
  /** Up to 2 plain-text lines, e.g. "Bedtime: everyone before 11pm". */
  matches: string[];
  /** Up to 2 plain-text lines, e.g. "Bedtime: you before 11pm, Sam after 1am". */
  mismatches: string[];
  /** One line per top mismatch, e.g. "Ask Sam about sleep schedules". */
  talkAbout: string[];
  uncoveredNights: number;
  /** True if every uncovered night falls inside the incoming's ±flexDays. Display-only. */
  withinFlex: boolean;
  /**
   * "Covers your dates" · "Starts 4 days after your move-in (inside your ±1 week)" ·
   * "Leaves 10 nights uncovered (outside your ±1 week)"
   */
  coverage: string;
}

/** Straight-line distance from a listing to the incoming's destination. Display-only. */
export interface DistanceInfo {
  miles: number;
  /** "1.2 mi to Medical Campus" */
  label: string;
}

export interface ExcludedListing {
  listingId: string;
  /** Address. */
  name: string;
  /** Human reasons, e.g. ["Pets in the home"]. */
  reasons: string[];
}

// ─── API: incoming ──────────────────────────────────────────────────────────

/** PUT /api/incoming/profile body — every field optional (save as you go). */
export interface IncomingProfileBody {
  startDate?: ISODate;
  endDate?: ISODate;
  destination?: Destination;
  flexDays?: FlexDays;
  /** null entries = not answered yet. */
  answers?: Array<number | null>;
  weights?: Weights;
  dealBreakers?: DealBreakerKey[];
}

/** GET/PUT /api/incoming/profile */
export interface IncomingProfileResponse {
  startDate: ISODate | null;
  endDate: ISODate | null;
  destination: Destination | null;
  flexDays: FlexDays;
  answers: Array<number | null>;
  weights: Weights;
  dealBreakers: DealBreakerKey[];
  complete: boolean;
  /** What's still missing, e.g. ["startDate", "answers.3"]. Empty when complete. */
  missing: string[];
}

/** GET /api/incoming/matches — 403 PROFILE_INCOMPLETE until complete. */
export interface MatchesResponse {
  ranked: Array<{ listing: ListingSummary; fit: ListingFit; distance: DistanceInfo; request: RequestRef | null }>;
  excluded: ExcludedListing[];
  /**
   * Listings submitted but waiting on stayers (gate §2.1). Address only: no answers, no names,
   * no scores, and their household/request endpoints still 404.
   */
  unreleased: Array<{ listingId: string; name: string; address: string }>;
}

export interface RequestRef {
  id: string;
  status: RequestStatus;
}

/** GET /api/listings/:id/household — 403 PROFILE_INCOMPLETE until complete. */
export interface HouseholdResponse {
  listing: ListingSummary;
  fit: ListingFit;
  distance: DistanceInfo;
  /** Present even if the listing is excluded, so the page can explain why. */
  excludedReasons: string[];
  stayers: Array<PublicUser & { answers: Answers; score: number }>;
  you: { answers: Answers; weights: Weights };
  /**
   * Side-by-side table. One row per question. `mismatchWith` lists stayer ids whose
   * answer has gap ≥ 0.5 on a question you weight > 0 (highlight these cells).
   */
  table: Array<{
    index: number;
    key: QuestionKey;
    short: string;
    you: number;
    weight: Weight;
    stayers: Array<{ stayerId: string; answer: number }>;
    mismatchWith: string[];
  }>;
  request: RequestRef | null;
}

/** GET /api/incoming/requests */
export interface IncomingRequestsResponse {
  requests: Array<{
    id: string;
    status: RequestStatus;
    createdAt: string;
    listing: ListingSummary;
    /** How many stayers have approved / total. Individual votes are not revealed. */
    approvals: { approved: number; total: number };
  }>;
}

// ─── API: requests (stayer inbox + shared) ──────────────────────────────────

/** GET /api/stayer/requests */
export interface StayerInboxResponse {
  requests: Array<{
    id: string;
    status: RequestStatus;
    createdAt: string;
    listing: ListingSummary;
    incoming: PublicUser & {
      startDate: ISODate;
      endDate: ISODate;
      destination: Destination;
      /** Revealed because they requested this listing (blind reveal, spec §2.3). */
      answers: Answers;
    };
    /** Fit computed from the incoming's weights; lines name the incoming, not "you". */
    fit: ListingFit;
    myDecision: Decision | null;
    approvals: Array<{ stayer: PublicUser; decision: Decision | null }>;
  }>;
}

/** POST /api/requests/:id/decision */
export interface DecisionBody {
  decision: Decision;
}

/** GET /api/requests/:id */
export interface RequestDetailResponse {
  id: string;
  status: RequestStatus;
  listing: ListingSummary;
  incoming: PublicUser;
  stayers: PublicUser[];
  /** Which party the current user is on this request. */
  viewerRole: "incoming" | "stayer";
}

// ─── API: terms + contacts ──────────────────────────────────────────────────

export interface Term {
  key: TermKey;
  /** "Quiet after 11pm on weeknights" */
  text: string;
  /** Why this term was generated, always shown. */
  why: string;
}

/** GET /api/requests/:id/terms — 403 NOT_APPROVED until the request is approved. */
export interface TermsResponse {
  requestId: string;
  terms: Term[];
  /** Every party (incoming + all stayers) and what they've agreed to. */
  parties: Array<
    PublicUser & {
      role: "incoming" | "stayer";
      agreed: TermKey[];
      hasContactMethod: boolean;
    }
  >;
  allAgreed: boolean;
  contactsUnlocked: boolean;
}

/** PUT /api/me/contact */
export interface ContactBody {
  method: ContactMethod;
  value: string;
}

/** GET /api/requests/:id/contacts — 403 CONTACTS_LOCKED until every gate passes. */
export interface ContactsResponse {
  contacts: Array<
    PublicUser & { role: "incoming" | "stayer"; method: ContactMethod; value: string }
  >;
}
