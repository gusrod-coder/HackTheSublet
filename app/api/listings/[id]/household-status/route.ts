import { handle, ok } from "@/lib/server/http";
import { householdStatus, requireLeader } from "@/lib/server/repo";
import { requireUser } from "@/lib/server/session";
import type { HouseholdStatusResponse } from "@/lib/types";

/** GET /api/listings/:id/household-status — leaver sees invite status per stayer (not their answers). */
export const GET = handle<{ id: string }>(async (_req, { id }) => {
  const u = await requireUser();
  await requireLeader(u.id, id);
  return ok<HouseholdStatusResponse>(await householdStatus(id));
});
