import { useEffect, useRef, useState } from 'react';
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
const MapToggles = styled.div`
  position: absolute; bottom: 70px; right: 12px; z-index: 100;
  display: flex; flex-direction: column; gap: 6px; align-items: flex-end;
`;
const ToggleChip = styled.label`
  background: #fff; border-radius: 20px; padding: 6px 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  display: flex; align-items: center; gap: 6px;
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
}

export default function MapView({ location, riverData }: Props) {
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
      const ov = overlayRef.current as { setContent: (h: string) => void; setPosition: (p: unknown) => void; setMap: (v: unknown) => void };
      ov.setContent(html);
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
      // Timer (스톱워치) — 육상트랙
      '육상트랙': `${S}<circle cx="12" cy="14" r="8"/><path d="M12 6v8l3 2"/><path d="M10 2h4"/></svg>`,
      // Waves — 한강코스
      '한강코스': `${S}<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
      // Tree (삼각형 나무) — 공원코스
      '공원코스': `${S}<polygon points="12 3 21 19 3 19" stroke-linejoin="round"/><line x1="12" y1="19" x2="12" y2="23"/></svg>`,
      // Mountain — 산악코스
      '산악코스': `${S}<path d="m3 17 4-8 4 4 4-4 4 8"/><path d="M2 17h20"/></svg>`,
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

      const html = `<div style="background:#fff;border-radius:14px;padding:14px 16px;min-width:190px;box-shadow:0 4px 20px rgba(0,0,0,0.12);font-family:-apple-system,'Noto Sans KR',sans-serif;">
        <div style="font-size:14px;font-weight:700;color:#191F28;margin-bottom:6px">${spot.name}</div>
        <div style="display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;background:${cfg.color}22;color:${cfg.color};margin-bottom:10px">${cfg.label}</div>
        ${rows}
        <div style="font-size:11px;color:#B0B8C1;margin-top:8px;text-align:right">탭하면 닫힘</div>
      </div>`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ov = overlayRef.current as { setContent: (h: string) => void; setPosition: (p: unknown) => void; setMap: (v: unknown) => void };
        ov.setContent(html); ov.setPosition(pos); ov.setMap(map);
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

      const html = `<div style="background:#fff;border-radius:12px;padding:12px 14px;min-width:170px;box-shadow:0 4px 16px rgba(0,0,0,0.12);font-family:-apple-system,'Noto Sans KR',sans-serif;">
        <div style="font-size:13px;font-weight:700;color:#191F28;margin-bottom:8px">📹 ${spot.name}</div>
        <a href="${spot.url}" target="_blank" rel="noopener" style="display:inline-block;font-size:12px;font-weight:600;color:#fff;background:#3182F6;padding:5px 12px;border-radius:8px;text-decoration:none;">영상 보기 →</a>
        <div style="font-size:10px;color:#B0B8C1;margin-top:6px">외부 사이트로 이동합니다</div>
      </div>`;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ov = overlayRef.current as { setContent: (h: string) => void; setPosition: (p: unknown) => void; setMap: (v: unknown) => void };
        ov.setContent(html); ov.setPosition(pos); ov.setMap(map);
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

  return (
    <MapWrapper>
      <MapContainer ref={mapRef} />
      <MapToggles>
        <ToggleChip>
          <input type="checkbox" checked={showTracks} onChange={e => setShowTracks(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
          러닝 스팟
        </ToggleChip>
        <ToggleChip>
          <input type="checkbox" checked={showCctv} onChange={e => setShowCctv(e.target.checked)} style={{ accentColor: '#e11d48' }} />
          CCTV
        </ToggleChip>
      </MapToggles>
      {location && mapReady && (
        <LocBtn onClick={goToMyLocation} title="현재 위치로">📍</LocBtn>
      )}
    </MapWrapper>
  );
}
