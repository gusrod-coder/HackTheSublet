"use client";
/**
 * /pitch: full-screen presentation slides (not linked anywhere). Click, Space or → to go forward; ← to go back.
 * The last slide's click goes to the home page. OWNER: h2. Copy follows the team's pitch script.
 */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Persona } from "@/components/shared/Persona";
import burrowIcon from "@/components/shared/assets/burrow-icon.png";
import s from "./pitch.module.css";

const SLIDES: ReactNode[] = [
  // 1. Title
  <div key="t" className={s.center}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={burrowIcon.src} alt="" className={s.logo} />
    <h1 className={s.brand}>burrow</h1>
    <p className={s.lead}>Find a summer sublet that matches how you live.</p>
  </div>,

  // 2. Today: a two-person deal
  <div key="two" className={s.center}>
    <p className={s.eyebrow}>How summer sublets work now</p>
    <h2 className={s.title}><span className={s.today}>Today,</span> the deal is made between two people.</h2>
    <div className={s.pair}>
      <figure className={s.who}><Persona kind="dino" label="The one leaving" /><figcaption>The one leaving</figcaption></figure>
      <span className={s.arrow} aria-hidden>⇄</span>
      <figure className={s.who}><Persona kind="fox" label="The one moving in" /><figcaption>The one moving in</figcaption></figure>
    </div>
  </div>,

  // 3. Really three, unfair to everyone
  <div key="three" className={s.center}>
    <p className={s.eyebrow}>But a sublet is really three-way</p>
    <h2 className={s.title}>And it’s unfair to everyone in it.</h2>
    <div className={s.cards}>
      <div className={`card ${s.card}`} style={{ background: "var(--mint, var(--leaf-soft, #dcefd9))" }}>
        <Persona kind="capybara" scale={0.8} label="Stayers" />
        <h3>Stayers</h3><p>Live with someone they never chose.</p>
      </div>
      <div className={`card ${s.card}`} style={{ background: "var(--sky)" }}>
        <Persona kind="fox" scale={0.8} label="Newcomer" />
        <h3>Newcomer</h3><p>Moves in blind to who they’ll share a home with.</p>
      </div>
      <div className={`card ${s.card}`} style={{ background: "var(--blush)" }}>
        <Persona kind="dino" scale={0.8} label="Leaver" />
        <h3>Leaver</h3><p>Pushed to oversell, or stuck paying rent.</p>
      </div>
    </div>
  </div>,

  // 4. Evidence
  <div key="stats" className={s.center}>
    <p className={s.eyebrow}>Habits are invisible in a listing</p>
    <div className={s.stats}>
      <div className={s.stat}><span className={s.num}>60%</span><span>picked cleanliness as a tension point</span></div>
      <div className={s.stat}><span className={s.num}>36%</span><span>picked noise</span></div>
      <div className={s.stat}><span className={s.num}>8%</span><span>left a rental over a roommate dispute</span></div>
    </div>
    <p className={s.source}>SpareRoom US roommate census, Aug 2025 (1,257 roommates). Separate findings; they don’t add up.</p>
  </div>,

  // 5. burrow
  <div key="burrow" className={s.center}>
    <p className={s.eyebrow}>That’s why we built burrow</p>
    <h2 className={s.title}>The whole household in the <span className={s.today}>same room</span>, before anyone signs.</h2>
    <div className={s.pair}>
      <Persona kind="dino" tilt={-4} label="Leaver" />
      <Persona kind="capybara" label="Stayer" />
      <Persona kind="fox" tilt={4} label="Incoming" />
    </div>
  </div>,

  // 6. How it works (click → home)
  <div key="how" className={s.center}>
    <p className={s.eyebrow}>How it works</p>
    <ol className={s.steps}>
      <li className={`card ${s.step}`}><span className={s.stepNum}>1</span><h3>Leaver lists</h3><p>The listing stays hidden.</p></li>
      <li className={`card ${s.step}`}><span className={s.stepNum}>2</span><h3>Stayers answer</h3><p>8 habit questions. Live once everyone answers.</p></li>
      <li className={`card ${s.step}`}><span className={s.stepNum}>3</span><h3>Incoming matches</h3><p>Same questions, deal-breakers, dates. Ranked by household fit.</p></li>
    </ol>
    <p className={s.hint}>Click to try it →</p>
  </div>,
];

export default function PitchPage() {
  const router = useRouter();
  const [i, setI] = useState(0);
  const last = SLIDES.length - 1;

  const next = useCallback(() => {
    if (i >= last) router.push("/");
    else setI(i + 1);
  }, [i, last, router]);
  const prev = useCallback(() => setI((n) => Math.max(0, n - 1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", " ", "Enter", "PageDown"].includes(e.key)) { e.preventDefault(); next(); }
      if (["ArrowLeft", "Backspace", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
      if (e.key === "f") document.documentElement.requestFullscreen?.().catch(() => {});
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className={s.stage} onClick={next} role="region" aria-roledescription="slideshow" aria-label="burrow pitch">
      <span className={`${s.blob} ${s.blobPeach}`} aria-hidden />
      <span className={`${s.blob} ${s.blobButter}`} aria-hidden />
      <section key={i} className={s.slide} aria-live="polite" aria-label={`Slide ${i + 1} of ${SLIDES.length}`}>
        {SLIDES[i]}
      </section>
      <div className={s.dots} aria-hidden>
        {SLIDES.map((_, k) => <span key={k} className={k === i ? s.dotOn : s.dot} />)}
      </div>
    </div>
  );
}
