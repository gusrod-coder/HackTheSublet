"use client";
/**
 * Requests to join. LANE: h3. Spec: §3 Stayers, gate §2.4 (unanimous approval; the leaver has no vote).
 * Figma: HackTheLease 10:663 "11 Stayer · Review request" and 10:713 "11b Stayer · Approved".
 */
import { useState } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/components/leaver/use-poll";
import { DESTINATIONS, QUESTIONS, type Decision, type FitLabel, type StayerInboxResponse } from "@/lib/types";
import { SampleBadge, formatDate } from "@/components/shared/ui";
import { Hero, Icon, Page, Persona, Status, cx, kit } from "@/components/leaver/kit";
import s from "./inbox.module.css";

type Req = StayerInboxResponse["requests"][number];

const FIT_CLS: Record<FitLabel, string> = { "Strong fit": kit.chipLeaf, "Okay fit": kit.chipButter, "Weak fit": kit.chipBlush };
const names = (n: string[]) => (n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);
const subtitle = (r: Req) => {
  const destination = DESTINATIONS.find((d) => d.key === r.incoming.destination)?.label;
  return `${r.incoming.name} · ${formatDate(r.incoming.startDate)} – ${formatDate(r.incoming.endDate)}${destination ? ` · days at ${destination}` : ""}`;
};

function RequestCaption({ r, viewerName }: { r: Req; viewerName?: string }) {
  return (
    <div className={kit.row}>
      <span className={cx(kit.caption, kit.muted)}>{viewerName ? `viewing as ${viewerName} · ` : ""}{r.listing.name}</span>
      <SampleBadge show={r.listing.isSample} />
    </div>
  );
}

export default function StayerInboxPage() {
  const inbox = useApi(() => api.stayer.inbox(), []);
  usePoll(inbox.reload, !!inbox.data?.requests.some((request) => request.status === "sent"));
  const me = useApi(() => api.me.get(), []);
  const myId = me.data?.user?.id;
  const requests = inbox.data?.requests ?? [];
  const single = requests.length === 1 ? requests[0] : null;

  return (
    <Page>
      <Status
        loading={inbox.loading && !inbox.data}
        error={inbox.error?.code === "NO_SESSION" ? { code: "", message: "Pick a demo user in the top bar first." } : inbox.error}
      />
      {inbox.data && (
        <>
          {single ? <RequestCaption r={single} viewerName={me.data?.user?.name} /> : me.data?.user && (
            <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>viewing as {me.data.user.name}</p>
          )}
          <Hero
            persona={single ? "fox" : requests.length === 0 ? "capybara" : undefined}
            title={single
              ? single.status === "sent" ? "Someone wants to join your household" : single.status === "approved" ? `${single.incoming.name}'s request is approved` : "Request closed"
              : requests.length ? "Requests to join your household" : "No requests yet"}
            lede={single ? subtitle(single) : requests.length
              ? "Review each student's habits and fit with everyone who's staying. Every roommate gets a say."
              : "When an incoming student asks to join your household, you'll review them here. Nobody moves in without your yes."}
          />
          {requests.length === 0 && <Link href="/stayer" className={cx(kit.btn, kit.btnSecondary)}>Back to your invites</Link>}
        </>
      )}
      {requests.map((r) => (
        <RequestCard key={r.id} r={r} myId={myId} single={!!single} onChange={inbox.reload} />
      ))}
    </Page>
  );
}

