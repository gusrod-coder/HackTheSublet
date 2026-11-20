"use client";
/**
 * List your room. LANE: h3. Spec: §3 Leaver, §7.
 * Figma: HackTheLease 10:431 "07 Leaver · List your room".
 */
import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import type { RoomType } from "@/lib/types";
import { Hero, Page, StepDots, cx, kit } from "@/components/leaver/kit";
import s from "./new.module.css";

const ListingMap = dynamic(() => import("@/components/shared/ListingMap"), { ssr: false });

export default function NewListingPage() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [roomType, setRoomType] = useState<RoomType>("private");
  const [furnished, setFurnished] = useState(true);
  // Figma shows the house facts as positive statements ("No indoor smoking"); the API stores the flag.
  const [noSmoking, setNoSmoking] = useState(true);
  const [noPets, setNoPets] = useState(true);
  const [houseRules, setHouseRules] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const missing = [
    !address.trim() && "an address",
    !pin && "a pin on the map",
    !area.trim() && "the area",
    !startDate && "a start date",
    !endDate && "an end date",
  ].filter(Boolean) as string[];
  const invalidDates = !!startDate && !!endDate && startDate >= endDate;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || missing.length || !pin || invalidDates) return;
    setSaving(true);
    setErr(null);
    try {
      const { listing } = await api.leaver.create({
        address: address.trim(),
        lat: pin.lat,
        lng: pin.lng,
        area: area.trim(),
        roomType,
        startDate,
        endDate,
        houseRules: houseRules.trim() || undefined,
        flags: { smoking: !noSmoking, pets: !noPets },
        furnished,
      });
      router.push(`/leaver/listings/${listing.id}`);
    } catch (e) {
      setErr(e instanceof ApiClientError ? (e.code === "NO_SESSION" ? "Pick a demo user in the top bar first." : e.message) : String(e));
      setSaving(false);
    }
  }

  const short = address.split(",")[0].trim();

  return (
    <Page>
      <StepDots step={1} total={2} label="your listing" />
      <Hero
        persona="dino"
        title="List your room"
        lede="You describe the room and the dates. Your roommates describe the household, so incoming students hear it from the people they'll actually live with."
      />
      <form className={s.layout} onSubmit={submit}>
        <div className={s.mapWrap}>
          <div className={s.mapFrame}>
            <ListingMap
              pins={pin ? [{ id: "new", lat: pin.lat, lng: pin.lng, label: short || "Your room" }] : []}
              onMapClick={(lat, lng) => { if (!saving) setPin({ lat, lng }); }}
              height={420}
            />
          </div>
          <p className={cx(kit.caption, kit.muted, s.mapHint)}>{pin ? "Click again to move the pin." : "Click the map to drop a pin on your place."}</p>
        </div>

        <div className={cx(kit.sticker, kit.col, s.formCard)}>
          <div className={kit.field}>
            <label htmlFor="address" className={kit.label}>Address</label>
            <input id="address" className={cx(kit.input, s.input)} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="1100 Packard St, Ann Arbor" disabled={saving} />
          </div>
          <div className={kit.field}>
            <label htmlFor="area" className={kit.label}>Area</label>
            <input id="area" className={cx(kit.input, s.input)} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Near Central Campus" disabled={saving} />
          </div>
          <div className={s.twoUp}>
            <div className={kit.field}>
              <label htmlFor="start" className={kit.label}>Available from</label>
              <input id="start" type="date" className={cx(kit.input, s.input)} value={startDate} onChange={(e) => setStart(e.target.value)} disabled={saving} aria-invalid={invalidDates} aria-describedby={invalidDates ? "date-range-error" : undefined} />
            </div>
            <div className={kit.field}>
              <label htmlFor="end" className={kit.label}>Available until</label>
              <input id="end" type="date" className={cx(kit.input, s.input)} value={endDate} min={startDate || undefined} onChange={(e) => setEnd(e.target.value)} disabled={saving} aria-invalid={invalidDates} aria-describedby={invalidDates ? "date-range-error" : undefined} />
            </div>
          </div>
          {invalidDates && <p id="date-range-error" className={cx(kit.caption, kit.muted)} role="alert">Available until must be after Available from.</p>}
          <fieldset className={kit.field} disabled={saving}>
            <legend className={kit.label} style={{ marginBottom: 8 }}>Room</legend>
            <div className={kit.pills}>
              <button type="button" className={cx(kit.pill, s.roomOption)} aria-pressed={roomType === "private"} onClick={() => setRoomType("private")}>Private room</button>
              <button type="button" className={cx(kit.pill, s.roomOption)} aria-pressed={roomType === "shared"} onClick={() => setRoomType("shared")}>Shared bedroom</button>
              <button type="button" className={cx(kit.pill, s.roomOption)} aria-pressed={furnished} onClick={() => setFurnished((v) => !v)}>Furnished</button>
            </div>
          </fieldset>
          <fieldset className={kit.field} disabled={saving}>
            <legend className={kit.label} style={{ marginBottom: 8 }}>House facts</legend>
            <div className={kit.pills}>
              <button type="button" className={kit.pill} aria-pressed={noSmoking} onClick={() => setNoSmoking((v) => !v)}>No indoor smoking</button>
              <button type="button" className={kit.pill} aria-pressed={noPets} onClick={() => setNoPets((v) => !v)}>No pets</button>
            </div>
          </fieldset>
          <details className={s.optional}>
            <summary className={kit.label}>Add house rules (optional)</summary>
            <div className={kit.field}>
              <label htmlFor="rules" className={kit.label}>House rules</label>
              <textarea id="rules" className={cx(kit.input, s.input)} value={houseRules} onChange={(e) => setHouseRules(e.target.value)} placeholder="Shared fridge shelves, bikes in the back…" disabled={saving} />
            </div>
          </details>
          {err && <p className={cx(kit.notice, kit.noticeBlush)} role="alert">{err}</p>}
          {missing.length > 0 && <p className={cx(kit.caption, kit.muted)} style={{ margin: 0 }}>Still needed: {missing.join(", ")}.</p>}
          <button type="submit" className={kit.btn} disabled={saving || missing.length > 0 || invalidDates}>
            {saving ? "Saving…" : "Next: invite your roommates →"}
          </button>
        </div>
      </form>
    </Page>
  );
}
