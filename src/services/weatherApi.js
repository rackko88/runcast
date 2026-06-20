// 기상청 단기예보 API v2.0 (apihub.kma.go.kr) + Open-Meteo fallback

// ──────────────────────────────────────────────
// 위경도 → KMA 격자(nx/ny) 변환
// ──────────────────────────────────────────────
const GRID = { Re:6371.00877, grid:5.0, slat1:30.0, slat2:60.0, olon:126.0, olat:38.0, xo:43, yo:136 };

function latLngToGrid(lat, lng) {
  const { Re, grid, slat1, slat2, olon, olat, xo, yo } = GRID;
  const D = Math.PI / 180;
  const re = Re / grid;
  const s1 = slat1*D, s2 = slat2*D, ol = olat*D;
  const sn = Math.log(Math.cos(s1)/Math.cos(s2)) / Math.log(Math.tan(Math.PI*.25+s2*.5)/Math.tan(Math.PI*.25+s1*.5));
  const sf = (Math.tan(Math.PI*.25+s1*.5)**sn) * Math.cos(s1) / sn;
  const ro = re * sf / (Math.tan(Math.PI*.25+ol*.5)**sn);
  const ra = re * sf / (Math.tan(Math.PI*.25+lat*D*.5)**sn);
  let theta = (lng - olon) * D * sn;
  if (theta > Math.PI) theta -= 2*Math.PI;
  if (theta < -Math.PI) theta += 2*Math.PI;
  return {
    nx: Math.floor(ra*Math.sin(theta) + xo + .5),
    ny: Math.floor(ro - ra*Math.cos(theta) + yo + .5),
  };
}

const pad = n => String(n).padStart(2, '0');

function fmtDate(d) {
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
}

// 초단기실황 발표: 매 시각 40분 이후 사용 가능 → 현재 시각 기준 base_time 계산
function getNcstBaseTime() {
  const now = new Date();
  const m = now.getMinutes();
  let h = now.getHours();
  // 40분 이전이면 1시간 전 자료 사용
  if (m < 40) {
    h -= 1;
    if (h < 0) { h = 23; now.setDate(now.getDate() - 1); }
  }
  return { base_date: fmtDate(now), base_time: `${pad(h)}00` };
}

// 초단기예보 발표: 매 30분 기준 → 45분 이후 사용 가능
function getFcstBaseTime() {
  const now = new Date();
  const m = now.getMinutes();
  let h = now.getHours();
  // 45분 이전이면 이전 30분 발표본
  const baseMin = m >= 45 ? 30 : 0;
  if (baseMin === 30 && m < 45) {
    // 현재 시간의 00분 발표본 사용 가능 여부
  }
  // 단순하게: 현재 시각 30분 이전이면 전 시각 30분, 아니면 현 시각 00분
  let baseHour = h;
  let baseMinute = 30;
  if (m < 45) {
    baseMinute = 0;
    if (m < 15) {
      baseHour = h - 1;
      if (baseHour < 0) { baseHour = 23; now.setDate(now.getDate() - 1); }
      baseMinute = 30;
    }
  }
  return { base_date: fmtDate(now), base_time: `${pad(baseHour)}${pad(baseMinute)}` };
}

// ──────────────────────────────────────────────
// KMA API 공통 호출
// ──────────────────────────────────────────────
const KMA_BASE = '/kma-api/api/typ02/openApi/VilageFcstInfoService_2.0';

async function kmaFetch(endpoint, extra) {
  const apiKey = import.meta.env.VITE_KMA_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({ authKey: apiKey, dataType: 'JSON', numOfRows: 100, pageNo: 1, ...extra });
  const res = await fetch(`${KMA_BASE}/${endpoint}?${params}`);
  if (!res.ok) throw new Error(`KMA ${endpoint} 오류: ${res.status}`);
  const json = await res.json();
  const code = json?.response?.header?.resultCode;
  if (code !== '00') throw new Error(`KMA resultCode: ${code} — ${json?.response?.header?.resultMsg}`);
  return json?.response?.body?.items?.item ?? [];
}

// ──────────────────────────────────────────────
// 초단기실황 (getUltraSrtNcst)
// categories: T1H 기온, RN1 강수량, REH 습도, PTY 강수형태, WSD 풍속, VEC 풍향
// ──────────────────────────────────────────────
async function fetchNcst(nx, ny) {
  const { base_date, base_time } = getNcstBaseTime();
  const items = await kmaFetch('getUltraSrtNcst', { base_date, base_time, nx, ny });
  if (!items) return null;
  return Object.fromEntries(items.map(i => [i.category, i.obsrValue]));
}

