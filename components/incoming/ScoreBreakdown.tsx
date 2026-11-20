"use client";
/**
 * "How was this score calculated?" on the Household page. LANE: h2. Spec §5: every number explainable.
 * Recomputes each stayer's score in the browser with the same functions the server uses (lib/scoring),
 * so the arithmetic on screen is exactly the one behind the number on the card.
 */
import { useState } from "react";
import { differs, gap, stayerScore } from "@/lib/scoring";
import { QUESTIONS, type HouseholdResponse, type Weight } from "@/lib/types";
import b from "./ScoreBreakdown.module.css";

const WEIGHT_LABEL: Record<Weight, string> = { 3: "A lot", 1: "Some", 0: "Not at all" };
/** 0.5 -> "0.5", 1 -> "1", 0.6667 -> "0.67" */
const num = (n: number) => String(Math.round(n * 100) / 100);
const short = (qi: number, a: number) => {
  const q = QUESTIONS[qi];
  if (q.key !== "noise") return q.options[a];
  const p = q.phrases[a];
  return p.charAt(0).toUpperCase() + p.slice(1);
};

export function ScoreBreakdown({ data }: { data: HouseholdResponse }) {
  const { stayers, you, fit } = data;
  const [who, setWho] = useState(fit.limitingStayer?.id ?? stayers[0]?.id);
  const st = stayers.find((x) => x.id === who) ?? stayers[0];
  if (!st) return null;

  const rows = QUESTIONS.map((q) => {
    const w = you.weights[q.index];
    const g = gap(q.index, you.answers[q.index], st.answers[q.index]);
    const close = 1 - g; // 1 = same answer, 0 = opposite ends of the scale
    return { q, w, close, diff: differs(q.index, you.answers[q.index], st.answers[q.index]), points: w * close };
  });
  const sumPoints = rows.reduce((t, r) => t + r.points, 0);
  const sumW = rows.reduce((t, r) => t + r.w, 0);
  const score = stayerScore(you.answers, you.weights, st.answers);

  return (
    <details className={`card soft ${b.box}`}>
      <summary className={b.summary}>How was this score calculated?</summary>
      <p className={b.lead}>
        Each question is worth up to 3 points if it matters <strong>a lot</strong> to you, 1 if it matters <strong>some</strong>, and 0
        if <strong>not at all</strong>. You get the full points when your answers are the same, half when they’re one step apart, and none
        at opposite ends. The score is the share of possible points you got. No AI: it’s this table.
      </p>

      {stayers.length > 1 && (
        <div className={b.tabs} role="tablist" aria-label="Show the calculation for">
          {stayers.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === st.id}
              className={b.tab}
              onClick={() => setWho(x.id)}
            >
              You + {x.name} · {x.score}
            </button>
          ))}
        </div>
      )}

      <div className={b.scroll}>
        <table className={b.table}>
          <thead>
            <tr>
              <th scope="col">Question</th>
              <th scope="col">You</th>
              <th scope="col">{st.name}</th>
              <th scope="col" className={b.num}>Matters</th>
              <th scope="col" className={b.num}>Closeness</th>
              <th scope="col" className={b.num}>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ q, w, close, diff, points }) => (
              <tr key={q.key} className={w === 0 ? b.ignored : diff ? b.far : undefined}>
                <th scope="row">{q.short}</th>
                <td>{short(q.index, you.answers[q.index])}</td>
                <td>{short(q.index, st.answers[q.index])}</td>
                <td className={b.num}>{WEIGHT_LABEL[w]} ({w})</td>
                <td className={b.num}>{num(close)}</td>
                <td className={b.num}>{w === 0 ? "–" : `${w} × ${num(close)} = ${num(points)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={b.math}>
        {sumW === 0 ? (
          <>Nothing is weighted, so every roommate scores 100.</>
        ) : (
          <>
            <span>{num(sumPoints)} of {sumW} possible points</span>
            <span> = {num((100 * sumPoints) / sumW)}%</span>
            <span> → rounds to <strong>{score}</strong> fit with {st.name}</span>
          </>
        )}
      </p>
      <p className={b.note}>
        Points = Matters × Closeness. Closeness is 1 for the same answer and 0 for opposite ends of the scale; one step apart is 0.5
        (0.67 for Guests, which has four choices, so each step is smaller).
        {stayers.length > 1 && (
          <>
            {" "}The house’s fit is the <strong>lowest</strong> roommate score, {fit.householdScore} (scores:{" "}
            {stayers.map((x) => x.score).join(", ")}; average {fit.average}), because you live with everyone.
          </>
        )}
      </p>
    </details>
  );
}
