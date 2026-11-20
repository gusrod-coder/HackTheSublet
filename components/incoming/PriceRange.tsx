"use client";
/**
 * Monthly price range: two handles on one track (min + max). LANE: h2.
 * At the ends the value is "no limit" (null): far left = no minimum, far right = no maximum.
 */
import pr from "./PriceRange.module.css";

export const PRICE_FLOOR = 500;
export const PRICE_CEIL = 1500;
const STEP = 25;
const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

export function priceRangeLabel(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Any price";
  if (min == null) return `Up to ${usd(max!)}`;
  if (max == null) return `${usd(min)} and up`;
  return `${usd(min)} – ${usd(max)}`;
}

export function PriceRange({ min, max, onChange, disabled }: {
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
  disabled?: boolean;
}) {
  const lo = min ?? PRICE_FLOOR;
  const hi = max ?? PRICE_CEIL;
  const pct = (v: number) => ((v - PRICE_FLOOR) / (PRICE_CEIL - PRICE_FLOOR)) * 100;
  const setLo = (v: number) => {
    const n = Math.min(v, hi);
    onChange(n <= PRICE_FLOOR ? null : n, max);
  };
  const setHi = (v: number) => {
    const n = Math.max(v, lo);
    onChange(min, n >= PRICE_CEIL ? null : n);
  };

  return (
    <div className={pr.wrap}>
      <div className={pr.readout} aria-live="polite">
        <span className={pr.value}>{priceRangeLabel(min, max)}</span>
        <span className={pr.unit}>/ month</span>
      </div>
      <div className={pr.track} style={{ ["--lo" as string]: `${pct(lo)}%`, ["--hi" as string]: `${pct(hi)}%` }}>
        <span className={pr.fill} aria-hidden />
        <input
          type="range" min={PRICE_FLOOR} max={PRICE_CEIL} step={STEP} value={lo} disabled={disabled}
          aria-label="Lowest monthly rent" aria-valuetext={min == null ? "No minimum" : usd(lo)}
          className={pr.thumb} onChange={(e) => setLo(Number(e.target.value))}
        />
        <input
          type="range" min={PRICE_FLOOR} max={PRICE_CEIL} step={STEP} value={hi} disabled={disabled}
          aria-label="Highest monthly rent" aria-valuetext={max == null ? "No maximum" : usd(hi)}
          className={pr.thumb} onChange={(e) => setHi(Number(e.target.value))}
        />
      </div>
      <div className={pr.scale} aria-hidden>
        <span>{usd(PRICE_FLOOR)}</span>
        <span>{usd(PRICE_CEIL)}+</span>
      </div>
    </div>
  );
}
