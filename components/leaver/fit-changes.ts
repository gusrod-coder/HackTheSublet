import type { MatchesResponse } from "@/lib/types";

/** Compare successful server snapshots by listing, never by list position or a predicted score. */
export function fitChanges(previous: MatchesResponse | null, next: MatchesResponse) {
  const changes = new Map<string, { from: number; to: number }>();
  if (!previous) return changes;
  const before = new Map(previous.ranked.map(({ listing, fit }) => [listing.id, fit.householdScore]));
  for (const { listing, fit } of next.ranked) {
    const from = before.get(listing.id);
    if (from !== undefined && from !== fit.householdScore) changes.set(listing.id, { from, to: fit.householdScore });
  }
  return changes;
}
