"use client";
/**
 * Terms and contacts. LANE: h3. Spec: §5 Generated terms, gate §2.5.
 * Prototype: https://claude.ai/artifact/RYVwAPw5Cm35x8pAPpMAGt
 *
 * TODO(h3):
 *  - Shared by incoming AND stayers (api.requests.get(id).viewerRole tells you which).
 *  - Each term with its "why"; Agree → api.requests.agree(id, key).
 *  - Preferred contact form → api.me.setContact({ method, value }).
 *  - When contactsUnlocked: api.requests.contacts(id). Poll every few seconds so both sides see it at once.
 *  - 403 NOT_APPROVED → show request status instead. Include <OutsideAppNotice />.
 */
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DevJson } from "@/components/shared/ui";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useApi(() => api.requests.terms(id), []);
  return (
    <div className="stack">
      <h1>Terms and contacts</h1>
      <p className="small muted">Stub, owned by h3. Replace with the real screen.</p>
      {loading && <p className="muted">Loading…</p>}
      {error && <p className="notice warn">{error.code}: {error.message}</p>}
      {data && <DevJson value={data} />}
    </div>
  );
}
