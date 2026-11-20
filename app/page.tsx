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
import { HomeDots } from "./HomeDots";
import tryQr from "@/components/shared/assets/try-burrow-qr.svg";
import s from "./page.module.css";

/** Figma "Logo / Burrow icon" (55:2015): the fox peeking out of its burrow, no background. */
function BurrowIcon({ size }: { size: number }) {
  const k = size / 120; // Figma art box: 160x151 at (-20,-8) inside a 120 tile
  return (
    <span className={s.icon} style={{ width: size, height: size, borderRadius: 16 * k }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={burrowIcon.src} alt="" style={{ left: -20 * k, top: -8 * k, width: 160 * k, height: 151 * k }} />
    </span>
  );
}

/** Homepage evidence cards, from sources.md (recommended stat cards). */
const STATS = [
  {
    num: "24.2%",
    text: "of responding undergraduates reported roommate or housemate problems in the past year.",
    source: "ACHA-NCHA, Spring 2026 (44,320 undergraduates, 86 US schools)",
    href: "https://www.acha.org/wp-content/uploads/NCHA-IIIb_SPRING_2026_UNDERGRADUATE_REFERENCE_GROUP_DATA_REPORT.pdf#page=49",
  },
  {
    num: "60%",
    text: "of surveyed US roommates picked cleanliness as a likely source of household tension.",
    source: "SpareRoom roommate census, Aug 2025 (1,257 US roommates)",
    href: "https://www.spareroom.com/content/info-statistics/avoid-roommate-disputes",
  },
  {
    num: "8%",
    text: "of surveyed US roommates said a roommate dispute made them leave their previous rental.",
    source: "SpareRoom roommate census, Aug 2025",
    href: "https://www.spareroom.com/content/info-statistics/avoid-roommate-disputes",
  },
] as const;

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
      body: "Hidden until your roommates answer.",
      gets: "You get: a replacement your roommates approved.",
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
      title: "The incoming student matches",
      body: "See homes ranked by fit, with rent and your budget.",
      gets: "You get: how the house lives, before you pay.",
      status: me?.incoming ? (me.incoming.complete ? "Profile complete" : "Profile in progress") : null,
    },
  ];

  return (
    <div className={s.home}>
      <HomeDots />

      <section className={s.hero}>
        <div className={s.heroText}>
          <p className={s.eyebrow}>Summer sublets · Ann Arbor</p>
          <h1 className={s.heroTitle}>Find a burrow.</h1>
          <p className={s.bodyL}>Find a summer sublet that matches how you live. The roommates who stay share their habits, you see how well you fit, and they approve who moves in.</p>
          <div className={s.actions}>
            <a href="#roles" className="btn">Get started</a>
            <a href="#how" className="btn ghost">How it works</a>
            <Link href="/pitch" className="btn ghost">Pitch</Link>
          </div>
          <p className={s.caption}>
            {user ? <>Signed in as <strong>{user.name}</strong>. </> : <>Pick a demo person from <strong>Viewing as</strong> at the top right, or choose a role below. </>}
            All listings and people here are sample data.
          </p>
          {/* For judges/audience: scan to open the public demo site. Hidden on phones (already there). */}
          <div className={s.tryPhone}>
            <img src={tryQr.src} alt="QR code to open burrow on your phone" width={112} height={112} className={s.tryQr} />
            <p className={s.caption}>
              <strong>Try it on your phone.</strong>
              <br />
              Scan, then pick anyone from <strong>Viewing as</strong>.
            </p>
          </div>
        </div>
        <BurrowIcon size={264} />
      </section>

      <section className={s.section} aria-labelledby="problem">
        <div className={s.head}>
          <p className={s.eyebrow}>The problem</p>
          <h2 id="problem" className={s.title}>You sign with one person and live with three.</h2>
          <p className={s.bodyL}>Sublets are arranged with whoever is leaving. The roommates who stay never get a say.</p>
        </div>
        {/* Cited per sources.md (research checked 2026-11-20). Separate findings: don't add them up or
            generalise them to all students, renters or Ann Arbor. */}
        <div className={s.stats}>
          {STATS.map((st) => (
            <div key={st.num} className={s.stat}>
              <p className={s.statNum}>{st.num}</p>
              <p className={s.bodyM}>{st.text}</p>
              <p className={s.caption}>
                <a href={st.href} target="_blank" rel="noreferrer" className={s.sourceLink}>{st.source}</a>
              </p>
            </div>
          ))}
        </div>
        <p className={s.caption}>
          Each figure links to its source. They come from separate surveys of different groups, so they don’t add up.
        </p>
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
          <h2 id="how-title" className={s.title}>Three roles, one household. Everyone gets a say.</h2>
        </div>
        <div className={s.three} id="roles">
          {roles.map((r) => (
            <Link key={r.href} href={r.href} className={`card ${s.role} ${r.tone}`}>
              <Persona kind={r.persona} label={r.title} />
              <h3 className={s.headingS}>{r.title}</h3>
              <p className={s.bodyM}>{r.body}</p>
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
            ["Contacts last", "Contact details stay private until terms are agreed, unless you choose to share your number."],
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
