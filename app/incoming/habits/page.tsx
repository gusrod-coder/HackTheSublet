"use client";
/**
 * Your habits, as a one-question-per-card deck. LANE: h2. Spec: §4, §7.
 * Figma: "B · Questionnaire deck" (03.1–03.8 questions + weights, 03.9 deal-breakers).
 * Saves as you go; the server decides `complete` and lists what's `missing`.
 * Deep link: /incoming/habits?q=3 opens question 3 (1-based); ?q=deal opens deal-breakers.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DEAL_BREAKERS, DEFAULT_WEIGHTS, QUESTIONS, type DealBreakerKey, type Weight, type Weights } from "@/lib/types";
import { Persona } from "@/components/shared/Persona";
import { StepDots, styles as s } from "@/components/incoming/ui";
import p from "./page.module.css";

const BUBBLES = [
  "no wrong answers, promise!",
  "be honest, it helps you",
  "they answered this too",
  "only matches see this",
  "almost halfway there",
  "we won’t judge the sink",
  "just vibes, no pressure",
  "last one!",
  "almost done!",
];
const WEIGHTS: Array<{ value: Weight; label: string }> = [
  { value: 3, label: "A lot" },
  { value: 1, label: "Some" },
  { value: 0, label: "Not at all" },
];
const DEAL = QUESTIONS.length; // step index of the deal-breaker card

function describeMissing(m: string): string {
  if (m === "startDate" || m === "endDate") return "your dates";
  if (m === "destination") return "where you’ll spend your days";
  const i = /^answers\.(\d+)$/.exec(m);
  if (i) return `question ${Number(i[1]) + 1} (${QUESTIONS[Number(i[1])]?.short ?? "?"})`;
  return m;
}

export default function Page() {
  const router = useRouter();
  const { data, error, loading } = useApi(() => api.incoming.profile(), []);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(Array(QUESTIONS.length).fill(null));
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [deal, setDeal] = useState<DealBreakerKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setAnswers(data.answers);
    setWeights(data.weights);
    setDeal(data.dealBreakers);
    const q = new URLSearchParams(window.location.search).get("q");
    if (q === "deal") setStep(DEAL);
    else if (q && Number(q) >= 1 && Number(q) <= QUESTIONS.length) setStep(Number(q) - 1);
    else {
      const firstOpen = data.answers.findIndex((a) => a === null);
      setStep(firstOpen === -1 ? 0 : firstOpen);
    }
  }, [data]);

  const set = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

  async function save(extra: { dealBreakers?: DealBreakerKey[] } = {}) {
    setSaving(true);
    setProblem(null);
    try {
      return await api.incoming.saveProfile({ answers, weights, ...extra });
    } catch (e) {
      setProblem(e instanceof ApiClientError ? e.message : String(e));
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function next() {
    if ((await save()) !== null) setStep((n) => n + 1);
  }

  async function finish() {
    const res = await save({ dealBreakers: deal });
    if (!res) return;
    if (res.complete) router.push("/incoming/browse");
    else setMissing(res.missing);
  }

  const q = step < DEAL ? QUESTIONS[step] : null;
  const answered = answers.filter((a) => a !== null).length;

  return (
    <>
      <div className={s.blob} style={{ width: 320, height: 320, left: "calc(50% + 440px)", top: 520, background: q ? "var(--peach)" : "var(--blush)", opacity: 0.7 }} />
      <div className={s.page}>
        <div className={p.top}>
          <StepDots step={2} />
          <div className={p.progress} aria-label={`${Math.min(step + 1, 8)} of 8`}>
            {QUESTIONS.map((x) => (
              <span key={x.key} className={`${p.seg} ${x.index <= step ? p.segOn : ""}`} />
            ))}
            <span className={p.count}>{q ? `${step + 1} / 8` : "8 / 8 ✓"}</span>
          </div>
        </div>

        {loading && <p className={s.muted}>Loading…</p>}
        {error && <p className={s.noticeWarn}>{error.message}</p>}

        {data && (
          <div className={p.stage}>
            <aside className={p.mascot}>
              <div className={p.bubble}>{BUBBLES[step]}</div>
              <div className={p.mascotArt}>
                <div className={p.foxCard}>
                  <Persona kind="fox" label="You, the incoming fox" />
                </div>
              </div>
            </aside>

            <div className={p.deck}>
              {q && <span className={p.behindMint} aria-hidden />}
              {q && <span className={p.behindPeach} aria-hidden />}

              {q ? (
                <section className={`${s.cardInk} ${p.card}`} aria-labelledby="q-title">
                  <div className={p.tags}>
                    <span className={p.qTag}>Q{step + 1}</span>
                    <span className={s.pillButter}>{q.short}</span>
                  </div>
                  <h1 id="q-title" className={p.question}>{q.question}</h1>
                  <div className={p.answers} role="radiogroup" aria-labelledby="q-title">
                    {q.options.map((opt, oi) => (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={answers[q.index] === oi}
                        className={p.answer}
                        onClick={() => setAnswers(set(answers, q.index, oi))}
                      >
                        <span className={p.letter}>{String.fromCharCode(65 + oi)}</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <div className={p.weight}>
                    <span className={`${s.caption} ${s.muted}`}>How much does this matter to you?</span>
                    <div className={s.choices} role="group" aria-label={`How much ${q.short} matters to you`}>
                      {WEIGHTS.map((w) => (
                        <button
                          key={w.value}
                          type="button"
                          className={s.choice}
                          aria-pressed={weights[q.index] === w.value}
                          onClick={() => setWeights(set(weights, q.index, w.value))}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {problem && <p className={s.noticeWarn}>{problem}</p>}
                  <div className={p.footer}>
                    {step === 0 ? (
                      <Link href="/incoming" className={s.btnText}>← Back to dates</Link>
                    ) : (
                      <button type="button" className={s.btnText} onClick={() => setStep(step - 1)}>← Back</button>
                    )}
                    <button type="button" className={s.btn} disabled={answers[q.index] === null || saving} onClick={next}>
                      {saving ? "Saving…" : step === DEAL - 1 ? "Last: deal-breakers →" : "Next question →"}
                    </button>
                  </div>
                </section>
              ) : (
                <section className={`${s.cardInk} ${p.card} ${p.dealCard}`} aria-labelledby="deal-title">
                  <span className={p.dealTag}>Deal-breakers · pick any</span>
                  <h1 id="deal-title" className={p.dealTitle}>Anything that’s an instant no?</h1>
                  <p className={s.body} style={{ margin: 0 }}>
                    Houses with these are left out of your results, and we’ll tell you why. Choose as many as you like, or none.
                  </p>
                  <div className={s.choices} role="group" aria-label="Deal-breakers">
                    {DEAL_BREAKERS.map((d) => (
                      <button
                        key={d.key}
                        type="button"
                        className={s.choice}
                        aria-pressed={deal.includes(d.key)}
                        onClick={() => setDeal(deal.includes(d.key) ? deal.filter((k) => k !== d.key) : [...deal, d.key])}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  {problem && <p className={s.noticeWarn}>{problem}</p>}
                  {missing.length > 0 && (
                    <div className={s.noticeWarn}>
                      <span>
                        Almost there. Still missing: {missing.map(describeMissing).join(", ")}.{" "}
                        {missing.some((m) => m.startsWith("answers.")) ? (
                          <button type="button" className={p.inlineLink} onClick={() => {
                            const i = Number(/^answers\.(\d+)$/.exec(missing.find((m) => m.startsWith("answers."))!)![1]);
                            setMissing([]);
                            setStep(i);
                          }}>
                            Go to it
                          </button>
                        ) : (
                          <Link href="/incoming">Go to your stay</Link>
                        )}
                      </span>
                    </div>
                  )}
                  <div className={p.footer}>
                    <button type="button" className={s.btnText} onClick={() => setStep(DEAL - 1)}>← Back</button>
                    <button type="button" className={s.btn} disabled={saving} onClick={finish}>
                      {saving ? "Saving…" : "See sublets ranked for me →"}
                    </button>
                  </div>
                </section>
              )}
              <p className={`${s.caption} ${s.muted} ${p.reveal}`}>
                {answered} of 8 answered. Households stay hidden until you finish; stayers only see your answers if you ask to join.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
