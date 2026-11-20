/**
 * End-to-end smoke test of the API against a running server: every gate in spec §2 and
 * every demo step in §8. RESETS THE DATABASE FIRST.
 *
 *   npm run dev            # in one terminal
 *   npm run smoke          # in another   (BASE_URL=http://host:3000 npm run smoke)
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let failures = 0;
function check(cond: unknown, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else {
    failures++;
    console.log(`  ✗ ${msg}`);
  }
}

class Client {
  cookie = "";
  constructor(public label: string) {}
  async req(method: string, path: string, body?: unknown) {
    const res = await fetch(BASE + path, {
      method,
      headers: { "Content-Type": "application/json", cookie: this.cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const set = res.headers.get("set-cookie");
    if (set) this.cookie = set.split(";")[0];
    const data = await res.json().catch(() => null);
    return { status: res.status, data: data as any };
  }
  async as(userId: string) {
    const r = await this.req("POST", "/api/demo/switch", { userId });
    if (r.status !== 200) throw new Error(`switch to ${userId} failed: ${r.status}`);
    return this;
  }
  get = (p: string) => this.req("GET", p);
  post = (p: string, b?: unknown) => this.req("POST", p, b);
  put = (p: string, b?: unknown) => this.req("PUT", p, b);
}

const as = (id: string) => new Client(id).as(id);
const outbox = async (kind?: string) => {
  const r = await new Client("anon").get("/api/dev/outbox?limit=200");
  return (r.data.emails as any[]).filter((e) => !kind || e.kind === kind);
};
const order = (m: any) => m.ranked.map((r: any) => r.listing.id).join(",");
const packardFit = (m: any) => m.ranked.find((r: any) => r.listing.id === "l_packard")?.fit;

async function main() {
  console.log(`Smoke test against ${BASE}`);
  const anon = new Client("anon");
  // The smoke test triggers dozens of notifications. Never run it against a server that sends real email.
  const mode = (await anon.get("/api/dev/outbox?limit=1")).data?.mode;
  if (mode === "smtp" && process.env.SMOKE_ALLOW_EMAIL !== "1") {
    console.error(
      "Refusing: this server has SMTP on, so the smoke test would send real email.\n" +
        "Start the server without it, e.g. SMTP_HOST= EMAIL_REDIRECT= npm run dev, or set SMOKE_ALLOW_EMAIL=1.",
    );
    process.exit(2);
  }
  check((await anon.post("/api/demo/reset")).status === 200, "reset sample data");
  check((await anon.get("/api/incoming/matches")).status === 401, "no session → 401");

  console.log("\nGate §2.2 — incoming must complete profile");
  const riley = await as("u_riley");
  check((await riley.get("/api/incoming/matches")).data?.error?.code === "PROFILE_INCOMPLETE", "matches 403 before profile");
  check((await riley.get("/api/listings/l_packard/household")).status === 403, "household 403 before profile");
  check((await riley.post("/api/listings/l_packard/requests")).status === 403, "request 403 before profile");
  let p = await riley.put("/api/incoming/profile", { startDate: "2027-06-01", endDate: "2027-08-01", destination: "north" });
  check(p.data.complete === false && p.data.missing.includes("answers.0"), "partial profile reports missing answers");
  p = await riley.put("/api/incoming/profile", { answers: [1, 1, 1, 1, 1, 1, 1, 1] });
  check(p.data.complete === true, "profile complete after answers");
  check((await riley.get("/api/incoming/matches")).status === 200, "matches unlocked");

  console.log("\nDemo §8.1 — Hill St hidden until Omar answers");
  const alex = await as("u_alex");
  let m = (await alex.get("/api/incoming/matches")).data;
  check(!order(m).includes("l_hill"), "Hill St not in matches");
  const hillU = m.unreleased.find((u: any) => u.listingId === "l_hill");
  check(hillU && Object.keys(hillU).sort().join() === "address,listingId,name", "Hill St listed as unreleased (name + address only)");
  check(!order(m).includes("l_prospect") && !order(m).includes("l_maynard"), "Prospect (unreleased) and Maynard (draft) not ranked");
  check(!m.unreleased.some((u: any) => u.listingId === "l_maynard"), "drafts aren't even listed as unreleased");
  check(m.ranked.every((r: any) => r.distance?.label?.includes("Medical Campus")), "distance labels present");
  check((await alex.get("/api/listings/l_hill/household")).status === 404, "Hill St household 404");
  check(m.excluded.some((e: any) => e.listingId === "l_church"), "Church St excluded (smoking)");
  const leo = await as("u_leo");
  const hs = (await leo.get("/api/listings/l_hill/household-status")).data;
  check(hs.waitingOn === 1 && !("answers" in hs.stayers[0]), "leaver sees waitingOn=1 and no answers");
  check((await leo.post("/api/stayer/l_hill/profile", { answers: [0, 0, 0, 0, 0, 0, 0, 0] })).status === 403, "leaver can't answer for a stayer");
  const omar = await as("u_omar");
  const op = await omar.post("/api/stayer/l_hill/profile", { answers: [0, 1, 1, 0, 0, 0, 1, 0] });
  check(op.data.listingStatus === "live", "Omar answers → Hill St live");
  check((await outbox("listing_live")).some((e) => e.to === "leo@example.edu"), "email: Leo told Hill St is live");
  m = (await alex.get("/api/incoming/matches")).data;
  check(order(m).includes("l_hill"), "Hill St now in matches");
  check(!m.unreleased.some((u: any) => u.listingId === "l_hill"), "Hill St no longer unreleased");
  await alex.put("/api/incoming/profile", { flexDays: 3 });
  const st = (await alex.get("/api/incoming/matches")).data.ranked.find((r: any) => r.listing.id === "l_state").fit;
  check(st.coverage.includes("outside your ±3 days") && !st.withinFlex, `flex coverage: ${st.coverage}`);
  await alex.put("/api/incoming/profile", { flexDays: 7 });

  const base = (await alex.get("/api/incoming/matches")).data;

  console.log("\nDemo §8.2 — guests 1 → 4+");
  await alex.put("/api/incoming/profile", { answers: [0, 1, 3, 0, 0, 0, 1, 0] });
  m = (await alex.get("/api/incoming/matches")).data;
  check(order(m) !== order(base), `order changed: ${order(m)}`);
  check(packardFit(m).mismatches[0]?.startsWith("Guests"), `Packard mismatch: ${packardFit(m).mismatches[0]}`);
  await alex.put("/api/incoming/profile", { answers: [0, 1, 1, 0, 0, 0, 1, 0] });

  console.log("\nDemo §8.3 — bedtime matters a lot");
  await alex.put("/api/incoming/profile", { weights: [3, 1, 1, 1, 1, 1, 1, 1] });
  m = (await alex.get("/api/incoming/matches")).data;
  check(order(m) !== order(base), `order changed: ${order(m)}`);
  await alex.put("/api/incoming/profile", { weights: [1, 1, 1, 1, 1, 1, 1, 1] });

  console.log("\nDemo §8.4 — pets deal-breaker");
  await alex.put("/api/incoming/profile", { dealBreakers: ["smoke", "pets"] });
  m = (await alex.get("/api/incoming/matches")).data;
  const ged = m.excluded.find((e: any) => e.listingId === "l_geddes");
  check(ged && ged.reasons[0] === "Pets in the home", "Geddes excluded: Pets in the home");
  await alex.put("/api/incoming/profile", { dealBreakers: ["smoke"] });

  console.log("\nDemo §8.5 — Priya changes one answer");
  const before = packardFit((await alex.get("/api/incoming/matches")).data).householdScore;
  const priya = await as("u_priya");
  await priya.post("/api/stayer/l_packard/profile", { answers: [2, 1, 1, 0, 0, 0, 1, 0] });
  const after = packardFit((await alex.get("/api/incoming/matches")).data).householdScore;
  check(after < before, `Packard fit ${before} → ${after}`);
  await priya.post("/api/stayer/l_packard/profile", { answers: [0, 1, 1, 0, 0, 0, 1, 0] });

  console.log("\nGate §2.3 — blind reveal");
  const hh = (await alex.get("/api/listings/l_packard/household")).data;
  check(hh.stayers.length === 2 && hh.table.length === 8, "complete incoming sees stayers' answers");
  let inbox = (await priya.get("/api/stayer/requests")).data;
  check(!inbox.requests.some((r: any) => r.incoming.id === "u_alex"), "stayers don't see Alex before Alex requests");

  console.log("\nDemo §8.6 — request → unanimous approval → terms → contacts");
  const rr = await alex.post("/api/listings/l_packard/requests");
  check(rr.status === 201, "Alex requests Packard St");
  const recv = (await outbox("request_received")).map((e) => e.to).sort().join();
  check(recv === "priya@example.edu,sam@example.edu", `email: both stayers told about the request (${recv})`);
  const rid = rr.data.id;
  check((await alex.post("/api/listings/l_packard/requests")).status === 409, "duplicate request 409");
  inbox = (await priya.get("/api/stayer/requests")).data;
  const mine = inbox.requests.find((r: any) => r.id === rid);
  check(mine && mine.incoming.answers.length === 8 && mine.fit.mismatches.every((x: string) => !x.includes(" you ")), "stayers see Alex's answers + fit naming Alex");
  const jordan = await as("u_jordan");
  check((await jordan.post(`/api/requests/${rid}/decision`, { decision: "approve" })).status === 403, "leaver has no vote");
  check((await alex.get(`/api/requests/${rid}/terms`)).data?.error?.code === "NOT_APPROVED", "terms 403 before approval");
  let d = await priya.post(`/api/requests/${rid}/decision`, { decision: "approve" });
  check(d.data.status === "sent", "one approval → still sent");
  check((await priya.req("DELETE", `/api/requests/${rid}/decision`)).data.status === "sent", "Priya retracts the vote");
  let inb = (await priya.get("/api/stayer/requests")).data.requests.find((r: any) => r.id === rid);
  check(inb.myDecision === null, "vote retracted");
  await priya.post(`/api/requests/${rid}/decision`, { decision: "approve" });
  const sam = await as("u_sam");
  d = await sam.post(`/api/requests/${rid}/decision`, { decision: "approve" });
  check(d.data.status === "approved", "all stayers approve → approved");
  check((await outbox("request_approved")).length === 3, "email: approval sent to Alex, Priya, Sam");
  check((await sam.post(`/api/requests/${rid}/decision`, { decision: "pass" })).status === 409, "closed request can't be re-voted");

  const terms = (await alex.get(`/api/requests/${rid}/terms`)).data;
  check(terms.terms.length === 5 && terms.terms.every((t: any) => t.why), "5 terms each with a why");
  console.log("    " + terms.terms.map((t: any) => t.text).join(" | "));
  check((await alex.get(`/api/requests/${rid}/contacts`)).data?.error?.code === "CONTACTS_LOCKED", "contacts locked before agreement");
  for (const c of [alex, priya, sam]) for (const t of terms.terms) await c.post(`/api/requests/${rid}/terms/${t.key}`);
  let ts = (await alex.get(`/api/requests/${rid}/terms`)).data;
  check(ts.allAgreed && !ts.contactsUnlocked, "all agreed, but Alex has no contact method → still locked");
  check((await sam.get(`/api/requests/${rid}/contacts`)).status === 403, "stayer side locked too (simultaneous)");
  await alex.put("/api/me/contact", { method: "text", value: "(734) 555-0199" });
  ts = (await alex.get(`/api/requests/${rid}/terms`)).data;
  check(ts.contactsUnlocked, "contacts unlocked");
  check((await outbox("contacts_unlocked")).length === 3, "email: contacts-unlocked sent once to each of 3 parties");
  await alex.put("/api/me/contact", { method: "text", value: "(734) 555-0199" });
  check((await outbox("contacts_unlocked")).length === 3, "email: contacts-unlocked not re-sent");
  check((await outbox()).every((e) => !e.text.includes("555-0199") && !e.text.includes("555-0141")), "emails never contain contact details");
  const ca = (await alex.get(`/api/requests/${rid}/contacts`)).data;
  const cs = (await sam.get(`/api/requests/${rid}/contacts`)).data;
  check(ca.contacts.length === 3 && JSON.stringify(ca) === JSON.stringify(cs), "both sides see the same 3 contacts");

  console.log("\nDecline path");
  const jamieReq = "r_jamie_packard";
  await priya.post(`/api/requests/${jamieReq}/decision`, { decision: "pass" });
  const jamie = await as("u_jamie");
  const jr = (await jamie.get("/api/incoming/requests")).data.requests[0];
  check(jr.status === "declined", "any single pass → declined");
  check((await outbox("request_declined")).some((e) => e.to === "jamie@example.edu"), "email: Jamie told it was declined");

  console.log("\nLeaver flow");
  const morgan = await as("u_morgan");
  const created = await morgan.post("/api/listings", {
    address: "900 Oakland Ave", lat: 42.2735, lng: -83.7395, area: "South U", roomType: "private",
    startDate: "2027-05-01", endDate: "2027-08-31", flags: { pets: false },
  });
  check(created.status === 201 && created.data.listing.status === "draft", "create → draft");
  const lid = created.data.listing.id;
  const inv = await morgan.post(`/api/listings/${lid}/invites`, { invites: [{ email: "newstayer@example.edu", name: "Quinn" }] });
  check(inv.data.waitingOn === 1, "invite → waiting on 1");
  const invMail = (await outbox("invite")).find((e) => e.to === "newstayer@example.edu");
  const invLink = invMail ? new URL(invMail.link) : null;
  check(
    !!invLink && invLink.pathname === "/api/demo/login" && invLink.searchParams.get("next") === `/stayer/${lid}/form` &&
      !!invLink.searchParams.get("u"),
    "email: invite link signs in as the stayer and opens their form",
  );
  check((await morgan.post(`/api/listings/${lid}/submit`)).data.listing.status === "awaiting_household", "submit → awaiting_household");
  m = (await alex.get("/api/incoming/matches")).data;
  check(!order(m).includes(lid), "unreleased listing not shown to incoming");
  const users = (await anon.get("/api/demo/users")).data.users;
  const quinn = await as(users.find((u: any) => u.name === "Quinn").id);
  const qa = await quinn.post(`/api/stayer/${lid}/profile`, { answers: [0, 0, 0, 0, 0, 0, 0, 0] });
  check(qa.data.listingStatus === "live", "Quinn answers → live");

  check((await anon.post("/api/demo/reset")).status === 200, "\nreset sample data again");
  console.log(failures === 0 ? "\nALL PASSED" : `\n${failures} FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
