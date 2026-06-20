import { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { RIVER_PATHS, RIVER_COLORS } from '../river/rivers';
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

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
`;

interface Props {
  location: { lat: number; lng: number } | null;
  riverData: RiverStation[];
}

export default function MapView({ location, riverData }: Props) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const mapInst    = useRef<unknown>(null);
  const overlayRef = useRef<unknown>(null);
  const [mapReady, setMapReady] = useState(false);

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

      const line = new K.Polyline({ map, path, strokeWeight: name === '한강' ? 8 : 5, strokeColor: color, strokeOpacity: 0.9, strokeStyle: 'solid' });
      const hit  = new K.Polyline({ map, path, strokeWeight: 24, strokeColor: '#fff', strokeOpacity: 0 });

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

  return <MapContainer ref={mapRef} />;
}
