import type { MatchesResponse } from "@/lib/types";

/** Manual refreshes queue after an active poll so post-save reads cannot reuse an older response. */
export function createLiveFitLoader(fetchMatches: () => Promise<MatchesResponse>) {
  let tail = Promise.resolve();
  let pending = 0;
  return {
    pending: () => pending,
    load: () => {
      pending++;
      const result = tail.then(fetchMatches).finally(() => { pending--; });
      // Keep the queue usable after a network or gate failure; return the error to the caller.
      tail = result.then(() => undefined, () => undefined);
      return result;
    },
  };
}
