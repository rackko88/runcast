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
  position: absolute; top: 12px; right: 12px;
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

interface Props { weather: WeatherData | null; loading: boolean; }

export default function WeatherFloat({ weather, loading }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  if (loading || !weather) return null;

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
            <ToggleBtn onClick={() => setCollapsed(true)}>▲</ToggleBtn>
            <Hum>💧{weather.humidity}%</Hum>
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
            <AirVals>PM10 {weather.pm10} · PM2.5 {weather.pm25}㎍</AirVals>
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
