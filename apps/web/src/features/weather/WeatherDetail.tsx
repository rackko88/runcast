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
function runScore(w: WeatherData): number {
  let s = 100;
  if (w.isRaining) s -= 40;
  else if ((w.precipProbability ?? 0) >= 60) s -= 20;
  else if ((w.precipProbability ?? 0) >= 30) s -= 10;
  const t = w.temperature;
  if (t < -5 || t > 38) s -= 40; else if (t < 0 || t > 35) s -= 25; else if (t < 5 || t > 30) s -= 10;
  if (w.windSpeed > 50) s -= 30; else if (w.windSpeed > 35) s -= 15;
  if ((w.pm10 ?? 0) > 150) s -= 30; else if ((w.pm10 ?? 0) > 80) s -= 15;
  return Math.max(0, s);
}
function scoreInfo(score: number) {
  if (score >= 80) return { text: '최적',  color: '#22c55e' };
  if (score >= 60) return { text: '양호',  color: '#f59e0b' };
  if (score >= 40) return { text: '보통',  color: '#f97316' };
  return                  { text: '비추천',color: '#ef4444' };
}

const Wrap = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const Placeholder = styled.div`font-size: 14px; color: ${theme.colors.gray400}; text-align: center; padding: 40px 0;`;
const Card = styled.div`background: ${theme.colors.white}; border-radius: ${theme.radius.md}; padding: 16px; box-shadow: ${theme.shadows.sm};`;
const ScoreHeader = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;`;
const ScoreTitle = styled.span`font-size: 14px; font-weight: 700; color: ${theme.colors.black};`;
const ScoreText = styled.span`font-size: 14px; font-weight: 700;`;
const ScoreTrack = styled.div`height: 8px; background: ${theme.colors.gray100}; border-radius: 4px; overflow: hidden;`;
const ScoreFill = styled.div<{ $w: number; $bg: string }>`height: 100%; border-radius: 4px; width: ${p => p.$w}%; background: ${p => p.$bg}; transition: width 0.6s ease;`;
const SectionTitle = styled.div`font-size: 11px; font-weight: 700; color: ${theme.colors.gray400}; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;`;
const Current = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 12px;`;
const BigIcon = styled.span`font-size: 40px; line-height: 1;`;
const BigTemp = styled.div`font-size: 32px; font-weight: 700; color: ${theme.colors.black}; line-height: 1;`;
const BigDesc = styled.div`font-size: 14px; color: ${theme.colors.gray600}; margin-top: 2px;`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 8px;`;
const Cell = styled.div`background: ${theme.colors.gray50}; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px;`;
const CellLabel = styled.span`font-size: 11px; color: ${theme.colors.gray400}; font-weight: 500;`;
const CellVal = styled.span`font-size: 15px; font-weight: 700; color: ${theme.colors.black};`;
const AirSummary = styled.div`font-size: 18px; font-weight: 700; margin-bottom: 10px;`;
const Source = styled.div`font-size: 11px; color: ${theme.colors.gray400}; text-align: right; padding-top: 4px;`;

function DataCell({ label, value }: { label: string; value: string }) {
  return <Cell><CellLabel>{label}</CellLabel><CellVal>{value}</CellVal></Cell>;
}

interface Props { weather: WeatherData | null; loading: boolean; }

export default function WeatherDetail({ weather, loading }: Props) {
  if (loading) return <Placeholder>날씨 불러오는 중…</Placeholder>;
  if (!weather) return <Placeholder>날씨 정보를 가져올 수 없습니다</Placeholder>;

  const grade = pmGrade(weather.pm10, weather.pm25);
  const score = runScore(weather);
  const si = scoreInfo(score);

  return (
    <Wrap>
      <Card>
        <ScoreHeader>
          <ScoreTitle>러닝 적합도</ScoreTitle>
          <ScoreText style={{ color: si.color }}>{score}점 · {si.text}</ScoreText>
        </ScoreHeader>
        <ScoreTrack><ScoreFill $w={score} $bg={si.color} /></ScoreTrack>
      </Card>

      <Card>
        <SectionTitle>현재 날씨</SectionTitle>
        <Current>
          <BigIcon>{weather.icon}</BigIcon>
          <div>
            <BigTemp>{weather.temperature}°C</BigTemp>
            <BigDesc>{weather.description}</BigDesc>
          </div>
        </Current>
        <Grid>
          <DataCell label="습도" value={`${weather.humidity}%`} />
          <DataCell label="풍속" value={`${weather.windSpeed}km/h`} />
          {weather.precipitation > 0 && <DataCell label="강수량" value={`${weather.precipitation}mm`} />}
          {(weather.precipProbability ?? 0) > 0 && <DataCell label="강수확률" value={`${weather.precipProbability}%`} />}
        </Grid>
      </Card>

      {(weather.tempMax != null || weather.sunrise) && (
        <Card>
          <SectionTitle>오늘 예보</SectionTitle>
          <Grid>
            {weather.tempMax != null && (
              <>
                <DataCell label="최고기온" value={`${weather.tempMax}°C`} />
                <DataCell label="최저기온" value={`${weather.tempMin}°C`} />
              </>
            )}
            {weather.sunrise && (
              <>
                <DataCell label="일출" value={`🌅 ${weather.sunrise}`} />
                <DataCell label="일몰" value={`🌇 ${weather.sunset}`} />
              </>
            )}
          </Grid>
        </Card>
      )}

      {grade && (
        <Card>
          <SectionTitle>대기질</SectionTitle>
          <AirSummary style={{ color: grade.color }}>● {grade.text}</AirSummary>
          <Grid>
            <DataCell label="미세먼지 PM10" value={`${weather.pm10}㎍/m³`} />
            <DataCell label="초미세먼지 PM2.5" value={`${weather.pm25}㎍/m³`} />
          </Grid>
        </Card>
      )}

      {weather.source && <Source>출처: {weather.source} · Open-Meteo</Source>}
    </Wrap>
  );
}
