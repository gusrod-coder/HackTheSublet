/**
 * Role mascots: leaver = dino, stayer = capybara, incoming = fox (Figma "Personas", frame 24:1975).
 * OWNER: h1. PLACEHOLDER ART (emoji) until the Figma SVGs are exported to public/personas/<kind>.svg;
 * once those files exist, set HAS_ART = true and every screen picks them up.
 */
import type { Role } from "@/lib/types";

export type PersonaKind = "dino" | "capybara" | "fox";
export const PERSONA_FOR_ROLE: Record<Role, PersonaKind> = { leaver: "dino", stayer: "capybara", incoming: "fox" };

const HAS_ART = false;
const EMOJI: Record<PersonaKind, string> = { dino: "🦖", capybara: "🦫", fox: "🦊" };
const BG: Record<PersonaKind, string> = { dino: "var(--blush)", capybara: "var(--leaf)", fox: "var(--sky)" };

export function Persona({ kind, size = 48, label }: { kind: PersonaKind; size?: number; label?: string }) {
  const style = {
    width: size,
    height: size,
    borderRadius: "var(--radius-md)",
    border: "var(--border)",
    background: BG[kind],
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.55,
    flexShrink: 0,
  } as const;
  return (
    <span style={style} role="img" aria-label={label ?? kind}>
      {HAS_ART ? <img src={`/personas/${kind}.svg`} alt="" width={size * 0.8} height={size * 0.8} /> : EMOJI[kind]}
    </span>
  );
}
