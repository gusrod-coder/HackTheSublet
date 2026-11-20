"use client";
/**
 * Figma header (5:70): logo tile + "burrow" + "prototype · sample data" pill | "You: <role>" chip,
 * Switch role, divider, account (persona avatar + name). "Switch role" is the demo user switcher;
 * Outbox + Reset demo are demo-only extras not in Figma. OWNER: h1.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { Persona, PERSONA_FOR_ROLE } from "./Persona";
import burrowIcon from "./assets/burrow-icon.png";
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
          {/* Figma "Logo / Burrow icon" (55:2015): the fox peeking out of its burrow. */}
          <span className="brand-tile" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={burrowIcon.src} alt="" />
          </span>
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
              {/* Head-and-shoulders crop: each persona is shifted so its head sits in the middle of the circle. */}
              <span className="avatar" data-kind={roleKey ? PERSONA_FOR_ROLE[roleKey] : "fox"} aria-hidden>
                <Persona kind={roleKey ? PERSONA_FOR_ROLE[roleKey] : "fox"} scale={0.5} />
              </span>
              {me.name}
            </span>
          </>
        )}
        <SettingsToggle onReset={onReset} />
      </div>
    </header>
  );
}

/** Gear button that opens a small floating panel of demo tools. Closes on outside click or Escape. */
function SettingsToggle({ onReset }: { onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="settings" ref={ref}>
      <button
        type="button"
        className="settings-btn"
        aria-label="Settings"
        aria-expanded={open}
        aria-controls="settings-panel"
        title="Settings"
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      </button>
      {open && (
        <div id="settings-panel" className="settings-panel" role="menu">
          <p className="settings-title">Demo settings</p>
          <Link href="/dev/outbox" className="settings-item" role="menuitem">Email outbox</Link>
          <button type="button" className="settings-item" role="menuitem" onClick={() => { setOpen(false); onReset(); }}>
            Reset demo
          </button>
        </div>
      )}
    </div>
  );
}
