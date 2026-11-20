"use client";
/**
 * Describe your household. LANE: h3. Spec: §4.
 * Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - <HabitForm answers onAnswers /> (no weights for stayers).
 *  - Save with api.stayer.saveProfile(listingId, { answers }); show listingStatus (may flip to live: demo §8.1).
 *  - Editing later must work (demo §8.5: Priya changes one answer).
 */
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {
  const { listingId } = useParams<{ listingId: string }>();
  const { data, error, loading } = useApi(() => api.stayer.profile(listingId), []);
  return (
    <div className="stack">
      <h1>Describe your household</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
