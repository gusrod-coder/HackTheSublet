"use client";
/**
 * Leaflet + OpenStreetMap map (no API key). OWNER: h1.
 * Import via next/dynamic — Leaflet touches `window`:
 *
 *   const ListingMap = dynamic(() => import("@/components/shared/ListingMap"), { ssr: false });
 *   <ListingMap pins={[{ id, lat, lng, label }]} highlightId={hovered} onPinClick={id => …} />
 *   <ListingMap pins={pin ? [pin] : []} onMapClick={(lat, lng) => setPin(…)} />   // leaver: drop a pin
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
            icon={icon}
            opacity={highlightId && highlightId !== p.id ? 0.5 : 1}
            eventHandlers={{ click: () => onPinClick?.(p.id) }}
          >
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
        {dest && (
          <CircleMarker center={[dest.lat, dest.lng]} radius={9} pathOptions={{ color: "#2f5d50", fillOpacity: 0.6 }}>
            <Popup>Your days: {dest.label}</Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
