"use client";
/**
 * Requests to join. LANE: h3. Spec: §3 Stayers, gate §2.4.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - Per request: incoming name/dates, household fit + per-stayer fit, matches/mismatches, their answers.
 *  - Approve / Pass → api.stayer.decide(id, { decision }); show other stayers votes.
 *  - Approved → link to /requests/[id].
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.stayer.inbox(), []);
  return (
    <div className="stack">
      <h1>Requests to join</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
