import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './style.css';
import { PLACES, REGIONS } from './places.js';
import {
  MAX_SCORE, ROUNDS, distanceKm, scoreFor, pickRounds, formatDistance, formatDuration, rankFor,
} from './game.js';

const TOKEN_KEY = 'geo-game.mapbox-token';
const $ = (id) => document.getElementById(id);

// ---------- token ----------

function storage(fn) {
  try { return fn(window.localStorage); } catch { return null; }
}

function resolveToken() {
  const fromUrl = new URLSearchParams(location.search).get('token');
  if (fromUrl) {
    storage((s) => s.setItem(TOKEN_KEY, fromUrl));
    return fromUrl;
  }
  return import.meta.env.VITE_MAPBOX_TOKEN || storage((s) => s.getItem(TOKEN_KEY)) || '';
}

// ---------- state ----------

const state = {
  region: 'kr',
  rounds: [],
  index: 0,
  results: [],
  guess: null, // [lng, lat]
  hintUsed: false,
  phase: 'idle', // idle | flying | guessing | reveal
};

let scene; // big 3D satellite map
let guessMap; // small 2D map the player clicks on
let guessMarker;
let answerMarker;
let orbitFrame = 0;

// ---------- maps ----------

function initMaps() {
  scene = new mapboxgl.Map({
    container: 'scene',
    // No labels on purpose: the satellite imagery and terrain are the only clues.
    style: 'mapbox://styles/mapbox/satellite-v9',
    projection: 'globe',
    center: [133, 36],
    zoom: 1.6,
    attributionControl: true,
  });
  scene.on('style.load', () => {
    scene.addSource('dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 });
    scene.setTerrain({ source: 'dem', exaggeration: 1.4 });
    scene.setFog({
      color: 'rgb(186, 210, 235)',
      'high-color': 'rgb(36, 92, 223)',
      'horizon-blend': 0.03,
      'space-color': 'rgb(11, 11, 25)',
      'star-intensity': 0.6,
    });
  });
  // Any manual camera move stops the auto-orbit so the player can look around.
  for (const evt of ['mousedown', 'touchstart', 'wheel']) scene.on(evt, stopOrbit);

  guessMap = new mapboxgl.Map({
    container: 'guess-map',
    style: 'mapbox://styles/mapbox/light-v11',
    bounds: REGIONS.all.bounds,
    attributionControl: false,
  });
  guessMap.addControl(new mapboxgl.AttributionControl({ compact: true }));
  guessMap.on('style.load', () => {
    guessMap.addSource('beeline', { type: 'geojson', data: emptyFC() });
    guessMap.addSource('route', { type: 'geojson', data: emptyFC() });
    guessMap.addLayer({
      id: 'route', type: 'line', source: 'route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#2f7fe0', 'line-width': 4, 'line-opacity': 0.9 },
    });
    guessMap.addLayer({
      id: 'beeline', type: 'line', source: 'beeline',
      paint: { 'line-color': '#333', 'line-width': 2, 'line-dasharray': [2, 2] },
    });
  });
  guessMap.on('click', (e) => {
    if (state.phase !== 'guessing' && state.phase !== 'flying') return;
    state.guess = [e.lngLat.lng, e.lngLat.lat];
    guessMarker ??= new mapboxgl.Marker({ element: pin('guess') });
    guessMarker.setLngLat(state.guess).addTo(guessMap);
    $('submit-btn').disabled = false;
    $('guess-panel').classList.add('has-guess');
    $('guess-help').textContent = '다른 곳을 눌러 옮길 수 있어요';
    // The panel grows once a guess exists; keep the map canvas in sync.
    setTimeout(() => guessMap.resize(), 260);
  });
  $('guess-panel').addEventListener('transitionend', () => guessMap.resize());
}

function emptyFC() {
  return { type: 'FeatureCollection', features: [] };
}

