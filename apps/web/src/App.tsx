import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { theme } from '@runcast/ui';
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
import { useLocationStore } from '@/stores/locationStore';
import { useWeather } from '@/features/weather/useWeather';
import { useRiverData } from '@/features/river/useRiverData';
import { useNotices } from '@/features/notice/useNotices';
import { RIVER_COLORS } from '@/features/river/rivers';

const pulse = keyframes`0%,100%{opacity:1} 50%{opacity:.7}`;

const AppRoot = styled.div`
  display: flex; flex-direction: column; height: 100dvh;
  font-family: -apple-system, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  background: ${theme.colors.gray50};
  @media (min-width: ${theme.bp.pc}) { flex-direction: row; }
`;
const Sidebar = styled.div`
  flex-shrink: 0; background: ${theme.colors.white};
  border-bottom: 1px solid ${theme.colors.gray200};
  @media (min-width: ${theme.bp.pc}) {
    width: ${theme.sizes.sidebar}; height: 100dvh;
    display: flex; flex-direction: column;
    border-right: 1px solid ${theme.colors.gray200}; border-bottom: none;
  }
`;
const AppHeader = styled.header`
  height: ${theme.sizes.headerH}; display: flex; align-items: center;
  justify-content: space-between; padding: 0 20px;
  border-bottom: 1px solid ${theme.colors.gray200};
  @media (min-width: ${theme.bp.pc}) { height: 64px; }
`;
const AppTitle = styled.h1`font-size: 17px; font-weight: 700; color: ${theme.colors.black}; letter-spacing: -0.3px;`;
const HeaderRight = styled.div`display: flex; align-items: center; gap: 8px;`;
const HeaderWeather = styled.span`font-size: 15px; color: ${theme.colors.gray600}; font-weight: 500;`;
const AlertBadge = styled.span`
  background: ${theme.colors.red}; color: #fff;
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px;
  animation: ${pulse} 2s infinite;
`;
const PcTabNav = styled.nav`
  display: none;
  @media (min-width: ${theme.bp.pc}) {
    display: flex; padding: 12px 16px; gap: 4px;
    border-bottom: 1px solid ${theme.colors.gray100}; flex-shrink: 0;
  }
`;
const PcTabBtn = styled.button<{ $active: boolean }>`
  flex: 1; padding: 7px 0; font-size: 12px; font-weight: 600;
  border: none; cursor: pointer; border-radius: 8px; position: relative;
  transition: background 0.15s, color 0.15s;
  background: ${p => p.$active ? theme.colors.blue : theme.colors.gray100};
  color: ${p => p.$active ? '#fff' : theme.colors.gray600};
`;
const PcTabBadge = styled.span`
  position: absolute; top: -4px; right: -4px;
  background: ${theme.colors.red}; color: #fff;
  font-size: 9px; font-weight: 700; min-width: 14px;
  padding: 1px 3px; border-radius: 8px; line-height: 1.4;
`;
const PcTabContent = styled.div`
  display: none;
  @media (min-width: ${theme.bp.pc}) {
    display: flex; flex: 1; flex-direction: column; overflow: hidden; padding: 16px 20px;
  }
`;
const AppBody = styled.main`
  flex: 1; position: relative; overflow: hidden;
  @media (min-width: ${theme.bp.pc}) { height: 100dvh; }
`;
const ViewMap = styled.div<{ $mobileHidden: boolean }>`
  position: absolute; inset: 0;
  display: ${p => p.$mobileHidden ? 'none' : 'block'};
  @media (min-width: ${theme.bp.pc}) { display: block !important; }
`;
const ViewTab = styled.div`
  position: absolute; inset: 0; overflow-y: auto;
  background: ${theme.colors.gray50}; padding: 16px;
  @media (min-width: ${theme.bp.pc}) { display: none !important; }
`;
const Legend = styled.div`
  position: absolute; bottom: 12px; left: 12px;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
  border-radius: ${theme.radius.sm}; padding: 7px 12px;
  display: flex; gap: 12px; box-shadow: ${theme.shadows.sm}; z-index: 50;
`;
const LegendItem = styled.div`display: flex; align-items: center; gap: 5px; font-size: 11px; color: ${theme.colors.gray800}; font-weight: 500;`;
const LegendDot = styled.span<{ $bg: string }>`width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: ${p => p.$bg};`;
const LocError = styled.div`
  position: absolute; top: 12px; left: 12px;
  background: rgba(240,68,82,0.1); color: ${theme.colors.red};
  font-size: 11px; font-weight: 500; padding: 6px 12px; border-radius: 8px; z-index: 50;
`;

