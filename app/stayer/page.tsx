"use client";
/**
 * You've been invited. LANE: h3. Spec: §3 Stayers, §7.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - Explain why to answer and what is protected (blind reveal: incoming only sees answers after completing theirs).
 *  - Per invite: listing, other stayers status, button to /stayer/[listingId]/form.
 *  - Link to /stayer/inbox.
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.stayer.invites(), []);
  return (
    <div className="stack">
      <h1>You've been invited</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
