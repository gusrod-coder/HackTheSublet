/**
 * h3 lane kit: small pieces shared by the leaver, stayer and terms screens (Figma HackTheLease).
 * LANE: h3. If h1 ships shared equivalents (REQ "Port Figma theme"), swap these out.
 */
import type { ReactNode } from "react";
import s from "./kit.module.css";
import sprite from "./assets/persona-sprite.png";
import pin from "./assets/icon-pin.svg";
import lock from "./assets/icon-lock.svg";
import lockOkay from "./assets/icon-lock-okay.svg";
import bell from "./assets/icon-bell.svg";
import heart from "./assets/icon-heart.svg";
import bolt from "./assets/icon-bolt.svg";
import sparkle from "./assets/icon-sparkle.svg";
import check from "./assets/icon-check.svg";

export { s as kit };

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

// ─── Persona ────────────────────────────────────────────────────────────────
// Figma "Persona" (4:52 / 4:54 / 4:56). One sprite, cropped per character.
// Art box is % of the 88×120 card; img offsets are % of the art box, straight from Figma.
type PersonaKind = "dino" | "capybara" | "fox";
const PERSONAS: Record<PersonaKind, { bg: string; art: [number, number, number, number]; img: [number, number, number, number] }> = {
  //             art: left, top, width, height (px on 88×120)   img: left, top, width, height (%)
  dino: { bg: "var(--hf-blush)", art: [2, 12, 80, 97], img: [-16.46, -36.98, 330.59, 181.77] },
  capybara: { bg: "var(--hf-leaf)", art: [6, 5, 72, 110], img: [-284.17, -33.88, 405, 177.05] },
  fox: { bg: "var(--hf-sky)", art: [9, 5, 66, 110], img: [-157.72, -22.44, 395.12, 158.05] },
};

export function Persona({ kind, size = "md", className }: { kind: PersonaKind; size?: "sm" | "md"; className?: string }) {
  const p = PERSONAS[kind];
  const w = size === "sm" ? 44 : 88;
  const h = size === "sm" ? 60 : 120;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  return (
    <div className={cx(s.persona, size === "sm" && s.personaSm, className)} style={{ width: w, height: h, background: p.bg }} aria-hidden>
      <div
        className={s.personaArt}
        style={{ left: pct(p.art[0], 88), top: pct(p.art[1], 120), width: pct(p.art[2], 88), height: pct(p.art[3], 120) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={sprite.src} alt="" style={{ left: `${p.img[0]}%`, top: `${p.img[1]}%`, width: `${p.img[2]}%`, height: `${p.img[3]}%` }} />
      </div>
    </div>
  );
}

// ─── Icon ───────────────────────────────────────────────────────────────────
// Figma "Icon" set (22:673). Assets are exported pre-coloured for where they appear.
const ICONS = { pin, lock, lockOkay, bell, heart, bolt, sparkle, check } as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16 }: { name: IconName; size?: 16 | 20 | 24 }) {
  const a = ICONS[name];
  // Each glyph was exported at the size it's used in Figma; keep its root dimensions, centre it in the box.
  return (
    <span className={s.icon} style={{ width: size, height: size }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={a.src} alt="" width={a.width} height={a.height} />
    </span>
  );
}

// ─── Step dots ("Step 1 of 2 · your listing") ──────────────────────────────
export function StepDots({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className={s.steps}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={cx(s.dot, i < step - 1 && s.dotDone, i === step - 1 && s.dotCurrent)} />
      ))}
      <span className={s.caption}>
        Step {step} of {total} · {label}
      </span>
    </div>
  );
}

// ─── Page shell + hero ──────────────────────────────────────────────────────
export function Page({ children, warmTop }: { children: ReactNode; warmTop?: boolean }) {
  return <div className={cx(s.page, warmTop && s.warmTop)}>{children}</div>;
}

export function Hero({ persona, title, lede }: { persona?: PersonaKind; title: ReactNode; lede?: ReactNode }) {
  return (
    <div className={s.hero}>
      {persona && <Persona kind={persona} />}
      <div className={s.heroText}>
        <h1 className={s.display}>{title}</h1>
        {lede && <p className={s.lede}>{lede}</p>}
      </div>
    </div>
  );
}

/** Loading / API error line, kept consistent across h3 screens. */
export function Status({ loading, error }: { loading?: boolean; error?: { code: string; message: string } | null }) {
  if (error)
    return (
      <p className={cx(s.notice, s.noticeBlush)} role="alert">
        {error.message}
      </p>
    );
  if (loading) return <p className={s.muted}>Loading…</p>;
  return null;
}
