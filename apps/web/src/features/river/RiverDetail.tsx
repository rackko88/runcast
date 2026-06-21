import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '@runcast/ui';
import { RIVER_COLORS } from './rivers';
import type { RiverStation, RiverStatus } from '@/types';

const shimmer = keyframes`0%,100%{opacity:.5} 50%{opacity:1}`;

const Wrap = styled.div`display: flex; flex-direction: column; height: 100%;`;
const Header = styled.div`display: flex; align-items: center; justify-content: space-between; padding: 0 0 12px;`;
const Meta = styled.div`display: flex; align-items: center; gap: 8px;`;
const Time = styled.span`font-size: 11px; color: ${theme.colors.gray400};`;
const MockTag = styled.span`background: #FFF3CD; color: #856404; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 6px;`;
const RefreshBtn = styled.button`background: ${theme.colors.gray100}; border: none; color: ${theme.colors.gray800}; width: 28px; height: 28px; border-radius: 8px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;`;

const Cards = styled.div`
  display: flex; gap: 10px; padding-bottom: 16px;
  overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none;
  flex-shrink: 0;
  &::-webkit-scrollbar { display: none; }
  @media (min-width: ${theme.bp.pc}) { flex-wrap: wrap; overflow-x: visible; }
`;
const Card = styled.div<{ $borderColor: string }>`
  flex-shrink: 0; background: ${theme.colors.gray50};
  border: 1px solid ${theme.colors.gray200};
  border-top: 3px solid ${p => p.$borderColor};
  border-radius: ${theme.radius.md}; padding: 12px 14px; min-width: 130px;
  @media (min-width: ${theme.bp.pc}) { width: calc(50% - 5px); min-width: unset; }
`;
const CardSkeleton = styled.div`
  flex-shrink: 0; background: ${theme.colors.gray100};
  border: 1px solid ${theme.colors.gray200}; border-top: 3px solid transparent;
  border-radius: ${theme.radius.md}; padding: 12px 14px; min-width: 130px;
  height: 90px; animation: ${shimmer} 1.4s infinite;
  @media (min-width: ${theme.bp.pc}) { width: calc(50% - 5px); min-width: unset; }
`;
const CardName = styled.span`display: block; font-size: 14px; font-weight: 700; color: ${theme.colors.black}; margin-bottom: 3px;`;
const CardStatus = styled.span`display: block; font-size: 12px; font-weight: 600; margin-bottom: 10px;`;
const Stations = styled.div`display: flex; flex-direction: column; gap: 5px;`;
const StationRow = styled.div`display: flex; align-items: center; gap: 6px;`;
const Dot = styled.span<{ $bg: string }>`width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: ${p => p.$bg};`;
const StationName = styled.span`font-size: 11px; color: ${theme.colors.gray600}; flex: 1;`;
const Level = styled.span`font-size: 11px; font-weight: 600; color: ${theme.colors.gray800};`;

const Bars = styled.div`flex: 1; overflow-y: auto;`;
const Group = styled.div`margin-bottom: 20px;`;
const GroupTitle = styled.div`font-size: 11px; font-weight: 700; color: ${theme.colors.gray400}; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 10px;`;
const Station = styled.div`display: flex; align-items: center; gap: 10px; margin-bottom: 10px;`;
const StName = styled.span`font-size: 13px; color: ${theme.colors.gray800}; width: 110px; flex-shrink: 0;`;
const BarWrap = styled.div`flex: 1; display: flex; align-items: center; gap: 8px;`;
const Bar = styled.div`flex: 1; height: 5px; background: ${theme.colors.gray100}; border-radius: 3px; position: relative; overflow: visible;`;
const Fill = styled.div<{ $w: number; $bg: string }>`height: 100%; border-radius: 3px; transition: width 0.6s ease; width: ${p => p.$w}%; background: ${p => p.$bg};`;
const WarnMark = styled.span<{ $left: number }>`position: absolute; top: -4px; left: ${p => p.$left}%; width: 2px; height: 13px; background: ${theme.colors.orange}; border-radius: 1px; transform: translateX(-50%);`;
const WarnLabel = styled.span<{ $left: number }>`
  position: absolute; top: -18px; left: ${p => p.$left}%;
  transform: translateX(-50%);
  font-size: 9px; color: ${theme.colors.orange}; font-weight: 700;
  white-space: nowrap; pointer-events: none;
`;
const BarLevel = styled.span`font-size: 12px; font-weight: 700; width: 42px; text-align: right;`;

function worstStatus(stations: RiverStation[]): RiverStatus {
  for (const s of ['통제', '위험', '경계', '주의', '정상'] as RiverStatus[]) {
    if (stations.some(st => st.status === s)) return s;
  }
  return '오류';
}
function groupByRiver(data: RiverStation[]): Record<string, RiverStation[]> {
  return data.reduce<Record<string, RiverStation[]>>((acc, s) => {
    (acc[s.river] = acc[s.river] || []).push(s);
    return acc;
  }, {});
}

interface Props {
  riverData: RiverStation[];
  loading: boolean;
  isMock: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function RiverDetail({ riverData, loading, isMock, lastUpdated, onRefresh }: Props) {
  const grouped = groupByRiver(riverData);

  return (
    <Wrap>
      <Header>
        <Meta>
          {isMock && <MockTag>샘플</MockTag>}
          {lastUpdated && (
            <Time>{lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준</Time>
          )}
        </Meta>
        <RefreshBtn onClick={onRefresh}>↻</RefreshBtn>
      </Header>

      <Cards>
        {loading ? (
          [1,2,3,4,5].map(i => <CardSkeleton key={i} />)
        ) : (
          Object.entries(grouped).map(([name, stations]) => {
            const status = worstStatus(stations);
            const color = RIVER_COLORS[status];
            return (
              <Card key={name} $borderColor={color}>
                <CardName>{name}</CardName>
                <CardStatus style={{ color }}>{status}</CardStatus>
                <Stations>
                  {stations.map(s => (
                    <StationRow key={s.id}>
                      <Dot $bg={RIVER_COLORS[s.status]} />
                      <StationName>{s.name.replace(/.*\(/, '').replace(')', '')}</StationName>
                      <Level>{s.waterLevel !== null ? `${s.waterLevel.toFixed(2)}m` : '-'}</Level>
                    </StationRow>
                  ))}
                </Stations>
              </Card>
            );
          })
        )}
      </Cards>

      <Bars>
        {Object.entries(grouped).map(([name, stations]) => (
          <Group key={name}>
            <GroupTitle>{name}</GroupTitle>
            {stations.map(s => (
              <Station key={s.id}>
                <StName>{s.name}</StName>
                <BarWrap>
                  <Bar>
                    <Fill
                      $w={Math.min(100, s.waterLevel != null ? (s.waterLevel / s.dangerLevel) * 100 : 0)}
                      $bg={RIVER_COLORS[s.status]}
                    />
                    <WarnLabel $left={(s.warnLevel / s.dangerLevel) * 100}>주의</WarnLabel>
                    <WarnMark $left={(s.warnLevel / s.dangerLevel) * 100} />
                  </Bar>
                  <BarLevel style={{ color: RIVER_COLORS[s.status] }}>
                    {s.waterLevel !== null ? `${s.waterLevel.toFixed(2)}m` : '-'}
                  </BarLevel>
                </BarWrap>
              </Station>
            ))}
          </Group>
        ))}
      </Bars>
    </Wrap>
  );
}
