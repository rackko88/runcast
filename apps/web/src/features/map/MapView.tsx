import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import styled from '@emotion/styled';
import { RIVER_PATHS, RIVER_COLORS } from '../river/rivers';
import { RUNNING_SPOTS, TRACK_TYPE_CONFIG } from '../track/tracks';

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

// ── 팝업 타입 ──
type PopupData =
  | { kind: 'river'; name: string; status: RiverStatus; color: string; stations: RiverStation[] }
  | { kind: 'station'; station: RiverStation; color: string }
  | { kind: 'spot'; spot: typeof RUNNING_SPOTS[0]; kakaoUrl: string; naverUrl: string }
;

// ── 스타일 ──
const MapWrapper = styled.div`position: relative; width: 100%; height: 100%;`;
const MapContainer = styled.div`width: 100%; height: 100%;`;

const MapLayerPanel = styled.div`
  position: absolute; right: 16px; z-index: 100;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 16px + 44px + 10px);
  background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
  border-radius: 14px; padding: 10px 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.14);
  display: flex; flex-direction: column; gap: 8px; min-width: 110px;
  @media (min-width: 768px) {
    bottom: calc(16px + 44px + 10px);
  }
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
  position: absolute; right: 16px; z-index: 100;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 16px);
  width: 44px; height: 44px; border-radius: 50%;
  background: #fff; border: none;
  box-shadow: 0 2px 14px rgba(0,0,0,0.18);
  cursor: pointer; font-size: 20px;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.12s;
  &:active { transform: scale(0.92); }
  @media (min-width: 768px) {
    bottom: 16px;
  }
`;

// React 팝업 — Kakao 이벤트 시스템 밖에서 렌더링
const PopupOverlay = styled.div`
  position: absolute;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%; transform: translateX(-50%);
  @media (min-width: 768px) {
    bottom: 80px;
  }
  z-index: 200; max-width: calc(100% - 32px);
`;
const PopupCard = styled.div`
  background: #fff; border-radius: 16px; padding: 16px;
  min-width: 230px; box-shadow: 0 4px 24px rgba(0,0,0,0.16);
  font-family: -apple-system, 'Noto Sans KR', sans-serif;
  position: relative;
`;
const PopupClose = styled.button`
  position: absolute; top: 10px; right: 10px;
  background: none; border: none; font-size: 16px; color: #8B95A1;
  cursor: pointer; line-height: 1; padding: 2px 6px;
`;
const PopupTitle = styled.div`font-size: 14px; font-weight: 700; color: #191F28; margin-bottom: 8px; padding-right: 24px;`;
const PopupRow = styled.div`display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #F2F4F6; font-size: 12px;`;
const PopupMeta = styled.div`font-size: 12px; color: #4E5968; line-height: 1.8; margin-bottom: 8px;`;
const PopupBtnRow = styled.div`display: flex; gap: 6px; margin-top: 10px;`;
const PopupLink = styled.a`
  flex: 1; text-align: center; padding: 7px 0; border-radius: 8px;
  font-size: 11px; font-weight: 700; text-decoration: none; display: block;
`;

interface Props {
  location: { lat: number; lng: number } | null;
  riverData: RiverStation[];
  moveToRef?: React.MutableRefObject<((lat: number, lng: number) => void) | null>;
  getMapCenterRef?: React.MutableRefObject<(() => { lat: number; lng: number } | null) | null>;
}

