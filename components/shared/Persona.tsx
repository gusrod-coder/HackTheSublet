/**
 * Role mascots from the Figma "Personas" component (4:58): leaver = red dino, stayer = green capybara,
 * incoming = blue fox. Coloured art, no card: screens that want a card behind the persona add it themselves.
 * OWNER: h1.
 *
 *   <Persona kind="fox" />                       88×120
 *   <Persona kind={PERSONA_FOR_ROLE.stayer} tilt={-4} scale={0.6} />
 */
import type { CSSProperties } from "react";
import type { Role } from "@/lib/types";
import personasPng from "./assets/personas.png";
import s from "./Persona.module.css";

type Art = { box: CSSProperties; img: CSSProperties };
// Figma offsets: art box inside the 88×120 frame, sprite position inside the art box.
const PERSONAS: Record<"fox" | "capybara" | "dino", Art> = {
  fox: { box: { left: 8, top: 0, width: 72, height: 120 }, img: { height: "158.05%", left: "-157.72%", top: "-22.44%", width: "395.12%" } },
  capybara: { box: { left: 5, top: 0, width: 79, height: 120 }, img: { height: "177.05%", left: "-284.17%", top: "-33.88%", width: "405%" } },
  dino: { box: { left: 0, top: 13, width: 88, height: 107 }, img: { height: "181.77%", left: "-16.46%", top: "-36.98%", width: "330.59%" } },
};

export type PersonaKind = keyof typeof PERSONAS;
export const PERSONA_FOR_ROLE: Record<Role, PersonaKind> = { leaver: "dino", stayer: "capybara", incoming: "fox" };

export function Persona({ kind, tilt = 0, scale = 1, label }: { kind: PersonaKind; tilt?: number; scale?: number; label?: string }) {
  const p = PERSONAS[kind];
  const transform = [tilt && `rotate(${tilt}deg)`, scale !== 1 && `scale(${scale})`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={s.persona} style={{ transform }} role="img" aria-label={label ?? kind}>
      <div className={s.art} style={p.box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={personasPng.src} style={p.img} />
      </div>
    </div>
  );
}
