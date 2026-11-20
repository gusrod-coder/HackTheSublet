/**
 * h3 lane kit: small pieces shared by the leaver, stayer and terms screens (Figma HackTheLease).
 * LANE: h3. If h1 ships shared equivalents (REQ "Port Figma theme"), swap these out.
 */
import type { ReactNode } from "react";
import { Persona as SharedPersona, type PersonaKind } from "@/components/shared/Persona";
import s from "./kit.module.css";
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
// The shared one (h1). "sm" = the 44×60 row avatar from Figma 08: scaled, with its layout box shrunk to match.
export function Persona({ kind, size = "md", tilt }: { kind: PersonaKind; size?: "sm" | "md"; tilt?: number }) {
  if (size === "md") return <SharedPersona kind={kind} tilt={tilt} />;
  return (
    <span className={s.personaSm}>
      <SharedPersona kind={kind} scale={0.5} tilt={tilt} />
    </span>
  );
}

// ─── Icon ───────────────────────────────────────────────────────────────────
// Figma "Icon" set (22:673). Assets are exported pre-coloured for where they appear.
const ICONS = { pin, lock, lockOkay, bell, heart, bolt, sparkle, check } as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 16 }: { name: IconName; size?: 16 | 20 | 24 }) {
  const a = ICONS[name];
  // Each glyph keeps the root size it was exported at (Figma 22:673), centred in the box. It's drawn as a
  // mask filled with currentColor, so it takes the text colour around it (the Figma "recolor by override" rule).
  const url = `url("${a.src}")`;
  return (
    <span className={s.icon} style={{ width: size, height: size }} aria-hidden>
      <span
        className={s.iconGlyph}
        style={{ width: a.width, height: a.height, maskImage: url, WebkitMaskImage: url }}
      />
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