export default function MapView({ location, riverData, moveToRef, getMapCenterRef }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const mapInst = useRef<unknown>(null);
  const [mapReady, setMapReady]     = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [popup, setPopup] = useState<PopupData | null>(null);

  // ── 지도 초기화 ──
  useEffect(() => {
    if (mapInst.current || !mapRef.current) return;
    let cancelled = false;
    loadKakaoSDK()
      .then((K: unknown) => {
        if (cancelled || mapInst.current || !mapRef.current) return;
        const maps = K as typeof window.kakao.maps;
        const map = new maps.Map(mapRef.current, { center: new maps.LatLng(37.5665, 126.978), level: 6 });
        mapInst.current = map;
        maps.event.addListener(map, 'click', () => setPopup(null));
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

  // ── 내 위치 마커 ──
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

  // ── 하천 라인 + 관측소 마커 ──
  useEffect(() => {
    if (!mapReady) return;
    const K = window.kakao.maps;
    const map = mapInst.current;
    const overlays: { setMap: (v: null) => void }[] = [];
    const polylines: { setMap: (v: null) => void }[] = [];

    Object.entries(RIVER_PATHS).forEach(([name, coords]) => {
      const status = getRiverStatus(name, riverData);
      const color  = RIVER_COLORS[status];
      const path   = coords.map(([la, ln]) => new K.LatLng(la, ln));
      const line = new K.Polyline({ map, path, strokeWeight: name === '한강' ? 5 : 3, strokeColor: color, strokeOpacity: 0.85, strokeStyle: 'solid' });
      const hit  = new K.Polyline({ map, path, strokeWeight: 20, strokeColor: '#fff', strokeOpacity: 0 });
      const stations = riverData.filter(s => s.river === name);
      K.event.addListener(hit, 'click', () => setPopup({ kind: 'river', name, status, color, stations }));
      polylines.push(line, hit);
    });

    riverData.forEach(station => {
      const color = RIVER_COLORS[station.status] || '#8B95A1';
      const pos   = new K.LatLng(station.lat, station.lng);
      const dot   = document.createElement('div');
      dot.className = 'station-marker';
      dot.style.background = color;
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', (e) => { e.stopPropagation(); setPopup({ kind: 'station', station, color }); });
      overlays.push(new K.CustomOverlay({ position: pos, content: dot, map, zIndex: 5 }));
    });

    return () => { polylines.forEach(p => p.setMap(null)); overlays.forEach(o => o.setMap(null)); };
  }, [mapReady, riverData]);

  // ── 러닝 스팟 마커 ──
  useEffect(() => {
    if (!mapReady || !showTracks) return;
    const K = window.kakao.maps;
    const map = mapInst.current;
    const overlays: { setMap: (v: null) => void }[] = [];

    const S = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">`;
    const ICON_SVG: Record<string, string> = {
      '육상트랙': `${S}<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      '한강코스': `${S}<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
      '공원코스': `${S}<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
      '산악코스': `${S}<path d="M3 20l5-8 4 4 4-4 6 8H3z"/></svg>`,
    };

    RUNNING_SPOTS.forEach(spot => {
      const cfg = TRACK_TYPE_CONFIG[spot.type];
      const pos = new K.LatLng(spot.lat, spot.lng);
      const el  = document.createElement('div');
      el.className = 'track-marker';
      el.style.background = cfg.color;
      el.style.cursor = 'pointer';
      el.innerHTML = ICON_SVG[spot.type] ?? '';
      const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(spot.name)},${spot.lat},${spot.lng}`;
      const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(spot.name)}?c=${spot.lng},${spot.lat},15,0,0,0,dh`;
      el.addEventListener('click', (e) => { e.stopPropagation(); setPopup({ kind: 'spot', spot, kakaoUrl, naverUrl }); });
      overlays.push(new K.CustomOverlay({ position: pos, content: el, map, zIndex: 4 }));
    });

    return () => overlays.forEach(o => o.setMap(null));
  }, [mapReady, showTracks]);


  // ── 외부 ref ──
  useEffect(() => {
    if (!moveToRef) return;
    moveToRef.current = (lat, lng) => {
      if (!mapInst.current) return;
      const K = window.kakao.maps;
      (mapInst.current as { setCenter: (v: unknown) => void; setLevel: (v: number) => void }).setCenter(new K.LatLng(lat, lng));
      (mapInst.current as { setLevel: (v: number) => void }).setLevel(4);
    };
  }, [mapReady, moveToRef]);

  useEffect(() => {
    if (!getMapCenterRef) return;
    getMapCenterRef.current = () => {
      if (!mapInst.current) return null;
      const K = window.kakao.maps;
      const c = (mapInst.current as { getCenter: () => unknown }).getCenter();
      return { lat: (c as { getLat: () => number }).getLat(), lng: (c as { getLng: () => number }).getLng() };
    };
  }, [mapReady, getMapCenterRef]);

  function goToMyLocation() {
    if (!location || !mapInst.current) return;
    (mapInst.current as { setCenter: (v: unknown) => void }).setCenter(new window.kakao.maps.LatLng(location.lat, location.lng));
  }

  // ── 팝업 렌더 ──
  function renderPopup() {
    if (!popup) return null;

    let content: React.ReactNode = null;

    if (popup.kind === 'river') {
      content = (
        <>
          <PopupTitle>{popup.name} <span style={{ fontSize: 12, fontWeight: 600, color: popup.color }}>{popup.status}</span></PopupTitle>
          {popup.stations.map(s => (
            <PopupRow key={s.id}>
              <span style={{ color: '#333' }}>{s.name}</span>
              <span style={{ fontWeight: 600, color: RIVER_COLORS[s.status] }}>
                {s.waterLevel != null ? `${s.waterLevel.toFixed(2)}m` : '-'} · {s.status}
              </span>
            </PopupRow>
          ))}
          <div style={{ fontSize: 10, color: '#B0B8C1', marginTop: 8, textAlign: 'right' }}>닫기 ✕</div>
        </>
      );
    } else if (popup.kind === 'station') {
      const s = popup.station;
      content = (
        <>
          <PopupTitle>{s.name}</PopupTitle>
          <PopupMeta>
            수위 <b style={{ color: '#191F28' }}>{s.waterLevel != null ? `${s.waterLevel.toFixed(2)}m` : '-'}</b>
            &nbsp;·&nbsp; 상태 <b style={{ color: popup.color }}>{s.status}</b><br />
            주의 {s.warnLevel}m &nbsp;|&nbsp; 위험 {s.dangerLevel}m
          </PopupMeta>
        </>
      );
    } else if (popup.kind === 'spot') {
      const { spot, kakaoUrl, naverUrl } = popup;
      const cfg = TRACK_TYPE_CONFIG[spot.type];
      const distText = spot.distanceKm ? (spot.type === '육상트랙' ? '400m 트랙' : `약 ${spot.distanceKm}km`) : '';
      content = (
        <>
          <PopupTitle>{spot.name}</PopupTitle>
          <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, background: `${cfg.color}22`, color: cfg.color, marginBottom: 10 }}>{cfg.label}</div>
          <PopupMeta>
            {distText && <div style={{ color: '#3182F6', fontWeight: 600 }}>📏 {distText}</div>}
            {spot.hours && <div>🕐 {spot.hours}</div>}
            {spot.fee   && <div>💰 {spot.fee}</div>}
            {spot.note  && <div style={{ color: '#8B95A1', fontSize: 11 }}>{spot.note}</div>}
          </PopupMeta>
          <PopupBtnRow>
            <PopupLink href={kakaoUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#FAE100', color: '#3A1D1D' }}>카카오맵</PopupLink>
            <PopupLink href={naverUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#03C75A', color: '#fff' }}>네이버지도</PopupLink>
          </PopupBtnRow>
        </>
      );
    }

    return (
      <PopupOverlay>
        <PopupCard>
          <PopupClose onClick={() => setPopup(null)}>✕</PopupClose>
          {content}
        </PopupCard>
      </PopupOverlay>
    );
  }

  return (
    <MapWrapper>
      <MapContainer ref={mapRef} />
      <MapLayerPanel>
        <LayerTitle>표시</LayerTitle>
        <ToggleChip>
          <input type="checkbox" checked={showTracks} onChange={e => setShowTracks(e.target.checked)} style={{ accentColor: '#7c3aed' }} />
          러닝 스팟
        </ToggleChip>
      </MapLayerPanel>
      {location && mapReady && (
        <LocBtn onClick={goToMyLocation} title="현재 위치로">📍</LocBtn>
      )}
      {renderPopup()}
    </MapWrapper>
  );
}
