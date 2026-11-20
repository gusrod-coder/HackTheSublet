"use client";
/**
 * Browse dead ends, explained with a one-click way out. LANE: h2.
 *  - search matches nothing          -> Clear search
 *  - deal-breakers exclude everything -> turn one off (per active deal-breaker)
 *  - nothing released yet             -> say how many houses are waiting on roommates
 *  - nothing covers your dates (even with your flexibility) -> widen to ±2 weeks / change dates
 * Fixes save to the profile like "Try a change", then the ranking reloads.
 */
import { useState } from "react";
import Link from "next/link";
import { api, ApiClientError } from "@/lib/api-client";
import { DEAL_BREAKERS, FLEX_OPTIONS, type IncomingProfileBody, type IncomingProfileResponse, type MatchesResponse } from "@/lib/types";
import { Icon, styles as s } from "./ui";
import h from "./BrowseHelp.module.css";

interface Props {
  matches: MatchesResponse;
  shownCount: number;
  query: string;
  onClearQuery: () => void;
  profile: IncomingProfileResponse | null;
  onSaved: () => void;
}

export function BrowseHelp({ matches, shownCount, query, onClearQuery, profile, onSaved }: Props) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const save = async (body: IncomingProfileBody) => {
    setBusy(true);
    setProblem(null);
    try {
      await api.incoming.saveProfile(body);
      onSaved();
    } catch (e) {
      setProblem(e instanceof ApiClientError ? e.message : "Couldn’t save that change. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const total = matches.ranked.length;
  const flexLabel = FLEX_OPTIONS.find((f) => f.value === profile?.flexDays)?.label ?? "your window";

  // 1. Search found nothing (but there are houses).
  if (query && shownCount === 0 && total > 0) {
    return (
      <Box tone="soft" title={`No sublets match “${query}”.`}>
        <p className={h.text}>Search looks at the house name, street and area.</p>
        <div className={h.actions}><button type="button" className="btn secondary" onClick={onClearQuery}>Clear search</button></div>
      </Box>
    );
  }

  // 2. Nothing ranked at all.
  if (total === 0) {
    const active = DEAL_BREAKERS.filter((d) => profile?.dealBreakers.includes(d.key));
    if (matches.excluded.length > 0 && active.length > 0) {
      return (
        <Box tone="warn" title="Your deal-breakers rule out every house that’s live right now.">
          <p className={h.text}>
            {matches.excluded.length} {matches.excluded.length === 1 ? "house is" : "houses are"} left out (listed below with the reason).
            Turning one deal-breaker off brings back the houses it excluded, ranked by fit.
          </p>
          <div className={h.actions}>
            {active.map((d) => (
              <button key={d.key} type="button" className="btn secondary" disabled={busy || !profile}
                onClick={() => profile && save({ dealBreakers: profile.dealBreakers.filter((k) => k !== d.key) })}>
                Turn off “{d.label}”
              </button>
            ))}
          </div>
          {problem && <p className={s.noticeWarn} role="alert">{problem}</p>}
        </Box>
      );
    }
    return (
      <Box tone="soft" title="No houses are live yet.">
        <p className={h.text}>
          {matches.unreleased.length > 0
            ? `${matches.unreleased.length} ${matches.unreleased.length === 1 ? "house is" : "houses are"} waiting on the roommates who stay to answer. Each one appears here as soon as they do.`
            : "A house shows up here once its leaver lists it and every roommate who stays has answered."}
        </p>
      </Box>
    );
  }

  // 3. Houses exist, but none covers the dates, even inside the flexibility window.
  const noneCovers = matches.ranked.every((r) => r.fit.uncoveredNights > 0 && !r.fit.withinFlex);
  if (noneCovers && !query) {
    const canWiden = profile && profile.flexDays < 14;
    return (
      <Box tone="warn" title={`None of these covers your dates, even within ${flexLabel}.`}>
        <p className={h.text}>
          They’re still ranked by household fit, and each card says how many nights it leaves uncovered. Widen your window or
          change your dates to see closer matches first.
        </p>
        <div className={h.actions}>
          {canWiden && (
            <button type="button" className="btn secondary" disabled={busy} onClick={() => save({ flexDays: 14 })}>
              Widen to ±2 weeks
            </button>
          )}
          <Link href="/incoming" className="btn ghost">Change my dates</Link>
        </div>
        {problem && <p className={s.noticeWarn} role="alert">{problem}</p>}
      </Box>
    );
  }
  return null;
}

function Box({ tone, title, children }: { tone: "soft" | "warn"; title: string; children: React.ReactNode }) {
  return (
    <section className={`${h.box} ${tone === "warn" ? h.warn : ""}`} role="status">
      <Icon name={tone === "warn" ? "bolt" : "search"} />
      <div className={h.body}>
        <h2 className={h.title}>{title}</h2>
        {children}
      </div>
    </section>
  );
}
