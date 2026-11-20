"use client";
/**
 * Figma header (5:70): logo tile + "burrow" + "prototype · sample data" pill | "You: <role>" chip,
 * Switch role, divider, account (persona avatar + name). "Switch role" is the demo user switcher;
 * Outbox + Reset demo are demo-only extras not in Figma. OWNER: h1.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { Persona, PERSONA_FOR_ROLE } from "./Persona";
import type { Role } from "@/lib/types";

const ROLE_FROM_HINT: Record<string, Role> = { Leaver: "leaver", Stayer: "stayer", Incoming: "incoming" };

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  // Refetch on navigation so "You: Morgan · Leaver · …" reflects what just happened.
  const { data, reload } = useApi(() => api.demo.users(), [pathname]);
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

  const roleKey = role ? ROLE_FROM_HINT[role] : undefined;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <Link href="/" className="brand" aria-label="burrow home">
          <span className="brand-tile" aria-hidden>b</span>
          <span className="brand-word">burrow</span>
        </Link>
        <span className="proto-pill">prototype · sample data</span>
      </div>
      <div className="topbar-right">
        <span className="you-chip">You: {role ?? "signed out"}</span>
        <label htmlFor="switch-role" className="btn ghost small">Switch role</label>
        <select id="switch-role" className="switch-select" value={data?.currentUserId ?? ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">— signed out —</option>
          {data?.users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.hint}
            </option>
          ))}
        </select>
        {me && (
          <>
            <span className="topbar-divider" aria-hidden />
            <span className="account" title={me.email}>
              <span className="avatar" aria-hidden>
                <Persona kind={roleKey ? PERSONA_FOR_ROLE[roleKey] : "fox"} scale={0.42} />
              </span>
              {me.name}
            </span>
          </>
        )}
        <Link href="/dev/outbox" className="btn ghost small" title="Notification emails (demo)">Outbox</Link>
        <button className="btn ghost small" type="button" onClick={onReset} title="Reseed sample data">
          Reset demo
        </button>
      </div>
    </header>
  );
}
