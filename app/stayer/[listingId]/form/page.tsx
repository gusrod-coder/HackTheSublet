"use client";
/**
 * Describe your household. LANE: h3. Spec: §4.
 * Figma: HackTheLease 10:564 "10 Stayer · Questions" (2-column question cards, no weights for stayers).
 * Demo §8.1: Omar submitting releases Hill St. Demo §8.5: Priya edits one answer later.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { PRACTICES, QUESTION_COUNT, type ListingStatus, type PracticeKey } from "@/lib/types";
import { HabitForm } from "@/components/shared/HabitForm";
import { Hero, Icon, Page, Status, cx, kit } from "@/components/leaver/kit";
import s from "./form.module.css";

/** Scripted live-demo answers: match Alex except people-over nights (2–3 vs 1) → 96, #1. */
const DEMO_STAYER_ANSWERS = [0, 1, 2, 0, 0, 0, 1, 0] as const;

export default function StayerFormPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const profile = useApi(() => api.stayer.profile(listingId), [listingId]);
  const listing = useApi(() => api.listing(listingId), [listingId]);

  const [answers, setAnswers] = useState<Array<number | null>>(() => Array(QUESTION_COUNT).fill(null));
  const [practices, setPractices] = useState<PracticeKey[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ status: ListingStatus; wasLive: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data?.answers) setAnswers(profile.data.answers);
    if (profile.data) setPractices(profile.data.practices ?? []);
  }, [profile.data]);

  // Live demo: the scripted stayer (NEXT_PUBLIC_DEMO_STAYER_EMAIL) opens the form with the scripted answers
  // pre-selected (docs/DEMO-GUIDE.md), so the new house lands #1 for Alex. Only before their first save.
  const me = useApi(() => api.me.get(), []);
  useEffect(() => {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_STAYER_EMAIL?.toLowerCase();
    if (!demoEmail || !profile.data || profile.data.answers) return;
    if (me.data?.user?.email.toLowerCase() === demoEmail) setAnswers([...DEMO_STAYER_ANSWERS]);
  }, [profile.data, me.data]);

  const unanswered = answers.filter((a) => a === null).length;
  const street = listing.data?.listing.name ?? "your place";

  async function save() {
    if (unanswered) return;
    setSaving(true);
    setErr(null);
    const wasLive = profile.data?.listingStatus === "live";
    try {
      const r = await api.stayer.saveProfile(listingId, { answers: answers as number[], practices });
      profile.setData(r);
      setSaved({ status: r.listingStatus, wasLive });
    } catch (e) {
      setErr(e instanceof ApiClientError ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (profile.error?.code === "NOT_STAYER")
    return (
      <Page>
        <p className={cx(kit.notice, kit.noticeBlush)}>
          Only roommates who are staying answer for this household. The person leaving can't answer for them.
        </p>
        <Link href="/stayer" className={kit.btn}>Back</Link>
      </Page>
    );

  return (
    <Page warmTop>
      <Hero
        persona="capybara"
        title="How does your house live?"
        lede={`Same questions incoming students answer. Your answers change how well each of them fits ${street}.`}
      />
      <Status loading={profile.loading && !profile.data} error={profile.error} />

      {profile.data && (
        <>
          <div className={s.grid}>
            <HabitForm
              compactTitles
              answers={answers}
              onAnswers={(a) => {
                setAnswers(a);
                setSaved(null);
              }}
              disabled={saving}
            />
          </div>

          {/* Optional household practices (h2, per human request): a commitment the household makes, never identity. */}
          <section className={cx(kit.soft, kit.col)} aria-labelledby="practices-h">
            <h2 id="practices-h" className={kit.headingS}>Household practices <span className={cx(kit.caption, kit.muted)}>(optional)</span></h2>
            <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>
              Mark anything your household commits to. A practice shows on your listing only when everyone who stays marks it,
              and incoming students can choose to see only households with it.
            </p>
            <div className={kit.pills} role="group" aria-label="Household practices">
              {PRACTICES.map((x) => (
                <button key={x.key} type="button" className={kit.pill} aria-pressed={practices.includes(x.key)} disabled={saving}
                  onClick={() => { setPractices(practices.includes(x.key) ? practices.filter((k) => k !== x.key) : [...practices, x.key]); setSaved(null); }}>
                  {x.label}
                </button>
              ))}
            </div>
          </section>

          {saved && (
            <div className={cx(kit.notice, kit.noticeSky)} role="status">
              <Icon name="sparkle" size={24} />
              <span>
                {saved.status === "live" && !saved.wasLive
                  ? `Saved, and that was the last answer: ${street} is now live for incoming students.`
                  : saved.status === "live"
                    ? "Saved. Incoming students' fit scores now reflect your updated habits."
                    : "Saved. The listing goes live once every roommate has answered."}
              </span>
            </div>
          )}
          {err && <p className={cx(kit.notice, kit.noticeBlush)} role="alert">{err}</p>}

          <div className={s.actions}>
            {unanswered > 0 && <span className={cx(kit.caption, kit.muted)}>{unanswered} left to answer</span>}
            {saved && (
              <Link href="/stayer/inbox" className={cx(kit.btn, kit.btnGhost)}>
                See requests to join
              </Link>
            )}
            <button type="button" className={kit.btn} onClick={save} disabled={saving || unanswered > 0}>
              {saving ? "Saving…" : profile.data.answers ? "Save changes →" : "Save my answers →"}
            </button>
          </div>
        </>
      )}
    </Page>
  );
}
