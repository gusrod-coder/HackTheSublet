"use client";
/**
 * Your listings. LANE: h3. Spec: §3 Leaver.
 * No dedicated Figma frame; built from the D · Leaver kit so it reads as step 0 of 07/08.
 */
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { SampleBadge, formatDate } from "@/components/shared/ui";
import { Hero, Page, Status, cx, kit } from "@/components/leaver/kit";
import type { ListingStatus } from "@/lib/types";

const STATUS: Record<ListingStatus, { text: string; cls: string }> = {
  draft: { text: "Draft · not submitted", cls: kit.chipButter },
  awaiting_household: { text: "Waiting on roommates", cls: kit.chipButter },
  live: { text: "Live", cls: kit.chipLeaf },
};

export default function LeaverListingsPage() {
  const { data, error, loading } = useApi(() => api.leaver.myListings(), []);
  const listings = data?.listings ?? [];
  return (
    <Page>
      <Hero
        persona="dino"
        title="Your listings"
        lede="Your room goes live for incoming students once every roommate who's staying has answered the habit questions."
      />
      <Status loading={loading} error={error?.code === "NO_SESSION" ? { code: "", message: "Pick a demo user in the top bar first." } : error} />
      {data && listings.length === 0 && (
        <div className={kit.soft}>
          <p className={kit.lede}>You haven't listed a room yet.</p>
        </div>
      )}
      {listings.map((l) => {
        const st = STATUS[l.status];
        return (
          <Link key={l.id} href={`/leaver/listings/${l.id}`} className={cx(kit.sticker, kit.col)} style={{ color: "inherit", textDecoration: "none" }}>
            <div className={kit.row} style={{ justifyContent: "space-between" }}>
              <h2 className={kit.headingS}>{l.address}</h2>
              <span className={kit.row}>
                <SampleBadge show={l.isSample} />
                <span className={cx(kit.chip, st.cls)}>{st.text}</span>
              </span>
            </div>
            <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>
              {formatDate(l.startDate)} – {formatDate(l.endDate)} · {l.roomType === "private" ? "Private room" : "Shared bedroom"} · {l.stayerCount}{" "}
              {l.stayerCount === 1 ? "roommate" : "roommates"}
            </p>
            {l.status !== "live" && l.waitingOn > 0 && (
              <p className={cx(kit.notice, kit.noticeButter)} style={{ margin: 0 }}>
                Waiting on {l.waitingOn} {l.waitingOn === 1 ? "roommate" : "roommates"}
              </p>
            )}
          </Link>
        );
      })}
      <Link href="/leaver/new" className={kit.btn}>
        + List a room
      </Link>
    </Page>
  );
}
