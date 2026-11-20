"use client";
/**
 * Household. LANE: h2. Spec: §3 Household page.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h2):
 *  - Profile card per stayer with their score; limiting stayer called out.
 *  - Side-by-side table (data.table): highlight cells in mismatchWith.
 *  - "Talk about this" list (fit.talkAbout). Explain min-not-average (spec §5).
 *  - Request button → api.incoming.request(id) → /incoming/requests. Disable if data.request exists.
 *  - Show excludedReasons as a warning if non-empty.
 */
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApi(() => api.incoming.household(id), []);
  return (
    <div className="stack">
      <h1>Household</h1>
      <p className="small muted">Stub, owned by h2. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
