import { describe, expect, it } from "vitest";
import type { MatchesResponse } from "@/lib/types";
import { fitChanges } from "./fit-changes";

// Only the fields consumed by the diff are relevant to these server-snapshot fixtures.
function snapshot(...scores: Array<[string, number]>): MatchesResponse {
  return {
    ranked: scores.map(([id, score]) => ({ listing: { id }, fit: { householdScore: score } })) as MatchesResponse["ranked"],
    excluded: [], unreleased: [],
  };
}

describe("live fit changes", () => {
  it("does not highlight the first successful load", () => {
    expect(fitChanges(null, snapshot(["packard", 94])).size).toBe(0);
  });
  it("tracks the real score change when a listing moves in rank", () => {
    const before = snapshot(["packard", 94], ["geddes", 90]);
    const after = snapshot(["geddes", 90], ["packard", 88]);
    expect([...fitChanges(before, after)]).toEqual([["packard", { from: 94, to: 88 }]]);
  });
  it("does not highlight unchanged scores or a pure rank reorder", () => {
    expect(fitChanges(snapshot(["a", 80], ["b", 80]), snapshot(["b", 80], ["a", 80])).size).toBe(0);
  });
  it("does not invent previous scores for newly released listings", () => {
    expect(fitChanges(snapshot(["packard", 94]), snapshot(["packard", 94], ["hill", 71])).size).toBe(0);
  });
  it("does not retain a change for a listing no longer ranked", () => {
    expect(fitChanges(snapshot(["packard", 94]), snapshot()).size).toBe(0);
  });
  it("shows a reverted habit as a new real change", () => {
    expect(fitChanges(snapshot(["packard", 88]), snapshot(["packard", 94])).get("packard")).toEqual({ from: 88, to: 94 });
  });
  it("handles zero scores and independently changed households", () => {
    expect([...fitChanges(snapshot(["a", 0], ["b", 90]), snapshot(["a", 10], ["b", 80]))]).toEqual([
      ["a", { from: 0, to: 10 }], ["b", { from: 90, to: 80 }],
    ]);
  });
});
