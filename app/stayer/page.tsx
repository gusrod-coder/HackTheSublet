"use client";
/**
 * You've been invited. LANE: h3. Spec: §3 Stayers, §7.
 * Figma: HackTheLease 10:537 "09 Stayer · Notification". One card per invite.
 */
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { SampleBadge, formatDate } from "@/components/shared/ui";
import { Icon, Page, Persona, Status, cx, kit } from "@/components/leaver/kit";
import s from "./stayer.module.css";

export default function StayerInvitesPage() {
  const { data, error, loading } = useApi(() => api.stayer.invites(), []);
  const invites = data?.invites ?? [];

  return (
    <Page warmTop>
      <Status loading={loading} error={error?.code === "NO_SESSION" ? { code: "", message: "Pick a demo user in the top bar first." } : error} />
      {data && invites.length === 0 && (
        <div className={cx(kit.soft, s.notifyCard)}>
          <Persona kind="capybara" />
          <h1 className={kit.headingM}>No invites yet</h1>
          <p className={kit.muted} style={{ margin: 0 }}>
            When a roommate who's leaving lists their room, you'll be asked to describe the household here.
          </p>
        </div>
      )}

      {invites.map(({ listing, inviteStatus, otherStayers }) => {
        const answered = inviteStatus === "answered";
        return (
          <section key={listing.id} className={cx(kit.sticker, s.notifyCard)}>
            <div className={s.personas}>
              <Persona kind="dino" />
              <Persona kind="capybara" tilt={8} />
            </div>
            <span className={cx(kit.label, s.kicker)}>
              <Icon name="bell" /> new from your house
            </span>
            <h1 className={kit.headingM}>{listing.leader.name} listed their room for the summer</h1>
            <p className={kit.muted} style={{ margin: 0 }}>
              Someone new may live with you from {formatDate(listing.startDate)} to {formatDate(listing.endDate)}. Answer 8 habit questions so
              incoming students see your household as it really is. Nobody sees your answers until they've shared theirs, and nobody moves in
              without your yes.
            </p>
            {answered ? (
              <div className={kit.col} style={{ alignItems: "center" }}>
                <span className={cx(kit.chip, kit.chipSky)}>You've answered ✓</span>
                <div className={kit.row} style={{ justifyContent: "center" }}>
                  <Link href={`/stayer/${listing.id}/form`} className={cx(kit.btn, kit.btnSecondary)}>
                    Edit my answers
                  </Link>
                  <Link href="/stayer/inbox" className={kit.btn}>
                    Requests to join →
                  </Link>
                </div>
              </div>
            ) : (
              <Link href={`/stayer/${listing.id}/form`} className={kit.btn} style={{ alignSelf: "center" }}>
                Answer now · 2 min
              </Link>
            )}
            <div className={kit.row} style={{ justifyContent: "center" }}>
              <SampleBadge show={listing.isSample} />
              <span className={cx(kit.caption, kit.muted)}>{listing.name}</span>
            </div>
            {otherStayers.length > 0 && (
              <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>
                {otherStayers.map((o) => `${o.name} · ${o.inviteStatus === "answered" ? "answered ✓" : "hasn't answered yet"}`).join(" / ")}
              </p>
            )}
          </section>
        );
      })}
    </Page>
  );
}
