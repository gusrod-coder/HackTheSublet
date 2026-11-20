# API reference

All routes are JSON. Types for every body and response are in `lib/types.ts` (named in the table).
From the browser, call them through `api.*` in `lib/api-client.ts`. It throws `ApiClientError { status, code, message }`.

**Auth:** the `hf_user` cookie, set by the demo switcher. No cookie → `401 NO_SESSION`.
**Errors:** `{ error: { code, message } }`. Codes are stable, so branch on `code`, not `message`.

## Demo / session

| Method | Path | Body → Response | Notes |
|---|---|---|---|
| GET | `/api/demo/users` | → `DemoUsersResponse` | All users + `currentUserId` |
| POST | `/api/demo/switch` | `{ userId }` → `{ user }` | Sets cookie |
| DELETE | `/api/demo/switch` | → `{ ok }` | Sign out |
| POST | `/api/demo/reset` | → `{ ok }` | Reseed sample data |
| GET | `/api/me` | → `MeResponse` | `user: null` when signed out (no 401) |
| PUT | `/api/me/contact` | `ContactBody` → `ContactBody` | Preferred contact |

## Leaver (h3)

| Method | Path | Body → Response | Gates / errors |
|---|---|---|---|
| GET | `/api/listings` | → `MyListingsResponse` | Listings I lead, with `waitingOn` |
| POST | `/api/listings` | `CreateListingBody` → `ListingResponse` (201) | Creates `draft` |
| GET | `/api/listings/:id` | → `ListingResponse` | Members always; others only when `live` (else 404) |
| PATCH | `/api/listings/:id` | `UpdateListingBody` → `ListingResponse` | `403 NOT_LEAVER` |
| POST | `/api/listings/:id/submit` | → `ListingResponse` | draft → awaiting_household → live if all answered |
| POST | `/api/listings/:id/invites` | `InviteBody` → `HouseholdStatusResponse` (201) | Creates users for new emails. Inviting to a live listing reverts it to awaiting_household. `400 CANNOT_INVITE_SELF` |
| GET | `/api/listings/:id/household-status` | → `HouseholdStatusResponse` | Who answered, **never what** |

## Stayer (h3)

| Method | Path | Body → Response | Gates / errors |
|---|---|---|---|
| GET | `/api/stayer/invites` | → `StayerInvitesResponse` | Invite notifications |
| GET | `/api/stayer/:listingId/profile` | → `StayerProfileResponse` | `403 NOT_STAYER` |
| POST | `/api/stayer/:listingId/profile` | `StayerProfileBody` → `StayerProfileResponse` | Only the stayer themself. May release the listing (`listingStatus: "live"`) |
| GET | `/api/stayer/requests` | → `StayerInboxResponse` | Incoming's answers + fit (lines name the incoming) |
| POST | `/api/requests/:id/decision` | `DecisionBody` → `RequestRef` | Stayers only (`403 NOT_STAYER`; leaver has no vote). `409 REQUEST_CLOSED` once decided |
| DELETE | `/api/requests/:id/decision` | → `RequestRef` | Undo my vote while `sent`. `409 REQUEST_CLOSED` once decided |

## Incoming (h2)

| Method | Path | Body → Response | Gates / errors |
|---|---|---|---|
| GET | `/api/incoming/profile` | → `IncomingProfileResponse` | Defaults if never started |
| PUT | `/api/incoming/profile` | `IncomingProfileBody` → `IncomingProfileResponse` | Partial updates. Server computes `complete` + `missing`. `400 INVALID_DATES` |
| GET | `/api/incoming/matches` | → `MatchesResponse` | `403 PROFILE_INCOMPLETE`. Ranks only `live` listings. `unreleased` lists name + address of listings still waiting on stayers (nothing else) |
| GET | `/api/listings/:id/household` | → `HouseholdResponse` | `403 PROFILE_INCOMPLETE`, `404` unless live |
| POST | `/api/listings/:id/requests` | → `RequestRef` (201) | `403 PROFILE_INCOMPLETE`, `403 OWN_LISTING`, `404`, `409 ALREADY_REQUESTED` |
| GET | `/api/incoming/requests` | → `IncomingRequestsResponse` | Vote counts, not who voted |

## Request parties (incoming + stayers of that listing)

| Method | Path | Body → Response | Gates / errors |
|---|---|---|---|
| GET | `/api/requests/:id` | → `RequestDetailResponse` | `403 NOT_A_PARTY`. `viewerRole` tells the UI which side you are |
| GET | `/api/requests/:id/terms` | → `TermsResponse` | `403 NOT_APPROVED` |
| POST | `/api/requests/:id/terms/:key` | → `TermsResponse` | Agree to one term. `400 UNKNOWN_TERM` |
| GET | `/api/requests/:id/contacts` | → `ContactsResponse` | `403 CONTACTS_LOCKED` until approved + all agreed + all have contact method |

## Display-only fields (never scored)

- `IncomingProfile.flexDays` (0 | 3 | 7 | 14, default 7) only changes `fit.coverage` wording and `fit.withinFlex`.
- `distance` on matches and household is straight-line miles to the incoming's destination. We don't estimate commute times (spec §10).
- `ListingSummary.name` is always set (derived as "<street> house" if the leaver leaves it blank). `furnished` defaults to true.

## Gate summary (spec §2): where each one lives

| Gate | Enforced in |
|---|---|
| §2.1 Listing release | `syncListingStatus`, `loadLiveListings`, `requireLiveListing` in `lib/server/repo.ts` |
| §2.2 Incoming must complete | `requireCompleteIncoming` |
| §2.3 Blind reveal | household route needs a complete profile; stayer inbox only lists requests to their listing |
| §2.4 Unanimous approval | `resolveRequestStatus` |
| §2.5 Contact exchange | `termsState().contactsUnlocked` |

`npm run smoke` exercises every row above.
