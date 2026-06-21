export interface CctvSpot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  url: string;   // 영상 또는 현황 페이지 링크
}

// 서울시 한강사업본부 CCTV 및 수자원공사 CCTV 주요 지점
// 영상: 홍수통제소(hrfco.go.kr) 또는 서울시 하천정보시스템(river.seoul.go.kr)
// 홍수통제소 주요지점 수위동영상 페이지
const HRFCO = 'https://www.hrfco.go.kr/sumun/cctvRtmp.do';

export const CCTV_SPOTS: CctvSpot[] = [
  // ── 한강 본류 ──
  { id: 'cctv-gwangjin',  name: '광진교 CCTV',    lat: 37.5456, lng: 127.1103, url: HRFCO },
  { id: 'cctv-cheongdam', name: '청담대교 CCTV',   lat: 37.5231, lng: 127.0628, url: HRFCO },
  { id: 'cctv-jamsu',     name: '잠수교 CCTV',    lat: 37.5172, lng: 126.9953, url: HRFCO },
  { id: 'cctv-hangang',   name: '한강대교 CCTV',   lat: 37.5144, lng: 126.9567, url: HRFCO },
  { id: 'cctv-yeongdong', name: '영동대교 CCTV',   lat: 37.5290, lng: 127.0500, url: HRFCO },
  { id: 'cctv-dongho',    name: '동호대교 CCTV',   lat: 37.5225, lng: 127.0083, url: HRFCO },
  { id: 'cctv-wonhyo',    name: '원효대교 CCTV',   lat: 37.5236, lng: 126.9447, url: HRFCO },
  { id: 'cctv-yanghwa',   name: '양화대교 CCTV',   lat: 37.5413, lng: 126.9036, url: HRFCO },
  { id: 'cctv-gayang',    name: '가양대교 CCTV',   lat: 37.5700, lng: 126.8618, url: HRFCO },
  // ── 중랑천 ──
  { id: 'cctv-wolge',     name: '중랑천 월계2교 CCTV', lat: 37.6242, lng: 127.0500, url: HRFCO },
  { id: 'cctv-jungnang',  name: '중랑천 중랑교 CCTV',  lat: 37.5925, lng: 127.0706, url: HRFCO },
  // ── 안양천 ──
  { id: 'cctv-ogeum',     name: '안양천 오금교 CCTV',  lat: 37.5083, lng: 126.8742, url: HRFCO },
  // ── 탄천 ──
  { id: 'cctv-daechi',    name: '탄천 대치교 CCTV',   lat: 37.4983, lng: 127.0744, url: HRFCO },
];
