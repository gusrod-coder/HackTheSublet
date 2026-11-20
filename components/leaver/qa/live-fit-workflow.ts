/** Real HTTP checks for the stayer-edit -> incoming matches workflow. LOCAL DB is reset. */
import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { api, ApiClientError } from "@/lib/api-client";
import type { MatchesResponse } from "@/lib/types";

const base = "http://localhost:3000";
const nativeFetch = globalThis.fetch;
const current = new AsyncLocalStorage<Session>();
let checks = 0;

class Session {
  cookie = "";
  run<T>(fn: () => Promise<T>): Promise<T> { return current.run(this, fn); }
  async signIn(userId: string) { await this.run(() => api.demo.switchTo(userId)); return this; }
}

// The product calls still use the shared typed client. Only base URL and cookie jars are adapted for Node.
globalThis.fetch = async (input, init) => {
  assert.equal(typeof input, "string");
  const session = current.getStore();
  const headers = new Headers(init?.headers);
  if (session?.cookie) headers.set("cookie", session.cookie);
  const response = await nativeFetch(new URL(input as string, base), { ...init, headers });
  const cookie = response.headers.get("set-cookie");
  if (session && cookie) session.cookie = cookie.split(";")[0];
  return response;
};

function check(value: unknown, label: string): asserts value {
  assert.ok(value, label);
  checks++;
  console.log(`PASS ${label}`);
}

function packard(matches: MatchesResponse) {
  const result = matches.ranked.find(({ listing }) => listing.id === "l_packard");
  assert.ok(result, "Packard must remain in matches");
  return result.fit;
}

async function main() {
  assert.equal((await api.dev.outbox()).mode, "outbox", "Use a local server without SMTP for this test");
  await api.demo.reset();
  try {
    const alex = await new Session().signIn("u_alex");
    const priya = await new Session().signIn("u_priya");
    const alexCookie = alex.cookie;
    const profile = await alex.run(() => api.incoming.profile());
    const baseline = await alex.run(() => api.incoming.matches());
    const original = await priya.run(() => api.stayer.profile("l_packard"));
    check(!!original.answers, "Priya has an existing household profile");
    check(packard(baseline).householdScore === 94, "Alex starts with Packard fit 94");

    const edited = [...original.answers];
    edited[0] = 2;
    const saved = await priya.run(() => api.stayer.saveProfile("l_packard", { answers: edited }));
    check(saved.answers?.[0] === 2 && saved.listingStatus === "live", "backend commits the new bedtime and keeps the listing live");
    const changed = await alex.run(() => api.incoming.matches());
    const fit = packard(changed);
    check(fit.householdScore === 88, "the next incoming matches request returns 94 -> 88");
    check(fit.perStayer.find(({ stayer }) => stayer.id === "u_priya")?.score === 88, "the changed per-stayer score belongs to Priya");
    check(fit.limitingStayer?.id === "u_priya", "Priya becomes the limiting stayer");
    check(fit.mismatches.some((line) => line.includes("Priya") && line.includes("after 1am")), "mismatch text reflects the saved bedtime");
    const position = (id: string) => changed.ranked.findIndex(({ listing }) => listing.id === id);
    check(position("l_geddes") < position("l_packard"), "Geddes ranks ahead of Packard after the edit");
    assert.deepEqual(await alex.run(() => api.incoming.profile()), profile);
    check(alex.cookie === alexCookie, "Alex stays signed in with the same profile and cookie");
    check(packard(await alex.run(() => api.incoming.matches())).householdScore === 88, "an unchanged refresh returns the same score");

    await assert.rejects(
      () => priya.run(() => api.stayer.saveProfile("l_packard", { answers: [] })),
      (error: unknown) => error instanceof ApiClientError && error.code === "INVALID_BODY",
    );
    check(packard(await alex.run(() => api.incoming.matches())).householdScore === 88, "a rejected save does not change the incoming score");

    await priya.run(() => api.stayer.saveProfile("l_packard", { answers: original.answers! }));
    const restored = packard(await alex.run(() => api.incoming.matches()));
    check(restored.householdScore === 94, "changing the habit back restores 88 -> 94");
    check(!restored.mismatches.some((line) => line.includes("Priya") && line.includes("after 1am")), "restored mismatch text drops the old Priya bedtime");

    const riley = await new Session().signIn("u_riley");
    await assert.rejects(
      () => riley.run(() => api.incoming.matches()),
      (error: unknown) => error instanceof ApiClientError && error.code === "PROFILE_INCOMPLETE",
    );
    check(true, "incomplete incoming profiles remain gated");
    const jordan = await new Session().signIn("u_jordan");
    await assert.rejects(
      () => jordan.run(() => api.stayer.saveProfile("l_packard", { answers: edited })),
      (error: unknown) => error instanceof ApiClientError && error.code === "NOT_STAYER",
    );
    check(packard(await alex.run(() => api.incoming.matches())).householdScore === 94, "the leaver cannot change stayer answers or fit");
    console.log(`\n${checks} live-fit backend checks passed using separate sessions.`);
  } finally {
    await api.demo.reset();
    globalThis.fetch = nativeFetch;
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
