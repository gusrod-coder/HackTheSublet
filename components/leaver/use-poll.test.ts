import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { usePoll } from "./use-poll";

// Run the effect directly to exercise timer behavior without a browser dependency.
vi.mock("react", () => ({ useEffect: vi.fn() }));

let cleanup: (() => void) | undefined;

function mount(refresh: () => Promise<void>, active = true) {
  usePoll(refresh, active);
  const effect = vi.mocked(useEffect).mock.calls.at(-1)![0];
  cleanup = effect() as (() => void) | undefined;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("document", { visibilityState: "visible" });
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("H3 status polling", () => {
  it("refreshes visible pending status every four seconds", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    mount(refresh);
    await vi.advanceTimersByTimeAsync(3999);
    expect(refresh).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("does not schedule requests when no status is pending", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    mount(refresh, false);
    await vi.advanceTimersByTimeAsync(12000);
    expect(refresh).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("skips hidden tabs and resumes when visible", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    mount(refresh);
    vi.stubGlobal("document", { visibilityState: "hidden" });
    await vi.advanceTimersByTimeAsync(8000);
    expect(refresh).not.toHaveBeenCalled();
    vi.stubGlobal("document", { visibilityState: "visible" });
    await vi.advanceTimersByTimeAsync(4000);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("waits for a slow response before scheduling the next request", async () => {
    let resolve!: () => void;
    const refresh = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    mount(refresh);
    await vi.advanceTimersByTimeAsync(16000);
    expect(refresh).toHaveBeenCalledTimes(1);
    resolve();
    await vi.advanceTimersByTimeAsync(4000);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("clears pending timers when unmounted or polling becomes inactive", async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    mount(refresh);
    cleanup?.();
    await vi.advanceTimersByTimeAsync(8000);
    expect(refresh).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not restart when an in-flight request resolves after cleanup", async () => {
    let resolve!: () => void;
    const refresh = vi.fn(() => new Promise<void>((done) => { resolve = done; }));
    mount(refresh);
    await vi.advanceTimersByTimeAsync(4000);
    cleanup?.();
    resolve();
    await vi.advanceTimersByTimeAsync(8000);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
