import { useState } from 'react';
import MapView from './components/MapView';
import WeatherFloat from './components/WeatherFloat';
import WeatherDetail from './components/WeatherDetail';
import RiverDetail from './components/RiverDetail';
import NoticeBoard from './components/NoticeBoard';
import BottomTabBar from './components/BottomTabBar';
import { useLocation } from './hooks/useLocation';
import { useWeather } from './hooks/useWeather';
import { useRiverData } from './hooks/useRiverData';
import { useNotices } from './hooks/useNotices';
import { RIVER_COLORS } from './data/rivers';
import './App.css';

const PC_TABS = [
  { id: 'river',   label: '하천현황' },
  { id: 'notice',  label: '공지사항' },
  { id: 'weather', label: '날씨상세' },
];

export default function App() {
  // 모바일: 'map' | 'notice' | 'weather' | 'river'
  // PC:     map 탭은 없고 사이드바가 탭을 가짐 → activeTab이 'map'이면 'river'로 취급
  const [activeTab, setActiveTab] = useState('map');

  const { location, error: locError } = useLocation();
  const { weather, loading: wLoading } = useWeather(location);
  const { riverData, loading: rLoading, isMock, lastUpdated, refresh } = useRiverData();
  const { notices, loading: nLoading, lastUpdated: nUpdated, refresh: nRefresh } = useNotices();

  const alertCount = riverData.filter(s => ['통제', '위험'].includes(s.status)).length;
  const hasEmergency = notices.some(n => n.isEmergency);

  // PC 사이드바는 'map' 탭을 'river'로 매핑
  const sidebarTab = activeTab === 'map' ? 'river' : activeTab;

  function tabContent(tab) {
    switch (tab) {
      case 'river':
        return <RiverDetail riverData={riverData} loading={rLoading} isMock={isMock} lastUpdated={lastUpdated} onRefresh={refresh} />;
      case 'notice':
        return <NoticeBoard notices={notices} loading={nLoading} lastUpdated={nUpdated} onRefresh={nRefresh} />;
      case 'weather':
        return <WeatherDetail weather={weather} loading={wLoading} />;
      default:
        return null;
    }
  }

  return (
    <div className="app">
      {/* ── 사이드바: 모바일에선 헤더만, PC에선 360px 패널 ── */}
      <div className="pc-sidebar">
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

        {/* PC 전용 탭 내비 */}
        <nav className="pc-tab-nav">
          {PC_TABS.map(({ id, label }) => (
            <button
              key={id}
              className={`pc-tab-btn${sidebarTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
              {id === 'river' && alertCount > 0 && <span className="pc-tab-badge">{alertCount}</span>}
              {id === 'notice' && hasEmergency && <span className="pc-tab-badge">!</span>}
            </button>
          ))}
        </nav>

        {/* PC 전용 탭 컨텐츠 */}
        <div className="pc-tab-content">
          {tabContent(sidebarTab)}
        </div>
      </div>

      {/* ── 앱 바디 ── */}
      <div className="app-body">
        {/* 지도 뷰 (PC 항상 표시, 모바일은 map 탭일 때만) */}
        <div className={`view-map${activeTab !== 'map' ? ' mobile-hidden' : ''}`}>
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

        {/* 모바일 탭 컨텐츠 (map 탭 제외) */}
        {activeTab !== 'map' && (
          <div className="view-tab">
            {tabContent(activeTab)}
          </div>
        )}
      </div>

      {/* ── 하단 탭바 (모바일 전용) ── */}
      <BottomTabBar
        activeTab={activeTab}
        onChange={setActiveTab}
        alertCount={alertCount}
        hasEmergency={hasEmergency}
      />
    </div>
  );
}
