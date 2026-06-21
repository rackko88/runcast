import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import styled from '@emotion/styled';
import { RIVER_PATHS, RIVER_COLORS } from '../river/rivers';
import { RUNNING_SPOTS, TRACK_TYPE_CONFIG } from '../track/tracks';
import { CCTV_SPOTS } from '../cctv/cctvs';
import type { RiverStation, RiverStatus } from '@/types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { kakao: any; }
}

let sdkPromise: Promise<unknown> | null = null;
function loadKakaoSDK() {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    if (window.kakao?.maps?.Map) { resolve(window.kakao.maps); return; }
    const key = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;
    if (!key) { reject(new Error('VITE_KAKAO_MAP_KEY 없음')); return; }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = () => (window.kakao.maps.load(() => resolve(window.kakao.maps)));
    script.onerror = () => reject(new Error('카카오 SDK 로드 실패'));
    document.head.appendChild(script);
  });
  return sdkPromise;
}

function getRiverStatus(riverName: string, riverData: RiverStation[]): RiverStatus {
  const stations = riverData.filter(s => s.river === riverName);
  for (const s of ['통제', '위험', '경계', '주의', '정상'] as RiverStatus[]) {
    if (stations.some(st => st.status === s)) return s;
  }
  return '정상';
}

const MapWrapper = styled.div`position: relative; width: 100%; height: 100%;`;
const MapContainer = styled.div`width: 100%; height: 100%;`;
const MapLayerPanel = styled.div`
  position: absolute; top: 12px; left: 12px; z-index: 100;
  background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
  border-radius: 14px; padding: 10px 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.14);
  display: flex; flex-direction: column; gap: 8px; min-width: 110px;
`;
const LayerTitle = styled.div`
  font-size: 10px; font-weight: 700; color: #8B95A1; letter-spacing: 0.4px; text-transform: uppercase;
  padding-bottom: 4px; border-bottom: 1px solid #F2F4F6;
`;
const ToggleChip = styled.label`
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600; color: #333;
  cursor: pointer; user-select: none;
`;
const LocBtn = styled.button`
  position: absolute; bottom: 16px; right: 16px; z-index: 100;
  width: 44px; height: 44px; border-radius: 50%;
  background: #fff; border: none;
  box-shadow: 0 2px 14px rgba(0,0,0,0.18);
  cursor: pointer; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.12s;
  &:active { transform: scale(0.92); }
`;

interface Props {
  location: { lat: number; lng: number } | null;
  riverData: RiverStation[];
  moveToRef?: React.MutableRefObject<((lat: number, lng: number) => void) | null>;
  getMapCenterRef?: React.MutableRefObject<(() => { lat: number; lng: number } | null) | null>;
}

