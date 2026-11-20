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
    expect(excluded.map((e) => e.listingId).sort()).toEqual(["l_church", "l_fuller"]);
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

describe("demo §8.1 follow-through: Omar's scripted answers keep the script's order", () => {
  // DEMO.md tells the presenter to enter exactly these for Omar.
  const OMAR = [2, 1, 2, 1, 1, 0, 1, 0];
  const hillSeed = LISTINGS.find((l) => l.id === "l_hill")!;
  const HILL: ListingInput = {
    ...hillSeed,
    stayers: [
      { id: "u_nina", name: "Nina", answers: hillSeed.stayers[0].answers! },
      { id: "u_omar", name: "Omar", answers: OMAR },
    ],
  };
  const WITH_HILL = [...LIVE, HILL];
  const rank = (inc: IncomingInput) => rankListings(inc, WITH_HILL).ranked.map((f) => f.listingId);

  it("Hill St lands as an Okay fit limited by Omar, below Packard and Geddes", () => {
    const hill = scoreListing(ALEX, HILL);
    expect(hill.label).toBe("Okay fit");
    expect(hill.limitingStayer?.name).toBe("Omar");
    expect(rank(ALEX).slice(0, 3)).toEqual(["l_packard", "l_geddes", "l_hill"]);
  });

  it("no other sample listing ties Hill St at step 1", () => {
    const fits = rankListings(ALEX, WITH_HILL).ranked;
    const hill = fits.find((f) => f.listingId === "l_hill")!.householdScore;
    expect(fits.filter((f) => f.listingId !== "l_hill" && f.householdScore === hill)).toEqual([]);
  });

  it("Packard + Geddes stay the top two in steps 2, 3 and 5", () => {
    expect(rank(setAnswer(ALEX, 2, 3)).slice(0, 2)).toEqual(["l_geddes", "l_packard"]);
    expect(rank(setWeight(ALEX, 0, 3)).slice(0, 2)).toEqual(["l_geddes", "l_packard"]);
  });
});

describe("budget (display + exclusion only)", () => {
  const packard = { ...LIVE.find((l) => l.id === "l_packard")!, rent: 950 };
  it("excludes a listing over budget with a reason", () => {
    expect(exclusionReasons({ dealBreakers: [], maxRent: 900 }, packard)).toEqual(["Over your budget: $950/mo (you set up to $900)"]);
  });
  it("keeps listings at or under budget, or with no rent given, or with no budget", () => {
    expect(exclusionReasons({ dealBreakers: [], maxRent: 950 }, packard)).toEqual([]);
    expect(exclusionReasons({ dealBreakers: [], maxRent: 500 }, { ...packard, rent: null })).toEqual([]);
    expect(exclusionReasons({ dealBreakers: [], maxRent: null }, packard)).toEqual([]);
  });
  it("must-haves: excludes a house missing a required household practice, keeps one that has it", () => {
    const withPractice = { ...packard, practices: ["affirming" as const] };
    expect(exclusionReasons({ dealBreakers: [], mustHaves: ["affirming"] }, withPractice)).toEqual([]);
    expect(exclusionReasons({ dealBreakers: [], mustHaves: ["affirming", "vegan"] }, withPractice)).toEqual(["Not marked by everyone who stays: Vegan kitchen"]);
    expect(exclusionReasons({ dealBreakers: [], mustHaves: [] }, { ...packard, practices: [] })).toEqual([]);
  });
  it("excludes a listing below the price range with a reason; keeps it inside the range", () => {
    expect(exclusionReasons({ dealBreakers: [], minRent: 1000 }, packard)).toEqual(["Below your price range: $950/mo (you set from $1,000)"]);
    expect(exclusionReasons({ dealBreakers: [], minRent: 950, maxRent: 950 }, packard)).toEqual([]);
    expect(exclusionReasons({ dealBreakers: [], minRent: 2000 }, { ...packard, rent: null })).toEqual([]);
  });
  it("never changes scores", () => {
    const a = rankListings(ALEX, LIVE).ranked.map((f) => [f.listingId, f.householdScore]);
    const b = rankListings({ ...ALEX, maxRent: 100000 }, LIVE.map((l) => ({ ...l, rent: 950 }))).ranked.map((f) => [f.listingId, f.householdScore]);
    expect(b).toEqual(a);
  });
});

describe("explanations account for every lost point", () => {
  it("a one-step difference on a 4-option question is listed (scripted demo: Tom, guests 2–3 vs 1 → 96)", () => {
    const oakland: ListingInput = {
      id: "l_oak", address: "1828 Oakland Ave", roomType: "private", flags: { smoking: false, pets: false },
      startDate: "2027-05-10", endDate: "2027-08-20",
      stayers: [{ id: "u_tom", name: "Tom", answers: [0, 1, 2, 0, 0, 0, 1, 0] }],
    };
    const fit = scoreListing(ALEX, oakland);
    expect(fit.householdScore).toBe(96); // 100 · (7 + 2/3) / 8 = 95.83 → 96
    expect(fit.mismatches).toEqual(["Guests: you 1 night, Tom 2–3 nights"]);
  });

  it("any score below 100 has at least one difference listed", () => {
    for (const l of LIVE) {
      const fit = scoreListing(ALEX, l);
      if (fit.householdScore < 100) expect(fit.mismatches.length).toBeGreaterThan(0);
    }
  });
});
