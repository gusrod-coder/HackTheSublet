/** Distance from a listing to the incoming's destination. Display-only, never scored. OWNER: h1. */
import { DESTINATIONS, type Destination, type DistanceInfo } from "./types";

export function milesBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8; // earth radius, miles
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "1.2 mi to Medical Campus". Straight-line distance: we deliberately don't estimate commute times (spec §10). */
export function distanceTo(listing: { lat: number; lng: number }, destination: Destination): DistanceInfo {
  const d = DESTINATIONS.find((x) => x.key === destination)!;
  const miles = Math.round(milesBetween(listing, d) * 10) / 10;
  return { miles, label: `${miles} mi to ${d.label}` };
}
