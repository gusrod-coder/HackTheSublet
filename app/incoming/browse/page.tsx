"use client";
/**
 * Sublets ranked by household fit. LANE: h2. Spec: §3 Browse, §5, §8.2–8.4. Figma: "04 Incoming · Browse" (7:104).
 * Gate §2.2: PROFILE_INCOMPLETE sends you back to finish your profile; the server enforces it.
 */
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DESTINATIONS, QUESTIONS, type IncomingProfileBody, type IncomingProfileResponse, type MatchesResponse } from "@/lib/types";
import { BUDGET_OPTIONS, SampleBadge, formatRent } from "@/components/shared/ui";
import { FitPill, Icon, StepDots, dateRange, roomLabel, styles as s } from "@/components/incoming/ui";
import { BrowseHelp } from "@/components/incoming/BrowseHelp";
import { useLiveFit } from "@/components/leaver/use-live-fit";
import p from "./page.module.css";

const ListingMap = dynamic(() => import("@/components/shared/ListingMap"), { ssr: false });

type Ranked = MatchesResponse["ranked"][number];

export default function Page() {
  const router = useRouter();
  const matches = useLiveFit();
  const profile = useApi(() => api.incoming.profile(), []);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    if (matches.error?.code === "PROFILE_INCOMPLETE") router.replace("/incoming?gate=profile");
  }, [matches.error, router]);

  const ranked = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = (matches.data?.ranked ?? []).map((r, i) => ({ ...r, rank: i + 1 }));
    return q ? all.filter((r) => `${r.listing.name} ${r.listing.address} ${r.listing.area}`.toLowerCase().includes(q)) : all;
  }, [matches.data, query]);

  const prof = profile.data;
  const dest = DESTINATIONS.find((d) => d.key === prof?.destination);

  return (
    <>
      <div className={s.blob} style={{ width: 320, height: 320, left: "calc(50% - 760px)", top: 640, background: "var(--peach)", opacity: 0.6 }} />
      <div className={s.page}>
        <StepDots step={3} />
        <div className={p.head}>
          <div className={p.headText}>
            <h1 className={s.display}>Sublets ranked by household fit</h1>
            <p className={s.lead}>
              {prof?.startDate && prof.endDate ? `${dateRange(prof.startDate, prof.endDate)} · ` : ""}
              {dest ? `${dest.label} · ` : ""}a house’s fit is set by its weakest match, since you live with everyone.
            </p>
            <p className={`${s.caption} ${s.muted} ${p.tight}`}>Fits update automatically when household habits change.</p>
          </div>
          <label className={p.search}>
            <input type="search" placeholder="Search a street or area" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>

        {matches.loading && !matches.data && <p className={s.muted}>Ranking households…</p>}
        {matches.error?.code === "PROFILE_INCOMPLETE" && (
          <p className={s.notice}>Finish your profile first: fit scores stay hidden until you’ve answered everything.</p>
        )}
        {matches.error && matches.error.code !== "PROFILE_INCOMPLETE" && <p className={s.noticeWarn} role="alert">{matches.error.message}{matches.data ? " Showing the last results; we will retry automatically." : ""}</p>}
        <div className={p.liveStatus} role="status" aria-live="polite" aria-atomic="true">
          {ranked.filter(({ listing }) => matches.changes.has(listing.id)).map(({ listing }) => {
            const change = matches.changes.get(listing.id)!;
            return `${listing.name}: fit updated from ${change.from} to ${change.to}.`;
          }).join(" ")}
        </div>

        {matches.data && (
          <div className={p.layout}>
            <div className={p.list}>
              <BrowseHelp
                matches={matches.data}
                shownCount={ranked.length}
                query={query}
                onClearQuery={() => setQuery("")}
                profile={prof ?? null}
                onSaved={() => { void matches.reload(); void profile.reload(); }}
              />
              {ranked.map((r) => (
                <ListingCard key={r.listing.id} r={r} top={r.rank === 1} onHover={setHover} change={matches.changes.get(r.listing.id)} />
              ))}

              {matches.data.unreleased.length > 0 && (
                <div className={s.notice}>
                  <Icon name="lock" />
                  <span>
                    {matches.data.unreleased.length === 1
                      ? `1 more house (${matches.data.unreleased[0].name}) isn’t released yet. It shows up once every roommate who stays has answered.`
                      : `${matches.data.unreleased.length} more houses (${matches.data.unreleased.map((u) => u.name).join(", ")}) aren’t released yet. Each shows up once every roommate who stays has answered.`}
                  </span>
                </div>
              )}

              {matches.data.excluded.length > 0 && (
                <details className={p.excluded}>
                  <summary>
                    <span className={s.label}>
                      {matches.data.excluded.length} {matches.data.excluded.length === 1 ? "house" : "houses"} hidden by your deal-breakers or budget
                    </span>
                    <svg className={p.exCaret} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </summary>
                  <p className={`${s.caption} ${s.muted}`}>
                    These aren’t ranked, but you can still look. Change your deal-breakers or budget in <strong>Try a change</strong> to bring them back.
                  </p>
                  <ul className={p.exList}>
                    {matches.data.excluded.map((x) => (
                      <li key={x.listingId} className={p.exItem}>
                        <div>
                          <p className={s.headingS}>{x.name}</p>
                          <p className={`${s.caption} ${s.muted}`}>{x.address}</p>
                          <p className={`${s.caption} ${p.exWhy}`}>Hidden because: {x.reasons.join(", ").toLowerCase()}</p>
                        </div>
                        <Link href={`/incoming/listings/${x.listingId}`} className={`${s.btnSecondary} ${p.view}`}>View household</Link>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>

            <aside className={p.side}>
              <div className={`${s.cardInk} ${p.map}`}>
                <ListingMap
                  pins={ranked.map((r) => ({ id: r.listing.id, lat: r.listing.lat, lng: r.listing.lng, label: `${r.rank}. ${r.listing.name}`, rank: r.rank }))}
                  highlightId={hover}
                  destination={prof?.destination ?? null}
                  onPinClick={(id) => router.push(`/incoming/listings/${id}`)}
                  height={500}
                />
                <span className={p.mapCaption}>pins numbered by fit rank</span>
              </div>
              {prof && <TryAChange profile={prof} onSaved={() => { void matches.reload(); void profile.reload(); }} />}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}

function ListingCard({ r, top, onHover, change }: { r: Ranked & { rank: number }; top: boolean; onHover: (id: string | null) => void; change?: { from: number; to: number } }) {
  const { listing: l, fit } = r;
  const single = fit.perStayer.length === 1;
  return (
    <article
      className={`${top ? s.cardInk : s.cardSoft} ${p.card} ${change ? p.changed : ""}`}
      onMouseEnter={() => onHover(l.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className={p.cardHead}>
        <div className={p.cardTitle}>
          <span className={p.rank}>{r.rank}</span>
          <h2 className={s.headingM}>{l.name}</h2>
          <FitPill label={fit.label} score={fit.householdScore} />
          {change && <span className={p.fitUpdate} aria-hidden="true">Fit updated: {change.from} → {change.to}</span>}
        </div>
        <Link href={`/incoming/listings/${l.id}`} className={`${s.btnSecondary} ${p.view}`}>View household</Link>
      </div>
      <p className={`${s.body} ${s.muted} ${p.tight} ${p.areaRow}`}>
        <span>{l.area} · {r.distance.label}</span>
        <SampleBadge show={l.isSample} />
      </p>
      <p className={`${p.meta} ${p.tight}`}>
        {l.rent != null && <><strong>{formatRent(l.rent)}</strong> · </>}{roomLabel(l.roomType)}{l.furnished ? ", furnished" : ""} · {dateRange(l.startDate, l.endDate)} ·{" "}
        <span className={fit.uncoveredNights === 0 ? p.covers : fit.withinFlex ? p.uncovered : p.outside}>{fit.coverage}</span>
        {r.request && <span className={p.reqTag}>Request {r.request.status}</span>}
      </p>
      <p className={`${s.label} ${p.tight}`}>
        {single
          ? `Your fit with ${fit.perStayer[0].stayer.name}: ${fit.householdScore} (the only roommate staying)`
          : `Your fit with ${fit.limitingStayer?.name}: ${fit.householdScore} (lowest of ${fit.perStayer.length} roommates, average ${fit.average})`}
      </p>
      <div className={p.boxes}>
        <div className={p.match}>
          <span className={p.boxTitle}><Icon name="heart" size={16} /> where you match</span>
          {fit.matches.length ? fit.matches.map((m) => <span key={m}>{m}</span>) : <span>No exact matches on what matters to you</span>}
        </div>
        <div className={p.differ}>
          <span className={p.boxTitle}><Icon name="bolt" size={16} /> where you differ</span>
          {fit.mismatches.length ? fit.mismatches.map((m) => <span key={m}>{m}</span>) : <span>Same answers on everything that matters to you</span>}
        </div>
      </div>
    </article>
  );
}

/** Demo quick-edit (spec §8.2–8.4): change one habit, one priority, one deal-breaker or the budget and watch the ranking move. */
function TryAChange({ profile, onSaved }: { profile: IncomingProfileResponse; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const guests = QUESTIONS.find((q) => q.key === "guests")!;
  const bedtime = QUESTIONS.find((q) => q.key === "bedtime")!;
  const save = async (b: IncomingProfileBody) => {
    setBusy(true);
    setProblem(null);
    try {
      await api.incoming.saveProfile(b);
      onSaved();
    } catch (e) {
      setProblem(e instanceof ApiClientError ? e.message : "Couldn’t save that change. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const pets = profile.dealBreakers.includes("pets");
  return (
    <details className={`${s.cardSoft} ${p.tryCard}`}>
      <summary className={s.headingS}>Try a change</summary>
      <p className={`${s.caption} ${s.muted}`}>Saved to your profile. The ranking updates right away.</p>
      <div className={p.tryRow}>
        <span className={s.caption}>{guests.question}</span>
        <div className={s.choices}>
          {guests.options.map((o, i) => (
            <button key={o} type="button" className={s.choice} disabled={busy} aria-pressed={profile.answers[guests.index] === i}
              onClick={() => save({ answers: profile.answers.map((a, j) => (j === guests.index ? i : a)) })}>{o}</button>
          ))}
        </div>
      </div>
      <div className={p.tryRow}>
        <span className={s.caption}>How much bedtime matters</span>
        <div className={s.choices}>
          {([[3, "A lot"], [1, "Some"], [0, "Not at all"]] as const).map(([w, label]) => (
            <button key={w} type="button" className={s.choice} disabled={busy} aria-pressed={profile.weights[bedtime.index] === w}
              onClick={() => save({ weights: profile.weights.map((x, j) => (j === bedtime.index ? w : x)) })}>{label}</button>
          ))}
        </div>
      </div>
      <div className={p.tryRow}>
        <span className={s.caption}>Deal-breaker</span>
        <div className={s.choices}>
          <button type="button" className={s.choice} disabled={busy} aria-pressed={pets}
            onClick={() => save({ dealBreakers: pets ? profile.dealBreakers.filter((d) => d !== "pets") : [...profile.dealBreakers, "pets"] })}>
            Pets
          </button>
        </div>
      </div>
      <div className={p.tryRow}>
        <span className={s.caption}>Monthly budget</span>
        <div className={s.choices}>
          {BUDGET_OPTIONS.map((b) => (
            <button key={b.label} type="button" className={s.choice} disabled={busy} aria-pressed={profile.maxRent === b.value}
              onClick={() => save({ maxRent: b.value })}>{b.label}</button>
          ))}
        </div>
      </div>
      {problem && <p className={s.noticeWarn} role="alert">{problem}</p>}
      <Link href="/incoming/habits" className={s.caption}>Edit all answers →</Link>
    </details>
  );
}
