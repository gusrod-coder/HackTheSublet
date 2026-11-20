/** Incoming-lane building blocks from the Figma design system (node 4:30). LANE: h2. */
import type { CSSProperties } from "react";
import type { Answers, FitLabel, PublicUser } from "@/lib/types";
import { QUESTIONS } from "@/lib/types";
import s from "./incoming.module.css";

import arrowLeft from "./assets/icon-arrow-left.svg";
import arrowRight from "./assets/icon-arrow-right.svg";
import bell from "./assets/icon-bell.svg";
import bolt from "./assets/icon-bolt.svg";
import calendar from "./assets/icon-calendar.svg";
import check from "./assets/icon-check.svg";
import chevronLeft from "./assets/icon-chevron-left.svg";
import chevronRight from "./assets/icon-chevron-right.svg";
import heart from "./assets/icon-heart.svg";
import lock from "./assets/icon-lock.svg";
import pin from "./assets/icon-pin.svg";
import search from "./assets/icon-search.svg";
import sparkle from "./assets/icon-sparkle.svg";

export { s as styles };

const ICONS = {
  "arrow-left": arrowLeft, "arrow-right": arrowRight, bell, bolt, calendar, check,
  "chevron-left": chevronLeft, "chevron-right": chevronRight, heart, lock, pin, search, sparkle,
};
export type IconName = keyof typeof ICONS;

/** 24px stroke icon; takes the current text color. */
export function Icon({ name, size = 24, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={s.icon}
      style={{ width: size, height: size, ["--icon" as string]: `url(${ICONS[name].src})`, ...style }}
    />
  );
}

const STEP_LABELS = ["your stay", "how you live", "browse", "the household"];

/** "Step N of 4 · …" progress dots. */
export function StepDots({ step }: { step: 1 | 2 | 3 | 4 }) {
  return (
    <div className={s.steps}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`${s.dot} ${i < step ? s.dotDone : ""} ${i === step ? s.dotNow : ""}`} />
      ))}
      <span className={s.stepsLabel}>Step {step} of 4 · {STEP_LABELS[step - 1]}</span>
    </div>
  );
}

/** "96 · Strong fit": the household score (your lowest match with any stayer) and its label, shown the same way everywhere. */
export function FitPill({ label, score }: { label: FitLabel; score?: number }) {
  const cls = label === "Strong fit" ? s.fitStrong : label === "Okay fit" ? s.fitOkay : s.fitWeak;
  return (
    <span className={cls}>
      {score !== undefined && <><strong>{score}</strong>&nbsp;·&nbsp;</>}
      {label}
    </span>
  );
}

// ─── Text helpers ───────────────────────────────────────────────────────────

/** "Priya", "Priya and Mei", "Ana, Priya and Mei" */
export function joinNames(people: Array<Pick<PublicUser, "name">>): string {
  const n = people.map((p) => p.name);
  return n.length <= 1 ? (n[0] ?? "") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`;
}

const parse = (d: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd));
};
/** "Jun 1" */
export const shortDate = (d: string) => parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
/** "Mon, Jun 1" */
export const longDate = (d: string) =>
  parse(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
export const nightsBetween = (a: string, b: string) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
export const dateRange = (a: string, b: string) => `${shortDate(a)} – ${shortDate(b)}`;
export const roomLabel = (t: "private" | "shared") => (t === "private" ? "Private room" : "Shared bedroom");

/** Short habit summary for a stayer card: "before 11pm · none · friendly but separate". */
export function habitSummary(a: Answers): string {
  const q = (k: string) => QUESTIONS.find((x) => x.key === k)!;
  const bed = q("bedtime"), guests = q("guests"), social = q("social");
  const g = a[guests.index];
  return [
    `In bed ${bed.phrases[a[bed.index]]}`,
    g === 0 ? "no guests" : `guests ${guests.phrases[g]} a week`,
    social.phrases[a[social.index]],
  ].join(" · ");
}
