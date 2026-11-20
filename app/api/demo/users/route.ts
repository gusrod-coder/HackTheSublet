import { prisma } from "@/lib/server/db";
import { handle, ok } from "@/lib/server/http";
import { currentUser } from "@/lib/server/session";
import { USERS } from "@/prisma/seed-data";
import type { DemoUsersResponse } from "@/lib/types";

/** Fallback for sample users with no role in the DB yet (e.g. Morgan, a leaver who hasn't listed). */
const SEED_HINT = new Map(USERS.map((u) => [u.id, u.hint]));

const street = (address: string) => address.split(",")[0].replace(/^\s*\d+[A-Za-z]?\s+/, "");
const STATUS: Record<string, string> = { draft: "draft", awaiting_household: "unreleased", live: "live" };

/**
 * GET /api/demo/users — everyone, for the demo switcher. Hints are computed live from the DB
 * ("Leaver · Packard St (live)", "Stayer · Hill St (NOT answered)", "Incoming · profile complete"),
 * so they stay right after demo actions like creating a listing or answering the form.
 */
export const GET = handle(async () => {
  const [users, me] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        listingsLed: { orderBy: { createdAt: "asc" } },
        memberships: { where: { role: "stayer" }, include: { listing: true } },
        incoming: true,
        requests: { select: { status: true } },
      },
    }),
    currentUser(),
  ]);
  return ok<DemoUsersResponse>({
    users: users.map((u) => {
      let hint = "New · no role yet";
      if (u.listingsLed.length) {
        const l = u.listingsLed[0];
        hint = `Leaver · ${street(l.address)} (${STATUS[l.status] ?? l.status})`;
      } else if (u.memberships.length) {
        const m = u.memberships[0];
        hint = `Stayer · ${street(m.listing.address)}${m.inviteStatus === "answered" ? "" : " (NOT answered)"}`;
      } else if (u.incoming) {
        const approved = u.requests.filter((r) => r.status === "approved").length;
        const sent = u.requests.filter((r) => r.status === "sent").length;
        hint = `Incoming · ${u.incoming.complete ? "profile complete" : "profile in progress"}${
          approved ? ` · ${approved} approved` : sent ? ` · ${sent} request${sent > 1 ? "s" : ""} sent` : ""
        }`;
      } else if (SEED_HINT.has(u.id)) {
        hint = SEED_HINT.get(u.id)!;
      }
      return { id: u.id, name: u.name, email: u.email, hint };
    }),
    currentUserId: me?.id ?? null,
  });
});
