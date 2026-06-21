export type TrackType = '육상트랙' | '한강코스' | '공원코스' | '산악코스';

export interface RunningSpot {
  id: string;
  name: string;
  type: TrackType;
  lat: number;
  lng: number;
  distanceKm?: number;   // 코스 총 거리 (트랙은 0.4)
  surface?: string;      // 'tartan' | 'asphalt' | 'dirt'
  note?: string;
  accessible: boolean;   // 일반인 접근 가능 여부
}

export const RUNNING_SPOTS: RunningSpot[] = [
  // ── 육상 트랙 (400m 공식) ──
  {
    id: 'jamsil-aux',
    name: '잠실보조경기장',
    type: '육상트랙',
    lat: 37.5118, lng: 127.0741,
    distanceKm: 0.4, surface: 'tartan',
    note: '무료 개방, 서울 대표 공개 트랙',
    accessible: true,
  },
  {
    id: 'mokdong',
    name: '목동종합운동장 트랙',
    type: '육상트랙',
    lat: 37.5280, lng: 126.8750,
    distanceKm: 0.4, surface: 'tartan',
    note: '유료 사용 가능',
    accessible: true,
  },
  {
    id: 'worldcup-aux',
    name: '서울월드컵경기장 보조경기장',
    type: '육상트랙',
    lat: 37.5696, lng: 126.8975,
    distanceKm: 0.4, surface: 'tartan',
    note: '상암동',
    accessible: true,
  },
  {
    id: 'olympic-stadium-aux',
    name: '올림픽공원 육상경기장',
    type: '육상트랙',
    lat: 37.5178, lng: 127.1222,
    distanceKm: 0.4, surface: 'tartan',
    note: '올림픽공원 내',
    accessible: true,
  },
  {
    id: 'dongdaemun',
    name: '동대문구 육상경기장',
    type: '육상트랙',
    lat: 37.5774, lng: 127.0432,
    distanceKm: 0.4, surface: 'tartan',
    accessible: true,
  },
  {
    id: 'mapo',
    name: '마포구민체육센터 트랙',
    type: '육상트랙',
    lat: 37.5486, lng: 126.9129,
    distanceKm: 0.4, surface: 'tartan',
    accessible: true,
  },

  // ── 한강 러닝 코스 ──
  {
    id: 'hangang-yeouido',
    name: '여의도 한강공원 코스',
    type: '한강코스',
    lat: 37.5283, lng: 126.9332,
    distanceKm: 7.0,
    note: '여의도 일주 약 7km, 평탄 포장',
    accessible: true,
  },
  {
    id: 'hangang-ttukseom',
    name: '뚝섬 한강공원 코스',
    type: '한강코스',
    lat: 37.5311, lng: 127.0687,
    distanceKm: 5.5,
    note: '성수대교~잠실대교, 야경 명소',
    accessible: true,
  },
  {
    id: 'hangang-jamsil',
    name: '잠실 한강공원 코스',
    type: '한강코스',
    lat: 37.5173, lng: 127.0921,
    distanceKm: 4.0,
    accessible: true,
  },
  {
    id: 'hangang-banpo',
    name: '반포 한강공원 코스',
    type: '한강코스',
    lat: 37.5106, lng: 126.9971,
    distanceKm: 5.0,
    note: '반포대교 무지개분수 구간',
    accessible: true,
  },
  {
    id: 'hangang-mangwon',
    name: '망원 한강공원 코스',
    type: '한강코스',
    lat: 37.5498, lng: 126.9057,
    distanceKm: 4.5,
    accessible: true,
  },

  // ── 공원 코스 ──
  {
    id: 'olympic-park',
    name: '올림픽공원 일주로',
    type: '공원코스',
    lat: 37.5204, lng: 127.1224,
    distanceKm: 5.6,
    note: '포장 일주로, 송파구 대표 코스',
    accessible: true,
  },
  {
    id: 'seoul-forest',
    name: '서울숲 코스',
    type: '공원코스',
    lat: 37.5474, lng: 127.0375,
    distanceKm: 3.0,
    note: '뚝섬역 인근, 그늘 코스',
    accessible: true,
  },
  {
    id: 'boramae',
    name: '보라매공원 코스',
    type: '공원코스',
    lat: 37.4938, lng: 126.9230,
    distanceKm: 2.5,
    note: '신대방역 인근',
    accessible: true,
  },
  {
    id: 'bukseoul',
    name: '북서울꿈의숲 코스',
    type: '공원코스',
    lat: 37.6200, lng: 127.0526,
    distanceKm: 3.5,
    note: '창동·방학 인근, 언덕 있음',
    accessible: true,
  },
  {
    id: 'worldcup-park',
    name: '월드컵공원(하늘공원) 코스',
    type: '공원코스',
    lat: 37.5684, lng: 126.8973,
    distanceKm: 4.0,
    note: '노을공원 포함 능선 코스',
    accessible: true,
  },
  {
    id: 'seonjeongneung',
    name: '선릉·정릉 코스',
    type: '공원코스',
    lat: 37.5087, lng: 127.0469,
    distanceKm: 2.0,
    note: '역삼 인근, 흙길 포함',
    accessible: true,
  },

  // ── 산악 코스 ──
  {
    id: 'namsan',
    name: '남산 순환 코스',
    type: '산악코스',
    lat: 37.5512, lng: 126.9882,
    distanceKm: 6.8,
    note: '순환 포장도로, 경사 있음',
    accessible: true,
  },
  {
    id: 'bukhansan-ui',
    name: '북한산 우이령 코스',
    type: '산악코스',
    lat: 37.6587, lng: 126.9906,
    distanceKm: 6.8,
    note: '사전 예약 필요',
    accessible: true,
  },
  {
    id: 'acha-mountain',
    name: '아차산 둘레길',
    type: '산악코스',
    lat: 37.5543, lng: 127.1051,
    distanceKm: 5.0,
    note: '광진구, 흙길 위주',
    accessible: true,
  },
];

export const TRACK_TYPE_CONFIG: Record<TrackType, { color: string; emoji: string; label: string }> = {
  '육상트랙': { color: '#7c3aed', emoji: '🏟️', label: '육상 트랙' },
  '한강코스': { color: '#0ea5e9', emoji: '🌊', label: '한강 코스' },
  '공원코스': { color: '#22c55e', emoji: '🌳', label: '공원 코스' },
  '산악코스': { color: '#f97316', emoji: '⛰️', label: '산악 코스' },
};
