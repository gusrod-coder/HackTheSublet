"use client";
/**
 * Home (Figma "00 Home", 49:2070). OWNER: h1 (built by h2 on request).
 * Also the demo entry: the three "How it works" cards are the role picker (leaver / stayer / incoming).
 */
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { Persona } from "@/components/shared/Persona";
import burrowIcon from "@/components/shared/assets/burrow-icon.png";
import s from "./page.module.css";

/** Figma "Logo / Burrow icon" (55:2015): the fox peeking out of its burrow, cropped in a sky tile. */
function BurrowIcon({ size }: { size: number }) {
  const k = size / 120; // Figma art box: 160x151 at (-20,-8) inside a 120 tile
  return (
    <span className={s.icon} style={{ width: size, height: size, borderRadius: 16 * k }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={burrowIcon.src} alt="" style={{ left: -20 * k, top: -8 * k, width: 160 * k, height: 151 * k }} />
    </span>
  );
}

export default function Home() {
  const { data: me } = useApi(() => api.me.get(), []);
  const user = me?.user;

  const roles = [
    {
      href: "/leaver",
      cta: "I'm leaving for the summer",
      tone: s.blush,
      persona: "dino" as const,
      title: "The leaver lists",
      body: "The listing stays hidden for now.",
      gets: "You get: roommates who already signed off.",
      status: me && me.leading.length > 0 ? me.leading.map((l) => `${l.address} (${l.status.replace("_", " ")})`).join(" · ") : null,
    },
    {
      href: "/stayer",
      cta: "I'm staying this summer",
      tone: s.leaf,
      persona: "capybara" as const,
      title: "The stayers answer",
      body: "Eight quick questions. Then it goes live.",
      gets: "You get: nobody moves in without your OK.",
      status: me && me.staying.length > 0 ? me.staying.map((x) => `${x.address} (${x.inviteStatus})`).join(" · ") : null,
    },
    {
      href: "/incoming",
      cta: "I'm coming to Ann Arbor",
      tone: s.sky,
      persona: "fox" as const,
      title: "The incoming matches",
      body: "See homes ranked by household fit.",
      gets: "You get: know how they live before you pay.",
      status: me?.incoming ? (me.incoming.complete ? "Profile complete" : "Profile in progress") : null,
    },
  ];

  return (
    <div className={s.home}>
      <span className={`${s.blob} ${s.blobPeach}`} aria-hidden />
      <span className={`${s.blob} ${s.blobButter}`} aria-hidden />

      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>Summer sublets · Ann Arbor</p>
          <h1 className={s.heroTitle}>Meet the roommates before you take the room.</h1>
          <p className={s.bodyL}>Burrow lets the people staying behind meet you before you sublet.</p>
          <div className={s.actions}>
            <a href="#roles" className="btn">Get started</a>
            <a href="#how" className="btn ghost">How it works</a>
          </div>
          <p className={s.caption}>
            {user ? <>Signed in as <strong>{user.name}</strong>. </> : <>Pick a demo person from <strong>Switch role</strong> at the top, or choose a role below. </>}
            All listings and people here are sample data.
          </p>
        </div>
        <BurrowIcon size={264} />
      </section>

      <section className={s.section} aria-labelledby="problem">
        <div className={s.head}>
          <p className={s.eyebrow}>The problem</p>
          <h2 id="problem" className={s.title}>You sign with one person and live with three.</h2>
          <p className={s.bodyL}>Sublets are arranged with whoever is leaving. The roommates who stay never get a say.</p>
        </div>
        <div className={s.stats}>
          <div className={s.stat}>
            <p className={s.statNum}>12 mo</p>
            <p className={s.bodyM}>Typical lease near campus. Leave for summer, and the room still needs filling.</p>
            <p className={s.caption}>U-M Dean of Students</p>
          </div>
          <div className={s.stat}>
            <p className={s.statNum}>4 of 6</p>
            <p className={s.bodyM}>Roommates leaving in one real U-M sublet listing. The other two stay.</p>
            <p className={s.caption}>U-M Off-Campus Housing, 2026</p>
          </div>
        </div>
      </section>

      <section className={`card ${s.why}`}>
        <BurrowIcon size={120} />
        <div className={s.whyText}>
          <p className={s.eyebrow}>Why Burrow</p>
          <h2 className={s.headingM}>A burrow belongs to everyone who lives in it.</h2>
          <p className={s.bodyM}>You’re not renting a room. You’re joining a household, so the household gets a say.</p>
        </div>
      </section>

      <section className={s.section} id="how" aria-labelledby="how-title">
        <div className={s.head}>
          <p className={s.eyebrow}>How it works</p>
          <h2 id="how-title" className={s.title}>Three people, one apartment. Everyone wins.</h2>
        </div>
        <div className={s.three} id="roles">
          {roles.map((r) => (
            <Link key={r.href} href={r.href} className={`card ${s.role} ${r.tone}`}>
              <Persona kind={r.persona} label={r.title} />
              <h3 className={s.headingS}>{r.title}</h3>
              <p className={s.bodyM}>{r.body}</p>
              <span className={s.divider} aria-hidden />
              <p className={s.gets}>{r.gets}</p>
              {r.status && <span className={s.status}>{r.status}</span>}
              <span className={s.go}>{r.cta} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={s.section} aria-labelledby="trust">
        <div className={s.head}>
          <p className={s.eyebrow}>Trust</p>
          <h2 id="trust" className={s.title}>Built so nobody can oversell.</h2>
        </div>
        <div className={s.three}>
          {[
            ["Blind answers", "Hidden until both sides answer."],
            ["Stayers decide", "Every stayer must approve."],
            ["Contacts last", "Shared only after terms are agreed."],
          ].map(([t, b]) => (
            <div key={t} className={`card ${s.trust}`}>
              <h3 className={s.headingS}>{t}</h3>
              <p className={s.bodyM}>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`card ${s.cta}`}>
        <h2 className={s.title}>Know who you’re living with before you sign.</h2>
        <a href="#roles" className="btn">Get started</a>
      </section>
    </div>
  );
}
