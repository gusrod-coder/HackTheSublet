"use client";
/**
 * Household. LANE: h2. Spec: §3 Household page, §5. Figma: "05 Incoming · Household" (7:262) + "05b … (approved)" (10:139).
 * Gate §2.2/§2.3: the server returns 403 PROFILE_INCOMPLETE until your profile is done; we send you to finish it.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { QUESTIONS, type HouseholdResponse } from "@/lib/types";
import { OutsideAppNotice, SampleBadge } from "@/components/shared/ui";
import { FitPill, Icon, Persona, dateRange, habitSummary, joinNames, personaFor, roomLabel, styles as s } from "@/components/incoming/ui";
import p from "./page.module.css";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, error, loading, reload } = useApi(() => api.incoming.household(id), [id]);

  useEffect(() => {
    if (error?.code === "PROFILE_INCOMPLETE") router.replace("/incoming?gate=profile");
  }, [error, router]);

  return (
    <>
      <div className={s.blob} style={{ width: 360, height: 360, left: "calc(50% + 400px)", top: -40, background: "var(--mint)", opacity: 0.8 }} />
      <div className={s.page}>
        <Link href="/incoming/browse" className={s.btnText} style={{ alignSelf: "flex-start" }}>
          <Icon name="arrow-left" size={16} /> Back to sublets
        </Link>
        {loading && !data && <p className={s.muted}>Loading household…</p>}
        {error?.code === "PROFILE_INCOMPLETE" && <p className={s.notice}>Finish your profile first. Household answers stay hidden until you do.</p>}
        {error?.code === "NOT_FOUND" && (
          <p className={s.noticeWarn}>This household isn’t released yet, or it doesn’t exist. Listings appear once every roommate who stays has answered.</p>
        )}
        {error && !["PROFILE_INCOMPLETE", "NOT_FOUND"].includes(error.code) && <p className={s.noticeWarn}>{error.message}</p>}
        {data && <Household data={data} onRequested={reload} />}
      </div>
    </>
  );
}

function Household({ data, onRequested }: { data: HouseholdResponse; onRequested: () => void }) {
  const { listing: l, fit, stayers } = data;
  const limiting = fit.limitingStayer?.id;
  return (
    <>
      <div className={p.titleRow}>
        <h1 className={s.display}>{l.name}</h1>
        <FitPill label={fit.label} />
        <SampleBadge show={l.isSample} />
      </div>
      <p className={`${s.body} ${s.muted} ${p.sub}`}>
        {l.area} · {data.distance.label} · {roomLabel(l.roomType).toLowerCase()}{l.furnished ? ", furnished" : ""} · {dateRange(l.startDate, l.endDate)} ·{" "}
        {fit.coverage.charAt(0).toLowerCase() + fit.coverage.slice(1)}
      </p>

      {data.excludedReasons.length > 0 && (
        <div className={s.noticeWarn}>
          <Icon name="bolt" />
          <span>This house hits your deal-breakers: {data.excludedReasons.join(", ").toLowerCase()}. It’s left out of your ranking.</span>
        </div>
      )}

      <div className={p.stayers}>
        {stayers.map((st) => {
          const kind = personaFor(st.id);
          return (
            <section key={st.id} className={`${s.cardInk} ${p.stayer}`} style={{ background: kind === "capybara" ? "var(--peach)" : "var(--mint)" }}>
              <Persona kind={kind} />
              <div className={p.stayerText}>
                <span className={`${s.caption} ${s.muted}`}>stays all summer</span>
                <h2 className={s.headingM}>{st.name}</h2>
                <span className={s.caption}>{habitSummary(st.answers)}</span>
                {st.id === limiting && stayers.length > 1 && <span className={p.limits}>sets the house’s fit</span>}
              </div>
              <div className={p.score}>
                <span className={p.scoreNum}>{st.score}</span>
                <span className={`${s.caption} ${s.muted}`}>fit</span>
              </div>
            </section>
          );
        })}
      </div>

      <div className={p.bottom}>
        <section className={`${s.cardSoft} ${p.table}`}>
          <h2 className={s.headingM}>Side by side</h2>
          <p className={`${s.caption} ${s.muted} ${p.tableNote}`}>
            Revealed because you both answered. Highlighted = a big difference on something you said matters.
          </p>
          <div className={p.grid} style={{ gridTemplateColumns: `130px repeat(${stayers.length + 1}, minmax(0, 1fr))` }} role="table">
            <span className={p.th} role="columnheader">Topic</span>
            <span className={p.th} role="columnheader">You</span>
            {stayers.map((st) => <span key={st.id} className={p.th} role="columnheader">{st.name}</span>)}
            {data.table.map((row) => {
              const q = QUESTIONS[row.index];
              return (
                <div key={row.key} className={p.tr} role="row">
                  <span className={p.topic} role="rowheader">{row.short}</span>
                  <span className={`${p.cell} ${p.you}`} role="cell">{q.options[row.you]}</span>
                  {row.stayers.map((c) => (
                    <span key={c.stayerId} role="cell" className={`${p.cell} ${row.mismatchWith.includes(c.stayerId) ? p.diff : ""}`}>
                      {q.options[c.answer]}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </section>

        <aside className={p.aside}>
          <section className={p.talk}>
            <h2 className={`${s.headingS} ${p.talkTitle}`}>Talk about this before you agree</h2>
            {fit.talkAbout.length ? (
              <ul>{fit.talkAbout.map((t) => <li key={t}>{t}</li>)}</ul>
            ) : (
              <p className={p.tight}>No big differences on what you said matters. Still worth a quick hello.</p>
            )}
            {stayers.length > 1 && (
              <p className={`${s.caption} ${p.why}`}>
                The house’s fit is its lowest score ({fit.householdScore}), not the average ({fit.average}): you live with everyone, so
                one hard match matters.
              </p>
            )}
          </section>
          <RequestCard data={data} onRequested={onRequested} />
        </aside>
      </div>
      <OutsideAppNotice />
    </>
  );
}

function RequestCard({ data, onRequested }: { data: HouseholdResponse; onRequested: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const names = joinNames(data.stayers);
  const both = data.stayers.length === 2 ? "both" : data.stayers.length > 2 ? "all" : "";
  const req = data.request;

  async function ask() {
    setBusy(true);
    setProblem(null);
    try {
      await api.incoming.request(data.listing.id);
      router.push("/incoming/requests");
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "ALREADY_REQUESTED") onRequested();
      else if (e instanceof ApiClientError && e.code === "PROFILE_INCOMPLETE") router.push("/incoming?gate=profile");
      else setProblem(e instanceof ApiClientError ? e.message : String(e));
      setBusy(false);
    }
  }

  if (req?.status === "approved") {
    return (
      <section className={`${s.cardInk} ${p.ask} ${p.approved}`}>
        <h2 className={`${s.headingS} ${p.approvedTitle}`}><Icon name="sparkle" /> Approved by everyone who stays</h2>
        <p className={p.tight}>{names} {both} said yes. Next, agree on how the house will work.</p>
        <Link href={`/requests/${req.id}`} className={s.btn}>Continue to terms →</Link>
      </section>
    );
  }
  if (req?.status === "declined") {
    return (
      <section className={`${s.cardInk} ${p.ask}`} style={{ background: "var(--blush)" }}>
        <h2 className={s.headingS}>Not this time</h2>
        <p className={p.tight}>Someone who stays passed, so this request is closed. We don’t share who.</p>
        <Link href="/incoming/browse" className={s.btnSecondary}>Back to sublets</Link>
      </section>
    );
  }
  if (req?.status === "sent") {
    return (
      <section className={`${s.cardInk} ${p.ask}`}>
        <h2 className={s.headingS}>Request sent</h2>
        <p className={p.tight}>Waiting on {names}. Everyone who stays has to say yes.</p>
        <Link href="/incoming/requests" className={s.btnSecondary}>See your requests →</Link>
      </section>
    );
  }
  return (
    <section className={`${s.cardInk} ${p.ask}`}>
      <h2 className={s.headingS}>Ready to ask?</h2>
      <p className={p.tight}>
        {data.stayers.length > 1 ? `${names} ${both} have to say yes.` : `${names} has to say yes.`} {data.listing.leader.name}, who’s
        leaving, can’t approve for them.
      </p>
      {problem && <p className={s.noticeWarn}>{problem}</p>}
      <button type="button" className={s.btn} disabled={busy} onClick={ask}>
        {busy ? "Sending…" : "Request to join this household"}
      </button>
    </section>
  );
}
