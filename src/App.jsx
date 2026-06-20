import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import MapPage from '@/pages/MapPage';
import NoticePage from '@/pages/NoticePage';
import WeatherPage from '@/pages/WeatherPage';
import RiverPage from '@/pages/RiverPage';
import MapView from '@/features/map/MapView';
import WeatherFloat from '@/features/weather/WeatherFloat';
import WeatherDetail from '@/features/weather/WeatherDetail';
import RiverDetail from '@/features/river/RiverDetail';
import NoticeBoard from '@/features/notice/NoticeBoard';
import BottomTabBar from '@/shared/components/BottomTabBar';
import { useLocation as useGeoLocation } from '@/shared/hooks/useLocation';
import { useWeather } from '@/features/weather/useWeather';
import { useRiverData } from '@/features/river/useRiverData';
import { useNotices } from '@/features/notice/useNotices';
import { RIVER_COLORS } from '@/features/river/rivers';
import './App.css';

const PC_TABS = [
  { id: 'river',   label: '하천현황' },
  { id: 'notice',  label: '공지사항' },
  { id: 'weather', label: '날씨상세' },
];

function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // pathname → activeTab: '/' = 'map', '/river' = 'river', etc.
  const activeTab = pathname === '/' ? 'map' : pathname.slice(1);
  const sidebarTab = activeTab === 'map' ? 'river' : activeTab;

  const { location, error: locError } = useGeoLocation();
  const { weather, loading: wLoading } = useWeather(location);
  const { riverData, loading: rLoading, isMock, lastUpdated, refresh } = useRiverData();
  const { notices, loading: nLoading, lastUpdated: nUpdated, refresh: nRefresh } = useNotices();

  const alertCount = riverData.filter(s => ['통제', '위험'].includes(s.status)).length;
  const hasEmergency = notices.some(n => n.isEmergency);

  function sidebarContent(tab) {
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

  const ctx = { weather, wLoading, riverData, rLoading, isMock, lastUpdated, refresh, notices, nLoading, nUpdated, nRefresh };

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
              onClick={() => navigate(`/${id}`)}
            >
              {label}
              {id === 'river' && alertCount > 0 && <span className="pc-tab-badge">{alertCount}</span>}
              {id === 'notice' && hasEmergency && <span className="pc-tab-badge">!</span>}
            </button>
          ))}
        </nav>

        {/* PC 전용 탭 컨텐츠 */}
        <div className="pc-tab-content">
          {sidebarContent(sidebarTab)}
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

        {/* 모바일 탭 컨텐츠 (map 탭 제외, Outlet으로 페이지 렌더) */}
        {activeTab !== 'map' && (
          <div className="view-tab">
            <Outlet context={ctx} />
          </div>
        )}
      </div>

      {/* ── 하단 탭바 (모바일 전용) ── */}
      <BottomTabBar
        activeTab={activeTab}
        onChange={(tab) => navigate(tab === 'map' ? '/' : `/${tab}`)}
        alertCount={alertCount}
        hasEmergency={hasEmergency}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<MapPage />} />
          <Route path="notice"  element={<NoticePage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="river"   element={<RiverPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
