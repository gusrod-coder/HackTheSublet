import { describe, expect, it } from "vitest";
import {
  exclusionReasons,
  fitLabel,
  gap,
  rankListings,
  scoreListing,
  stayerScore,
  uncoveredNights,
  type IncomingInput,
  type ListingInput,
} from "./scoring";
import { generateTerms } from "./terms";
import { INCOMING, LISTINGS, USERS } from "../prisma/seed-data";
import type { Weights } from "./types";

const name = (id: string) => USERS.find((u) => u.id === id)!.name;
const LIVE: ListingInput[] = LISTINGS.filter((l) => l.stayers.every((s) => s.answers)).map((l) => ({
  ...l,
  stayers: l.stayers.map((s) => ({ id: s.userId, name: name(s.userId), answers: s.answers! })),
}));
const ALEX: IncomingInput = { ...INCOMING[0] };
const order = (inc: IncomingInput, ls = LIVE) => rankListings(inc, ls).ranked.map((f) => f.listingId);
const setAnswer = (inc: IncomingInput, i: number, v: number): IncomingInput => ({
  ...inc,
  answers: inc.answers.map((a, j) => (j === i ? v : a)),
});
const setWeight = (inc: IncomingInput, i: number, w: 0 | 1 | 3): IncomingInput => ({
  ...inc,
  weights: inc.weights.map((x, j) => (j === i ? w : x)) as Weights,
});

describe("primitives", () => {
  it("gap normalises by option count", () => {
    expect(gap(0, 0, 2)).toBe(1); // 3 options
    expect(gap(2, 1, 3)).toBeCloseTo(2 / 3); // guests has 4 options
    expect(gap(5, 1, 1)).toBe(0);
  });

  it("stayerScore — worked example by hand", () => {
    // Alex vs Sam: only bedtime differs, by one step of two → gap 0.5
    // Σ w·(1−gap) = 7 + 0.5 = 7.5 ; Σ w = 8 ; 100·7.5/8 = 93.75 → 94
    expect(stayerScore([0, 1, 1, 0, 0, 0, 1, 0], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 0, 0, 0, 1, 0])).toBe(94);
  });

  it("stayerScore is 100 when nothing matters", () => {
    expect(stayerScore([0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0], [2, 2, 3, 2, 2, 2, 2, 2])).toBe(100);
  });

  it("labels", () => {
    expect(fitLabel(75)).toBe("Strong fit");
    expect(fitLabel(74)).toBe("Okay fit");
    expect(fitLabel(55)).toBe("Okay fit");
    expect(fitLabel(54)).toBe("Weak fit");
  });

  it("uncovered nights count both ends", () => {
    expect(uncoveredNights({ startDate: "2027-05-01", endDate: "2027-08-31" }, { startDate: "2027-05-15", endDate: "2027-08-15" })).toBe(0);
    expect(uncoveredNights({ startDate: "2027-05-20", endDate: "2027-08-10" }, { startDate: "2027-05-15", endDate: "2027-08-15" })).toBe(10);
  });
});

describe("listing fit", () => {
  it("household score is the minimum stayer score; average shown alongside", () => {
    const packard = LIVE.find((l) => l.id === "l_packard")!;
    const fit = scoreListing(ALEX, packard);
    expect(fit.perStayer.map((p) => p.score)).toEqual([100, 94]);
    expect(fit.householdScore).toBe(94);
    expect(fit.average).toBe(97);
    expect(fit.limitingStayer?.name).toBe("Sam");
    expect(fit.mismatches).toEqual(["Bedtime: you before 11pm, Sam 11pm–1am"]);
    expect(fit.talkAbout).toEqual(["Ask Sam about sleep schedules"]);
    expect(fit.matches).toHaveLength(2);
    expect(fit.coverage).toBe("Covers your dates");
  });

  it("names the incoming when scored for stayers", () => {
    const packard = LIVE.find((l) => l.id === "l_packard")!;
    expect(scoreListing(ALEX, packard, { incomingName: "Alex" }).mismatches[0]).toMatch(/^Bedtime: Alex /);
  });

  it("mismatches are distinct questions, at most 2", () => {
    const state = LIVE.find((l) => l.id === "l_state")!;
    const fit = scoreListing(ALEX, state);
    expect(fit.mismatches).toHaveLength(2);
    expect(new Set(fit.mismatches.map((m) => m.split(":")[0])).size).toBe(2);
  });

  it("deal-breakers exclude with reasons", () => {
    const geddes = LIVE.find((l) => l.id === "l_geddes")!;
    expect(exclusionReasons({ dealBreakers: ["pets"] }, geddes)).toEqual(["Pets in the home"]);
    const state = LIVE.find((l) => l.id === "l_state")!;
    expect(exclusionReasons({ dealBreakers: ["overnight"] }, state)[0]).toMatch(/Marcus/);
    const division = LIVE.find((l) => l.id === "l_division")!;
    expect(exclusionReasons({ dealBreakers: ["shared"] }, division)).toEqual(["Shared bedroom"]);
  });
});

