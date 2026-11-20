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
import { QUESTION_COUNT, type ListingStatus } from "@/lib/types";
import { HabitForm } from "@/components/shared/HabitForm";
import { Hero, Icon, Page, Status, cx, kit } from "@/components/leaver/kit";
import s from "./form.module.css";

export default function StayerFormPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const profile = useApi(() => api.stayer.profile(listingId), [listingId]);
  const listing = useApi(() => api.listing(listingId), [listingId]);

  const [answers, setAnswers] = useState<Array<number | null>>(() => Array(QUESTION_COUNT).fill(null));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ status: ListingStatus; wasLive: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (profile.data?.answers) setAnswers(profile.data.answers);
  }, [profile.data]);

  const unanswered = answers.filter((a) => a === null).length;
  const street = listing.data?.listing.name ?? "your place";

  async function save() {
    if (unanswered) return;
    setSaving(true);
    setErr(null);
    const wasLive = profile.data?.listingStatus === "live";
    try {
      const r = await api.stayer.saveProfile(listingId, { answers: answers as number[] });
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
              answers={answers}
              onAnswers={(a) => {
                setAnswers(a);
                setSaved(null);
              }}
              disabled={saving}
            />
          </div>

          {saved && (
            <div className={cx(kit.notice, kit.noticeSky)} role="status">
              <Icon name="sparkle" size={24} />
              <span>
                {saved.status === "live" && !saved.wasLive
                  ? `Saved, and that was the last answer: ${street} is now live for incoming students.`
                  : saved.status === "live"
                    ? "Saved. Fit scores for incoming students update right away."
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
