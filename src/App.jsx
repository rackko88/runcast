import { useState } from 'react';
import MapView from './components/MapView';
import WeatherFloat from './components/WeatherFloat';
import BottomSheet from './components/BottomSheet';
import { useLocation } from './hooks/useLocation';
import { useWeather } from './hooks/useWeather';
import { useRiverData } from './hooks/useRiverData';
import { useNotices } from './hooks/useNotices';
import { RIVER_COLORS } from './data/rivers';
import './App.css';

export default function App() {
  const [sheetOpen, setSheetOpen] = useState(() => window.innerWidth >= 768);
  const { location, error: locError } = useLocation();
  const { weather, loading: wLoading } = useWeather(location);
  const { riverData, loading: rLoading, isMock, lastUpdated, refresh } = useRiverData();
  const { notices, loading: nLoading, lastUpdated: nUpdated, refresh: nRefresh } = useNotices();

  const alertCount = riverData.filter(s => ['통제', '위험'].includes(s.status)).length;

  return (
    <div className="app">
      {/* PC: 왼쪽 사이드패널 / 모바일: 헤더+바텀시트 오버레이 */}
      <div className="side-panel">
        <header className="app-header">
          <h1 className="app-title">🏃 러닝 환경 체크</h1>
          <div className="header-right">
            {weather && !wLoading && (
              <span className="header-weather">{weather.icon} {weather.temperature}°</span>
            )}
            {alertCount > 0 && (
              <span className="alert-badge">⚠️ {alertCount}곳 위험</span>
            )}
          </div>
        </header>

        <BottomSheet
          riverData={riverData}
          loading={rLoading}
          isMock={isMock}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
          open={sheetOpen}
          onToggle={() => setSheetOpen(o => !o)}
          notices={notices}
          noticesLoading={nLoading}
          noticesUpdated={nUpdated}
          onRefreshNotices={nRefresh}
        />
      </div>

      {/* 지도 */}
      <div className="map-area">
        <MapView location={location} riverData={riverData} />

        <WeatherFloat weather={weather} loading={wLoading} />

        <div className="map-legend">
          {['정상', '주의', '경계', '위험', '통제'].map(status => (
            <div key={status} className="legend-item">
              <span className="legend-dot" style={{ background: RIVER_COLORS[status] }} />
              <span>{status}</span>
            </div>
          ))}
        </div>

        {locError && <div className="loc-error-float">{locError}</div>}
      </div>
    </div>
  );
}
