"use client";
/** Shared bits for /account and /settings (Figma 12 + 13). LANE: h2. */
import type { MeResponse, Role } from "@/lib/types";
import st from "./account.module.css";

/** The signed-in user's main role, from what the API says they do (same order the header uses). */
export function roleOf(me: MeResponse | null | undefined): Role {
  if (!me) return "incoming";
  if (me.leading.length > 0) return "leaver";
  if (me.staying.length > 0) return "stayer";
  return "incoming";
}
export const ROLE_LABEL: Record<Role, string> = { incoming: "Incoming", leaver: "Leaver", stayer: "Stayer" };

/** "maya.k@umich.edu" -> "@maya.k" */
export const handleOf = (email?: string | null) => (email ? "@" + email.split("@")[0] : "");

/** Figma Toggle (43:1649). Read-only in the prototype unless onChange is given. */
export function Toggle({ id, on, label, hint, locked, onChange }: { id: string; on: boolean; label: string; hint: string; locked?: string; onChange?: (v: boolean) => void }) {
  return (
    <div className={st.toggleRow}>
      <div className={st.toggleText}>
        <label htmlFor={id} className={st.label}>{label}</label>
        <span className={st.hint}>{hint}{locked && <> <em className={st.locked}>{locked}</em></>}</span>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={on}
        className={st.toggle}
        disabled={!onChange}
        onClick={() => onChange?.(!on)}
      >
        <span className={st.knob} />
      </button>
    </div>
  );
}
