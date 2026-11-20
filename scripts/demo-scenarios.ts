// Prints rankings for each §8 demo scenario, straight from lib/scoring.ts. `npx tsx scripts/demo-scenarios.ts`
import { rankListings, type IncomingInput, type ListingInput } from "../lib/scoring";
import { INCOMING, LISTINGS, USERS } from "../prisma/seed-data";

const name = (id: string) => USERS.find((u) => u.id === id)!.name;
const live: ListingInput[] = LISTINGS.filter((l) => l.stayers.every((s) => s.answers)).map((l) => ({
  ...l,
  stayers: l.stayers.map((s) => ({ id: s.userId, name: name(s.userId), answers: s.answers! })),
}));
const alex = INCOMING[0];
const base: IncomingInput = { ...alex };

function show(title: string, inc: IncomingInput, listings = live) {
  const { ranked, excluded } = rankListings(inc, listings);
  console.log(`\n== ${title}`);
  for (const f of ranked)
    console.log(`  ${String(f.householdScore).padStart(3)} (avg ${f.average}) ${f.label.padEnd(10)} ${LISTINGS.find((l) => l.id === f.listingId)!.address.padEnd(18)} ${f.coverage} | mism: ${f.mismatches.join("; ")}`);
  for (const e of excluded) console.log(`  EXCLUDED ${e.name}: ${e.reasons.join(", ")}`);
}

show("Baseline (Alex)", base);
show("§8.2 guests 1 → 4+", { ...base, answers: base.answers.map((a, i) => (i === 2 ? 3 : a)) });
show("§8.3 bedtime matters a lot", { ...base, weights: base.weights.map((w, i) => (i === 0 ? 3 : w)) as any });
show("§8.3 bedtime not at all", { ...base, weights: base.weights.map((w, i) => (i === 0 ? 0 : w)) as any });
show("§8.4 pets deal-breaker", { ...base, dealBreakers: ["smoke", "pets"] });
const priyaChanged = live.map((l) => l.id !== "l_packard" ? l : { ...l, stayers: l.stayers.map((s) => s.id === "u_priya" ? { ...s, answers: [2, 1, 1, 0, 0, 0, 1, 0] } : s) });
show("§8.5 Priya bedtime → after 1am", base, priyaChanged);
