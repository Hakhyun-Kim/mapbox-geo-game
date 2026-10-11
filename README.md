# 어디일까? — 한·일 3D 지오 게임 (Mapbox GL JS 데모)

3D 위성 화면만 보고 한국·일본 명소의 위치를 지도에 찍는 5라운드 게임입니다.
정답을 공개하면 내가 찍은 지점에서 정답까지의 **실제 운전 경로와 소요 시간**을 Directions API로 보여 줍니다.

## 쓰인 Mapbox 기능

| 기능 | 어디에 |
|---|---|
| Globe projection + Fog/별 하늘 | 시작 화면의 지구본, 라운드 사이 비행 |
| Satellite imagery (`satellite-v9`, 라벨 없음) | 정답 장소 3D 장면 — 지명이 안 보이게 |
| Terrain (`mapbox-terrain-dem-v1`, 1.4배 과장) | 한라산·후지산 같은 지형이 입체로 보임 |
| Camera API (`flyTo`, 자동 궤도 회전, minZoom 잠금) | 장소로 날아가 주변을 돌며 보여 주되, 너무 줌아웃해 해안선으로 답을 알 수 없게 |
| Markers + GeoJSON line layers | 추측·정답 핀, 직선 거리 점선, 운전 경로 |
| Directions API (`driving`) | 추측 지점 → 정답까지 도로 경로·거리·시간. 바다 건너면 `NoRoute`를 받아 안내 |

거리 계산(하버사인)과 점수(지수 감쇠, 300m 이내 만점, 힌트 사용 시 절반)는 `src/game.js`에 DOM 없이 분리돼 있고 `npm test`로 검증합니다.

## 플레이

https://hakhyun-kim.github.io/mapbox-geo-game/

## 토큰 설정 (배포)

1. [Mapbox 계정 → Tokens](https://account.mapbox.com/access-tokens/)에서 공개 토큰(`pk.`)을 만들고 **URL restrictions**에 `https://hakhyun-kim.github.io/mapbox-geo-game/`와 `http://localhost:5173/`를 넣습니다. 공개 토큰은 빌드된 JS에 그대로 들어가므로, 다른 사이트에서 못 쓰게 막는 건 이 URL 제한입니다.
2. 이 저장소 **Settings → Secrets and variables → Actions → New repository secret**: 이름 `MAPBOX_TOKEN`, 값 `pk....`
3. **Settings → Pages → Source: Deploy from a branch → `gh-pages` / root** (첫 배포 때 자동으로 켜지기도 함)
4. **Actions → Deploy to GitHub Pages → Run workflow** (이후엔 `main`에 push할 때마다 자동 배포)

## 실행 (로컬)

```bash
npm install
cp .env.example .env   # VITE_MAPBOX_TOKEN=pk.... 입력
npm run dev
```

토큰 없이 열면 화면에서 공개 토큰(`pk.`)을 입력받아 브라우저에만 저장합니다. 주소에 `?token=pk...`을 붙여도 됩니다.
비밀 토큰(`sk.`)은 거부합니다.

공개 배포(GitHub Pages 등) 시에는 Mapbox 계정에서 토큰의 **URL 제한**을 배포 주소로 걸어 두세요.

```bash
npm run build   # dist/ 를 정적 호스팅에 올리면 끝 (base: './')
```

## 구조

```
src/places.js   명소 21곳 (한국 10 · 일본 11) + 지역별 경계·점수 스케일
src/game.js     순수 로직: 거리, 점수, 라운드 추첨, 포맷
src/main.js     지도 두 개(3D 장면 + 추측 지도)와 게임 흐름
```
