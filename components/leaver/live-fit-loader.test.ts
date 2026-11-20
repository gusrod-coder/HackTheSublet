import { describe, expect, it, vi } from "vitest";
import type { MatchesResponse } from "@/lib/types";
import { createLiveFitLoader } from "./live-fit-loader";

const response = (): MatchesResponse => ({ ranked: [], excluded: [], unreleased: [] });
function deferred() {
  let resolve!: (data: MatchesResponse) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<MatchesResponse>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("live fit loader", () => {
  it("queues a post-save refresh after a slow poll instead of sharing its stale response", async () => {
    const first = deferred();
    const second = deferred();
    const fetchMatches = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const loader = createLiveFitLoader(fetchMatches);
    const poll = loader.load();
    const afterSave = loader.load();
    await Promise.resolve();
    expect(fetchMatches).toHaveBeenCalledTimes(1);
    expect(loader.pending()).toBe(2);
    const old = response();
    first.resolve(old);
    expect(await poll).toBe(old);
    await Promise.resolve();
    expect(fetchMatches).toHaveBeenCalledTimes(2);
    const fresh = response();
    second.resolve(fresh);
    expect(await afterSave).toBe(fresh);
    expect(loader.pending()).toBe(0);
  });

  it("returns a refresh failure without poisoning later queued reads", async () => {
    const failed = deferred();
    const fresh = response();
    const fetchMatches = vi.fn().mockReturnValueOnce(failed.promise).mockResolvedValueOnce(fresh);
    const loader = createLiveFitLoader(fetchMatches);
    const error = new Error("offline");
    const first = loader.load();
    const expectedFailure = expect(first).rejects.toBe(error);
    const retry = loader.load();
    failed.reject(error);
    await expectedFailure;
    expect(await retry).toBe(fresh);
    expect(fetchMatches).toHaveBeenCalledTimes(2);
    expect(loader.pending()).toBe(0);
  });
});