describe("demo script (spec §8) — these must keep passing", () => {
  it("baseline: Packard first, Church excluded for smoking, Hill not present", () => {
    const { ranked, excluded } = rankListings(ALEX, LIVE);
    expect(ranked[0].listingId).toBe("l_packard");
    expect(excluded.map((e) => e.listingId)).toEqual(["l_church"]);
    expect(LIVE.find((l) => l.id === "l_hill")).toBeUndefined();
  });

  it("§8.2 guests 1 → 4+ changes ranking and mismatches", () => {
    const changed = setAnswer(ALEX, 2, 3);
    expect(order(changed)).not.toEqual(order(ALEX));
    const packard = rankListings(changed, LIVE).ranked.find((f) => f.listingId === "l_packard")!;
    expect(packard.mismatches[0]).toMatch(/^Guests/);
  });

  it("§8.3 bedtime weight changes the order", () => {
    expect(order(setWeight(ALEX, 0, 3))).not.toEqual(order(ALEX));
    expect(order(setWeight(ALEX, 0, 0))[0]).toBe("l_packard");
  });

  it("§8.4 pets deal-breaker moves Geddes to excluded with reason", () => {
    const { ranked, excluded } = rankListings({ ...ALEX, dealBreakers: ["smoke", "pets"] }, LIVE);
    expect(ranked.map((f) => f.listingId)).not.toContain("l_geddes");
    expect(excluded.find((e) => e.listingId === "l_geddes")?.reasons).toEqual(["Pets in the home"]);
  });

  it("§8.5 Priya changing one answer changes Packard's fit", () => {
    const changed = LIVE.map((l) =>
      l.id !== "l_packard"
        ? l
        : { ...l, stayers: l.stayers.map((s) => (s.id === "u_priya" ? { ...s, answers: [2, 1, 1, 0, 0, 0, 1, 0] } : s)) },
    );
    const before = scoreListing(ALEX, LIVE.find((l) => l.id === "l_packard")!);
    const after = scoreListing(ALEX, changed.find((l) => l.id === "l_packard")!);
    expect(after.householdScore).toBeLessThan(before.householdScore);
    expect(order(ALEX, changed)).not.toEqual(order(ALEX));
  });
});

describe("terms", () => {
  const packard = LIVE.find((l) => l.id === "l_packard")!;
  const terms = generateTerms({
    incoming: { id: "u_alex", name: "Alex", ...ALEX },
    stayers: packard.stayers,
    listing: packard,
  });

  it("generates all five keys in order, each with a why", () => {
    expect(terms.map((t) => t.key)).toEqual(["dates", "quiet", "guests", "kitchen", "issues"]);
    for (const t of terms) expect(t.why.length).toBeGreaterThan(0);
  });

  it("quiet hours follow the earliest sleeper", () => {
    expect(terms.find((t) => t.key === "quiet")!.text).toBe("Quiet after 11pm on weeknights");
  });

  it("issues follows the majority", () => {
    expect(terms.find((t) => t.key === "issues")!.text).toBe("Raise problems in person within a day or two");
  });
});

describe("date flexibility (display-only)", () => {
  it("names a gap inside the flex window", async () => {
    const { coverage } = await import("./scoring");
    const c = coverage({ startDate: "2027-05-19", endDate: "2027-08-31" }, { startDate: "2027-05-15", endDate: "2027-08-15", flexDays: 7 });
    expect(c).toEqual({ uncoveredNights: 4, withinFlex: true, coverage: "Starts 4 days after your move-in (inside your ±1 week)" });
  });

  it("flags a gap outside the flex window", async () => {
    const { coverage } = await import("./scoring");
    const c = coverage({ startDate: "2027-05-20", endDate: "2027-08-10" }, { startDate: "2027-05-15", endDate: "2027-08-15", flexDays: 3 });
    expect(c.withinFlex).toBe(false);
    expect(c.coverage).toBe("Leaves 10 nights uncovered (outside your ±3 days)");
  });

  it("never changes the score or order", () => {
    const a = rankListings({ ...ALEX, flexDays: 0 }, LIVE).ranked.map((f) => [f.listingId, f.householdScore]);
    const b = rankListings({ ...ALEX, flexDays: 14 }, LIVE).ranked.map((f) => [f.listingId, f.householdScore]);
    expect(a).toEqual(b);
  });
});
