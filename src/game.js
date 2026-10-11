// Pure game logic: no DOM, no map. Covered by game.test.js.

export const MAX_SCORE = 5000;
export const ROUNDS = 5;

const EARTH_RADIUS_KM = 6371;
const toRad = (deg) => (deg * Math.PI) / 180;

// Great-circle distance between two [lng, lat] points.
export function distanceKm([lng1, lat1], [lng2, lat2]) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Exponential falloff; anything within 300 m is a perfect hit. A used hint halves the round.
export function scoreFor(km, scaleKm, hintUsed = false) {
  const base = km <= 0.3 ? MAX_SCORE : Math.round(MAX_SCORE * Math.exp(-km / scaleKm));
  return hintUsed ? Math.round(base / 2) : base;
}

export function pickRounds(places, region, count = ROUNDS, rng = Math.random) {
  const pool = places.filter((p) => region === 'all' || p.region === region);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString('ko-KR')} km`;
}

export function formatDuration(seconds) {
  const totalMin = Math.max(1, Math.round(seconds / 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

export function rankFor(total, maxTotal) {
  const ratio = total / maxTotal;
  if (ratio >= 0.9) return '지도 장인';
  if (ratio >= 0.7) return '노련한 여행자';
  if (ratio >= 0.4) return '길눈 밝은 편';
  return '내비게이션 필수';
}
