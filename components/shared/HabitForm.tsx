"use client";
/**
 * The 8-question habit form, shared by stayers and incoming. OWNER: h1.
 * Controlled: you own the state and the save call.
 *
 *   Stayer:   <HabitForm answers={a} onAnswers={setA} />
 *   Incoming: <HabitForm answers={a} onAnswers={setA} weights={w} onWeights={setW} />
 *
 * Answers are option indexes (null = unanswered). Passing `weights` shows the
 * "matters to me" control under each question.
 */
import { QUESTIONS, WEIGHT_OPTIONS, type Weight } from "@/lib/types";

interface Props {
  answers: Array<number | null>;
  onAnswers: (next: Array<number | null>) => void;
  weights?: Weight[];
  onWeights?: (next: Weight[]) => void;
  disabled?: boolean;
}

export function HabitForm({ answers, onAnswers, weights, onWeights, disabled }: Props) {
  const setAt = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));
  return (
    <div className="stack">
      {QUESTIONS.map((q) => (
        <fieldset key={q.key} className="card stack" disabled={disabled}>
          <legend className="small muted">Question {q.index + 1} of {QUESTIONS.length}</legend>
          <strong>{q.question}</strong>
          <div className="options" role="group" aria-label={q.question}>
            {q.options.map((opt, oi) => (
              <button
                key={opt}
                type="button"
                className="option"
                aria-pressed={answers[q.index] === oi}
                onClick={() => onAnswers(setAt(answers, q.index, oi))}
              >
                {opt}
              </button>
            ))}
          </div>
          {weights && onWeights && (
            <div className="row small">
              <span className="muted">Matters to me:</span>
              <div className="options" role="group" aria-label={`How much ${q.short} matters`}>
                {WEIGHT_OPTIONS.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    className="option small"
                    aria-pressed={weights[q.index] === w.value}
                    onClick={() => onWeights(setAt(weights, q.index, w.value))}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>
      ))}
    </div>
  );
}
