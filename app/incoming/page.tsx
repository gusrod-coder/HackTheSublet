"use client";
/**
 * Stay setup. LANE: h2. Spec: §3 Incoming, §7.
 * Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h2):
 *  - Move-in / move-out date inputs and destination picker (DESTINATIONS from lib/types).
 *  - Save with api.incoming.saveProfile({ startDate, endDate, destination }); then go to /incoming/habits.
 *  - If profile.complete, show a shortcut to /incoming/browse.
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.incoming.profile(), []);
  return (
    <div className="stack">
      <h1>Stay setup</h1>
      <p className="small muted">Stub, owned by h2. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
