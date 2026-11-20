/**
 * Typed browser client for every API route. OWNER: h1.
 * h2/h3: call these from client components instead of hand-rolling fetch.
 *
 *   import { api, ApiClientError } from "@/lib/api-client";
 *   try { const m = await api.incoming.matches(); }
 *   catch (e) { if (e instanceof ApiClientError && e.code === "PROFILE_INCOMPLETE") router.push("/incoming"); }
 */
import type {
  ApiError,
  ContactBody,
  ContactsResponse,
  CreateListingBody,
  DecisionBody,
  DemoUsersResponse,
  HouseholdResponse,
  HouseholdStatusResponse,
  IncomingProfileBody,
  IncomingProfileResponse,
  IncomingRequestsResponse,
  InviteBody,
  ListingResponse,
  MatchesResponse,
  MeResponse,
  MyListingsResponse,
  OutboxResponse,
  RequestDetailResponse,
  RequestRef,
  RequestToJoinBody,
  StayerInboxResponse,
  StayerInvitesResponse,
  StayerProfileBody,
  StayerProfileResponse,
  TermKey,
  TermsResponse,
  UpdateListingBody,
} from "./types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (data as ApiError | null)?.error;
    throw new ApiClientError(res.status, err?.code ?? "HTTP_" + res.status, err?.message ?? res.statusText);
  }
  return data as T;
}

const enc = encodeURIComponent;

export const api = {
  demo: {
    users: () => call<DemoUsersResponse>("GET", "/api/demo/users"),
    switchTo: (userId: string) => call<{ user: { id: string; name: string } }>("POST", "/api/demo/switch", { userId }),
    signOut: () => call<{ ok: true }>("DELETE", "/api/demo/switch"),
    /** On the public address the server may ask for the demo passcode (403 RESET_CODE). */
    reset: (code?: string) => call<{ ok: true }>("POST", "/api/demo/reset", code ? { code } : {}),
  },
  dev: {
    outbox: (to?: string) => call<OutboxResponse>("GET", `/api/dev/outbox${to ? `?to=${enc(to)}` : ""}`),
  },
  me: {
    get: () => call<MeResponse>("GET", "/api/me"),
    setContact: (b: ContactBody) => call<ContactBody>("PUT", "/api/me/contact", b),
  },

  // ── Leaver (h3) ──
  leaver: {
    myListings: () => call<MyListingsResponse>("GET", "/api/listings"),
    create: (b: CreateListingBody) => call<ListingResponse>("POST", "/api/listings", b),
    update: (id: string, b: UpdateListingBody) => call<ListingResponse>("PATCH", `/api/listings/${enc(id)}`, b),
    submit: (id: string) => call<ListingResponse>("POST", `/api/listings/${enc(id)}/submit`),
    invite: (id: string, b: InviteBody) => call<HouseholdStatusResponse>("POST", `/api/listings/${enc(id)}/invites`, b),
    householdStatus: (id: string) => call<HouseholdStatusResponse>("GET", `/api/listings/${enc(id)}/household-status`),
  },

  // ── Stayer (h3) ──
  stayer: {
    invites: () => call<StayerInvitesResponse>("GET", "/api/stayer/invites"),
    profile: (listingId: string) => call<StayerProfileResponse>("GET", `/api/stayer/${enc(listingId)}/profile`),
    saveProfile: (listingId: string, b: StayerProfileBody) =>
      call<StayerProfileResponse>("POST", `/api/stayer/${enc(listingId)}/profile`, b),
    inbox: () => call<StayerInboxResponse>("GET", "/api/stayer/requests"),
    decide: (requestId: string, b: DecisionBody) => call<RequestRef>("POST", `/api/requests/${enc(requestId)}/decision`, b),
    /** Retract my vote while the request is still "sent". */
    undoDecision: (requestId: string) => call<RequestRef>("DELETE", `/api/requests/${enc(requestId)}/decision`),
  },

  // ── Incoming (h2) ──
  incoming: {
    profile: () => call<IncomingProfileResponse>("GET", "/api/incoming/profile"),
    saveProfile: (b: IncomingProfileBody) => call<IncomingProfileResponse>("PUT", "/api/incoming/profile", b),
    matches: () => call<MatchesResponse>("GET", "/api/incoming/matches"),
    household: (listingId: string) => call<HouseholdResponse>("GET", `/api/listings/${enc(listingId)}/household`),
    request: (listingId: string, b: RequestToJoinBody = {}) => call<RequestRef>("POST", `/api/listings/${enc(listingId)}/requests`, b),
    myRequests: () => call<IncomingRequestsResponse>("GET", "/api/incoming/requests"),
  },

  // ── Shared: any party on a request ──
  listing: (id: string) => call<ListingResponse>("GET", `/api/listings/${enc(id)}`),
  requests: {
    get: (id: string) => call<RequestDetailResponse>("GET", `/api/requests/${enc(id)}`),
    terms: (id: string) => call<TermsResponse>("GET", `/api/requests/${enc(id)}/terms`),
    agree: (id: string, key: TermKey) => call<TermsResponse>("POST", `/api/requests/${enc(id)}/terms/${enc(key)}`),
    contacts: (id: string) => call<ContactsResponse>("GET", `/api/requests/${enc(id)}/contacts`),
  },
};
