import { useMemo } from 'react';
import styled from '@emotion/styled';
import { theme } from '@runcast/ui';
import type { WeatherData } from '@/types';

// ── 러닝 적합도 (과학적 근거 기반) ──
// 참고: 최적 러닝 온도 8-15°C (마라톤 연구), 습도 40-60%, 바람 5-20km/h는 냉각 도움
function runScore(w: WeatherData): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  // 온도 (40점): 체감온도 우선, 8-15°C 최적
  const t = w.feelsLike ?? w.temperature;
  let tempScore: number;
  if      (t >= 8  && t <= 15) { tempScore = 40; }
  else if (t >= 5  && t <  8)  { tempScore = 35; reasons.push('기온 약간 쌀쌀'); }
  else if (t > 15  && t <= 20) { tempScore = 33; reasons.push('기온 약간 따뜻'); }
  else if (t >= 0  && t <  5)  { tempScore = 22; reasons.push('기온 쌀쌀'); }
  else if (t > 20  && t <= 25) { tempScore = 20; reasons.push('기온 더움'); }
  else if (t >= -5 && t <  0)  { tempScore = 10; reasons.push('기온 매우 쌀쌀'); }
  else if (t > 25  && t <= 30) { tempScore = 10; reasons.push('기온 매우 더움'); }
  else if (t > 30  && t <= 35) { tempScore = 3;  reasons.push('기온 위험 수준'); }
  else if (t >= -10&& t < -5)  { tempScore = 3;  reasons.push('기온 위험 수준'); }
  else                          { tempScore = 0;  reasons.push('기온 극한값'); }

  // 강수 (25점)
  const prob = w.precipProbability ?? 0;
  let rainScore: number;
  if      (w.isRaining)  { rainScore = 0;  reasons.push('현재 강수 중'); }
  else if (prob >= 70)   { rainScore = 2;  reasons.push('강수 가능성 높음'); }
  else if (prob >= 50)   { rainScore = 8;  reasons.push('강수 가능성 있음'); }
  else if (prob >= 30)   { rainScore = 15; reasons.push('강수 가능성 낮음'); }
  else if (prob >= 10)   { rainScore = 20; }
  else                   { rainScore = 25; }

  // 습도 (15점): 40-60% 최적
  const h = w.humidity;
  let humScore: number;
  if      (h >= 40 && h <= 60) { humScore = 15; }
  else if (h >= 30 && h <  40) { humScore = 11; }
  else if (h >  60 && h <= 70) { humScore = 11; }
  else if (h >= 20 && h <  30) { humScore = 7;  reasons.push('습도 건조'); }
  else if (h >  70 && h <= 80) { humScore = 7;  reasons.push('습도 높음'); }
  else if (h >  80 && h <= 90) { humScore = 3;  reasons.push('습도 매우 높음'); }
  else                          { humScore = 0;  reasons.push('습도 극단값'); }

  // 바람 (12점): 1.5-5.5m/s 미풍은 체온냉각 도움
  const ws = w.windSpeed;
  let windScore: number;
  if      (ws >= 1.5 && ws <= 5.5) { windScore = 12; }
  else if (ws <  1.5)              { windScore = 10; }
  else if (ws <= 8.5)              { windScore = 8;  }
  else if (ws <= 12.5)             { windScore = 4;  reasons.push('바람 강함'); }
  else if (ws <= 16.5)             { windScore = 1;  reasons.push('바람 매우 강함'); }
  else                             { windScore = 0;  reasons.push('바람 위험 수준'); }

  // 대기질 (8점)
  const pm = w.pm10 ?? 0;
  let airScore: number;
  if      (pm <= 30)  { airScore = 8; }
  else if (pm <= 80)  { airScore = 5; }
  else if (pm <= 150) { airScore = 2; reasons.push('미세먼지 나쁨'); }
  else                { airScore = 0; reasons.push('미세먼지 매우 나쁨'); }

  const score = tempScore + rainScore + humScore + windScore + airScore;
  return { score: Math.min(100, Math.max(0, score)), reasons };
}

function scoreInfo(score: number) {
  if (score >= 85) return { text: '최적',   color: '#22c55e', emoji: '🟢' };
  if (score >= 70) return { text: '양호',   color: '#84cc16', emoji: '🟡' };
  if (score >= 50) return { text: '보통',   color: '#f59e0b', emoji: '🟠' };
  if (score >= 30) return { text: '주의',   color: '#f97316', emoji: '🔴' };
  return                  { text: '비추천', color: '#ef4444', emoji: '⛔' };
}

