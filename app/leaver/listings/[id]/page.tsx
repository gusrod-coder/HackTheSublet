"use client";
/**
 * Invite your roommates. LANE: h3. Spec: §3 Leaver, gate §2.1.
 * Figma: HackTheLease 10:496 "08 Leaver · Invite roommates".
 * The leaver sees who answered, never what (server only returns inviteStatus).
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { usePoll } from "@/components/leaver/use-poll";
import { SampleBadge, formatDate, formatRent } from "@/components/shared/ui";
import { Icon, Page, Persona, StepDots, Status, cx, kit } from "@/components/leaver/kit";
import s from "./invite.module.css";

const names = (n: string[]) => (n.length <= 1 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`);

/** Live demo: the stayer to pre-fill in the invite form, from .env (never committed). */
const DEMO_STAYER = {
  name: process.env.NEXT_PUBLIC_DEMO_STAYER_NAME ?? "",
  email: process.env.NEXT_PUBLIC_DEMO_STAYER_EMAIL ?? "",
};

export default function InvitePage() {
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, setData, reload } = useApi(() => api.leaver.householdStatus(id), [id]);
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  usePoll(reload, !!data && data.waitingOn > 0 && !busy);
  // Remember what we saw on the previous poll, so a roommate answering (and the listing going live)
  // while Morgan watches gets called out instead of silently flipping a chip.
  const seen = useRef<{ answered: Set<string>; live: boolean } | null>(null);
  const [justAnswered, setJustAnswered] = useState<string[]>([]);
  const [justWentLive, setJustWentLive] = useState(false);
  useEffect(() => {
    if (!data) return;
    const answered = new Set(data.stayers.filter((x) => x.inviteStatus === "answered").map((x) => x.id));
    const live = data.listing.status === "live";
    const prev = seen.current;
    if (prev) {
      const fresh = data.stayers.filter((x) => answered.has(x.id) && !prev.answered.has(x.id)).map((x) => x.id);
      if (fresh.length) setJustAnswered((j) => [...new Set([...j, ...fresh])]);
      if (live && !prev.live) setJustWentLive(true);
    }
    seen.current = { answered, live };
  }, [data]);
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !data || data.stayers.length > 0 || !DEMO_STAYER.email) return;
    prefilled.current = true;
    setEmail(DEMO_STAYER.email);
    setName(DEMO_STAYER.name);
    setAdding(true);
  }, [data]);

  async function run<T>(fn: () => Promise<T>, after: (r: T) => void) {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      after(await fn());
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "CANNOT_INVITE_SELF") setErr("That's your own email. Invite the roommates who are staying.");
      else setErr(e instanceof ApiClientError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    void run(
      () => api.leaver.invite(id, { invites: [{ email: email.trim(), name: name.trim() || undefined }] }),
      (r) => {
        setData(r);
        setEmail("");
        setName("");
        setAdding(false);
      },
    );
  };

  const submit = () =>
    void run(
      async () => {
        await api.leaver.submit(id);
        return api.leaver.householdStatus(id);
      },
      setData,
    );

  if (error?.code === "NOT_LEAVER" || error?.code === "NOT_FOUND")
    return (
      <Page>
        <p className={cx(kit.notice, kit.noticeBlush)}>Only the person who listed this room can manage its invites.</p>
        <Link href="/leaver" className={kit.btn}>Back to your listings</Link>
      </Page>
    );

  const listing = data?.listing;
  const stayers = data?.stayers ?? [];
  const waiting = stayers.filter((x) => x.inviteStatus === "invited").map((x) => x.name);
  const answeredNames = stayers.filter((x) => x.inviteStatus === "answered").map((x) => x.name);
  const isLive = listing?.status === "live";
  const lastIn = stayers.filter((x) => justAnswered.includes(x.id)).map((x) => x.name);

  return (
    <Page>
      <StepDots step={2} total={2} label="your roommates" />
      <div className={kit.heroText}>
        <h1 className={kit.display}>{isLive ? "Your room is live" : "Invite the roommates who are staying"}</h1>
        <p className={kit.lede}>
          {isLive
            ? "Everyone who's staying has described the household, so incoming students can now see how well they'd fit."
            : "Your listing goes live once every roommate has answered. You can't answer for them or edit what they say. That's the whole point."}
        </p>
      </div>
      <Status loading={loading && !data} error={error} />

      {/* Always rendered so screen readers hear the change when it happens. */}
      <div role="status" aria-live="polite" className={s.srOnly}>
        {justWentLive && listing ? `${names(lastIn)} answered. ${listing.name} is now live for incoming students.` : lastIn.length ? `${names(lastIn)} answered.` : ""}
      </div>

      {isLive && listing && (
        <div className={cx(s.liveBanner, justWentLive && s.liveBannerPop)}>
          <span className={s.liveCheck} aria-hidden>✓</span>
          <div className={s.liveText}>
            <h2 className={kit.headingM}>
              {justWentLive && lastIn.length ? `${names(lastIn)} answered. ${listing.name} is live!` : `${listing.name} is live`}
            </h2>
            <p className={s.liveBody}>
              Incoming students can find your room and see their fit with {names(answeredNames)}.
            </p>
            <ul className={s.nextSteps}>
              <li>Students who fit ask to join.</li>
              <li>{names(answeredNames)} {answeredNames.length === 1 ? "approves or passes" : "each approve or pass"}. Nobody moves in without every roommate's yes.</li>
              <li>Your part is done. You don't vote, since you won't be living there.</li>
            </ul>
          </div>
        </div>
      )}

      {listing && (
        <div className={cx(kit.sticker, s.card)}>
          <div className={kit.row} style={{ justifyContent: "space-between" }}>
            <span className={cx(kit.caption, kit.muted)}>
              {listing.address} · {formatDate(listing.startDate)} – {formatDate(listing.endDate)}{listing.rent != null && ` · ${formatRent(listing.rent)}`}
            </span>
            <SampleBadge show={listing.isSample} />
          </div>

          {stayers.length === 0 && <p className={kit.muted} style={{ margin: "8px 0" }}>No roommates invited yet.</p>}
          {stayers.length > 0 && (
            <div className={s.progress}>
              <span className={kit.label}>
                {answeredNames.length} of {stayers.length} {stayers.length === 1 ? "roommate" : "roommates"} answered
              </span>
              <span className={s.bar} aria-hidden>
                <span className={s.barFill} style={{ width: `${(100 * answeredNames.length) / stayers.length}%` }} />
              </span>
            </div>
          )}
          {stayers.map((st) => (
            <div key={st.id} className={cx(s.stayer, justAnswered.includes(st.id) && s.stayerJust)}>
              <Persona kind="capybara" size="sm" />
              <div className={s.who}>
                <span className={kit.headingS}>{st.name}</span>
              </div>
              {st.inviteStatus === "answered" ? (
                <span className={cx(kit.chip, kit.chipLeaf)}>{justAnswered.includes(st.id) ? "Just answered ✓" : "Answered ✓"}</span>
              ) : (
                <span className={cx(kit.chip, kit.chipButter)}>Invited · hasn't answered yet</span>
              )}
            </div>
          ))}

          {listing.status === "live" ? null : listing.status === "draft" ? (
            <div className={cx(kit.notice, kit.noticeButter)}>
              <Icon name="lockOkay" size={20} />
              <span>
                Not submitted yet. Invite everyone who's staying, then submit.
                {waiting.length > 0 && ` It goes live once ${names(waiting)} ${waiting.length === 1 ? "has" : "have"} answered.`}
              </span>
            </div>
          ) : (
            <div className={cx(kit.notice, kit.noticeButter)}>
              <Icon name="lockOkay" size={20} />
              <span>Not visible to incoming students yet. {stayers.length ? `Waiting on ${names(waiting)}.` : "Invite at least one roommate who is staying."}</span>
            </div>
          )}

          {adding && (
            <form className={s.inviteForm} onSubmit={invite}>
              <input className={kit.input} type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} aria-label="Roommate name" disabled={busy} />
              <input className={kit.input} type="email" required placeholder="roommate@umich.edu" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Roommate email" disabled={busy} />
              <button type="submit" className={kit.btn} disabled={busy || !email.trim()}>Send invite</button>
            </form>
          )}
          {err && <p className={cx(kit.notice, kit.noticeBlush)} role="alert">{err}</p>}

          <div className={kit.row} style={{ paddingTop: 8 }}>
            {listing.status === "draft" && (
              <button type="button" className={kit.btn} onClick={submit} disabled={busy}>
                Submit listing
              </button>
            )}
            {/* "Send <name> a nudge" (Figma) is out: no messaging in scope. See REQ to h1. */}
            {!adding && (
              <button type="button" className={cx(kit.btn, kit.btnGhost)} onClick={() => setAdding(true)}>
                + Add a roommate
              </button>
            )}
          </div>
        </div>
      )}
      {listing?.status === "live" && stayers.length > 0 && (
        <p className={cx(kit.caption, kit.muted)}>Adding a roommate now takes the listing offline until they've answered too.</p>
      )}
    </Page>
  );
}
