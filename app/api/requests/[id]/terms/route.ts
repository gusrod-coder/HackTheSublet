import { forbidden, handle, ok } from "@/lib/server/http";
import { loadRequest, partyRole, termsState } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { TermsResponse } from "@/lib/types";

/** GET /api/requests/:id/terms — generated terms + who agreed. 403 NOT_APPROVED until approved. */
export const GET = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  const req = await loadRequest(id);
  partyRole(u.id, req.request, req.listing);
  if (req.request.status !== "approved") throw forbidden("NOT_APPROVED", "Terms appear once every stayer approves.");
  return ok<TermsResponse>(termsState(req));
});
