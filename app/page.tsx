"use client";
/** Entry: role picker (spec §7). OWNER: h1. */
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";

export default function Home() {
  const { data: me } = useApi(() => api.me.get(), []);
  const user = me?.user;

  return (
    <div className="stack">
      <section className="stack">
        <h1>Live with a household that fits.</h1>
        <p className="muted">
          Ann Arbor summer sublets, ranked by how well you fit with every roommate who&apos;s staying, not just the
          person who&apos;s leaving. Every stayer approves before anyone moves in.
        </p>
        <p className="small muted">All listings and people in this demo are sample data.</p>
      </section>

      {!user ? (
        <p className="notice">Pick a demo user from the menu at the top to start.</p>
      ) : (
        <p className="muted">Signed in as <strong>{user.name}</strong>.</p>
      )}

      <div className="grid-2">
        <Link href="/incoming" className="card stack" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>I&apos;m coming to Ann Arbor</h2>
          <p className="muted">Tell us your dates and habits, then compare households.</p>
          {me?.incoming && <span className="small">{me.incoming.complete ? "Profile complete" : "Profile in progress"}</span>}
        </Link>
        <Link href="/stayer" className="card stack" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>I&apos;m staying this summer</h2>
          <p className="muted">Describe your household and approve who joins.</p>
          {me && me.staying.length > 0 && (
            <span className="small">
              {me.staying.map((s) => `${s.address} (${s.inviteStatus})`).join(" · ")}
            </span>
          )}
        </Link>
        <Link href="/leaver" className="card stack" style={{ textDecoration: "none", color: "inherit" }}>
          <h2>I&apos;m leaving for the summer</h2>
          <p className="muted">List your room and invite the roommates who stay.</p>
          {me && me.leading.length > 0 && (
            <span className="small">{me.leading.map((l) => `${l.address} (${l.status})`).join(" · ")}</span>
          )}
        </Link>
      </div>
    </div>
  );
}
