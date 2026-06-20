import type { WeatherData } from '@/types';

// ── KMA 격자 변환 ──
const G = { Re:6371.00877, grid:5.0, slat1:30.0, slat2:60.0, olon:126.0, olat:38.0, xo:43, yo:136 };
function latLngToGrid(lat: number, lng: number) {
  const { Re,grid,slat1,slat2,olon,olat,xo,yo } = G;
  const D=Math.PI/180, re=Re/grid;
  const s1=slat1*D,s2=slat2*D,ol=olat*D;
  const sn=Math.log(Math.cos(s1)/Math.cos(s2))/Math.log(Math.tan(Math.PI*.25+s2*.5)/Math.tan(Math.PI*.25+s1*.5));
  const sf=(Math.tan(Math.PI*.25+s1*.5)**sn)*Math.cos(s1)/sn;
  const ro=re*sf/(Math.tan(Math.PI*.25+ol*.5)**sn);
  const ra=re*sf/(Math.tan(Math.PI*.25+lat*D*.5)**sn);
  let theta=(lng-olon)*D*sn;
  if(theta>Math.PI)theta-=2*Math.PI; if(theta<-Math.PI)theta+=2*Math.PI;
  return { nx:Math.floor(ra*Math.sin(theta)+xo+.5), ny:Math.floor(ro-ra*Math.cos(theta)+yo+.5) };
}
const pad=(n: number)=>String(n).padStart(2,'0');
function fmtDate(d: Date){return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;}
function getNcstBaseTime(){const now=new Date();const m=now.getMinutes();let h=now.getHours();if(m<40){h-=1;if(h<0){h=23;now.setDate(now.getDate()-1);}}return{base_date:fmtDate(now),base_time:`${pad(h)}00`};}
function getFcstBaseTime(){const now=new Date();const m=now.getMinutes();let h=now.getHours(),bm=30;if(m<45){bm=0;if(m<15){h-=1;if(h<0){h=23;now.setDate(now.getDate()-1);}bm=30;}}return{base_date:fmtDate(now),base_time:`${pad(h)}${pad(bm)}`};}

// ── KMA ──
const KMA_BASE='/kma-api/api/typ02/openApi/VilageFcstInfoService_2.0';
const SKY_DESC: Record<number,string>={1:'맑음',3:'구름많음',4:'흐림'};
const SKY_ICON: Record<number,string>={1:'☀️',3:'⛅',4:'☁️'};
const PTY_DESC: Record<number,string|null>={0:null,1:'비',2:'비/눈',3:'눈',4:'소나기',5:'빗방울',6:'빗방울/눈날림',7:'눈날림'};
const PTY_ICON: Record<number,string|null>={0:null,1:'🌧️',2:'🌨️',3:'❄️',4:'🌦️',5:'🌦️',6:'🌨️',7:'❄️'};

async function kmaFetch(endpoint: string, extra: Record<string,unknown>) {
  const apiKey=import.meta.env.VITE_KMA_API_KEY;
  if(!apiKey)return null;
  const params=new URLSearchParams({authKey:apiKey,dataType:'JSON',numOfRows:'100',pageNo:'1',...Object.fromEntries(Object.entries(extra).map(([k,v])=>[k,String(v)]))});
  const res=await fetch(`${KMA_BASE}/${endpoint}?${params}`);
  if(!res.ok)throw new Error(`KMA ${endpoint} 오류: ${res.status}`);
  const json=await res.json();
  if(json?.response?.header?.resultCode!=='00')throw new Error(`KMA resultCode: ${json?.response?.header?.resultCode}`);
  return (json?.response?.body?.items?.item??[]) as Array<Record<string,string>>;
}

