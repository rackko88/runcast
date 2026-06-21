import { useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Cloud, Waves, Bell, RefreshCw } from 'lucide-react';
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
  position: fixed; inset: 0;
  display: flex; flex-direction: column;
  font-family: -apple-system, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  background: ${theme.colors.gray50};
  @media (min-width: ${theme.bp.pc}) { flex-direction: row; }
`;
const Sidebar = styled.div`
  flex-shrink: 0; background: ${theme.colors.white};
  border-bottom: 1px solid ${theme.colors.gray200};
  @media (min-width: ${theme.bp.pc}) {
    width: ${theme.sizes.sidebar}; height: 100%;
    display: flex; flex-direction: column;
    border-right: 1px solid ${theme.colors.gray200}; border-bottom: none;
  }
`;
const AppHeader = styled.header`
  min-height: ${theme.sizes.headerH};
  padding-top: env(safe-area-inset-top, 0px);
  display: flex; align-items: center;
  justify-content: space-between; padding-left: 20px; padding-right: 20px;
  border-bottom: 1px solid ${theme.colors.gray200};
  @media (min-width: ${theme.bp.pc}) { min-height: 64px; padding-top: 0; }
`;
const AppTitle = styled.h1`
  font-size: 17px; font-weight: 700; color: ${theme.colors.black}; letter-spacing: -0.3px;
  cursor: pointer; user-select: none;
  &:active { opacity: 0.7; }
`;
const HeaderRight = styled.div`display: flex; align-items: center; gap: 8px; position: relative;`;
const AlertBadge = styled.span`
  background: ${theme.colors.red}; color: #fff;
  font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 20px;
  animation: ${pulse} 2s infinite;
`;
const MenuBtn = styled.button`
  width: 36px; height: 36px; border-radius: 10px;
  background: ${theme.colors.gray100}; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  flex-shrink: 0;
  &:active { background: ${theme.colors.gray200}; }
`;
const MenuLine = styled.span`width: 16px; height: 2px; background: ${theme.colors.gray800}; border-radius: 2px;`;
const MenuDropdown = styled.div`
  position: absolute; top: calc(100% + 8px); right: 0;
  background: ${theme.colors.white}; border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12); z-index: 200;
  min-width: 150px; overflow: hidden;
`;
const MenuItem = styled.button`
  width: 100%; padding: 12px 16px; background: none; border: none;
  text-align: left; font-size: 14px; color: ${theme.colors.gray800};
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  &:hover { background: ${theme.colors.gray50}; }
  &:not(:last-child) { border-bottom: 1px solid ${theme.colors.gray100}; }
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
    display: flex; flex: 1; flex-direction: column; overflow-y: auto; padding: 16px 20px;
  }
`;
const AppBody = styled.main`
  flex: 1; position: relative; overflow: hidden; min-height: 0;
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
  position: absolute; left: 12px;
  bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 12px);
  background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
  border-radius: ${theme.radius.sm}; padding: 7px 12px;
  display: flex; gap: 12px; box-shadow: ${theme.shadows.sm}; z-index: 50;
  @media (min-width: ${theme.bp.pc}) {
    bottom: 12px;
  }
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
  { id: 'weather', label: '날씨상세' },
  { id: 'notice',  label: '공지사항' },
];

function AppLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = pathname === '/' ? 'map' : pathname.slice(1);
  const sidebarTab = activeTab === 'map' ? 'river' : activeTab;

  const [menuOpen, setMenuOpen] = useState(false);
  const moveToRef = useRef<((lat: number, lng: number) => void) | null>(null);
  const getMapCenterRef = useRef<(() => { lat: number; lng: number } | null) | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const { location, error: locError } = useLocationStore();
  const locationLabel = !location ? '위치 확인 중' : locError ? '서울 시청 기준' : '내 위치 기준';
  const { weather, loading: wLoading, activeLoc, refresh: wRefresh } = useWeather(location);
  const { riverData, loading: rLoading, isMock, lastUpdated, refresh } = useRiverData();
  const { notices, loading: nLoading, lastUpdated: nUpdated, refresh: nRefresh } = useNotices();

  const alertCount = riverData.filter(s => ['통제', '위험'].includes(s.status)).length;
  const seoulNow = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Seoul' }));
  const todayKey = `${seoulNow.getFullYear()}.${String(seoulNow.getMonth()+1).padStart(2,'0')}.${String(seoulNow.getDate()).padStart(2,'0')}`;
  const hasEmergency = notices.some(n => n.isEmergency && n.date === todayKey);

  function sidebarContent(tab: string) {
    switch (tab) {
      case 'river':   return <RiverDetail riverData={riverData} loading={rLoading} isMock={isMock} lastUpdated={lastUpdated} onRefresh={refresh} onStationClick={(lat, lng) => { moveToRef.current?.(lat, lng); navigate('/'); }} />;
      case 'notice':  return <NoticeBoard notices={notices} loading={nLoading} lastUpdated={nUpdated} onRefresh={nRefresh} />;
      case 'weather': return <WeatherDetail weather={weather} loading={wLoading} locationLabel={locationLabel} location={activeLoc} />;

      default:        return null;
    }
  }

  const ctx = { weather, wLoading, locationLabel, riverData, rLoading, isMock, lastUpdated, refresh, notices, nLoading, nUpdated, nRefresh, moveToRef };

  return (
    <AppRoot>
      <Sidebar>
        <AppHeader>
          <AppTitle onClick={() => navigate('/')}>🏃 러닝 오케이?</AppTitle>
          <HeaderRight ref={menuRef}>
            {alertCount > 0 && <AlertBadge>⚠️ {alertCount}곳 위험</AlertBadge>}
            <MenuBtn onClick={() => setMenuOpen(v => !v)}>
              <MenuLine /><MenuLine /><MenuLine />
            </MenuBtn>
            {menuOpen && (
              <MenuDropdown>
                <MenuItem onClick={() => { navigate('/weather'); setMenuOpen(false); }}><Cloud size={15}/> 날씨 상세</MenuItem>
                <MenuItem onClick={() => { navigate('/river');   setMenuOpen(false); }}><Waves size={15}/> 하천 현황</MenuItem>
                <MenuItem onClick={() => { navigate('/notice');  setMenuOpen(false); }}><Bell size={15}/> 공지 사항</MenuItem>
                <MenuItem onClick={() => { refresh(); nRefresh(); setMenuOpen(false); }}><RefreshCw size={15}/> 새로고침</MenuItem>
              </MenuDropdown>
            )}
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
          <MapView location={location} riverData={riverData} moveToRef={moveToRef} getMapCenterRef={getMapCenterRef} />
          <WeatherFloat
            weather={weather} loading={wLoading} location={activeLoc}
            onRefresh={() => { const c = getMapCenterRef.current?.(); wRefresh(c ?? undefined); }}
          />
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
