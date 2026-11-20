"use client";
/**
 * Your habits, as a one-question-per-card deck. LANE: h2. Spec: §4, §7.
 * Figma: "B · Questionnaire deck" (03.1–03.8 questions + weights, 03.9 deal-breakers).
 * Saves as you go; the server decides `complete` and lists what's `missing`.
 * Deep link: /incoming/habits?q=3 opens question 3 (1-based); ?q=deal opens deal-breakers.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { DEAL_BREAKERS, DEFAULT_WEIGHTS, PRACTICES, QUESTIONS, type DealBreakerKey, type PracticeKey, type Weight, type Weights } from "@/lib/types";
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
  const [must, setMust] = useState<PracticeKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setAnswers(data.answers);
    setWeights(data.weights);
    setDeal(data.dealBreakers);
    setMust(data.mustHaves ?? []);
    const q = new URLSearchParams(window.location.search).get("q");
    if (q === "deal") setStep(DEAL);
    else if (q && Number(q) >= 1 && Number(q) <= QUESTIONS.length) setStep(Number(q) - 1);
    else {
      const firstOpen = data.answers.findIndex((a) => a === null);
      setStep(firstOpen === -1 ? 0 : firstOpen);
    }
  }, [data]);

  const set = <T,>(arr: T[], i: number, v: T) => arr.map((x, j) => (j === i ? v : x));

  async function save(extra: { dealBreakers?: DealBreakerKey[]; mustHaves?: PracticeKey[] } = {}) {
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

  // Card transitions: forward = current card slides away left and fades, next one rises underneath;
  // back = the previous card slides in from the left on top. ~280ms; skipped with reduced motion.
  const [ghost, setGhost] = useState<{ step: number; dir: "fwd" | "back"; key: number } | null>(null);
  const ghostTimer = useRef<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  function go(to: number, dir: "fwd" | "back") {
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (ghostTimer.current) window.clearTimeout(ghostTimer.current);
    setGhost(reduce ? null : { step, dir, key: Date.now() });
    setStep(to);
    if (!reduce) ghostTimer.current = window.setTimeout(() => setGhost(null), 320);
    navigated.current = true;
  }
  const navigated = useRef(false);
  // After a card change (not on first load), move keyboard/screen-reader focus to the new question.
  useEffect(() => {
    if (navigated.current) titleRef.current?.focus({ preventScroll: true });
  }, [step]);
  useEffect(() => () => { if (ghostTimer.current) window.clearTimeout(ghostTimer.current); }, []);

  async function next() {
    if ((await save()) !== null) go(step + 1, "fwd");
  }

  /** One card of the deck. `live` = the interactive one; the outgoing copy is inert. */
  function renderCard(st: number, live: boolean) {
    const cq = st < DEAL ? QUESTIONS[st] : null;
    const tid = live ? (cq ? "q-title" : "deal-title") : undefined;
    if (cq) {
      return (
        <section className={`${s.cardInk} ${p.card}`} aria-labelledby={tid}>
          <div className={p.tags}>
            <span className={p.qTag}>Q{st + 1}</span>
            <span className={s.pillButter}>{cq.short}</span>
          </div>
          <h1 id={tid} ref={live ? titleRef : undefined} tabIndex={live ? -1 : undefined} className={p.question}>{cq.question}</h1>
          <div className={p.answers} role="radiogroup" aria-labelledby={tid}>
            {cq.options.map((opt, oi) => (
              <button key={opt} type="button" role="radio" aria-checked={answers[cq.index] === oi} className={p.answer}
                tabIndex={live ? undefined : -1} onClick={() => live && setAnswers(set(answers, cq.index, oi))}>
                <span className={p.letter}>{String.fromCharCode(65 + oi)}</span>
                {opt}
              </button>
            ))}
          </div>
          <div className={p.weight}>
            <span className={`${s.caption} ${s.muted}`}>How much does this matter to you?</span>
            <div className={s.choices} role="group" aria-label={`How much ${cq.short} matters to you`}>
              {WEIGHTS.map((w) => (
                <button key={w.value} type="button" className={s.choice} aria-pressed={weights[cq.index] === w.value}
                  tabIndex={live ? undefined : -1} onClick={() => live && setWeights(set(weights, cq.index, w.value))}>
                  {w.label}
                </button>
              ))}
            </div>
          </div>
          {live && problem && <p className={s.noticeWarn}>{problem}</p>}
          <div className={p.footer}>
            {st === 0 ? (
              <Link href="/incoming" className={s.btnText} tabIndex={live ? undefined : -1}>← Back to dates</Link>
            ) : (
              <button type="button" className={s.btnText} tabIndex={live ? undefined : -1} onClick={() => live && go(st - 1, "back")}>← Back</button>
            )}
            <button type="button" className={s.btn} tabIndex={live ? undefined : -1} disabled={answers[cq.index] === null || saving} onClick={() => live && void next()}>
              {saving && live ? "Saving…" : st === DEAL - 1 ? "Last: deal-breakers →" : "Next question →"}
            </button>
          </div>
        </section>
      );
    }
    return (
      <section className={`${s.cardInk} ${p.card} ${p.dealCard}`} aria-labelledby={tid}>
        <span className={p.dealTag}>Deal-breakers · pick any</span>
        <h1 id={tid} ref={live ? titleRef : undefined} tabIndex={live ? -1 : undefined} className={p.dealTitle}>Anything that’s an instant no?</h1>
        <p className={s.body} style={{ margin: 0 }}>
          Houses with these are left out of your results, and we’ll tell you why. Choose as many as you like, or none.
        </p>
        <div className={s.choices} role="group" aria-label="Deal-breakers">
          {DEAL_BREAKERS.map((d) => (
            <button key={d.key} type="button" className={s.choice} aria-pressed={deal.includes(d.key)} tabIndex={live ? undefined : -1}
              onClick={() => live && setDeal(deal.includes(d.key) ? deal.filter((k) => k !== d.key) : [...deal, d.key])}>
              {d.label}
            </button>
          ))}
        </div>
        <div className={p.mustBlock}>
          <h2 className={p.mustTitle}>Must-haves <span className={p.optional}>optional</span></h2>
          <p className={s.caption} style={{ margin: 0 }}>
            Only show houses where everyone who stays has marked this. Households choose these themselves; nobody is asked who they are.
          </p>
          <div className={s.choices} role="group" aria-label="Must-haves">
            {PRACTICES.map((x) => (
              <button key={x.key} type="button" className={s.choice} aria-pressed={must.includes(x.key)} tabIndex={live ? undefined : -1}
                onClick={() => live && setMust(must.includes(x.key) ? must.filter((k) => k !== x.key) : [...must, x.key])}>
                {x.label}
              </button>
            ))}
          </div>
        </div>
        {live && problem && <p className={s.noticeWarn}>{problem}</p>}
        {live && missing.length > 0 && (
          <div className={s.noticeWarn}>
            <span>
              Almost there. Still missing: {missing.map(describeMissing).join(", ")}.{" "}
              {missing.some((m) => m.startsWith("answers.")) ? (
                <button type="button" className={p.inlineLink} onClick={() => {
                  const i = Number(/^answers\.(\d+)$/.exec(missing.find((m) => m.startsWith("answers."))!)![1]);
                  setMissing([]);
                  go(i, "back");
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
          <button type="button" className={s.btnText} tabIndex={live ? undefined : -1} onClick={() => live && go(DEAL - 1, "back")}>← Back</button>
          <button type="button" className={s.btn} tabIndex={live ? undefined : -1} disabled={saving} onClick={() => live && void finish()}>
            {saving && live ? "Saving…" : "See sublets ranked for me →"}
          </button>
        </div>
      </section>
    );
  }

  async function finish() {
    const res = await save({ dealBreakers: deal, mustHaves: must });
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

              <div className={p.slot}>
                {/* Outgoing card, kept briefly so it can slide away (forward) or sink back (back). */}
                {ghost && (
                  <div key={`ghost-${ghost.key}`} className={`${p.ghost} ${ghost.dir === "fwd" ? p.exitFwd : p.exitBack}`} aria-hidden inert>
                    {renderCard(ghost.step, false)}
                  </div>
                )}
                <div key={`card-${step}`} className={ghost ? (ghost.dir === "fwd" ? p.enterFwd : p.enterBack) : undefined}>
                  {renderCard(step, true)}
                </div>
              </div>
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
