"use client";
/** Email outbox: every notification the app sent, live. OWNER: h1. Handy on a second screen during the demo. */
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

const KIND_LABEL: Record<string, string> = {
  invite: "Invite",
  listing_live: "Listing live",
  request_received: "New request",
  request_approved: "Approved",
  request_declined: "Declined",
  contacts_unlocked: "Contacts unlocked",
};
const KIND_TINT: Record<string, string> = {
  invite: "butter",
  listing_live: "mint",
  request_received: "peach",
  request_approved: "mint",
  request_declined: "blush",
  contacts_unlocked: "mint",
};

export default function Outbox() {
  const [to, setTo] = useState("");
  const { data, error, reload } = useApi(() => api.dev.outbox(to || undefined), [to]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") void reload();
    }, 3000);
    return () => clearInterval(t);
  }, [reload]);

  const recipients = Array.from(new Set((data?.emails ?? []).map((e) => e.to)));

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <h1>Email outbox</h1>
          <p className="muted small" style={{ margin: 0 }}>
            Every notification burrow sends: invites, new requests, approvals, contacts unlocked. Updates live.{" "}
            {data?.mode === "smtp"
              ? "SMTP is on: real email goes out too. Sample @example.edu people only get mail if EMAIL_REDIRECT is set (it goes to one team inbox, tagged [to Name])."
              : "Outbox only: no SMTP configured, so nothing leaves this server."}
          </p>
        </div>
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Filter by recipient">
          <option value="">All recipients</option>
          {recipients.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      {error && <p className="notice warn">{error.message}</p>}
      {data && data.emails.length === 0 && (
        <p className="notice info">No emails yet. Invite a stayer, send a request, or approve one and they'll appear here.</p>
      )}
      {data?.emails.map((e) => (
        <article key={e.id} className={`card ${KIND_TINT[e.kind] ?? ""}`} style={{ padding: 16, cursor: "pointer" }} onClick={() => setOpen(open === e.id ? null : e.id)}>
          <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill">{KIND_LABEL[e.kind] ?? e.kind}</span>
              <strong>{e.subject}</strong>
            </div>
            <span className="small muted">
              to {e.toName ? `${e.toName} <${e.to}>` : e.to} · {new Date(e.createdAt).toLocaleTimeString()} ·{" "}
              {e.status === "sent" ? "sent ✓" : e.status === "failed" ? `failed: ${e.error}` : e.status === "skipped" ? `not sent (${e.error})` : "logged"}
            </span>
          </div>
          {open === e.id && (
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font)", margin: "12px 0 0" }}>
              {e.text}
            </pre>
          )}
        </article>
      ))}
    </div>
  );
}
