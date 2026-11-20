/**
 * Householdfit scoring. OWNER: h1. Pure functions, no I/O, no AI. Spec §5.
 *
 *   gap(i, a, b)    = |a − b| / (options[i].length − 1)                      0..1
 *   stayerScore     = round(100 · Σ w[i]·(1 − gap) / Σ w[i])                  100 if Σw = 0
 *   householdScore  = min(stayerScore)      ← you live with every stayer
 *   average         = mean(stayerScore)     ← shown for comparison only
 *   label           = ≥75 Strong · ≥55 Okay · else Weak
 *
 * Deal-breakers exclude a listing before scoring. Date coverage is display-only.
 */
import {
  QUESTIONS,
  type Answers,
  type DealBreakerKey,
  type ExcludedListing,
  type FitLabel,
  type FlexDays,
  type ISODate,
  type ListingFit,
  type ListingFlags,
  type PublicUser,
  type RoomType,
  type Weights,
} from "./types";

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface IncomingInput {
  answers: Answers;
  weights: Weights;
  dealBreakers: DealBreakerKey[];
  startDate: ISODate;
  endDate: ISODate;
  /** ± days of date flexibility; display-only. Defaults to 7. */
  flexDays?: FlexDays;
}

export interface StayerInput extends PublicUser {
  answers: Answers;
}

export interface ListingInput {
  id: string;
  address: string;
  roomType: RoomType;
  flags: ListingFlags;
  startDate: ISODate;
  endDate: ISODate;
  stayers: StayerInput[];
}

export interface ScoreOptions {
  /** How the incoming is named in generated lines. "you" for the incoming, their name for stayers. */
  incomingName?: string;
}

// ─── Primitives ─────────────────────────────────────────────────────────────

export function gap(i: number, a: number, b: number): number {
  const span = QUESTIONS[i].options.length - 1;
  return Math.abs(a - b) / span;
}

export function stayerScore(incoming: Answers, weights: Weights, stayer: Answers): number {
  let num = 0;
  let den = 0;
  for (let i = 0; i < QUESTIONS.length; i++) {
    const w = weights[i];
    num += w * (1 - gap(i, incoming[i], stayer[i]));
    den += w;
  }
  if (den === 0) return 100;
  return Math.round((100 * num) / den);
}

export function fitLabel(score: number): FitLabel {
  if (score >= 75) return "Strong fit";
  if (score >= 55) return "Okay fit";
  return "Weak fit";
}

const DAY_MS = 86_400_000;
function toDay(d: ISODate): number {
  const [y, m, dd] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, dd) / DAY_MS;
}

/** Nights of the incoming's stay that the listing doesn't cover. */
export function uncoveredNights(
  listing: { startDate: ISODate; endDate: ISODate },
  inc: { startDate: ISODate; endDate: ISODate },
): number {
  const before = Math.max(0, toDay(listing.startDate) - toDay(inc.startDate));
  const after = Math.max(0, toDay(inc.endDate) - toDay(listing.endDate));
  return before + after;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

export function flexLabel(flex: FlexDays): string {
  return flex === 7 ? "±1 week" : flex === 14 ? "±2 weeks" : `±${flex} days`;
}

/**
 * Coverage line (display-only, never scored). A gap is "inside your flex" when the listing
 * starts ≤ flex days after move-in AND ends ≤ flex days before move-out.
 */
export function coverage(
  listing: { startDate: ISODate; endDate: ISODate },
  inc: { startDate: ISODate; endDate: ISODate; flexDays?: FlexDays },
): { uncoveredNights: number; withinFlex: boolean; coverage: string } {
  const flex = inc.flexDays ?? 7;
  const late = Math.max(0, toDay(listing.startDate) - toDay(inc.startDate));
  const early = Math.max(0, toDay(inc.endDate) - toDay(listing.endDate));
  const nights = late + early;
  if (nights === 0) return { uncoveredNights: 0, withinFlex: true, coverage: "Covers your dates" };
  const withinFlex = flex > 0 && late <= flex && early <= flex;
  if (!withinFlex) {
    const suffix = flex > 0 ? ` (outside your ${flexLabel(flex)})` : "";
    return { uncoveredNights: nights, withinFlex, coverage: `Leaves ${plural(nights, "night")} uncovered${suffix}` };
  }
  const parts: string[] = [];
  if (late > 0) parts.push(`Starts ${plural(late, "day")} after your move-in`);
  if (early > 0) parts.push(`${late > 0 ? "ends" : "Ends"} ${plural(early, "day")} before your move-out`);
  return { uncoveredNights: nights, withinFlex, coverage: `${parts.join(" and ")} (inside your ${flexLabel(flex)})` };
}

/** @deprecated use coverage(); kept for callers that only have a night count. */
export function coverageText(nights: number): string {
  if (nights === 0) return "Covers your dates";
  return `Leaves ${plural(nights, "night")} uncovered`;
}

// ─── Deal-breakers ──────────────────────────────────────────────────────────

const OVERNIGHT_WEEKLY = 2;

export function exclusionReasons(inc: Pick<IncomingInput, "dealBreakers">, listing: ListingInput): string[] {
  const reasons: string[] = [];
  const db = new Set(inc.dealBreakers);
  if (db.has("smoke") && listing.flags.smoking) reasons.push("Indoor smoking or vaping allowed");
  if (db.has("pets") && listing.flags.pets) reasons.push("Pets in the home");
  if (db.has("overnight")) {
    const who = listing.stayers.filter((s) => s.answers[3] === OVERNIGHT_WEEKLY);
    if (who.length > 0)
      reasons.push(`Overnight guests weekly or more (${who.map((s) => s.name).join(", ")})`);
  }
  if (db.has("shared") && listing.roomType === "shared") reasons.push("Shared bedroom");
  return reasons;
}

// ─── Listing fit ────────────────────────────────────────────────────────────

interface Mismatch {
  index: number;
  stayer: StayerInput;
  gap: number;
  severity: number; // gap × weight
}

/** All (stayer, question) pairs with w > 0 and gap ≥ 0.5, most severe first. */
export function allMismatches(inc: IncomingInput, stayers: StayerInput[]): Mismatch[] {
  const out: Mismatch[] = [];
  for (const s of stayers) {
    for (let i = 0; i < QUESTIONS.length; i++) {
      const w = inc.weights[i];
      if (w <= 0) continue;
      const g = gap(i, inc.answers[i], s.answers[i]);
      if (g >= 0.5) out.push({ index: i, stayer: s, gap: g, severity: g * w });
    }
  }
  // Stable tiebreak: question order, then stayer order (already the insertion order).
  return out.sort((a, b) => b.severity - a.severity || a.index - b.index);
}

/** Top `n` mismatches, at most one per question. */
export function topMismatches(inc: IncomingInput, stayers: StayerInput[], n = 2): Mismatch[] {
  const seen = new Set<number>();
  const top: Mismatch[] = [];
  for (const m of allMismatches(inc, stayers)) {
    if (seen.has(m.index)) continue;
    seen.add(m.index);
    top.push(m);
    if (top.length === n) break;
  }
  return top;
}

/** Questions with w > 0 where every stayer answered the same as the incoming. Highest weight first. */
export function topMatches(inc: IncomingInput, stayers: StayerInput[], n = 2): number[] {
  if (stayers.length === 0) return [];
  const idx: number[] = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (inc.weights[i] <= 0) continue;
    if (stayers.every((s) => s.answers[i] === inc.answers[i])) idx.push(i);
  }
  return idx.sort((a, b) => inc.weights[b] - inc.weights[a] || a - b).slice(0, n);
}

