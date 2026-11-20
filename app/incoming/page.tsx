"use client";
/**
 * Stay setup. LANE: h2. Spec: §3 Incoming, §7. Figma: "02 Incoming · Dates" (5:69).
 * Dates + destination save to the profile, then on to the habit questions.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { PriceRange } from "@/components/incoming/PriceRange";
import { DEFAULT_FLEX_DAYS, DESTINATIONS, FLEX_OPTIONS, type Destination, type FlexDays } from "@/lib/types";
import { RangeCalendar } from "@/components/incoming/RangeCalendar";
import { Persona } from "@/components/shared/Persona";
import { Icon, StepDots, longDate, nightsBetween, styles as s } from "@/components/incoming/ui";
import p from "./page.module.css";

export default function Page() {
  const router = useRouter();
  const { data, error, loading } = useApi(() => api.incoming.profile(), []);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [flex, setFlex] = useState<FlexDays>(DEFAULT_FLEX_DAYS);
  const [dest, setDest] = useState<Destination | null>(null);
  const [minRent, setMinRent] = useState<number | null>(null);
  const [maxRent, setMaxRent] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gated, setGated] = useState(false);

  useEffect(() => setGated(new URLSearchParams(window.location.search).get("gate") === "profile"), []);

  useEffect(() => {
    if (!data) return;
    setStart(data.startDate);
    setEnd(data.endDate);
    setDest(data.destination);
    setFlex(data.flexDays);
    setMinRent(data.minRent);
    setMaxRent(data.maxRent);
  }, [data]);

  const ready = Boolean(start && end && dest);

  async function next() {
    if (!start || !end || !dest) return;
    setSaving(true);
    setSaveError(null);
    try {
      await api.incoming.saveProfile({ startDate: start, endDate: end, destination: dest, flexDays: flex, minRent, maxRent });
      router.push("/incoming/habits");
    } catch (e) {
      setSaveError(e instanceof ApiClientError ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <>
      <div className={s.blob} style={{ width: 320, height: 320, left: "calc(50% + 420px)", top: 456, background: "var(--butter)" }} />
      <div className={s.page}>
        <StepDots step={1} />
        <div className={p.intro}>
          <Persona kind="fox" label="You, the incoming fox" />
          <div className={p.introText}>
            <h1 className={s.display}>When and where are you staying?</h1>
            <p className={s.lead}>
              We check which sublets cover your dates and how far they are from where you’ll spend your days.
            </p>
          </div>
        </div>

        {loading && <p className={s.muted}>Loading…</p>}
        {error && error.code !== "PROFILE_INCOMPLETE" && <p className={s.noticeWarn}>{error.message}</p>}

        {gated && !data?.complete && (
          <p className={s.notice}>Finish your profile first: households and fit scores stay hidden until you’ve answered everything.</p>
        )}

        {data?.complete && (
          <div className={s.notice}>
            <Icon name="check" />
            <span>
              Your profile is complete. <Link href="/incoming/browse">See sublets ranked for you →</Link>
            </span>
          </div>
        )}

        <section className={`${s.cardInk} ${p.dates}`}>
          <div className={p.summary}>
            <Icon name="calendar" style={{ color: "var(--ink)" }} />
            {/* Figma "Date range picker" (37:2013): the box you're picking next is highlighted, plus a hint. */}
            <div className={`${p.when} ${!start ? p.whenActive : ""}`}>
              <span className={`${s.caption} ${s.muted}`}>Move in</span>
              <span className={`${s.headingS} ${start ? "" : p.pick}`}>{start ? longDate(start) : "Pick a day"}</span>
            </div>
            <Icon name="arrow-right" style={{ color: "var(--muted)" }} />
            <div className={`${p.when} ${start && !end ? p.whenActive : ""}`}>
              <span className={`${s.caption} ${s.muted}`}>Move out</span>
              <span className={`${s.headingS} ${end ? "" : p.pick}`}>{end ? longDate(end) : "Pick a day"}</span>
            </div>
            {start && end && <span className={p.nights}>{nightsBetween(start, end)} nights</span>}
            <span className={`${s.caption} ${s.muted}`}>
              {!start ? "Tap your move-in day" : !end ? "Now tap your move-out day" : "Tap any day to start over"}
            </span>
          </div>

          <RangeCalendar
            start={start}
            end={end}
            flexDays={flex}
            onChange={(a, b) => {
              setStart(a);
              setEnd(b);
            }}
          />

          <div className={p.flex}>
            <div className={p.flexRow}>
              <h2 className={s.headingS}>How flexible are your dates?</h2>
              <div className={s.choices} role="group" aria-label="Date flexibility">
                {FLEX_OPTIONS.map((f) => (
                  <button key={f.value} type="button" className={s.choice} aria-pressed={flex === f.value} onClick={() => setFlex(f.value)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <p className={`${s.body} ${s.muted}`} style={{ margin: 0 }}>
              Not every sublet starts on your exact day. We’ll still match places that start or end inside your window and tell
              you how many days off they are.
            </p>
          </div>
        </section>

        <section className={`${s.cardInk} ${p.where}`} aria-labelledby="price-h">
          <h2 className={`${s.headingS} ${p.whereTitle}`} id="price-h">Monthly price range</h2>
          <div className={p.budget}>
            <PriceRange min={minRent} max={maxRent} onChange={(lo, hi) => { setMinRent(lo); setMaxRent(hi); }} />
          </div>
        </section>

        <section className={`${s.cardInk} ${p.where}`}>
          <h2 className={`${s.headingS} ${p.whereTitle}`}>Where you’ll spend your days</h2>
          <div className={s.choices} role="group" aria-label="Where you’ll spend your days">
            {DESTINATIONS.map((d) => (
              <button key={d.key} type="button" className={s.choice} aria-pressed={dest === d.key} onClick={() => setDest(d.key)}>
                {d.label}
              </button>
            ))}
          </div>
        </section>

        {saveError && <p className={s.noticeWarn}>{saveError}</p>}

        <div className={p.actions}>
          {!ready && <span className={`${s.caption} ${s.muted}`}>Pick your move-in day, move-out day and where you’ll spend your days.</span>}
          <button type="button" className={s.btn} disabled={!ready || saving} onClick={next}>
            {saving ? "Saving…" : "Next: how you live →"}
          </button>
        </div>
      </div>
    </>
  );
}
