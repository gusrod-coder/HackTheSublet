"use client";
/**
 * Your habits. LANE: h2. Spec: §4, §7.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h2):
 *  - <HabitForm answers weights onAnswers onWeights /> from components/shared/HabitForm.
 *  - Deal-breaker toggles (DEAL_BREAKERS from lib/types).
 *  - Save with api.incoming.saveProfile({ answers, weights, dealBreakers }); show `missing` until complete.
 *  - Explain the blind reveal: households are hidden until you finish.
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.incoming.profile(), []);
  return (
    <div className="stack">
      <h1>Your habits</h1>
      <p className="small muted">Stub, owned by h2. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