function pmGrade(pm10?: number, pm25?: number) {
  if (pm10 == null) return null;
  const p25 = pm25 ?? 0;
  if (pm10 <= 30  && p25 <= 15) return { text: '좋음',    color: '#22c55e' };
  if (pm10 <= 80  && p25 <= 35) return { text: '보통',    color: '#f59e0b' };
  if (pm10 <= 150 && p25 <= 75) return { text: '나쁨',    color: '#ef4444' };
  return                               { text: '매우나쁨', color: '#7c3aed' };
}

function windDirLabel(deg?: number) {
  if (deg == null) return '';
  return ['북','북동','동','남동','남','남서','서','북서'][Math.round(deg / 45) % 8];
}

function windStrength(ms: number) {
  if (ms < 0.3)  return '고요';
  if (ms < 1.6)  return '실바람';
  if (ms < 3.4)  return '약한 바람';
  if (ms < 5.5)  return '산들바람';
  if (ms < 8.0)  return '건들바람';
  if (ms < 10.8) return '강한 바람';
  if (ms < 13.9) return '매우 강함';
  return '폭풍';
}

function humidityLabel(h: number) {
  if (h < 30) return '매우 건조';
  if (h < 40) return '건조';
  if (h < 60) return '쾌적';
  if (h < 70) return '약간 습함';
  if (h < 80) return '습함';
  return '매우 습함';
}

function hourLabel(h: number, isFirst: boolean) {
  if (isFirst) return '지금';
  return h === 0 ? '자정' : h < 12 ? `오전${h}시` : h === 12 ? '오후12시' : `오후${h - 12}시`;
}

