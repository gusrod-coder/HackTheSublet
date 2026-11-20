"use client";
/**
 * Your listings. LANE: h3. Spec: §3 Leaver.
 * Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - List my listings with status; "Waiting on N roommates" until live.
 *  - Link to /leaver/new and /leaver/listings/[id].
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.leaver.myListings(), []);
  return (
    <div className="stack">
      <h1>Your listings</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
