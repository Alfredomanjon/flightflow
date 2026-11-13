const R_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km (haversine). */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Initial bearing in degrees (0-360) from point 1 to point 2. */
export function bearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δλ = rad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
