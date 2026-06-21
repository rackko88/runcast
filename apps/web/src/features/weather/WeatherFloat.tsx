import { useState } from 'react';
import styled from '@emotion/styled';
import { theme } from '@runcast/ui';
import type { WeatherData } from '@/types';

function pmGrade(pm10?: number, pm25?: number) {
  if (pm10 == null) return null;
  const p25 = pm25 ?? 0;
  if (pm10 <= 30  && p25 <= 15) return { text: '좋음',   color: '#22c55e' };
  if (pm10 <= 80  && p25 <= 35) return { text: '보통',   color: '#f59e0b' };
  if (pm10 <= 150 && p25 <= 75) return { text: '나쁨',   color: '#ef4444' };
  return                               { text: '매우나쁨',color: '#7c3aed' };
}

const Card = styled.div<{ $alert: boolean }>`
  position: absolute;
  top: 12px; right: 12px;
  background: ${theme.colors.white};
  border-radius: ${theme.radius.md};
  box-shadow: ${theme.shadows.md};
  z-index: 50;
  overflow: hidden;
  ${p => p.$alert && `outline: 2px solid ${theme.colors.blue};`}
`;
const CollapseRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 8px 14px; cursor: pointer;
  min-width: 140px;
`;
const MiniIcon = styled.span`font-size: 20px; line-height: 1; flex-shrink: 0;`;
const MiniTemp = styled.span`font-size: 17px; font-weight: 700; color: ${theme.colors.black}; flex: 1;`;
const MiniDesc = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;
const ToggleBtn = styled.button`
  background: none; border: none; cursor: pointer;
  color: ${theme.colors.gray400}; font-size: 14px; padding: 0 4px;
  line-height: 1; flex-shrink: 0;
`;
const Details = styled.div`
  padding: 0 14px 12px;
  display: flex; flex-direction: column; gap: 6px;
  border-top: 1px solid ${theme.colors.gray100};
`;
const Top = styled.div`display: flex; align-items: center; gap: 10px; padding-top: 10px;`;
const Icon = styled.span`font-size: 26px; line-height: 1; flex-shrink: 0;`;
const Info = styled.div`display: flex; flex-direction: column; gap: 1px; flex: 1;`;
const TempRow = styled.div`display: flex; align-items: baseline; gap: 6px;`;
const Temp = styled.span`font-size: 20px; font-weight: 700; color: ${theme.colors.black}; line-height: 1;`;
const Range = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;
const Desc = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;
const Hum = styled.span`font-size: 12px; color: ${theme.colors.blue}; font-weight: 600; flex-shrink: 0;`;
const Sun = styled.div`display: flex; gap: 12px; font-size: 12px; color: ${theme.colors.gray600}; font-weight: 500; padding-top: 4px; border-top: 1px solid ${theme.colors.gray100};`;
const Air = styled.div`display: flex; align-items: center; gap: 8px; font-size: 11px;`;
const AirGrade = styled.span`font-weight: 700;`;
const AirVals = styled.span`color: ${theme.colors.gray400};`;
const Rain = styled.div`font-size: 11px; color: ${theme.colors.blue}; font-weight: 600;`;

interface Props { weather: WeatherData | null; loading: boolean; }

export default function WeatherFloat({ weather, loading }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (loading || !weather) return null;

  const isAlert = weather.isRaining || (weather.precipProbability ?? 0) >= 60;
  const grade = pmGrade(weather.pm10, weather.pm25);

  return (
    <Card $alert={isAlert}>
      <CollapseRow onClick={() => setCollapsed(v => !v)}>
        <MiniIcon>{weather.icon}</MiniIcon>
        <MiniTemp>{weather.temperature}°</MiniTemp>
        {collapsed && <MiniDesc>{weather.description}</MiniDesc>}
        <ToggleBtn onClick={e => { e.stopPropagation(); setCollapsed(v => !v); }}>
          {collapsed ? '▼' : '▲'}
        </ToggleBtn>
      </CollapseRow>

      {!collapsed && (
        <Details>
          <Top>
            <Icon>{weather.icon}</Icon>
            <Info>
              <TempRow>
                <Temp>{weather.temperature}°</Temp>
                {weather.tempMax != null && <Range>↑{weather.tempMax}° ↓{weather.tempMin}°</Range>}
              </TempRow>
              <Desc>{weather.description}</Desc>
            </Info>
            <Hum>💧{weather.humidity}%</Hum>
          </Top>

          {weather.sunrise && (
            <Sun>
              <span>🌅 {weather.sunrise}</span>
              <span>🌇 {weather.sunset}</span>
            </Sun>
          )}

          {grade && (
            <Air>
              <AirGrade style={{ color: grade.color }}>● {grade.text}</AirGrade>
              <AirVals>PM10 {weather.pm10} · PM2.5 {weather.pm25}㎍</AirVals>
            </Air>
          )}

          {weather.precipitation > 0 && <Rain>💧 {weather.precipitation}mm</Rain>}
          {(weather.precipProbability ?? 0) > 0 && !weather.isRaining && (
            <Rain>강수 {weather.precipProbability}%</Rain>
          )}
        </Details>
      )}
    </Card>
  );
}