function RequestCard({ r, myId, single, onChange }: { r: Req; myId?: string; single: boolean; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await fn();
      await onChange();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "REQUEST_CLOSED") await onChange();
      setErr(e instanceof ApiClientError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  const decide = (decision: Decision) => act(() => api.stayer.decide(r.id, { decision }));

  const others = r.approvals.filter((a) => a.stayer.id !== myId);
  const waitingOn = others.filter((a) => a.decision !== "approve").map((a) => a.stayer.name);
  const perStayer = [...r.fit.perStayer].sort((a, b) => Number(b.stayer.id === myId) - Number(a.stayer.id === myId));

  return (
    <section className={kit.col} style={{ gap: 24 }} aria-labelledby={single ? undefined : `request-${r.id}`} aria-label={single ? `${r.incoming.name}'s request` : undefined}>
      {!single && <>
        <RequestCaption r={r} />
        <div className={kit.hero}>
          <Persona kind="fox" />
          <div className={kit.heroText}>
            <h2 id={`request-${r.id}`} className={kit.headingM}>
              {r.status === "sent" ? `${r.incoming.name} wants to join` : r.status === "approved" ? `${r.incoming.name}'s request is approved` : `${r.incoming.name}'s request is closed`}
            </h2>
            <p className={kit.lede}>{subtitle(r)}</p>
          </div>
        </div>
      </>}

      <div className={kit.split}>
        {/* Household fit */}
        <div className={cx(kit.sticker, kit.col, s.fitCard)}>
          <div className={kit.row}>
            <h2 className={kit.headingM}>Household fit</h2>
            <span className={cx(kit.chip, kit.fit, FIT_CLS[r.fit.label])} title={`Household fit ${r.fit.householdScore}/100`} aria-label={`${r.fit.label}, household fit ${r.fit.householdScore} out of 100`}>
              {r.fit.label}
            </span>
          </div>
          {perStayer.map((p) => (
            <div key={p.stayer.id} className={s.scoreRow}>
              <span>
                Fit with {p.stayer.name}
                {p.stayer.id === myId ? " (you)" : ""}
              </span>
              <span className={cx(kit.headingS, s.score)}>{p.score}</span>
            </div>
          ))}
          <div className={s.lines}>
            <div className={cx(s.lineBox, s.match)}>
              <span className={cx(kit.label, s.lineHead)}>
                <Icon name="heart" /> where you match
              </span>
              {r.fit.matches.length ? r.fit.matches.map((m) => <p key={m} className={kit.caption}>{m}</p>) : <p className={kit.caption}>Nothing stands out.</p>}
            </div>
            <div className={cx(s.lineBox, s.differ)}>
              <span className={cx(kit.label, s.lineHead)}>
                <Icon name="bolt" /> where you differ
              </span>
              {r.fit.mismatches.length ? r.fit.mismatches.map((m) => <p key={m} className={kit.caption}>{m}</p>) : <p className={kit.caption}>Same answers on everything they said matters.</p>}
            </div>
          </div>
          {r.fit.talkAbout.length > 0 && <p className={cx(kit.caption, kit.muted)}>{r.fit.talkAbout.join(" · ")}</p>}
          <details className={s.answers}>
            <summary className={kit.label}>{r.incoming.name}'s answers</summary>
            <dl>
              {QUESTIONS.map((q) => (
                <div key={q.key} className={s.answerRow}>
                  <dt className={kit.muted}>{q.short}</dt>
                  <dd>{q.options[r.incoming.answers[q.index]] ?? "–"}</dd>
                </div>
              ))}
            </dl>
          </details>
        </div>

        {/* Your call */}
        <div className={cx(kit.soft, kit.col, (r.myDecision === "approve" || r.status === "approved") && kit.tintSky)}>
          <h2 className={kit.headingM}>Your call</h2>
          <p className={kit.muted} style={{ margin: 0 }}>
            {r.listing.leader.name}, who's leaving, can't approve this for you. Every roommate who stays has to say yes.
          </p>

          {r.sharedPhone && (
            <div className={cx(kit.notice, kit.noticeSky)}>
              <Icon name="bell" size={20} />
              <span>
                {r.incoming.name} shared a phone number so you can talk before deciding:{" "}
                <a href={`tel:${r.sharedPhone.replace(/[^\d+]/g, "")}`} style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{r.sharedPhone}</a>
              </span>
            </div>
          )}

          {r.status === "approved" ? (
            <>
              <span className={cx(kit.headingS, s.approved)}>
                <Icon name="sparkle" size={24} /> Everyone said yes
              </span>
              <p style={{ margin: 0 }}>Next, you all agree on house terms. Then contacts are shared.</p>
              <Link href={`/requests/${r.id}`} className={kit.btn}>Agree on house terms →</Link>
            </>
          ) : r.status === "declined" ? (
            <p className={cx(kit.notice, kit.noticeBlush)} style={{ margin: 0 }}>
              {r.myDecision === "pass" ? "You passed." : "A roommate passed."} This request is closed. Individual votes aren't shown to {r.incoming.name}.
            </p>
          ) : r.myDecision === "approve" ? (
            <>
              <span className={cx(kit.headingS, s.approved)}>
                <Icon name="sparkle" size={24} /> You approved
              </span>
              <p style={{ margin: 0 }}>
                {waitingOn.length ? `Waiting on ${names(waitingOn)}. If ${waitingOn.length === 1 ? "they say" : "they all say"} yes too, you'll agree on house terms next.` : "Waiting on the others."}
              </p>
              <button type="button" className={cx(kit.btn, kit.btnGhost)} disabled={busy} onClick={() => act(() => api.stayer.undoDecision(r.id))}>
                Undo
              </button>
            </>
          ) : (
            <>
              <button type="button" className={kit.btn} disabled={busy} onClick={() => decide("approve")}>
                Approve ✓
              </button>
              <button type="button" className={cx(kit.btn, kit.btnSecondary)} disabled={busy} onClick={() => decide("pass")}>
                Pass
              </button>
              <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>
                Passing closes the request for the whole house.
              </p>
            </>
          )}
          {err && <p className={cx(kit.notice, kit.noticeBlush)} role="alert">{err}</p>}
        </div>
      </div>
    </section>
  );
}
