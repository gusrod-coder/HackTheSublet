"use client";
/** Two-month range picker with a flexibility window (Figma "Calendar day" 23:598, Dates card 23:599). LANE: h2. */
import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui";
import c from "./RangeCalendar.module.css";

const DAY = 86_400_000;
const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);
const monthStart = (t: number) => {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
};
const addMonths = (t: number, n: number) => {
  const d = new Date(t);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1);
};

/** Default view: the coming summer (June of this year, or next year once June has passed). */
const nextJune = () => {
  const now = new Date();
  return Date.UTC(now.getUTCMonth() > 5 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(), 5, 1);
};

interface Props {
  start: string | null;
  end: string | null;
  flexDays: number;
  onChange: (start: string | null, end: string | null) => void;
}

export function RangeCalendar({ start, end, flexDays, onChange }: Props) {
  const s = start ? toUtc(start) : null;
  const e = end ? toUtc(end) : null;
  const [left, setLeft] = useState(() => monthStart(s ?? nextJune()));
  const [right, setRight] = useState(() => {
    const r = monthStart(e ?? addMonths(left, 1));
    return r <= left ? addMonths(left, 1) : r;
  });

  // Saved dates arrive after the first render: jump to their months once.
  const synced = useRef(false);
  useEffect(() => {
    if (synced.current || s === null) return;
    synced.current = true;
    const l = monthStart(s);
    const r = e !== null ? monthStart(e) : addMonths(l, 1);
    setLeft(l);
    setRight(r <= l ? addMonths(l, 1) : r);
  }, [s, e]);

  const pick = (t: number) => {
    if (s === null || e !== null) onChange(toIso(t), null);
    else if (t > s) onChange(start, toIso(t));
    else onChange(toIso(t), null);
  };

  const state = (t: number) => {
    if (t === s || t === e) return "selected";
    const near = (x: number | null) => x !== null && Math.abs(t - x) <= flexDays * DAY;
    if (flexDays > 0 && (near(s) || near(e))) return "flex";
    if (s !== null && e !== null && t > s && t < e) return "range";
    return "default";
  };

  const month = (m: number, setM: (t: number) => void, min?: number) => {
    const d = new Date(m);
    const lead = d.getUTCDay();
    const days = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    const prevDays = new Date(m - DAY).getUTCDate();
    return (
      <div className={c.month}>
        <div className={c.nav}>
          <button type="button" className={c.chev} aria-label="Previous month" disabled={min !== undefined && addMonths(m, -1) <= min} onClick={() => setM(addMonths(m, -1))}>
            <Icon name="chevron-left" size={18} />
          </button>
          <span className={c.monthName}>{d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</span>
          <button type="button" className={c.chev} aria-label="Next month" onClick={() => setM(addMonths(m, 1))}>
            <Icon name="chevron-right" size={18} />
          </button>
        </div>
        <div className={c.grid} role="grid">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
            <span key={i} className={c.dow}>{w}</span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`m${i}`} className={`${c.day} ${c.muted}`}>{prevDays - lead + i + 1}</span>
          ))}
          {Array.from({ length: days }, (_, i) => {
            const t = m + i * DAY;
            const st = state(t);
            return (
              <button
                key={i}
                type="button"
                className={`${c.day} ${c[st]}`}
                aria-pressed={st === "selected"}
                aria-label={toIso(t)}
                onClick={() => pick(t)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={c.months}>
      {month(left, (t) => { setLeft(t); if (right <= t) setRight(addMonths(t, 1)); })}
      {month(right, setRight, left)}
      <div className={c.legend}>
        <span className={c.legendRow}><span className={`${c.day} ${c.selected} ${c.mini}`}>1</span>Move in / move out</span>
        <span className={c.legendRow}><span className={`${c.day} ${c.range} ${c.mini}`}>1</span>Your stay</span>
        <span className={c.legendRow}><span className={`${c.day} ${c.flex} ${c.mini}`}>1</span>Flexible window</span>
      </div>
    </div>
  );
}
