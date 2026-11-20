"use client";
/**
 * Your requests. LANE: h2. Spec: §3 Request status. No dedicated Figma frame: built from the design-system
 * pieces used on 05/05b. Approved → /requests/[id] (terms + contacts, owned by h3).
 */
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import type { IncomingRequestsResponse } from "@/lib/types";
import { OutsideAppNotice, SampleBadge } from "@/components/shared/ui";
import { Icon, StepDots, dateRange, roomLabel, styles as s } from "@/components/incoming/ui";
import { usePoll } from "@/components/incoming/usePoll";
import p from "./page.module.css";

type Req = IncomingRequestsResponse["requests"][number];

export default function Page() {
  const { data, error, loading, reload } = useApi(() => api.incoming.myRequests(), []);
  // Demo step 6: show sent → approved as stayers vote, without a manual reload.
  const waiting = data?.requests.some((r) => r.status === "sent") ?? false;
  usePoll(() => void reload(), 5000, waiting);
  return (
    <div className={s.page}>
      <StepDots step={4} />
      <div className={p.head}>
        <h1 className={s.display}>Your requests</h1>
        <p className={s.lead}>Everyone who stays has to say yes. You’ll see how many have, not who.</p>
        {data && data.requests.length > 0 && (
          <div className={p.refresh}>
            <button type="button" className={s.btnText} disabled={loading} onClick={() => void reload()}>
              {loading ? "Checking…" : "Refresh"}
            </button>
            {waiting && <span className={`${s.caption} ${s.muted}`}>Checking for new votes every few seconds.</span>}
          </div>
        )}
      </div>
      {loading && !data && <p className={s.muted}>Loading…</p>}
      {error && <p className={s.noticeWarn}>{error.message}</p>}
      {data && data.requests.length === 0 && (
        <section className={`${s.cardSoft} ${p.empty}`}>
          <p className={p.tight}>You haven’t asked to join a household yet.</p>
          <Link href="/incoming/browse" className={s.btn}>See sublets ranked for you →</Link>
        </section>
      )}
      {data?.requests.map((r) => <RequestRow key={r.id} r={r} />)}
      {data && data.requests.length > 0 && <OutsideAppNotice />}
    </div>
  );
}

function RequestRow({ r }: { r: Req }) {
  const { approved, total } = r.approvals;
  const tone = r.status === "approved" ? p.approved : r.status === "declined" ? p.declined : "";
  return (
    <article className={`${s.cardInk} ${p.card} ${tone}`}>
      <div className={p.main}>
        <div className={p.titleRow}>
          <h2 className={s.headingM}>{r.listing.name}</h2>
          <StatusPill status={r.status} />
          <SampleBadge show={r.listing.isSample} />
        </div>
        <p className={`${s.caption} ${s.muted} ${p.tight}`}>
          <strong>{r.listing.address}</strong> · {r.listing.area} · {roomLabel(r.listing.roomType)} · {dateRange(r.listing.startDate, r.listing.endDate)}
        </p>
        <div className={p.votes} aria-label={`${approved} of ${total} ${total === 1 ? "roommate" : "roommates"} approved`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`${p.vote} ${i < approved ? p.voteYes : ""}`}>{i < approved && <Icon name="check" size={14} />}</span>
          ))}
          <span className={s.label}>
            {r.status === "declined" ? "Someone who stays passed" : `${approved} of ${total} ${total === 1 ? "roommate" : "roommates"} said yes`}
          </span>
        </div>
      </div>
      <div className={p.action}>
        {r.status === "approved" && <Link href={`/requests/${r.id}`} className={s.btn}>Continue to terms →</Link>}
        {r.status === "sent" && <Link href={`/incoming/listings/${r.listing.id}`} className={s.btnSecondary}>View household</Link>}
        {r.status === "declined" && <Link href="/incoming/browse" className={s.btnSecondary}>Back to sublets</Link>}
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: Req["status"] }) {
  if (status === "approved") return <span className={s.fitStrong}>Approved</span>;
  if (status === "declined") return <span className={s.fitWeak}>Declined</span>;
  return <span className={s.fitOkay}>Sent · waiting</span>;
}
