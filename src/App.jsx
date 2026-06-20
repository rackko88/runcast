import { useState } from 'react';
import MapView from './components/MapView';
import WeatherFloat from './components/WeatherFloat';
import BottomSheet from './components/BottomSheet';
import { useLocation } from './hooks/useLocation';
import { useWeather } from './hooks/useWeather';
import { useRiverData } from './hooks/useRiverData';
import './App.css';

export default function App() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { location, error: locError } = useLocation();
  const { weather, loading: wLoading } = useWeather(location);
  const { riverData, loading: rLoading, isMock, lastUpdated, refresh } = useRiverData();

  const alertCount = riverData.filter(s => ['통제','위험'].includes(s.status)).length;

  return (
    <div className="app">
      {/* PC 사이드 / 모바일 플로팅 헤더 */}
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

      {/* 하천 현황 시트 (PC: 사이드패널, 모바일: 바텀시트) */}
      <BottomSheet
        riverData={riverData}
        loading={rLoading}
        isMock={isMock}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        open={sheetOpen}
        onToggle={() => setSheetOpen(o => !o)}
      />

      {/* 지도 */}
      <div className="map-area">
        <MapView location={location} riverData={riverData} />

        <WeatherFloat weather={weather} loading={wLoading} />

        <div className="map-legend">
          {[['정상','#12B968'],['주의','#F5A623'],['경계','#F04452'],['통제','#7248D9']].map(([label, color]) => (
            <div key={label} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {locError && <div className="loc-error-float">{locError}</div>}
      </div>
    </div>
  );
}
