import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InboxPage from "@/app/stayer/inbox/page";
import { useApi } from "@/lib/use-api";
import { scoreListing } from "@/lib/scoring";
import type { StayerInboxResponse } from "@/lib/types";
import { INCOMING, LISTINGS, USERS } from "@/prisma/seed-data";

vi.mock("@/lib/use-api", () => ({ useApi: vi.fn() }));
vi.mock("@/components/leaver/use-poll", () => ({ usePoll: vi.fn() }));

const listing = LISTINGS.find(({ id }) => id === "l_plymouth")!;
const incoming = INCOMING.find(({ userId }) => userId === "u_noor")!;
const person = (id: string) => USERS.find((user) => user.id === id)!;
const stayers = listing.stayers.map(({ userId, answers }) => ({ ...person(userId), answers: answers! }));

function request(): StayerInboxResponse["requests"][number] {
  return {
    id: "r_noor_plymouth",
    status: "sent",
    createdAt: "2026-11-20T00:00:00Z",
    listing: { ...listing, status: "live", isSample: true, leader: person(listing.leaverId) },
    incoming: { ...person(incoming.userId), ...incoming },
    fit: scoreListing(incoming, { ...listing, stayers }, { incomingName: "Noor" }),
    myDecision: "approve",
    approvals: stayers.map((stayer) => ({ stayer, decision: stayer.id === "u_lena" ? "approve" : null })),
  };
}

function render(requests: StayerInboxResponse["requests"]) {
  const state = { error: null, loading: false, reload: vi.fn(), setData: vi.fn() };
  vi.mocked(useApi)
    .mockReturnValueOnce({ ...state, data: { requests } })
    .mockReturnValueOnce({ ...state, data: { user: person("u_lena") } });
  return renderToStaticMarkup(React.createElement(InboxPage));
}

beforeEach(() => {
  vi.clearAllMocks();
  // The app uses Next's JSX transform; standalone Vitest honors jsx: preserve via classic JSX.
  vi.stubGlobal("React", React);
});
afterEach(() => vi.unstubAllGlobals());

describe("stayer inbox rendering", () => {
  it("renders one page heading with separate incoming names and actions for multiple requests", () => {
    const pending = request();
    const approved = { ...request(), id: "r_other", status: "approved" as const, incoming: { ...pending.incoming, name: "Jamie" } };
    const html = render([pending, approved]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html.match(/Viewing as Lena/g)).toHaveLength(1);
    expect(html).toContain("Noor wants to join");
    expect(html).toContain("Jamie&#x27;s request is approved");
    expect(html).toContain('href="/requests/r_other"');
    expect(html).toContain("Waiting on Tariq and Wei");
    expect(html.match(/Fit with /g)).toHaveLength(6);
    expect(html.match(/Sample data/g)).toHaveLength(2);
  });

  it("keeps the empty inbox actionable", () => {
    const html = render([]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain("No requests yet");
    expect(html).toContain('href="/stayer"');
    expect(html).not.toContain("Your call");
  });
});
