/** H3 integration checks. Local dev server required; resets the LOCAL sample DB. */
import assert from "node:assert/strict";
import { api, ApiClientError } from "@/lib/api-client";

const base = "http://localhost:3000";
const nativeFetch = globalThis.fetch;
let cookie = "";
let checks = 0;

// Keep every product call on the shared typed client; supply Node's base URL and cookie jar.
globalThis.fetch = async (input, init) => {
  assert.equal(typeof input, "string");
  const headers = new Headers(init?.headers);
  if (cookie) headers.set("cookie", cookie);
  const response = await nativeFetch(new URL(input as string, base), { ...init, headers });
  const nextCookie = response.headers.get("set-cookie");
  if (nextCookie) cookie = nextCookie.split(";")[0];
  return response;
};

function check(value: unknown, label: string): asserts value {
  assert.ok(value, label);
  checks++;
  console.log(`PASS ${label}`);
}

async function denied(run: () => Promise<unknown>, code: string, label: string) {
  await assert.rejects(run, (error: unknown) => error instanceof ApiClientError && error.code === code);
  checks++;
  console.log(`PASS ${label}`);
}

async function main() {
  await api.demo.reset();
  try {
    check((await api.demo.users()).users.length === 42, "expanded seed contains 42 users");

    await api.demo.switchTo("u_taylor");
    const draft = (await api.leaver.myListings()).listings.find((listing) => listing.id === "l_maynard");
    check(draft?.status === "draft" && draft.stayerCount === 0, "Taylor sees the unsubmitted Maynard draft");
    check((await api.leaver.householdStatus("l_maynard")).stayers.length === 0, "draft invite screen handles no roommates");
    await api.demo.switchTo("u_alex");
    let matches = await api.incoming.matches();
    check(!matches.ranked.some(({ listing }) => listing.id === "l_maynard") && !matches.unreleased.some(({ listingId }) => listingId === "l_maynard"), "draft is neither ranked nor advertised as unreleased");

    await api.demo.switchTo("u_taylor");
    check((await api.leaver.submit("l_maynard")).listing.status === "awaiting_household", "submitting without stayers never releases Maynard");
    check((await api.leaver.invite("l_maynard", { invites: [{ email: "sofia@example.edu", name: "Sofia" }] })).waitingOn === 1, "Taylor can invite a sample roommate to the submitted draft");
    await api.demo.switchTo("u_sofia");
    check((await api.stayer.profile("l_maynard")).answers === null, "answers from another listing are not reused");
    check((await api.stayer.saveProfile("l_maynard", { answers: [0, 1, 1, 0, 0, 0, 1, 0] })).listingStatus === "live", "Maynard releases after its own stayer answers");

    await api.demo.switchTo("u_drew");
    const household = await api.leaver.householdStatus("l_prospect");
    check(household.listing.status === "awaiting_household" && household.waitingOn === 1 && household.stayers.length === 3, "Prospect has three stayers and waits on one");
    check(household.stayers.find(({ id }) => id === "u_mei")?.inviteStatus === "invited", "Mei is the outstanding invite");
    check(household.stayers.every((stayer) => !("answers" in stayer)), "leaver sees status without private answers");
    await api.demo.switchTo("u_mei");
    const invite = (await api.stayer.invites()).invites.find(({ listing }) => listing.id === "l_prospect");
    check(invite?.inviteStatus === "invited" && invite.otherStayers.length === 2 && invite.otherStayers.every(({ inviteStatus }) => inviteStatus === "answered"), "Mei sees her invite and both answered roommates");
    check((await api.stayer.profile("l_prospect")).answers === null, "Mei starts with an unanswered form");
    check((await api.stayer.saveProfile("l_prospect", { answers: [0, 1, 1, 0, 0, 0, 1, 0] })).listingStatus === "live", "Mei's submission releases Prospect");
    await api.demo.switchTo("u_alex");
    matches = await api.incoming.matches();
    check(matches.ranked.some(({ listing }) => listing.id === "l_prospect"), "Prospect appears in matching after Mei answers");

    for (const user of ["u_lena", "u_tariq", "u_wei"]) {
      await api.demo.switchTo(user);
      const request = (await api.stayer.inbox()).requests.find(({ id }) => id === "r_noor_plymouth");
      check(request?.status === "sent" && request.approvals.length === 3 && request.fit.perStayer.length === 3, `${user} sees Noor and all three stayer scores/votes`);
      check(request.myDecision === (user === "u_lena" ? "approve" : null), `${user} gets the correct personal decision`);
    }
    await api.demo.switchTo("u_lena");
    check((await api.stayer.undoDecision("r_noor_plymouth")).status === "sent", "Lena can undo while the request is pending");
    await api.stayer.decide("r_noor_plymouth", { decision: "approve" });
    await api.demo.switchTo("u_tariq");
    check((await api.stayer.decide("r_noor_plymouth", { decision: "approve" })).status === "sent", "two of three approvals leave Noor pending");
    await api.demo.switchTo("u_wei");
    check((await api.stayer.decide("r_noor_plymouth", { decision: "approve" })).status === "approved", "third approval unlocks the terms link");
    for (const user of ["u_lena", "u_tariq", "u_wei"]) {
      await api.demo.switchTo(user);
      check((await api.stayer.inbox()).requests.find(({ id }) => id === "r_noor_plymouth")?.status === "approved", `${user} sees the final approved state on reload`);
    }

    await api.demo.switchTo("u_grace");
    check((await api.stayer.inbox()).requests.find(({ id }) => id === "r_noor_catherine")?.status === "approved", "Grace starts with an approved request and can enter terms");
    const terms = await api.requests.terms("r_noor_catherine");
    check(terms.parties.find(({ id }) => id === "u_grace")?.agreed.length === 5 && terms.parties.find(({ id }) => id === "u_noor")?.agreed.length === 2 && !terms.contactsUnlocked, "Catherine preserves the seeded terms-in-progress state");
    await denied(() => api.requests.contacts("r_noor_catherine"), "CONTACTS_LOCKED", "Grace cannot see contacts before everyone is ready");
    console.log(`\n${checks} H3 expanded-state checks passed.`);
  } finally {
    await api.demo.reset();
    globalThis.fetch = nativeFetch;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