const PC_TABS = [
  { id: 'river',   label: '하천현황' },
  { id: 'notice',  label: '공지사항' },
  { id: 'weather', label: '날씨상세' },
];

function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = pathname === '/' ? 'map' : pathname.slice(1);
  const sidebarTab = activeTab === 'map' ? 'river' : activeTab;

  const { location, error: locError } = useLocationStore();
  const locationLabel = !location ? '위치 확인 중' : locError ? '서울 시청 기준' : '내 위치 기준';
  const { weather, loading: wLoading } = useWeather(location);
  const { riverData, loading: rLoading, isMock, lastUpdated, refresh } = useRiverData();
  const { notices, loading: nLoading, lastUpdated: nUpdated, refresh: nRefresh } = useNotices();

  const alertCount = riverData.filter(s => ['통제', '위험'].includes(s.status)).length;
  const hasEmergency = notices.some(n => n.isEmergency);

  function sidebarContent(tab: string) {
    switch (tab) {
      case 'river':   return <RiverDetail riverData={riverData} loading={rLoading} isMock={isMock} lastUpdated={lastUpdated} onRefresh={refresh} />;
      case 'notice':  return <NoticeBoard notices={notices} loading={nLoading} lastUpdated={nUpdated} onRefresh={nRefresh} />;
      case 'weather': return <WeatherDetail weather={weather} loading={wLoading} locationLabel={locationLabel} />;
      default:        return null;
    }
  }

  const ctx = { weather, wLoading, locationLabel, riverData, rLoading, isMock, lastUpdated, refresh, notices, nLoading, nUpdated, nRefresh };

  return (
    <AppRoot>
      <Sidebar>
        <AppHeader>
          <AppTitle>🏃 러닝 오케이?</AppTitle>
          <HeaderRight>
            {weather && !wLoading && <HeaderWeather>{weather.icon} {weather.temperature}°</HeaderWeather>}
            {alertCount > 0 && <AlertBadge>⚠️ {alertCount}곳 위험</AlertBadge>}
          </HeaderRight>
        </AppHeader>

        <PcTabNav>
          {PC_TABS.map(({ id, label }) => (
            <PcTabBtn key={id} $active={sidebarTab === id} onClick={() => navigate(`/${id}`)}>
              {label}
              {id === 'river'  && alertCount > 0 && <PcTabBadge>{alertCount}</PcTabBadge>}
              {id === 'notice' && hasEmergency    && <PcTabBadge>!</PcTabBadge>}
            </PcTabBtn>
          ))}
        </PcTabNav>

        <PcTabContent>{sidebarContent(sidebarTab)}</PcTabContent>
      </Sidebar>

      <AppBody>
        <ViewMap $mobileHidden={activeTab !== 'map'}>
          <MapView location={location} riverData={riverData} />
          <WeatherFloat weather={weather} loading={wLoading} />
          <Legend>
            {(['정상','주의','경계','위험','통제'] as const).map(status => (
              <LegendItem key={status}>
                <LegendDot $bg={RIVER_COLORS[status]} />
                <span>{status}</span>
              </LegendItem>
            ))}
          </Legend>
          {locError && <LocError>{locError}</LocError>}
        </ViewMap>

        {activeTab !== 'map' && (
          <ViewTab><Outlet context={ctx} /></ViewTab>
        )}
      </AppBody>

      <BottomTabBar alertCount={alertCount} hasEmergency={hasEmergency} />
    </AppRoot>
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