function setLine(source, coordinates) {
  guessMap.getSource(source)?.setData(
    coordinates ? { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } } : emptyFC(),
  );
}

function pin(kind) {
  const el = document.createElement('div');
  el.className = `pin ${kind}`;
  return el;
}

function startOrbit() {
  stopOrbit();
  let last = performance.now();
  const step = (now) => {
    const dt = now - last;
    last = now;
    scene.setBearing(scene.getBearing() + dt * 0.006);
    orbitFrame = requestAnimationFrame(step);
  };
  orbitFrame = requestAnimationFrame(step);
}

function stopOrbit() {
  cancelAnimationFrame(orbitFrame);
  orbitFrame = 0;
}

// ---------- directions ----------

// Driving route from the guess to the answer. Returns null when there is no road
// connection (another island, open sea) or the request fails.
async function fetchDrivingRoute(from, to) {
  const coords = `${from.join(',')};${to.join(',')}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`
    + `?geometries=geojson&overview=full&access_token=${encodeURIComponent(mapboxgl.accessToken)}`;
  try {
    const res = await fetch(url);
    const body = await res.json();
    if (body.code !== 'Ok' || !body.routes?.length) return { ok: false, reason: body.code || res.status };
    const r = body.routes[0];
    return { ok: true, distanceKm: r.distance / 1000, durationSec: r.duration, coordinates: r.geometry.coordinates };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

// ---------- game flow ----------

function startGame(region) {
  state.region = region;
  state.rounds = pickRounds(PLACES, region, ROUNDS);
  state.index = 0;
  state.results = [];
  $('start').hidden = true;
  $('end').hidden = true;
  $('hud').hidden = false;
  $('guess-panel').hidden = false;
  guessMap.resize();
  startRound();
}

function startRound() {
  const place = state.rounds[state.index];
  state.guess = null;
  state.hintUsed = false;
  state.phase = 'flying';

  guessMarker?.remove();
  answerMarker?.remove();
  setLine('beeline', null);
  setLine('route', null);
  $('result').hidden = true;
  $('guess-panel').classList.remove('has-guess', 'reveal');
  $('submit-btn').disabled = true;
  $('guess-help').textContent = '지도를 눌러 위치를 찍으세요';
  $('hint-btn').hidden = false;
  $('hint-text').hidden = true;
  $('hud-round').textContent = `${state.index + 1} / ${state.rounds.length}`;
  $('hud-score').textContent = total().toLocaleString('ko-KR');

  guessMap.fitBounds(REGIONS[state.region].bounds, { padding: 10, duration: 0 });

  // Lock the camera near the landmark: zooming far out would give the coastline away.
  stopOrbit();
  scene.setMinZoom(0);
  scene.dragPan.enable();
  scene.flyTo({
    center: place.center,
    zoom: place.zoom,
    pitch: place.pitch,
    bearing: Math.random() * 360,
    duration: 5000,
    essential: true,
  });
  scene.once('moveend', () => {
    if (state.rounds[state.index] !== place) return;
    scene.setMinZoom(place.zoom - 1.5);
    scene.dragPan.disable();
    state.phase = 'guessing';
    startOrbit();
  });
}

function total() {
  return state.results.reduce((sum, r) => sum + r.score, 0);
}

async function submitGuess() {
  if (!state.guess) return;
  const place = state.rounds[state.index];
  state.phase = 'reveal';
  $('submit-btn').disabled = true;
  $('hint-btn').hidden = true;

  const km = distanceKm(state.guess, place.center);
  const score = scoreFor(km, REGIONS[state.region].scaleKm, state.hintUsed);
  state.results.push({ place, km, score, hintUsed: state.hintUsed });

  answerMarker = new mapboxgl.Marker({ element: pin('answer') }).setLngLat(place.center).addTo(guessMap);
  setLine('beeline', [state.guess, place.center]);
  $('guess-panel').classList.add('reveal');
  guessMap.resize();
  guessMap.fitBounds(new mapboxgl.LngLatBounds(state.guess, state.guess).extend(place.center), {
    padding: 50, maxZoom: 13, duration: 1200,
  });

  $('result-title').textContent = place.name;
  $('result-distance').textContent = formatDistance(km);
  $('result-score').textContent = `${score.toLocaleString('ko-KR')}점${state.hintUsed ? ' (힌트 사용)' : ''}`;
  $('result-route').textContent = '경로 찾는 중…';
  $('next-btn').textContent = state.index + 1 < state.rounds.length ? '다음 라운드' : '최종 결과';
  $('result').hidden = false;
  $('hud-score').textContent = total().toLocaleString('ko-KR');

  // Let the player look around freely once the answer is out.
  stopOrbit();
  scene.setMinZoom(0);
  scene.dragPan.enable();

  const route = await fetchDrivingRoute(state.guess, place.center);
  if (state.phase !== 'reveal' || state.rounds[state.index] !== place) return;
  if (route.ok) {
    setLine('route', route.coordinates);
    $('result-route').textContent = `${formatDistance(route.distanceKm)} · 차로 ${formatDuration(route.durationSec)}`;
  } else if (route.reason === 'NoRoute' || route.reason === 'NoSegment') {
    $('result-route').textContent = '도로로는 못 가요 (바다 건너편)';
  } else {
    $('result-route').textContent = '경로 정보를 불러오지 못했어요';
  }
}

function nextRound() {
  state.index += 1;
  if (state.index < state.rounds.length) startRound();
  else endGame();
}

function endGame() {
  state.phase = 'idle';
  $('result').hidden = true;
  $('guess-panel').hidden = true;
  $('hud').hidden = true;
  const sum = total();
  const max = MAX_SCORE * state.rounds.length;
  $('end-rank').textContent = rankFor(sum, max);
  $('end-total').textContent = `${sum.toLocaleString('ko-KR')} / ${max.toLocaleString('ko-KR')}점`;
  $('end-list').replaceChildren(...state.results.map((r) => {
    const li = document.createElement('li');
    const name = document.createElement('b');
    name.textContent = r.place.name;
    li.append(name, ` · ${formatDistance(r.km)} 차이 · ${r.score.toLocaleString('ko-KR')}점`);
    return li;
  }));
  $('end').hidden = false;
  scene.setMinZoom(0);
  scene.flyTo({ center: [133, 36], zoom: 1.6, pitch: 0, bearing: 0, duration: 4000 });
}

function showHint() {
  const place = state.rounds[state.index];
  state.hintUsed = true;
  $('hint-btn').hidden = true;
  $('hint-text').textContent = `힌트: ${place.hint}`;
  $('hint-text').hidden = false;
}

// ---------- boot ----------

function boot(token) {
  mapboxgl.accessToken = token;
  initMaps();
  $('start').hidden = false;
}

function wireUi() {
  document.querySelectorAll('[data-region]').forEach((btn) => {
    btn.addEventListener('click', () => startGame(btn.dataset.region));
  });
  $('submit-btn').addEventListener('click', submitGuess);
  $('next-btn').addEventListener('click', nextRound);
  $('hint-btn').addEventListener('click', showHint);
  $('again-btn').addEventListener('click', () => {
    $('end').hidden = true;
    $('start').hidden = false;
  });
  $('token-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const value = $('token-input').value.trim();
    if (!value.startsWith('pk.')) {
      $('token-error').textContent = '공개 토큰(pk.)만 쓸 수 있어요. 비밀 토큰(sk.)은 브라우저에 넣으면 안 돼요.';
      $('token-error').hidden = false;
      return;
    }
    storage((s) => s.setItem(TOKEN_KEY, value));
    $('token').hidden = true;
    boot(value);
  });
}

wireUi();
const token = resolveToken();
if (token) {
  boot(token);
} else {
  $('start').hidden = true;
  $('token').hidden = false;
}
