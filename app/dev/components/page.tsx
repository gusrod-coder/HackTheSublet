"use client";
/** Living reference for shared components. OWNER: h1. Visit /dev/components. */
import dynamic from "next/dynamic";
import { useState } from "react";
import { HabitForm } from "@/components/shared/HabitForm";
import { FitBadge, OutsideAppNotice, SampleBadge } from "@/components/shared/ui";
import { Persona } from "@/components/shared/Persona";
import { DEFAULT_WEIGHTS, type Weight } from "@/lib/types";
import { LISTINGS } from "@/prisma/seed-data";

const ListingMap = dynamic(() => import("@/components/shared/ListingMap"), { ssr: false });

export default function Components() {
  const [answers, setAnswers] = useState<Array<number | null>>(Array(8).fill(null));
  const [weights, setWeights] = useState<Weight[]>(DEFAULT_WEIGHTS);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [hl, setHl] = useState<string | null>(null);

  return (
    <div className="stack">
      <h1>Shared components</h1>
      <div className="row">
        <FitBadge score={94} label="Strong fit" />
        <FitBadge score={62} label="Okay fit" />
        <FitBadge score={23} label="Weak fit" />
        <SampleBadge />
      </div>
      <OutsideAppNotice />
      <div className="row">
        <Persona kind="dino" label="Leaver" tilt={-4} />
        <Persona kind="capybara" label="Stayer" />
        <Persona kind="fox" label="Incoming" tilt={4} />
      </div>

      <h2>ListingMap: browse</h2>
      <ListingMap
        pins={LISTINGS.map((l, i) => ({ id: l.id, lat: l.lat, lng: l.lng, label: l.address, rank: i + 1 }))}
        destination="medical"
        highlightId={hl}
        onPinClick={setHl}
      />
      <p className="small muted">Highlighted: {hl ?? "none"}</p>

      <h2>ListingMap: leaver drops a pin</h2>
      <ListingMap pins={pin ? [{ id: "new", ...pin, label: "Your place" }] : []} onMapClick={(lat, lng) => setPin({ lat, lng })} height={260} />
      <p className="small muted">{pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : "Click the map"}</p>

      <h2>HabitForm with weights (incoming)</h2>
      <HabitForm answers={answers} onAnswers={setAnswers} weights={weights} onWeights={setWeights} />
      <pre className="small">{JSON.stringify({ answers, weights })}</pre>
    </div>
  );
}
