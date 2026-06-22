import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '@runcast/ui';
import type { WeatherData } from '@/types';

function pmGrade(pm10?: number, pm25?: number) {
  if (pm10 == null) return null;
  const p25 = pm25 ?? 0;
  if (pm10 <= 15  && p25 <= 8)   return { text: '매우좋음', color: '#3b82f6' };
  if (pm10 <= 30  && p25 <= 15)  return { text: '좋음',     color: '#22c55e' };
  if (pm10 <= 80  && p25 <= 35)  return { text: '보통',     color: '#f59e0b' };
  if (pm10 <= 150 && p25 <= 75)  return { text: '나쁨',     color: '#ef4444' };
  if (pm10 <= 250 && p25 <= 150) return { text: '매우나쁨', color: '#7c3aed' };
  return                                { text: '최악',     color: '#1a1a1a' };
}

const Card = styled.div<{ $alert: boolean }>`
  position: absolute;
  top: 12px; right: 12px;
  background: ${theme.colors.white};
  border-radius: ${theme.radius.md};
  box-shadow: ${theme.shadows.md};
  z-index: 50;
  ${p => p.$alert && `outline: 2px solid ${theme.colors.blue};`}
`;

/* 접힌 상태 */
const Mini = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 8px 14px; cursor: pointer;
`;
const MiniIcon = styled.span`font-size: 20px; line-height: 1;`;
const MiniTemp = styled.span`font-size: 17px; font-weight: 700; color: ${theme.colors.black};`;
const MiniDesc = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;

/* 펼친 상태 */
const Full = styled.div`padding: 12px 14px; min-width: 200px;`;
const FullHeader = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 8px;`;
const FullLeft = styled.div`display: flex; align-items: center; gap: 10px;`;
const BigIcon = styled.span`font-size: 26px; line-height: 1; flex-shrink: 0;`;
const Info = styled.div`display: flex; flex-direction: column; gap: 1px;`;
const TempRow = styled.div`display: flex; align-items: baseline; gap: 6px;`;
const Temp = styled.span`font-size: 20px; font-weight: 700; color: ${theme.colors.black}; line-height: 1;`;
const Range = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;
const Desc = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;
const Hum = styled.span`font-size: 12px; color: ${theme.colors.blue}; font-weight: 600;`;
const Sun = styled.div`display: flex; gap: 12px; font-size: 12px; color: ${theme.colors.gray600}; font-weight: 500; padding-top: 8px; border-top: 1px solid ${theme.colors.gray100};`;
const Air = styled.div`display: flex; align-items: center; gap: 8px; font-size: 11px; padding-top: 6px;`;
const AirGrade = styled.span`font-weight: 700;`;
const AirVals = styled.span`color: ${theme.colors.gray400};`;
const Rain = styled.div`font-size: 11px; color: ${theme.colors.blue}; font-weight: 600; padding-top: 4px;`;

const ToggleBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: ${theme.colors.gray400}; font-size: 13px; padding: 0;
  line-height: 1; flex-shrink: 0; margin-top: 2px;
`;

const LocLabel = styled.div`font-size: 10px; color: ${theme.colors.gray400}; font-weight: 500; margin-bottom: 6px;`;

/* 조회중 상태 */
const spin = keyframes`to { transform: rotate(360deg); }`;
const Loading = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; min-width: 120px;
`;
const Spinner = styled.span`
  width: 14px; height: 14px; flex-shrink: 0;
  border: 2px solid ${theme.colors.gray200};
  border-top-color: ${theme.colors.blue};
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
const LoadingText = styled.span`font-size: 12px; color: ${theme.colors.gray600}; font-weight: 600;`;

const RefreshBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: ${theme.colors.gray400}; font-size: 13px; padding: 0; line-height: 1;
  &:hover { color: ${theme.colors.gray600}; }
`;

interface Props {
  weather: WeatherData | null;
  loading: boolean;
  validating?: boolean;
  location?: { lat: number; lng: number } | null;
  onRefresh?: () => void;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ko`,
      { headers: { 'Accept-Language': 'ko' } }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const addr = data.address ?? {};
    // 구 > 군 > 시 순으로 우선
    return addr.city_district || addr.county || addr.city || addr.state || '';
  } catch { return ''; }
}

export default function WeatherFloat({ weather, loading, validating, location, onRefresh }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [areaName, setAreaName] = useState('');

  useEffect(() => {
    if (!location) return;
    reverseGeocode(location.lat, location.lng).then(setAreaName);
  }, [location?.lat, location?.lng]);

  // 영역은 항상 보여주고, 조회·갱신 중이면 "조회중" 표시 (새로고침 시에도 동일)
  if (loading || validating || !weather) {
    return (
      <Card $alert={false}>
        <Loading>
          <Spinner />
          <LoadingText>{weather ? '날씨 갱신중…' : '날씨 조회중…'}</LoadingText>
        </Loading>
      </Card>
    );
  }

  const isAlert = weather.isRaining || (weather.precipProbability ?? 0) >= 60;
  const grade = pmGrade(weather.pm10, weather.pm25);

  if (collapsed) {
    return (
      <Card $alert={isAlert}>
        <Mini onClick={() => setCollapsed(false)}>
          <MiniIcon>{weather.icon}</MiniIcon>
          <MiniTemp>{weather.temperature}°</MiniTemp>
          <MiniDesc>{weather.description}</MiniDesc>
          <ToggleBtn>▼</ToggleBtn>
        </Mini>
      </Card>
    );
  }

  return (
    <Card $alert={isAlert}>
      <Full>
        {areaName && <LocLabel>📍 {areaName}</LocLabel>}
        <FullHeader>
          <FullLeft>
            <BigIcon>{weather.icon}</BigIcon>
            <Info>
              <TempRow>
                <Temp>{weather.temperature}°</Temp>
                {weather.tempMax != null && <Range>↑{weather.tempMax}° ↓{weather.tempMin}°</Range>}
              </TempRow>
              <Desc>{weather.description}</Desc>
            </Info>
          </FullLeft>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {onRefresh && <RefreshBtn onClick={onRefresh} title="지도 중심 기준 재조회">↻</RefreshBtn>}
              <ToggleBtn onClick={() => setCollapsed(true)}>▲</ToggleBtn>
            </div>
            <Hum>💧{weather.humidity}% 습도</Hum>
          </div>
        </FullHeader>

        {weather.sunrise && (
          <Sun>
            <span>🌅 {weather.sunrise}</span>
            <span>🌇 {weather.sunset}</span>
          </Sun>
        )}

        {grade && (
          <Air>
            <AirGrade style={{ color: grade.color }}>● {grade.text}</AirGrade>
            <AirVals>미세먼지 {weather.pm10} · 초미세 {weather.pm25}</AirVals>
          </Air>
        )}

        {weather.precipitation > 0 && <Rain>💧 {weather.precipitation}mm</Rain>}
        {(weather.precipProbability ?? 0) > 0 && !weather.isRaining && (
          <Rain>강수 {weather.precipProbability}%</Rain>
        )}
      </Full>
    </Card>
  );
}