function fmtDate(dateStr: string) {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

function fmtTime(d: Date) {
  const h = d.getHours(), m = d.getMinutes();
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
}

// ── 스타일 ──
const Wrap = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const Placeholder = styled.div`font-size: 14px; color: ${theme.colors.gray400}; text-align: center; padding: 40px 0;`;
const Card = styled.div`background: ${theme.colors.white}; border-radius: ${theme.radius.md}; padding: 16px; box-shadow: ${theme.shadows.sm};`;

const SectionTitle = styled.div`
  font-size: 11px; font-weight: 700; color: ${theme.colors.gray400};
  letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;
`;

// 러닝 점수
const ScoreRow = styled.div`display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;`;
const ScoreTitle = styled.span`font-size: 14px; font-weight: 700; color: ${theme.colors.black};`;
const ScoreBadge = styled.span<{ $color: string }>`
  font-size: 14px; font-weight: 700; color: ${p => p.$color};
`;
const ScoreTrack = styled.div`height: 8px; background: ${theme.colors.gray100}; border-radius: 4px; overflow: hidden; margin-bottom: 8px;`;
const ScoreFill = styled.div<{ $w: number; $bg: string }>`
  height: 100%; border-radius: 4px; width: ${p => p.$w}%; background: ${p => p.$bg}; transition: width 0.6s ease;
`;
const ScoreReasons = styled.div`font-size: 11px; color: ${theme.colors.gray400}; line-height: 1.6;`;

// 현재 날씨
const WeatherMeta = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
`;
const MetaLeft = styled.div`font-size: 11px; color: ${theme.colors.gray400}; font-weight: 500;`;
const Current = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 14px;`;
const BigIcon = styled.span`font-size: 40px; line-height: 1; flex-shrink: 0;`;
const BigInfo = styled.div`min-width: 0;`;
const BigTemp = styled.div`font-size: 32px; font-weight: 700; color: ${theme.colors.black}; line-height: 1;`;
const BigDesc = styled.div`font-size: 13px; color: ${theme.colors.gray600}; margin-top: 3px; white-space: nowrap;`;
const Grid = styled.div`display: grid; grid-template-columns: 1fr 1fr; gap: 8px;`;
const Cell = styled.div`
  background: ${theme.colors.gray50}; border-radius: 10px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 2px; min-width: 0;
`;
const CellLabel = styled.span`font-size: 11px; color: ${theme.colors.gray400}; font-weight: 500; white-space: nowrap;`;
const CellVal = styled.span`font-size: 14px; font-weight: 700; color: ${theme.colors.black}; word-break: keep-all; overflow-wrap: break-word;`;
const CellSub = styled.span`font-size: 11px; color: ${theme.colors.gray600}; font-weight: 500;`;

// 시간별
const HourlyScroll = styled.div`
  display: flex; gap: 6px; overflow-x: auto; padding-bottom: 4px;
  scrollbar-width: none; &::-webkit-scrollbar { display: none; }
`;
const HourCell = styled.div<{ $now: boolean }>`
  flex: 0 0 58px; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: ${p => p.$now ? theme.colors.black : theme.colors.gray50};
  border-radius: 12px; padding: 10px 4px;
`;
const HourTime = styled.span<{ $now: boolean }>`
  font-size: 10px; font-weight: 600; text-align: center;
  color: ${p => p.$now ? 'rgba(255,255,255,0.65)' : theme.colors.gray400};
`;
const HourIcon = styled.span`font-size: 18px; line-height: 1;`;
const HourDesc = styled.span<{ $now: boolean }>`
  font-size: 9px; color: ${p => p.$now ? 'rgba(255,255,255,0.5)' : theme.colors.gray400};
  text-align: center; white-space: nowrap; overflow: hidden; width: 54px;
  text-overflow: ellipsis;
`;
const HourTemp = styled.span<{ $now: boolean }>`font-size: 13px; font-weight: 700; color: ${p => p.$now ? '#fff' : theme.colors.black};`;
const HourRainWrap = styled.div`display: flex; flex-direction: column; align-items: center; gap: 0px;`;
const HourRain = styled.span<{ $show: boolean; $now: boolean }>`
  font-size: 10px; font-weight: 600;
  color: ${p => p.$now ? '#93c5fd' : '#3b82f6'};
  opacity: ${p => p.$show ? 1 : 0};
`;
const HourRainLabel = styled.span<{ $now: boolean }>`
  font-size: 9px; color: ${p => p.$now ? 'rgba(255,255,255,0.4)' : theme.colors.gray400};
  opacity: inherit;
`;

// 주간 예보
const WeekRow = styled.div`
  display: flex; align-items: center; padding: 9px 0;
  border-bottom: 1px solid ${theme.colors.gray100};
  &:last-child { border-bottom: none; }
  gap: 8px;
`;
const WeekDay = styled.div`display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; width: 38px;`;
const WeekDayLabel = styled.span`font-size: 13px; font-weight: 700; color: ${theme.colors.black};`;
const WeekDate = styled.span`font-size: 10px; color: ${theme.colors.gray400}; font-weight: 500;`;
const WeekIconWrap = styled.div`display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0;`;
const WeekEmoji = styled.span`font-size: 18px; flex-shrink: 0;`;
const WeekDesc = styled.span`font-size: 11px; color: ${theme.colors.gray600}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
const WeekRight = styled.div`display: flex; align-items: center; gap: 8px; flex-shrink: 0;`;
const WeekTemps = styled.div`display: flex; align-items: center; gap: 4px;`;
const WeekMax = styled.span`font-size: 13px; font-weight: 700; color: #ef4444;`;
const WeekMin = styled.span`font-size: 13px; color: #60a5fa;`;
const WeekRainWrap = styled.div`display: flex; flex-direction: column; align-items: flex-end; min-width: 38px;`;
const WeekRainProb = styled.span<{ $show: boolean }>`font-size: 11px; font-weight: 600; color: #3b82f6; opacity: ${p => p.$show ? 1 : 0};`;
const WeekPrecip = styled.span<{ $show: boolean }>`font-size: 10px; color: ${theme.colors.gray400}; opacity: ${p => p.$show ? 1 : 0};`;

// 대기질
const AirSummary = styled.div`font-size: 18px; font-weight: 700; margin-bottom: 10px;`;
const Source = styled.div`font-size: 11px; color: ${theme.colors.gray400}; text-align: right; padding-top: 4px;`;

function DataCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Cell>
      <CellLabel>{label}</CellLabel>
      <CellVal>{value}</CellVal>
      {sub && <CellSub>{sub}</CellSub>}
    </Cell>
  );
}

interface Props {
  weather: WeatherData | null;
  loading: boolean;
  locationLabel?: string;
}

