"use client";
/**
 * Invite your roommates. LANE: h3. Spec: §3 Leaver, gate §2.1.
 * Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - Invite by email: api.leaver.invite(id, { invites: [{ email, name }] }).
 *  - Status list per stayer (invited / answered); "Waiting on N roommates".
 *  - Submit button (api.leaver.submit) while status is draft.
 *  - Make clear the leaver cannot answer for stayers or approve incoming.
 */
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApi(() => api.leaver.householdStatus(id), []);
  return (
    <div className="stack">
      <h1>Invite your roommates</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
