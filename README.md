# 어디일까? (Where is it?) — a 3D geo-guessing game on Mapbox GL JS

**Play:** https://hakhyun-kim.github.io/mapbox-geo-game/

You are dropped into an unlabeled 3D satellite view of a landmark somewhere in Korea or Japan.
Find it on the map. When the answer is revealed, the game also asks the Directions API how long it
would actually take to **drive** from your guess to the answer — or tells you there is no road,
because the answer is across the sea.

> 3D 위성 화면만 보고 한국·일본 명소의 위치를 지도에 찍는 5라운드 게임입니다.
> 정답을 공개하면 내가 찍은 지점에서 정답까지의 실제 운전 경로와 소요 시간을 보여 줍니다.

## How a round works

1. **Fly-in.** The camera flies from the globe to the landmark (`flyTo`) and starts a slow orbit over
   3D terrain. Satellite imagery without labels (`satellite-v9`) is the only clue.
2. **Guess.** Click a point on the 2D guess map. A category hint is available for half the points.
3. **Reveal.** The answer pin, a straight-line distance, and the driving route from the guess to the
   answer are drawn on the guess map. Score falls off exponentially with distance (5,000 max per round).

Regions: Korea, Japan, or both — 21 landmarks in total.

## Mapbox features used

| Feature | Where it shows up |
|---|---|
| Globe projection, fog and star sky | Start screen and the flights between rounds |
| Satellite imagery (`satellite-v9`) | The landmark scene, with no labels to give the answer away |
| Terrain (`mapbox-terrain-dem-v1`, 1.4× exaggeration) | Mountains such as Hallasan and Fuji read as real 3D shapes |
| Camera API (`flyTo`, bearing orbit, `minZoom` lock, `dragPan` toggle) | Shows the surroundings but stops the player zooming out to read the coastline |
| Markers and GeoJSON line layers | Guess and answer pins, the dashed straight line, the driving route |
| Directions API (`mapbox/driving`, GeoJSON geometry) | Route, distance and duration from guess to answer; `NoRoute` / `NoSegment` handled as "no road connection" |

## Design notes

- **Logic is separated from the map.** Distance (haversine), scoring, round selection and formatting
  live in `src/game.js` with no DOM or map dependency, and are covered by `npm test`. A test also
  checks that every landmark lies inside its region's bounds.
- **Stale responses are ignored.** A Directions response that arrives after the player has moved on
  to the next round is dropped instead of drawing over the new round.
- **Token safety.** The access token is inlined into the public bundle, so the build refuses anything
  that is not a public `pk.*` token, and the in-page token form rejects `sk.*` tokens. Deployment uses
  a Pages artifact, so the built bundle is never committed to git.

## Run locally

```bash
npm install
cp .env.example .env     # set VITE_MAPBOX_TOKEN=pk....
npm run dev
npm test                 # game logic tests
```

Without a build-time token, the page asks for a public token and keeps it in that browser only.
Appending `?token=pk...` to the URL also works.

## Deploy (GitHub Pages)

1. Add a repository secret `MAPBOX_TOKEN` with a Mapbox **public** token (`pk.*`).
   If you create a dedicated token, restrict it to your Pages URL in the Mapbox account.
2. Settings → Pages → Source: **GitHub Actions**.
3. Push to `main` (or run the "Deploy to GitHub Pages" workflow). Tests run before the build.

## Project layout

```
src/places.js   21 landmarks (Korea 10, Japan 11) and per-region bounds / score scale
src/game.js     pure game logic: distance, score, round picking, formatting
src/main.js     the two maps (3D scene + guess map) and the game flow
.github/workflows/pages.yml   test → build → deploy to Pages
```

Built with [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) and Vite.
