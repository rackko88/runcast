import { useState } from 'react';
import useSWR from 'swr';
import { fetchWeather } from './weatherApi';
import type { GeoLocation, WeatherData } from '@/types';

export function useWeather(location: GeoLocation | null) {
  const [overrideLoc, setOverrideLoc] = useState<GeoLocation | null>(null);
  const activeLoc = overrideLoc ?? location;

  const { data, isLoading, isValidating, mutate } = useSWR<WeatherData | null>(
    activeLoc ? ['weather', activeLoc.lat, activeLoc.lng] : null,
    ([, lat, lng]: [string, number, number]) => fetchWeather(lat, lng),
    // 자동 갱신 없음 — 새로고침 버튼으로만 재조회
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false },
  );

  function refresh(loc?: GeoLocation) {
    if (loc) setOverrideLoc(loc);
    mutate();
  }

  return {
    weather: data ?? null,
    loading: activeLoc === null || isLoading,
    // 새로고침·자동 갱신 등 재조회 중 (기존 데이터 유무와 무관)
    validating: activeLoc === null || isValidating,
    activeLoc,
    refresh,
  };
}
