import { forbidden, handle, ok } from "@/lib/server/http";
import { contactOf, loadRequest, partyRole, pub, termsState } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { ContactsResponse } from "@/lib/types";

/**
 * GET /api/requests/:id/contacts — 403 CONTACTS_LOCKED until: approved, every party agreed
 * to every term, every party set a contact method (gate §2.5). Then everyone sees everyone
 * at once — the gate is the same for both sides, so the reveal is simultaneous.
 */
export const GET = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const req = await loadRequest(id);
  partyRole(u.id, req.request, req.listing);
  if (!termsState(req).contactsUnlocked)
    throw forbidden("CONTACTS_LOCKED", "Contacts unlock once everyone approves, agrees to every term and sets a contact method.");
  const parties = [
    { user: req.request.incoming, role: "incoming" as const },
    ...req.listing.memberships.map((m) => ({ user: m.user, role: "stayer" as const })),
  ];
  return ok<ContactsResponse>({
    contacts: parties.map(({ user, role }) => ({ ...pub(user), role, ...contactOf(user)! })),
  });
});