// ──────────────────────────────────────────────
// 초단기예보 (getUltraSrtFcst)
// categories: SKY 하늘상태, PTY 강수형태, T1H 기온, RN1 강수량, REH 습도, LGT 낙뢰
// ──────────────────────────────────────────────
async function fetchUltraFcst(nx, ny) {
  const { base_date, base_time } = getFcstBaseTime();
  const items = await kmaFetch('getUltraSrtFcst', { base_date, base_time, nx, ny, numOfRows: 60 });
  if (!items) return null;
  // 가장 가까운 예보 시각의 데이터만 추출
  const sorted = [...items].sort((a, b) => a.fcstTime.localeCompare(b.fcstTime));
  const firstTime = sorted[0]?.fcstTime;
  const current = sorted.filter(i => i.fcstTime === firstTime);
  return Object.fromEntries(current.map(i => [i.category, i.fcstValue]));
}

// ──────────────────────────────────────────────
// 변환 테이블
// ──────────────────────────────────────────────
const SKY_DESC = { 1:'맑음', 3:'구름많음', 4:'흐림' };
const SKY_ICON = { 1:'☀️', 3:'⛅', 4:'☁️' };
const PTY_DESC = { 0:null, 1:'비', 2:'비/눈', 3:'눈', 4:'소나기', 5:'빗방울', 6:'빗방울/눈날림', 7:'눈날림' };
const PTY_ICON = { 0:null, 1:'🌧️', 2:'🌨️', 3:'❄️', 4:'🌦️', 5:'🌦️', 6:'🌨️', 7:'❄️' };

async function fetchKmaWeather(lat, lng) {
  const { nx, ny } = latLngToGrid(lat, lng);

  const [ncst, fcst] = await Promise.allSettled([fetchNcst(nx, ny), fetchUltraFcst(nx, ny)]);

  const obs = ncst.status === 'fulfilled' ? ncst.value : null;
  const fcs = fcst.status === 'fulfilled' ? fcst.value : null;
  if (!obs && !fcs) return null;

  const pty  = parseInt((obs?.PTY ?? fcs?.PTY) ?? 0);
  const sky  = parseInt(fcs?.SKY ?? 1);
  const isRaining = pty > 0;
  const description = isRaining ? PTY_DESC[pty] : (SKY_DESC[sky] ?? '맑음');
  const icon        = isRaining ? PTY_ICON[pty] : (SKY_ICON[sky] ?? '☀️');

  const rn1 = obs?.RN1;
  const precipitation = (!rn1 || rn1 === '강수없음') ? 0 : parseFloat(rn1) || 0;

  return {
    temperature:      Math.round(parseFloat(obs?.T1H ?? fcs?.T1H ?? 0)),
    humidity:         parseInt(obs?.REH ?? fcs?.REH ?? 0),
    precipitation,
    windSpeed:        Math.round(parseFloat(obs?.WSD ?? 0) * 3.6), // m/s → km/h
    description,
    icon,
    precipProbability: null, // 초단기실황엔 없음 (단기예보에만 있음)
    precipNext3h:     null,
    isRaining,
    source:           'KMA',
  };
}

// ──────────────────────────────────────────────
// Open-Meteo fallback (API 키 불필요)
// ──────────────────────────────────────────────
const WMO_DESC = {
  0:'맑음',1:'대체로 맑음',2:'부분적으로 흐림',3:'흐림',
  45:'안개',48:'안개',
  51:'이슬비',53:'이슬비',55:'강한 이슬비',
  61:'약한 비',63:'비',65:'강한 비',
  71:'약한 눈',73:'눈',75:'강한 눈',
  80:'소나기',81:'소나기',82:'강한 소나기',
  95:'뇌우',96:'뇌우',99:'뇌우',
};
const WMO_ICON = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',
  45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',
  61:'🌧️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'🌨️',75:'🌨️',
  80:'🌦️',81:'🌧️',82:'⛈️',
  95:'⛈️',96:'⛈️',99:'⛈️',
};

async function fetchOpenMeteoWeather(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lng,
    current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    hourly: 'precipitation_probability,precipitation',
    forecast_days: 1,
    timezone: 'Asia/Seoul',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error('Open-Meteo 오류');
  const data = await res.json();
  const cur = data.current;
  const code = cur.weather_code;
  const h = new Date().getHours();
  return {
    temperature:      Math.round(cur.temperature_2m),
    humidity:         cur.relative_humidity_2m,
    precipitation:    cur.precipitation,
    windSpeed:        Math.round(cur.wind_speed_10m),
    description:      WMO_DESC[code] ?? '알 수 없음',
    icon:             WMO_ICON[code] ?? '🌡️',
    precipProbability: data.hourly.precipitation_probability[h] ?? 0,
    precipNext3h:     Math.round(data.hourly.precipitation.slice(h, h+3).reduce((a,b)=>a+b,0)*10)/10,
    isRaining:        [51,53,55,61,63,65,80,81,82,95,96,99].includes(code),
    source:           'Open-Meteo',
  };
}

// ──────────────────────────────────────────────
// export: KMA 우선, 실패 시 Open-Meteo
// ──────────────────────────────────────────────
export async function fetchWeather(lat, lng) {
  try {
    const kma = await fetchKmaWeather(lat, lng);
    if (kma) return kma;
  } catch (e) {
    console.warn('KMA 실패 → Open-Meteo 전환:', e.message);
  }
  return fetchOpenMeteoWeather(lat, lng);
}
