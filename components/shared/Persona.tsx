/**
 * Role mascots from the Figma "Personas" frame (24:1975): leaver = dino, stayer = capybara, incoming = fox.
 * OWNER: h1. Art + sprite offsets ported from h2's components/incoming Persona, now the single source.
 *
 *   <Persona kind="fox" />                       88×120 sticker
 *   <Persona kind={PERSONA_FOR_ROLE.stayer} tilt={-4} scale={0.6} />
 */
import type { Role } from "@/lib/types";
import personasPng from "./assets/personas.png";
import s from "./Persona.module.css";

const PERSONAS = {
  dino: { bg: "var(--mint)", left: "-15.52%", width: "344.83%" },
  capybara: { bg: "var(--peach)", left: "-123.21%", width: "357.14%" },
  fox: { bg: "var(--butter)", left: "-217.24%", width: "344.83%" },
} as const;

export type PersonaKind = keyof typeof PERSONAS;
export const PERSONA_FOR_ROLE: Record<Role, PersonaKind> = { leaver: "dino", stayer: "capybara", incoming: "fox" };

export function Persona({
  kind,
  tilt = 0,
  scale = 1,
  label,
}: {
  kind: PersonaKind;
  tilt?: number;
  scale?: number;
  label?: string;
}) {
  const p = PERSONAS[kind];
  const transform = [tilt && `rotate(${tilt}deg)`, scale !== 1 && `scale(${scale})`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={s.persona} style={{ background: p.bg, transform }} role="img" aria-label={label ?? kind}>
      <div className={s.art}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={personasPng.src} style={{ left: p.left, width: p.width }} />
      </div>
    </div>
  );
}
