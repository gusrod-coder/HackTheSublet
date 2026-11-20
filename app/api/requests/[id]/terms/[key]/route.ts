import { prisma } from "@/lib/server/db";
import { badRequest, forbidden, handle, ok } from "@/lib/server/http";
import { loadRequest, partyRole, termsState } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import { TERM_KEYS, type TermKey, type TermsResponse } from "@/lib/types";

/** POST /api/requests/:id/terms/:key — current user agrees to one term. No body. Returns TermsResponse. */
export const POST = handle<{ id: string; key: string }>(async (_req, { id, key }) => {
  const u = await requireUser();
  if (!TERM_KEYS.includes(key as TermKey)) throw badRequest("UNKNOWN_TERM", `Unknown term "${key}".`);
  const req = await loadRequest(id);
  partyRole(u.id, req.request, req.listing);
  if (req.request.status !== "approved") throw forbidden("NOT_APPROVED", "Terms appear once every stayer approves.");
  await prisma.termAgreement.upsert({
    where: { requestId_userId_termKey: { requestId: id, userId: u.id, termKey: key } },
    create: { requestId: id, userId: u.id, termKey: key, agreed: true },
    update: { agreed: true },
  });
  return ok<TermsResponse>(termsState(await loadRequest(id)));
});
