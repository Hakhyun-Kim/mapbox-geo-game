import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distanceKm, scoreFor, pickRounds, formatDistance, formatDuration, MAX_SCORE } from './game.js';
import { PLACES, REGIONS } from './places.js';

test('distanceKm: Seoul to Busan is about 325 km', () => {
  const d = distanceKm([126.978, 37.5665], [129.0756, 35.1796]);
  assert.ok(d > 315 && d < 335, `got ${d}`);
});

test('distanceKm: same point is zero', () => {
  assert.equal(distanceKm([139.7, 35.6], [139.7, 35.6]), 0);
});

test('scoreFor: perfect hit, falloff, hint penalty', () => {
  assert.equal(scoreFor(0.1, 40), MAX_SCORE);
  assert.equal(scoreFor(40, 40), Math.round(MAX_SCORE / Math.E));
  assert.ok(scoreFor(400, 40) < 1);
  assert.equal(scoreFor(0.1, 40, true), MAX_SCORE / 2);
});

test('pickRounds: filters by region, no repeats, deterministic with rng', () => {
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const kr = pickRounds(PLACES, 'kr', 5, rng);
  assert.equal(kr.length, 5);
  assert.ok(kr.every((p) => p.region === 'kr'));
  assert.equal(new Set(kr.map((p) => p.id)).size, 5);
  assert.equal(pickRounds(PLACES, 'all', 99).length, PLACES.length);
});

test('every place sits inside its region bounds', () => {
  for (const p of PLACES) {
    for (const key of [p.region, 'all']) {
      const [[w, s], [e, n]] = REGIONS[key].bounds;
      const [lng, lat] = p.center;
      assert.ok(lng > w && lng < e && lat > s && lat < n, `${p.id} outside ${key}`);
    }
  }
});

test('formatters', () => {
  assert.equal(formatDistance(0.25), '250 m');
  assert.equal(formatDistance(12.34), '12.3 km');
  assert.equal(formatDistance(1234.4), '1,234 km');
  assert.equal(formatDuration(30), '1분');
  assert.equal(formatDuration(3600), '1시간');
  assert.equal(formatDuration(5520), '1시간 32분');
});
