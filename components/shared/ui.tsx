/** Small shared display pieces. OWNER: h1. */
import type { FitLabel } from "@/lib/types";

export function FitBadge({ score, label }: { score: number; label: FitLabel }) {
  const cls = label === "Strong fit" ? "strong" : label === "Okay fit" ? "okay" : "weak";
  return (
    <span className={`chip ${cls}`} title={`Household fit ${score}/100`}>
      {label} · {score}
    </span>
  );
}

/** Spec §6: label all seed data as sample data in the UI. */
export function SampleBadge({ show = true }: { show?: boolean }) {
  return show ? <span className="chip small muted">Sample data</span> : null;
}

/** Spec §2.6: no payments, no in-app messaging — say so in the UI. */
export function OutsideAppNotice() {
  return (
    <p className="notice small">
      Rent, deposit and the sublease agreement happen outside burrow. There is no in-app messaging or payment.
    </p>
  );
}

/** Dev helper: dump a response while you build the real UI. Remove before the demo. */
export function DevJson({ value }: { value: unknown }) {
  return (
    <details className="card small">
      <summary className="muted">API response (dev)</summary>
      <pre style={{ overflow: "auto", maxHeight: 400 }}>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

export function formatDate(d: string): string {
  const [y, m, dd] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** 950 → "$950/mo"; null → null (listing didn't give a rent). */
export function formatRent(rent: number | null | undefined): string | null {
  return rent == null ? null : `$${rent.toLocaleString("en-US")}/mo`;
}

/** Budget choices for the incoming profile (max monthly rent, USD). null = no limit. */
export const BUDGET_OPTIONS: ReadonlyArray<{ value: number | null; label: string }> = [
  { value: null, label: "Any" },
  { value: 800, label: "Up to $800" },
  { value: 900, label: "Up to $900" },
  { value: 1000, label: "Up to $1,000" },
  { value: 1200, label: "Up to $1,200" },
];