function mismatchLine(m: Mismatch, inc: IncomingInput, incomingName: string): string {
  const q = QUESTIONS[m.index];
  return `${q.short}: ${incomingName} ${q.phrases[inc.answers[m.index]]}, ${m.stayer.name} ${q.phrases[m.stayer.answers[m.index]]}`;
}

function matchLine(i: number, inc: IncomingInput): string {
  const q = QUESTIONS[i];
  return `${q.short}: everyone ${q.phrases[inc.answers[i]]}`;
}

function talkLine(m: Mismatch): string {
  return `Ask ${m.stayer.name} about ${QUESTIONS[m.index].topic}`;
}

export function scoreListing(inc: IncomingInput, listing: ListingInput, opts: ScoreOptions = {}): ListingFit {
  const incomingName = opts.incomingName ?? "you";
  const perStayer = listing.stayers.map((s) => ({
    stayer: { id: s.id, name: s.name },
    score: stayerScore(inc.answers, inc.weights, s.answers),
  }));

  let householdScore = 100;
  let average = 100;
  let limitingStayer: PublicUser | null = null;
  if (perStayer.length > 0) {
    const min = perStayer.reduce((lo, p) => (p.score < lo.score ? p : lo), perStayer[0]);
    householdScore = min.score;
    limitingStayer = min.stayer;
    average = Math.round(perStayer.reduce((sum, p) => sum + p.score, 0) / perStayer.length);
  }

  const mism = topMismatches(inc, listing.stayers);
  const cov = coverage(listing, inc);

  return {
    listingId: listing.id,
    householdScore,
    average,
    label: fitLabel(householdScore),
    limitingStayer,
    perStayer,
    matches: topMatches(inc, listing.stayers).map((i) => matchLine(i, inc)),
    mismatches: mism.map((m) => mismatchLine(m, inc, incomingName)),
    talkAbout: mism.map(talkLine),
    uncoveredNights: cov.uncoveredNights,
    withinFlex: cov.withinFlex,
    coverage: cov.coverage,
  };
}

/** Exclude by deal-breakers, score the rest, sort by household score desc then average desc. */
export function rankListings(
  inc: IncomingInput,
  listings: ListingInput[],
  opts: ScoreOptions = {},
): { ranked: ListingFit[]; excluded: ExcludedListing[] } {
  const ranked: ListingFit[] = [];
  const excluded: ExcludedListing[] = [];
  for (const l of listings) {
    const reasons = exclusionReasons(inc, l);
    if (reasons.length > 0) excluded.push({ listingId: l.id, name: l.address, reasons });
    else ranked.push(scoreListing(inc, l, opts));
  }
  ranked.sort((a, b) => b.householdScore - a.householdScore || b.average - a.average);
  return { ranked, excluded };
}
