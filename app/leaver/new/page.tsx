"use client";
/**
 * List your room. LANE: h3. Spec: §3 Leaver, §7.
 * Design: consult the Figma MCP with the link from your chat (primary). Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - Form: address, map pin (ListingMap with onMapClick), area, dates, room type, house rules, smoking/pets flags.
 *  - api.leaver.create(body) → draft; then /leaver/listings/[id] to invite stayers and submit.
 */
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {

  const { data, error, loading } = useApi(() => api.me.get(), []);
  return (
    <div className="stack">
      <h1>List your room</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