async function fetchKmaCurrent(lat: number, lng: number): Promise<Partial<WeatherData>|null> {
  const {nx,ny}=latLngToGrid(lat,lng);
  const [ncst,fcst]=await Promise.allSettled([
    kmaFetch('getUltraSrtNcst',{...getNcstBaseTime(),nx,ny}),
    kmaFetch('getUltraSrtFcst',{...getFcstBaseTime(),nx,ny,numOfRows:'60'}),
  ]);
  const obs=ncst.status==='fulfilled'?ncst.value:null;
  let fcs:Record<string,string>|null=null;
  if(fcst.status==='fulfilled'&&fcst.value){
    const sorted=[...fcst.value].sort((a,b)=>a.fcstTime.localeCompare(b.fcstTime));
    const first=sorted[0]?.fcstTime;
    fcs=Object.fromEntries(sorted.filter(i=>i.fcstTime===first).map(i=>[i.category,i.fcstValue]));
  }
  if(!obs&&!fcs)return null;
  const obsMap=obs?Object.fromEntries(obs.map(i=>[i.category,i.obsrValue])):{};
  const pty=parseInt((obsMap.PTY??fcs?.PTY??'0'));
  const sky=parseInt(fcs?.SKY??'1');
  const isRaining=pty>0;
  const rn1=obsMap.RN1;
  return {
    temperature:Math.round(parseFloat(obsMap.T1H??fcs?.T1H??'0')),
    humidity:parseInt(obsMap.REH??fcs?.REH??'0'),
    precipitation:(!rn1||rn1==='강수없음')?0:parseFloat(rn1)||0,
    windSpeed:Math.round(parseFloat(obsMap.WSD??'0')*3.6),
    description:isRaining?(PTY_DESC[pty]??'비'):(SKY_DESC[sky]??'맑음'),
    icon:isRaining?(PTY_ICON[pty]??'🌧️'):(SKY_ICON[sky]??'☀️'),
    isRaining, source:'KMA',
  };
}

// ── Open-Meteo ──
const WMO_DESC: Record<number,string>={0:'맑음',1:'대체로 맑음',2:'부분적으로 흐림',3:'흐림',45:'안개',48:'안개',51:'이슬비',53:'이슬비',55:'강한 이슬비',61:'약한 비',63:'비',65:'강한 비',71:'약한 눈',73:'눈',75:'강한 눈',80:'소나기',81:'소나기',82:'강한 소나기',95:'뇌우',96:'뇌우',99:'뇌우'};
const WMO_ICON: Record<number,string>={0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'🌨️',80:'🌦️',81:'🌧️',82:'⛈️',95:'⛈️',96:'⛈️',99:'⛈️'};

async function fetchOpenMeteo(lat: number, lng: number): Promise<Partial<WeatherData>> {
  const params=new URLSearchParams({latitude:String(lat),longitude:String(lng),current:'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',hourly:'precipitation_probability',forecast_days:'1',timezone:'Asia/Seoul'});
  const res=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if(!res.ok)throw new Error('Open-Meteo 오류');
  const data=await res.json();
  const cur=data.current;
  const code=cur.weather_code as number;
  const h=new Date().getHours();
  return {
    temperature:Math.round(cur.temperature_2m),
    humidity:cur.relative_humidity_2m,
    precipitation:cur.precipitation,
    windSpeed:Math.round(cur.wind_speed_10m),
    description:WMO_DESC[code]??'알 수 없음',
    icon:WMO_ICON[code]??'🌡️',
    precipProbability:data.hourly.precipitation_probability[h]??0,
    isRaining:[51,53,55,61,63,65,80,81,82,95,96,99].includes(code),
    source:'Open-Meteo',
  };
}

async function fetchDaily(lat: number, lng: number) {
  const params=new URLSearchParams({latitude:String(lat),longitude:String(lng),daily:'temperature_2m_max,temperature_2m_min,sunrise,sunset',forecast_days:'1',timezone:'Asia/Seoul'});
  const res=await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if(!res.ok)throw new Error('Open-Meteo daily 오류');
  const data=await res.json();
  return { tempMax:Math.round(data.daily.temperature_2m_max[0]), tempMin:Math.round(data.daily.temperature_2m_min[0]), sunrise:(data.daily.sunrise[0] as string).slice(-5), sunset:(data.daily.sunset[0] as string).slice(-5) };
}

async function fetchAirQuality(lat: number, lng: number) {
  const params=new URLSearchParams({latitude:String(lat),longitude:String(lng),current:'pm10,pm2_5',timezone:'Asia/Seoul'});
  const res=await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${params}`);
  if(!res.ok)throw new Error('Air quality 오류');
  const data=await res.json();
  return { pm10:Math.round(data.current.pm10??0), pm25:Math.round(data.current.pm2_5??0) };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  let current: Partial<WeatherData> | null = null;
  try { current=await fetchKmaCurrent(lat,lng); } catch(e) { console.warn('KMA 실패→ Open-Meteo:', (e as Error).message); }
  if (!current) current = await fetchOpenMeteo(lat, lng);
  if (!current) return null;

  const [daily,air]=await Promise.allSettled([fetchDaily(lat,lng),fetchAirQuality(lat,lng)]);
  return {
    ...current,
    ...(daily.status==='fulfilled'?daily.value:{}),
    ...(air.status==='fulfilled'?air.value:{}),
  } as WeatherData;
}
