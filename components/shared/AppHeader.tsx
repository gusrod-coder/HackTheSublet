"use client";
/**
 * Figma header: logo + "prototype · sample data" pill + "You: <role>" + Switch role.
 * "Switch role" is the demo user switcher. OWNER: h1.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

export function AppHeader() {
  const router = useRouter();
  const { data, reload } = useApi(() => api.demo.users(), []);
  const me = data?.users.find((u) => u.id === data.currentUserId);
  const role = me?.hint.split("·")[0].trim();

  async function onChange(userId: string) {
    if (userId) await api.demo.switchTo(userId);
    else await api.demo.signOut();
    await reload();
    router.push("/");
    router.refresh();
  }

  async function onReset() {
    if (!confirm("Reset all sample data to the demo starting state?")) return;
    await api.demo.reset();
    window.location.href = "/";
  }

  return (
    <header className="topbar">
      <div className="row">
        <Link href="/" className="brand">Householdfit</Link>
        <span className="pill">prototype · sample data</span>
      </div>
      <div className="row small">
        <span>
          You: <strong>{me ? `${me.name}${role ? ` · ${role}` : ""}` : "signed out"}</strong>
        </span>
        <label htmlFor="switch-role" className="muted">Switch role</label>
        <select id="switch-role" value={data?.currentUserId ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">— signed out —</option>
          {data?.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.hint}
            </option>
          ))}
        </select>
        <Link href="/dev/outbox" className="btn ghost small" title="Notification emails">Outbox</Link>
        <button className="btn secondary small" type="button" onClick={onReset} title="Reseed sample data">
          Reset demo
        </button>
      </div>
    </header>
  );
}
