"use client";
/**
 * Your account. LANE: h2. Figma "12 Account" (44:1892). Not linked from the header yet (h1: the gear
 * opens the demo panel). Uses existing API only: me (name, email, contact) + PUT /api/me/contact.
 * Display name, username and email are read-only (no endpoint). Pronouns are left out on purpose:
 * spec says habits only, never identity data. Picking a different mascot needs a field (REQ to h1).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import type { ContactMethod } from "@/lib/types";
import { Persona, PERSONA_FOR_ROLE, type PersonaKind } from "@/components/shared/Persona";
import { dateRange } from "@/components/incoming/ui";
import { ROLE_LABEL, handleOf, roleOf } from "./shared";
import st from "./account.module.css";

const METHODS: Array<{ key: ContactMethod; label: string; field: string; type: string; placeholder: string }> = [
  { key: "text", label: "Text", field: "Phone number", type: "tel", placeholder: "(734) 555-0100" },
  { key: "phone", label: "Call", field: "Phone number", type: "tel", placeholder: "(734) 555-0100" },
  { key: "email", label: "Email", field: "Email", type: "email", placeholder: "you@umich.edu" },
  { key: "instagram", label: "Instagram", field: "Instagram handle", type: "text", placeholder: "@yourhandle" },
];
const MASCOTS: Array<{ kind: PersonaKind; name: string; sub: string }> = [
  { kind: "fox", name: "Fox", sub: "the fox" },
  { kind: "dino", name: "Dino", sub: "the dino" },
  { kind: "capybara", name: "Capybara", sub: "the capybara" },
];

export default function AccountPage() {
  const router = useRouter();
  const me = useApi(() => api.me.get(), []);
  const incoming = useApi(() => api.incoming.profile().catch(() => null), []);
  const user = me.data?.user;
  const role = roleOf(me.data);
  const mascot = PERSONA_FOR_ROLE[role];

  const [method, setMethod] = useState<ContactMethod | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setMethod(user.contactMethod);
    setValue(user.contactValue ?? "");
  }, [user]);

  if (me.loading && !me.data) return <div className={st.page}><p className={st.caption}>Loading…</p></div>;
  if (!user) {
    return (
      <div className={st.page}>
        <h1 className={st.title}>Your account</h1>
        <p className={st.note}>You’re signed out. Pick a demo person from <strong>Viewing as</strong> at the top right.</p>
      </div>
    );
  }

  const dirty = method !== user.contactMethod || value.trim() !== (user.contactValue ?? "");
  const m = METHODS.find((x) => x.key === method);
  const where =
    role === "incoming" && incoming.data?.startDate && incoming.data.endDate
      ? dateRange(incoming.data.startDate, incoming.data.endDate)
      : role === "leaver" ? me.data?.leading[0]?.address : role === "stayer" ? me.data?.staying[0]?.address : null;

  async function save() {
    if (!method || !value.trim()) { setProblem("Pick how roommates should reach you and fill it in."); return; }
    setSaving(true); setProblem(null); setSaved(false);
    try {
      await api.me.setContact({ method, value: value.trim() });
      await me.reload();
      setSaved(true);
    } catch (e) {
      setProblem(e instanceof ApiClientError ? e.message : "Couldn’t save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={st.page}>
      <button type="button" className={st.back} onClick={() => router.back()} style={{ border: 0, background: "none", cursor: "pointer" }}>← Back</button>
      <h1 className={st.title}>Your account</h1>

      <div className={st.grid}>
        <aside className={st.idCard}>
          <Persona kind={mascot} scale={1.15} label={`${user.name}'s mascot`} />
          <p className={st.idName}>{user.name}</p>
          <p className={st.idHandle}>{handleOf(user.email)}</p>
          <div className={st.chips}>
            <span className={st.chip}>{ROLE_LABEL[role]}</span>
            <span className={st.chip}>University of Michigan</span>
            {where && <span className={st.chip}>{where}</span>}
          </div>
        </aside>

        <div className={st.col}>
          <section className={st.panel} aria-labelledby="profile-h">
            <h2 id="profile-h" className={st.headingM}>Profile</h2>
            <div className={st.fields}>
              <div className={st.field}>
                <label htmlFor="acc-name" className={st.label}>Display name</label>
                <input id="acc-name" className={st.input} value={user.name} readOnly />
              </div>
              <div className={st.field}>
                <label htmlFor="acc-handle" className={st.label}>Username</label>
                <input id="acc-handle" className={st.input} value={handleOf(user.email)} readOnly />
              </div>
              <div className={st.field}>
                <label htmlFor="acc-email" className={st.label}>School email</label>
                <input id="acc-email" className={st.input} value={user.email} readOnly />
              </div>
            </div>
            <p className={st.caption}>Roommates see your display name and mascot. Your email stays private. Name and email come from your school sign-in.</p>
          </section>

          <section className={st.panel} aria-labelledby="mascot-h">
            <div className={st.titleRow}>
              <h2 id="mascot-h" className={st.headingM}>Your mascot</h2>
              <span className={st.tag}>shown next to your name</span>
            </div>
            <div className={st.mascots} role="group" aria-label="Mascot">
              {MASCOTS.map((x) => (
                <button key={x.kind} type="button" className={st.mascot} aria-pressed={x.kind === mascot} disabled title={x.kind === mascot ? undefined : "Coming soon"}>
                  <Persona kind={x.kind} scale={0.8} label={x.name} />
                  <span className={st.mascotName}>{x.name}</span>
                  <span className={x.kind === mascot ? st.mascotSel : st.mascotSub}>{x.kind === mascot ? "✓ selected" : x.sub}</span>
                </button>
              ))}
            </div>
            <p className={st.caption}>Your mascot is your role’s animal. Picking a different one is coming soon; it won’t change your role.</p>
          </section>

          <section className={st.panel} aria-labelledby="reach-h">
            <h2 id="reach-h" className={st.headingM}>How roommates reach you</h2>
            <div className={st.pills} role="group" aria-label="Preferred contact method">
              {METHODS.map((x) => (
                <button key={x.key} type="button" className={st.pill} aria-pressed={method === x.key} onClick={() => { setMethod(x.key); setSaved(false); }}>
                  {x.label}
                </button>
              ))}
            </div>
            {m && (
              <div className={`${st.field} ${st.narrow}`}>
                <label htmlFor="acc-contact" className={st.label}>{m.field}</label>
                <input id="acc-contact" className={st.input} type={m.type} placeholder={m.placeholder} value={value}
                  onChange={(e) => { setValue(e.target.value); setSaved(false); }} />
              </div>
            )}
            <p className={st.caption}>Only shared after everyone agrees to house terms.</p>
          </section>

          {problem && <p className={st.note} role="alert">{problem}</p>}
          <div className={st.actions}>
            {saved && !dirty && <span className={st.saved} role="status">Saved</span>}
            <Link href="/" className="btn ghost">Cancel</Link>
            <button type="button" className="btn" disabled={saving || !dirty} onClick={() => void save()}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
