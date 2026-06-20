// 한강홍수통제소 API
// 키 발급: https://www.hrfco.go.kr/web/openapiPage/certifyKey.do
// 회원가입 없이 이메일 인증만으로 발급 (무료)
// 엔드포인트: https://api.hrfco.go.kr/{key}/waterlevel/list/10M.json?Wlobscd={코드}

const API_KEY = import.meta.env.VITE_HRFCO_API_KEY;

async function fetchHrfco(path) {
  const res = await fetch(`/hrfco-api/${API_KEY}/${path}`);
  if (!res.ok) throw new Error(`HRFCO API 오류: ${res.status}`);
  return res.json();
}

export async function fetchWaterLevels(stationIds) {
  if (!API_KEY) return getMockData(stationIds);

  // 전체 수위 조회 후 필요한 관측소만 필터링 (10분 단위)
  const data = await fetchHrfco('waterlevel/list/10M.json');
  const items = data?.content ?? [];

  // 관측소 코드 → 최신 수위 매핑
  const levelMap = {};
  for (const item of items) {
    const code = item.WLOBSCD;
    if (!levelMap[code]) {
      levelMap[code] = parseFloat(item.WL);
    }
  }

  return stationIds.map(id => ({
    stationId: id,
    waterLevel: levelMap[id] ?? null,
    isMock: false,
  }));
}

export async function fetchStationLevel(stationId) {
  if (!API_KEY) return null;
  const data = await fetchHrfco(`waterlevel/list/10M.json?Wlobscd=${stationId}`);
  const latest = data?.content?.[0];
  return latest ? parseFloat(latest.WL) : null;
}

function getMockData(stationIds) {
  const mockLevels = {
    '1018680': 0.42, '1018660': 0.38,
    '1018290': 1.82, '1018280': 1.54, '1018670': 1.23,
    '1017680': 3.21, '1017770': 2.87, '1017650': 3.05,
    '1018490': 0.95, '1018000': 0.61,
  };
  return stationIds.map(id => ({
    stationId: id,
    waterLevel: mockLevels[id] ?? 0.5,
    isMock: true,
  }));
}
