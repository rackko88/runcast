import useSWR from 'swr';
import { useMemo } from 'react';
import { STATIONS, getStatusFromLevel } from './rivers';
import { fetchWaterLevels } from './riverApi';
import type { RiverStation } from '@/types';

interface FetchResult {
  levels: Awaited<ReturnType<typeof fetchWaterLevels>>;
  fetchedAt: Date;
}

async function fetcher(): Promise<FetchResult> {
  const levels = await fetchWaterLevels(STATIONS.map(s => s.id));
  return { levels, fetchedAt: new Date() };
}

export function useRiverData() {
  const { data, isLoading, mutate } = useSWR<FetchResult>('riverData', fetcher, {
    refreshInterval: 5 * 60 * 1000,
    revalidateOnFocus: false,
  });

  const isMock = data?.levels?.[0]?.isMock ?? false;

  const riverData = useMemo<RiverStation[]>(() => {
    if (!data) return [];
    const map = new Map(data.levels.map(l => [l.stationId, l]));
    return STATIONS.map(s => {
      const info = map.get(s.id);
      const wl = info?.waterLevel ?? null;
      return { ...s, waterLevel: wl, status: getStatusFromLevel(wl, s.warnLevel, s.dangerLevel), error: info?.error };
    });
  }, [data]);

  return {
    riverData,
    loading: isLoading,
    isMock,
    lastUpdated: data?.fetchedAt ?? null,
    // 인자 없이 재검증만 수행 (onClick 등에서 이벤트 객체가 mutate로 넘어가 캐시를 덮어쓰는 것 방지)
    refresh: () => mutate(),
  };
}
