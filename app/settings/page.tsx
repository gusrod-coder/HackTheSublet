"use client";
/**
 * Settings. LANE: h2. Figma "13 Settings" (44:2004). Not linked from the header yet.
 * Real: Sign out (demo sign-out), "Your role" links to each role's area, and the one privacy rule
 * the app actually enforces (answers stay hidden until you request), shown locked on.
 * Notification / other privacy toggles, school and delete have no backend yet: shown, not saved.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import type { Role } from "@/lib/types";
import { ROLE_LABEL, Toggle, roleOf } from "../account/shared";
import st from "../account/account.module.css";

const ROLE_HREF: Record<Role, string> = { incoming: "/incoming", leaver: "/leaver", stayer: "/stayer" };

export default function SettingsPage() {
  const router = useRouter();
  const me = useApi(() => api.me.get(), []);
  const role = roleOf(me.data);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await api.demo.signOut();
    } finally {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className={st.page}>
      <button type="button" className={st.back} onClick={() => router.back()} style={{ border: 0, background: "none", cursor: "pointer" }}>← Back</button>
      <h1 className={st.title}>Settings</h1>
      <p className={st.note}>Prototype: only Sign out, Your role and the answer-privacy rule are live. The other switches show the planned defaults and aren’t saved yet.</p>

      <div className={st.grid2}>
        <div className={st.col}>
          <section className={st.panel} aria-labelledby="notif-h">
            <h2 id="notif-h" className={st.headingM}>Notifications</h2>
            <Toggle id="n-matches" on label="New matches" hint="When a household that fits you is released." />
            <Toggle id="n-requests" on label="Requests and approvals" hint="When a stayer approves or passes, or someone requests your room." />
            <Toggle id="n-reminders" on label="Reminders" hint="Nudges to finish your questions or answer roommate invites." />
            <Toggle id="n-digest" on={false} label="Weekly email digest" hint="A summary of new sublets near your campus." />
          </section>

          <section className={st.panel} aria-labelledby="priv-h">
            <h2 id="priv-h" className={st.headingM}>Privacy</h2>
            <Toggle id="p-school" on label="Show my school on my profile" hint="Roommates see “University of Michigan” next to your name." />
            <Toggle id="p-blind" on label="Hide my answers until I request" hint="Households only see your habits after you ask to join them." locked="Always on: this is how burrow works." />
            <Toggle id="p-similar" on={false} label="Show me in “similar students”" hint="Let incoming students with similar habits find your household." />
          </section>
        </div>

        <div className={st.col}>
          <section className={st.panel} aria-labelledby="role-h">
            <h2 id="role-h" className={st.headingM}>Your role</h2>
            <p className={st.caption}>Jump to each role’s screens. To act as someone else in the demo, use Switch role at the top.</p>
            <div className={st.pills}>
              {(["incoming", "leaver", "stayer"] as Role[]).map((r) => (
                <Link key={r} href={ROLE_HREF[r]} className={st.pill} aria-pressed={r === role} style={{ textDecoration: "none" }}>
                  {ROLE_LABEL[r]}
                </Link>
              ))}
            </div>
          </section>

          <section className={st.panel} aria-labelledby="school-h">
            <h2 id="school-h" className={st.headingM}>School</h2>
            <div className={st.field}>
              <label htmlFor="s-campus" className={st.label}>Campus</label>
              <input id="s-campus" className={st.input} value="University of Michigan · Ann Arbor" readOnly />
            </div>
          </section>

          <section className={st.panel} aria-labelledby="acct-h">
            <h2 id="acct-h" className={st.headingM}>Account</h2>
            <button type="button" className="btn secondary" style={{ alignSelf: "flex-start" }} disabled={signingOut || !me.data?.user} onClick={() => void signOut()}>
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
            <button type="button" className={st.danger} disabled title="Not available in the prototype">Delete my account</button>
            <p className={st.caption}>Deleting removes your answers and listings. This can’t be undone. (Not available in the prototype.)</p>
          </section>
        </div>
      </div>
    </div>
  );
}
