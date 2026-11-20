"use client";
/**
 * Leaflet + OpenStreetMap map (no API key). OWNER: h1.
 * Import via next/dynamic — Leaflet touches `window`:
 *
 *   const ListingMap = dynamic(() => import("@/components/shared/ListingMap"), { ssr: false });
 *   <ListingMap pins={[{ id, lat, lng, label }]} highlightId={hovered} onPinClick={id => …} />
 *   <ListingMap pins={pin ? [pin] : []} onMapClick={(lat, lng) => setPin(…)} />   // leaver: drop a pin
 *   pins={[{ …, rank: 1 }]}  → numbered sticker pins (browse)
 */
import { useEffect } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { DESTINATIONS, type Destination } from "@/lib/types";

// Default marker icons don't survive bundling; point them at the CDN copies.
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** If set, the pin is a numbered sticker (Figma browse: "pins numbered by fit rank"). */
  rank?: number;
}

function rankIcon(rank: number, active: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;border:2px solid #2b2420;box-shadow:0 3px 0 #2b2420;background:${active ? "#2f5c9a" : "#fffdf8"};color:${active ? "#fffdf8" : "#2b2420"};font:700 14px/1 var(--font-body),sans-serif">${rank}</span>`,
  });
}

interface Props {
  pins: MapPin[];
  highlightId?: string | null;
  destination?: Destination | null;
  onPinClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  height?: number;
}

const ANN_ARBOR: [number, number] = [42.2780, -83.7382];

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onMapClick?.(e.latlng.lat, e.latlng.lng) });
  return null;
}

function FitBounds({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length > 1) map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng])), { padding: [32, 32] });
    else if (pins.length === 1) map.setView([pins[0].lat, pins[0].lng], 15);
  }, [map, pins]);
  return null;
}

export default function ListingMap({ pins, highlightId, destination, onPinClick, onMapClick, height = 360 }: Props) {
  const dest = DESTINATIONS.find((d) => d.key === destination);
  return (
    <div style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
      <MapContainer center={ANN_ARBOR} zoom={14} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onMapClick={onMapClick} />
        <FitBounds pins={pins} />
        {pins.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={p.rank !== undefined ? rankIcon(p.rank, highlightId === p.id) : icon}
            zIndexOffset={highlightId === p.id ? 1000 : 0}
            opacity={highlightId && highlightId !== p.id ? 0.5 : 1}
            eventHandlers={{ click: () => onPinClick?.(p.id) }}
          >
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
        {dest && (
          <CircleMarker center={[dest.lat, dest.lng]} radius={9} pathOptions={{ color: "#2f5c9a", fillColor: "#6f9bd8", fillOpacity: 0.7 }}>
            <Popup>Your days: {dest.label}</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
