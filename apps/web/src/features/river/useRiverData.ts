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

  const isMock = data?.levels[0]?.isMock ?? false;

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
    refresh: mutate,
  };
}
