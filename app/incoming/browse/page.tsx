"use client";
/**
 * Households for you. LANE: h2. Spec: §3 Browse, §5, §8.2–8.4.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h2):
 *  - Ranked list: FitBadge(householdScore, label), average, coverage line, top-2 matches/mismatches.
 *  - Map: dynamic(() => import("@/components/shared/ListingMap"), { ssr: false }) with pins + destination.
 *  - Collapsed "Excluded by your deal-breakers" section with reasons.
 *  - error.code === "PROFILE_INCOMPLETE" → send to /incoming (gate §2.2).
 *  - Quick-edit controls for the demo (guests answer, bedtime weight, pets deal-breaker) are a big win: §8.2–8.4.
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.incoming.matches(), []);
  return (
    <div className="stack">
      <h1>Households for you</h1>
      <p className="small muted">Stub, owned by h2. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