export default function MapView({ location, riverData, moveToRef, getMapCenterRef }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<unknown>(null);
  const overlayRef = useRef<unknown>(null);
  const [mapReady, setMapReady]     = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [showCctv, setShowCctv]     = useState(false);

  useEffect(() => {
    if (mapInst.current || !mapRef.current) return;
    let cancelled = false;
    loadKakaoSDK()
      .then((K: unknown) => {
        if (cancelled || mapInst.current || !mapRef.current) return;
        const maps = K as typeof window.kakao.maps;
        const map = new maps.Map(mapRef.current, { center: new maps.LatLng(37.5665, 126.978), level: 6 });
        mapInst.current = map;
        overlayRef.current = new maps.CustomOverlay({ zIndex: 10, yAnchor: 1.15 });
        maps.event.addListener(map, 'click', () => (overlayRef.current as { setMap: (v: null) => void }).setMap(null));
        setMapReady(true);
      })
      .catch(err => console.error('지도 초기화 실패:', err));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const ro = new ResizeObserver(() => (mapInst.current as { relayout: () => void })?.relayout());
    ro.observe(mapRef.current);
    return () => ro.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (!mapReady || !location) return;
    const K = window.kakao.maps;
    const map = mapInst.current;
    const marker = new K.CustomOverlay({
      position: new K.LatLng(location.lat, location.lng),
      content: '<div class="user-dot"></div>',
      map, zIndex: 20,
    });
    (map as { setCenter: (v: unknown) => void }).setCenter(new K.LatLng(location.lat, location.lng));
    return () => marker.setMap(null);
  }, [mapReady, location]);

  useEffect(() => {
    if (!mapReady) return;
    const K = window.kakao.maps;
    const map = mapInst.current;
    const overlays: { setMap: (v: null) => void }[] = [];
    const polylines: { setMap: (v: null) => void }[] = [];

    function showPopup(html: string, position: unknown) {
      const ov = overlayRef.current as { setContent: (h: HTMLElement) => void; setPosition: (p: unknown) => void; setMap: (v: unknown) => void };
      const el = document.createElement('div');
      el.innerHTML = html;
      K.event.preventMap(el);
      ov.setContent(el);
      ov.setPosition(position);
      ov.setMap(map);
    }

    Object.entries(RIVER_PATHS).forEach(([name, coords]) => {
      const status = getRiverStatus(name, riverData);
      const color  = RIVER_COLORS[status];
      const path   = coords.map(([la, ln]) => new K.LatLng(la, ln));

      const line = new K.Polyline({ map, path, strokeWeight: name === '한강' ? 5 : 3, strokeColor: color, strokeOpacity: 0.85, strokeStyle: 'solid' });
      const hit  = new K.Polyline({ map, path, strokeWeight: 20, strokeColor: '#fff', strokeOpacity: 0 });

      const stations = riverData.filter(s => s.river === name);
      const rows = stations.map(s => `
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F2F4F6;">
          <span style="font-size:13px;color:#333">${s.name}</span>
          <span style="font-size:13px;font-weight:600;color:${RIVER_COLORS[s.status]}">
            ${s.waterLevel != null ? s.waterLevel.toFixed(2) + 'm' : '-'} · ${s.status}
          </span>
        </div>`).join('');

      const html = `<div style="background:#fff;border-radius:16px;padding:16px;min-width:230px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:-apple-system,'Noto Sans KR',sans-serif;">
        <div style="font-size:16px;font-weight:700;color:#191F28;margin-bottom:12px;">${name} <span style="font-size:12px;font-weight:600;color:${color};margin-left:6px">${status}</span></div>
        ${rows}
        <div style="font-size:11px;color:#B0B8C1;margin-top:8px;text-align:right">탭하면 닫힘</div>
      </div>`;

      K.event.addListener(hit, 'click', (e: { latLng: unknown }) => showPopup(html, e.latLng));
      polylines.push(line, hit);
    });

    riverData.forEach(station => {
      const color = RIVER_COLORS[station.status] || '#8B95A1';
      const pos   = new K.LatLng(station.lat, station.lng);

      const dot = document.createElement('div');
      dot.className = 'station-marker';
      dot.style.background = color;
      dot.style.cursor = 'pointer';

      const overlay = new K.CustomOverlay({ position: pos, content: dot, map, zIndex: 5 });

      const html = `<div style="background:#fff;border-radius:14px;padding:14px 16px;min-width:190px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:-apple-system,'Noto Sans KR',sans-serif;">
        <div style="font-size:14px;font-weight:700;color:#191F28;margin-bottom:8px">${station.name}</div>
        <div style="font-size:13px;color:#4E5968;line-height:2">
          수위 <b style="color:#191F28">${station.waterLevel != null ? station.waterLevel.toFixed(2) + 'm' : '-'}</b>
          &nbsp;·&nbsp; 상태 <b style="color:${color}">${station.status}</b><br/>
          주의 ${station.warnLevel}m &nbsp;|&nbsp; 위험 ${station.dangerLevel}m
        </div>
      </div>`;

      dot.addEventListener('click', (e) => { e.stopPropagation(); showPopup(html, pos); });
      overlays.push(overlay);
    });

    return () => {
      polylines.forEach(p => p.setMap(null));
      overlays.forEach(o => o.setMap(null));
    };
  }, [mapReady, riverData]);

  // 러닝 스팟 마커
  useEffect(() => {
    if (!mapReady) return;
    const K = window.kakao.maps;
    const map = mapInst.current;
    const overlays: { setMap: (v: null) => void }[] = [];

    const S = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">`;
    const ICON_SVG: Record<string, string> = {
      // Activity (운동 심박) — 육상트랙
      '육상트랙': `${S}<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      // Water drop — 한강코스
      '한강코스': `${S}<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
      // Leaf — 공원코스
      '공원코스': `${S}<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
      // Mountain range — 산악코스
      '산악코스': `${S}<path d="M3 20l5-8 4 4 4-4 6 8H3z"/></svg>`,
    };

    if (!showTracks) return;

    RUNNING_SPOTS.forEach(spot => {
      const cfg = TRACK_TYPE_CONFIG[spot.type];
      const pos = new K.LatLng(spot.lat, spot.lng);

      const el = document.createElement('div');
      el.className = 'track-marker';
      el.style.background = cfg.color;
      el.style.cursor = 'pointer';
      el.innerHTML = ICON_SVG[spot.type] ?? '';

      const overlay = new K.CustomOverlay({ position: pos, content: el, map, zIndex: 4 });

      const distText = spot.distanceKm
        ? (spot.type === '육상트랙' ? '400m 트랙' : `약 ${spot.distanceKm}km`)
        : '';
      const rows = [
        distText && `<div style="font-size:13px;color:#3182F6;font-weight:600;margin-bottom:3px">📏 ${distText}</div>`,
        spot.hours && `<div style="font-size:12px;color:#4E5968;margin-bottom:2px">🕐 ${spot.hours}</div>`,
        spot.fee   && `<div style="font-size:12px;color:#4E5968;margin-bottom:2px">💰 ${spot.fee}</div>`,
        spot.note  && `<div style="font-size:11px;color:#8B95A1;margin-top:2px">${spot.note}</div>`,
      ].filter(Boolean).join('');

      const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lng}`;
      const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(spot.name)}?c=${spot.lng},${spot.lat},16,0,0,0,dh`;

      const html = `<div style="background:#fff;border-radius:14px;padding:14px 16px;min-width:200px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:-apple-system,'Noto Sans KR',sans-serif;">
        <div style="font-size:14px;font-weight:700;color:#191F28;margin-bottom:6px">${spot.name}</div>
        <div style="display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;background:${cfg.color}22;color:${cfg.color};margin-bottom:10px">${cfg.label}</div>
        ${rows}
        <div style="display:flex;gap:6px;margin-top:10px">
          <a href="${kakaoUrl}" target="_blank" rel="noopener"
             style="flex:1;text-align:center;padding:6px 0;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;background:#FAE100;color:#3A1D1D">
            카카오맵
          </a>
          <a href="${naverUrl}" target="_blank" rel="noopener"
             style="flex:1;text-align:center;padding:6px 0;border-radius:8px;font-size:11px;font-weight:700;text-decoration:none;background:#03C75A;color:#fff">
            네이버지도
          </a>
        </div>
      </div>`;

      // DOM으로 팝업 구성 — iOS PWA에서 innerHTML anchor는 동작 안 함
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ov = overlayRef.current as { setContent: (h: HTMLElement) => void; setPosition: (p: unknown) => void; setMap: (v: unknown) => void };

        const wrap = document.createElement('div');
        Object.assign(wrap.style, { background:'#fff', borderRadius:'14px', padding:'14px 16px', minWidth:'200px', boxShadow:'0 4px 20px rgba(0,0,0,0.12)', fontFamily:"-apple-system,'Noto Sans KR',sans-serif" });

        const title = document.createElement('div');
        Object.assign(title.style, { fontSize:'14px', fontWeight:'700', color:'#191F28', marginBottom:'6px' });
        title.textContent = spot.name;

        const badge = document.createElement('div');
        Object.assign(badge.style, { display:'inline-block', fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'8px', background:`${cfg.color}22`, color:cfg.color, marginBottom:'10px' });
        badge.textContent = cfg.label;

        const info = document.createElement('div');
        info.style.fontSize = '12px';
        info.style.color = '#4E5968';
        info.style.lineHeight = '1.8';
        if (distText) { const d = document.createElement('div'); d.style.color='#3182F6'; d.style.fontWeight='600'; d.textContent=`📏 ${distText}`; info.appendChild(d); }
        if (spot.hours) { const d = document.createElement('div'); d.textContent=`🕐 ${spot.hours}`; info.appendChild(d); }
        if (spot.fee)   { const d = document.createElement('div'); d.textContent=`💰 ${spot.fee}`;   info.appendChild(d); }
        if (spot.note)  { const d = document.createElement('div'); d.style.color='#8B95A1'; d.style.fontSize='11px'; d.textContent=spot.note; info.appendChild(d); }

        const btnRow = document.createElement('div');
        Object.assign(btnRow.style, { display:'flex', gap:'6px', marginTop:'10px' });

        const makeLink = (label: string, url: string, bg: string, color: string) => {
          const a = document.createElement('a');
          a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          Object.assign(a.style, { flex:'1', textAlign:'center', padding:'7px 0', borderRadius:'8px', fontSize:'11px', fontWeight:'700', textDecoration:'none', background:bg, color, cursor:'pointer', display:'block' });
          a.textContent = label;
          K.event.preventMap(a);
          return a;
        };
        btnRow.appendChild(makeLink('카카오맵', kakaoUrl, '#FAE100', '#3A1D1D'));
        btnRow.appendChild(makeLink('네이버지도', naverUrl, '#03C75A', '#fff'));

        wrap.appendChild(title);
        wrap.appendChild(badge);
        wrap.appendChild(info);
        wrap.appendChild(btnRow);

        K.event.preventMap(wrap);
        ov.setContent(wrap); ov.setPosition(pos); ov.setMap(map);
      });
      overlays.push(overlay);
    });

    return () => overlays.forEach(o => o.setMap(null));
  }, [mapReady, showTracks]);

  // CCTV 마커
  useEffect(() => {
    if (!mapReady) return;
    const K = window.kakao.maps;
    const map = mapInst.current;
    const overlays: { setMap: (v: null) => void }[] = [];

    if (!showCctv) return;

    const camSvg = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`;

    CCTV_SPOTS.forEach(spot => {
      const pos = new K.LatLng(spot.lat, spot.lng);
      const el = document.createElement('div');
      el.className = 'cctv-marker';
      el.style.cursor = 'pointer';
      el.innerHTML = camSvg;

      const overlay = new K.CustomOverlay({ position: pos, content: el, map, zIndex: 3 });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ov = overlayRef.current as { setContent: (h: HTMLElement) => void; setPosition: (p: unknown) => void; setMap: (v: unknown) => void };

        const wrap = document.createElement('div');
        Object.assign(wrap.style, { background:'#fff', borderRadius:'12px', padding:'12px 14px', minWidth:'170px', boxShadow:'0 4px 16px rgba(0,0,0,0.12)', fontFamily:"-apple-system,'Noto Sans KR',sans-serif" });

        const nameEl = document.createElement('div');
        Object.assign(nameEl.style, { fontSize:'13px', fontWeight:'700', color:'#191F28', marginBottom:'10px' });
        nameEl.textContent = `📹 ${spot.name}`;

        const link = document.createElement('a');
        link.href = spot.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
        Object.assign(link.style, { display:'inline-block', fontSize:'12px', fontWeight:'600', color:'#fff', background:'#3182F6', padding:'6px 14px', borderRadius:'8px', textDecoration:'none' });
        link.textContent = '영상 보기 →';
        K.event.preventMap(link);

        const hint = document.createElement('div');
        Object.assign(hint.style, { fontSize:'10px', color:'#B0B8C1', marginTop:'6px' });
        hint.textContent = '외부 사이트로 이동합니다';

        wrap.appendChild(nameEl);
        wrap.appendChild(link);
        wrap.appendChild(hint);

        K.event.preventMap(wrap);
        ov.setContent(wrap); ov.setPosition(pos); ov.setMap(map);
      });
      overlays.push(overlay);
    });

    return () => overlays.forEach(o => o.setMap(null));
  }, [mapReady, showCctv]);

  function goToMyLocation() {
    if (!location || !mapInst.current) return;
    const K = window.kakao.maps;
    (mapInst.current as { setCenter: (v: unknown) => void }).setCenter(new K.LatLng(location.lat, location.lng));
  }

  // 외부에서 지도 이동 요청 (하천현황 클릭 등)
  useEffect(() => {
    if (!moveToRef) return;
    moveToRef.current = (lat, lng) => {
      if (!mapInst.current) return;
      const K = window.kakao.maps;
      (mapInst.current as { setCenter: (v: unknown) => void; setLevel: (v: number) => void })
        .setCenter(new K.LatLng(lat, lng));
      (mapInst.current as { setLevel: (v: number) => void }).setLevel(4);
    };
  }, [mapReady, moveToRef]);

  // 지도 중심 좌표 반환 함수 노출
  useEffect(() => {
    if (!getMapCenterRef) return;
    getMapCenterRef.current = () => {
      if (!mapInst.current) return null;
      const K = window.kakao.maps;
      const center = (mapInst.current as { getCenter: () => unknown }).getCenter();
      return { lat: (center as { getLat: () => number }).getLat(), lng: (center as { getLng: () => number }).getLng() };
    };
  }, [mapReady, getMapCenterRef]);

  return (
    <MapWrapper>
      <MapContainer ref={mapRef} />
      <MapLayerPanel>
        <LayerTitle>레이어</LayerTitle>
        <ToggleChip>
          <input type="checkbox" checked={showTracks} onChange={e => setShowTracks(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
          러닝 스팟
        </ToggleChip>
        <ToggleChip>
          <input type="checkbox" checked={showCctv} onChange={e => setShowCctv(e.target.checked)} style={{ accentColor: '#e11d48' }} />
          CCTV
        </ToggleChip>
      </MapLayerPanel>
      {location && mapReady && (
        <LocBtn onClick={goToMyLocation} title="현재 위치로">📍</LocBtn>
      )}
    </MapWrapper>
  );
}