export default function WeatherDetail({ weather, loading, locationLabel }: Props) {
  const now = useMemo(() => new Date(), [weather]);

  if (loading) return <Placeholder>날씨 불러오는 중…</Placeholder>;
  if (!weather) return <Placeholder>날씨 정보를 가져올 수 없습니다</Placeholder>;

  const { score, reasons } = runScore(weather);
  const si    = scoreInfo(score);
  const grade = pmGrade(weather.pm10, weather.pm25);
  const nowH  = now.getHours();

  return (
    <Wrap>
      {/* 러닝 적합도 */}
      <Card>
        <ScoreRow>
          <ScoreTitle>러닝 적합도</ScoreTitle>
          <ScoreBadge $color={si.color}>{si.emoji} {score}점 · {si.text}</ScoreBadge>
        </ScoreRow>
        <ScoreTrack><ScoreFill $w={score} $bg={si.color} /></ScoreTrack>
        {reasons.length > 0 && (
          <ScoreReasons>{reasons.join(' · ')}</ScoreReasons>
        )}
      </Card>

      {/* 현재 날씨 */}
      <Card>
        <WeatherMeta>
          <SectionTitle style={{ margin: 0 }}>현재 날씨</SectionTitle>
          <MetaLeft>{locationLabel ?? '위치 확인 중'} · {fmtTime(now)}</MetaLeft>
        </WeatherMeta>
        <Current>
          <BigIcon>{weather.icon}</BigIcon>
          <BigInfo>
            <BigTemp>{weather.temperature}°C</BigTemp>
            <BigDesc>{weather.description}{weather.feelsLike != null ? ` · 체감 ${weather.feelsLike}°` : ''}</BigDesc>
          </BigInfo>
        </Current>
        <Grid>
          <DataCell
            label="습도"
            value={`${weather.humidity}%`}
            sub={humidityLabel(weather.humidity)}
          />
          <DataCell
            label="바람"
            value={`${weather.windSpeed}m/s${weather.windDirection != null ? ` ${windDirLabel(weather.windDirection)}` : ''}`}
            sub={windStrength(weather.windSpeed)}
          />
          {(weather.precipProbability ?? 0) > 0 && (
            <DataCell label="강수확률" value={`${weather.precipProbability}%`} />
          )}
          {weather.precipitation > 0 && (
            <DataCell label="강수량" value={`${weather.precipitation}mm`} />
          )}
        </Grid>
      </Card>

      {/* 시간별 예보 */}
      {(weather.hourly?.length ?? 0) > 0 && (
        <Card>
          <SectionTitle>시간별 예보 · 강수확률 포함</SectionTitle>
          <HourlyScroll>
            {weather.hourly!.map((h, i) => {
              const isNow = i === 0;
              const showRain = h.precipProbability > 0;
              return (
                <HourCell key={i} $now={isNow}>
                  <HourTime $now={isNow}>{hourLabel(h.hour, isNow)}</HourTime>
                  <HourIcon>{h.icon}</HourIcon>
                  <HourDesc $now={isNow}>{h.description}</HourDesc>
                  <HourTemp $now={isNow}>{h.temperature}°</HourTemp>
                  <HourRainWrap>
                    <HourRain $show={showRain} $now={isNow}>
                      {showRain ? `${h.precipProbability}%` : '　'}
                    </HourRain>
                    {showRain && <HourRainLabel $now={isNow}>강수확률</HourRainLabel>}
                  </HourRainWrap>
                </HourCell>
              );
            })}
          </HourlyScroll>
        </Card>
      )}

      {/* 오늘 예보 */}
      {(weather.tempMax != null || weather.sunrise) && (
        <Card>
          <SectionTitle>오늘 예보</SectionTitle>
          <Grid>
            {weather.tempMax != null && (
              <>
                <DataCell label="최고기온 ☀️" value={`${weather.tempMax}°C`} />
                <DataCell label="최저기온 🌙" value={`${weather.tempMin}°C`} />
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

      {/* 주간 예보 */}
      {(weather.weekly?.length ?? 0) > 0 && (
        <Card>
          <SectionTitle>주간 예보 (7일)</SectionTitle>
          {weather.weekly!.map((d, i) => (
            <WeekRow key={i}>
              <WeekDay>
                <WeekDayLabel>{d.dayLabel}</WeekDayLabel>
                <WeekDate>{fmtDate(d.date)}</WeekDate>
              </WeekDay>
              <WeekIconWrap>
                <WeekEmoji>{d.icon}</WeekEmoji>
                <WeekDesc>{d.description}</WeekDesc>
              </WeekIconWrap>
              <WeekRight>
                <WeekTemps>
                  <WeekMax>{d.tempMax}°</WeekMax>
                  <WeekMin>/{d.tempMin}°</WeekMin>
                </WeekTemps>
                <WeekRainWrap>
                  <WeekRainProb $show={d.precipProbabilityMax > 0}>
                    {d.precipProbabilityMax > 0 ? `🌂${d.precipProbabilityMax}%` : ''}
                  </WeekRainProb>
                  <WeekPrecip $show={d.precipSum > 0}>
                    {d.precipSum > 0 ? `${d.precipSum}mm` : ''}
                  </WeekPrecip>
                </WeekRainWrap>
              </WeekRight>
            </WeekRow>
          ))}
        </Card>
      )}

      {/* 대기질 */}
      {grade && (
        <Card>
          <SectionTitle>대기질</SectionTitle>
          <AirSummary style={{ color: grade.color }}>● {grade.text}</AirSummary>
          <Grid>
            <DataCell label="미세먼지 PM10" value={`${weather.pm10}㎍/m³`} />
            <DataCell label="초미세 PM2.5" value={`${weather.pm25}㎍/m³`} />
          </Grid>
        </Card>
      )}

      {weather.source && <Source>출처: {weather.source} · Open-Meteo</Source>}
    </Wrap>
  );
}
