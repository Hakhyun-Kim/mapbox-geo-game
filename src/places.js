// Landmarks used as rounds. center is [lng, lat]; zoom/pitch frame the 3D orbit shot.
// hint is a category only, so the satellite view stays the main clue.
export const PLACES = [
  // Korea
  { id: 'gyeongbokgung', region: 'kr', name: '경복궁', hint: '궁궐', center: [126.977, 37.5796], zoom: 16.2, pitch: 62 },
  { id: 'namsan-tower', region: 'kr', name: 'N서울타워', hint: '전망 타워', center: [126.9882, 37.5512], zoom: 16, pitch: 65 },
  { id: 'lotte-tower', region: 'kr', name: '롯데월드타워', hint: '초고층 빌딩', center: [127.1025, 37.5126], zoom: 16, pitch: 68 },
  { id: 'gwangan-bridge', region: 'kr', name: '광안대교', hint: '다리', center: [129.129, 35.1475], zoom: 14.6, pitch: 60 },
  { id: 'seongsan', region: 'kr', name: '성산일출봉', hint: '분화구', center: [126.9425, 33.4581], zoom: 14.8, pitch: 62 },
  { id: 'hallasan', region: 'kr', name: '한라산 백록담', hint: '산 정상', center: [126.5292, 33.3617], zoom: 13.2, pitch: 65 },
  { id: 'bulguksa', region: 'kr', name: '불국사', hint: '사찰', center: [129.332, 35.79], zoom: 16.5, pitch: 60 },
  { id: 'icn', region: 'kr', name: '인천국제공항', hint: '공항', center: [126.4407, 37.4602], zoom: 13.4, pitch: 55 },
  { id: 'hwaseong', region: 'kr', name: '수원 화성 행궁', hint: '성곽 도시', center: [127.0136, 37.2818], zoom: 15.6, pitch: 60 },
  { id: 'hahoe', region: 'kr', name: '안동 하회마을', hint: '전통 마을', center: [128.518, 36.539], zoom: 15.4, pitch: 60 },

  // Japan
  { id: 'tokyo-tower', region: 'jp', name: '도쿄 타워', hint: '전망 타워', center: [139.7454, 35.6586], zoom: 16, pitch: 65 },
  { id: 'shibuya', region: 'jp', name: '시부야 스크램블 교차로', hint: '교차로', center: [139.7005, 35.6595], zoom: 17, pitch: 60 },
  { id: 'skytree', region: 'jp', name: '도쿄 스카이트리', hint: '전망 타워', center: [139.8107, 35.7101], zoom: 16, pitch: 68 },
  { id: 'fuji', region: 'jp', name: '후지산', hint: '산 정상', center: [138.7274, 35.3606], zoom: 12, pitch: 70 },
  { id: 'osaka-castle', region: 'jp', name: '오사카성', hint: '성', center: [135.5262, 34.6873], zoom: 15.8, pitch: 60 },
  { id: 'fushimi-inari', region: 'jp', name: '후시미 이나리 신사', hint: '신사', center: [135.7727, 34.9671], zoom: 16, pitch: 62 },
  { id: 'kinkakuji', region: 'jp', name: '긴카쿠지 (금각사)', hint: '사찰', center: [135.7292, 35.0394], zoom: 16.5, pitch: 60 },
  { id: 'itsukushima', region: 'jp', name: '이쓰쿠시마 신사', hint: '바다 위 신사', center: [132.3198, 34.296], zoom: 16, pitch: 60 },
  { id: 'himeji', region: 'jp', name: '히메지성', hint: '성', center: [134.6939, 34.8394], zoom: 16, pitch: 62 },
  { id: 'kix', region: 'jp', name: '간사이 국제공항', hint: '공항', center: [135.2304, 34.432], zoom: 13.4, pitch: 55 },
  { id: 'todaiji', region: 'jp', name: '나라 도다이지', hint: '사찰', center: [135.8398, 34.689], zoom: 16.2, pitch: 60 },
];

// bounds: [[west, south], [east, north]] for the guess map.
// scaleKm: distance at which a round's score drops to ~37% of the max.
export const REGIONS = {
  kr: { label: '한국', bounds: [[124.5, 33.0], [131.0, 38.7]], scaleKm: 60 },
  jp: { label: '일본', bounds: [[129.5, 30.8], [146.0, 45.6]], scaleKm: 150 },
  all: { label: '한국 + 일본', bounds: [[124.5, 30.8], [146.0, 45.6]], scaleKm: 150 },
};
