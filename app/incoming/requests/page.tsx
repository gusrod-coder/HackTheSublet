"use client";
/**
 * Your requests. LANE: h2. Spec: §3 Request status.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h2):
 *  - sent → approved / declined, with approvals.approved / approvals.total.
 *  - Approved → link to /requests/[id] (terms + contacts screen, owned by h3).
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.incoming.myRequests(), []);
  return (
    <div className="stack">
      <h1>Your requests</h1>
      <p className="small muted">Stub, owned by h2. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
