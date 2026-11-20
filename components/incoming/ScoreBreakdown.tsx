"use client";
/**
 * "How was this score calculated?" on the Household page. LANE: h2. Spec §5: every number explainable.
 * Recomputes each stayer's score in the browser with the same functions the server uses (lib/scoring),
 * so the arithmetic on screen is exactly the one behind the number on the card.
 */
import { useState } from "react";
import { gap, stayerScore } from "@/lib/scoring";
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
    return { q, w, g, points: w * (1 - g) };
  });
  const sumPoints = rows.reduce((t, r) => t + r.points, 0);
  const sumW = rows.reduce((t, r) => t + r.w, 0);
  const score = stayerScore(you.answers, you.weights, st.answers);

  return (
    <details className={`card soft ${b.box}`}>
      <summary className={b.summary}>How was this score calculated?</summary>
      <p className={b.lead}>
        Each roommate gets a score from the questions you said matter. A question you weight <strong>a lot</strong> counts 3,{" "}
        <strong>some</strong> counts 1, <strong>not at all</strong> counts 0. The further apart your answers are, the fewer points it
        gives. No AI: it’s this table.
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
              <th scope="col" className={b.num}>Gap</th>
              <th scope="col" className={b.num}>Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ q, w, g, points }) => (
              <tr key={q.key} className={w === 0 ? b.ignored : g >= 0.5 ? b.far : undefined}>
                <th scope="row">{q.short}</th>
                <td>{short(q.index, you.answers[q.index])}</td>
                <td>{short(q.index, st.answers[q.index])}</td>
                <td className={b.num}>{WEIGHT_LABEL[w]} ({w})</td>
                <td className={b.num}>{num(g)}</td>
                <td className={b.num}>{w === 0 ? "–" : `${w} × ${num(1 - g)} = ${num(points)}`}</td>
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
            <span>{num(sumPoints)} points ÷ {sumW} possible</span>
            <span> = {num(sumPoints / sumW)}</span>
            <span> × 100 → <strong>{score}</strong> fit with {st.name}</span>
          </>
        )}
      </p>
      <p className={b.note}>
        Gap = how far apart the two answers are on that question’s scale (0 = same answer, 1 = opposite ends).
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
