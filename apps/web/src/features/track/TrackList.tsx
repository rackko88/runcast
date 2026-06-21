import styled from '@emotion/styled';
import { theme } from '@runcast/ui';
import { RUNNING_SPOTS, TRACK_TYPE_CONFIG, type TrackType } from './tracks';

const Wrap = styled.div`display: flex; flex-direction: column; gap: 12px;`;
const FilterRow = styled.div`display: flex; gap: 6px; flex-wrap: wrap; padding-bottom: 4px;`;
const FilterBtn = styled.button<{ $active: boolean; $color: string }>`
  padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700;
  border: none; cursor: pointer; transition: all 0.15s;
  background: ${p => p.$active ? p.$color : theme.colors.gray100};
  color: ${p => p.$active ? '#fff' : theme.colors.gray600};
`;

const Card = styled.div`
  background: ${theme.colors.white}; border-radius: ${theme.radius.md};
  padding: 12px 14px; box-shadow: ${theme.shadows.sm};
  display: flex; flex-direction: column; gap: 4px;
`;
const CardTop = styled.div`display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;`;
const Name = styled.span`font-size: 14px; font-weight: 700; color: ${theme.colors.black}; flex: 1;`;
const TypeBadge = styled.span<{ $color: string }>`
  font-size: 10px; font-weight: 700; padding: 2px 7px;
  border-radius: 8px; flex-shrink: 0; margin-top: 1px;
  background: ${p => p.$color}22; color: ${p => p.$color};
`;
const Dist = styled.span`font-size: 12px; color: ${theme.colors.blue}; font-weight: 600;`;
const Note = styled.span`font-size: 11px; color: ${theme.colors.gray600};`;

const TYPES = Object.entries(TRACK_TYPE_CONFIG) as [TrackType, typeof TRACK_TYPE_CONFIG[TrackType]][];

import { useState } from 'react';

export default function TrackList() {
  const [filter, setFilter] = useState<TrackType | null>(null);

  const spots = filter ? RUNNING_SPOTS.filter(s => s.type === filter) : RUNNING_SPOTS;

  return (
    <Wrap>
      <FilterRow>
        <FilterBtn $active={filter === null} $color={theme.colors.gray800} onClick={() => setFilter(null)}>
          전체
        </FilterBtn>
        {TYPES.map(([type, cfg]) => (
          <FilterBtn
            key={type}
            $active={filter === type}
            $color={cfg.color}
            onClick={() => setFilter(filter === type ? null : type)}
          >
            {cfg.label[0]} {cfg.label}
          </FilterBtn>
        ))}
      </FilterRow>

      {spots.map(spot => {
        const cfg = TRACK_TYPE_CONFIG[spot.type];
        return (
          <Card key={spot.id}>
            <CardTop>
              <Name>{spot.name}</Name>
              <TypeBadge $color={cfg.color}>{cfg.label[0]} {cfg.label}</TypeBadge>
            </CardTop>
            {spot.distanceKm && (
              <Dist>
                {spot.type === '육상트랙'
                  ? `400m 트랙 (${Math.round(1000 / 400)}바퀴 = 1km)`
                  : `약 ${spot.distanceKm}km`}
              </Dist>
            )}
            {spot.note && <Note>{spot.note}</Note>}
          </Card>
        );
      })}
    </Wrap>
  );
}
