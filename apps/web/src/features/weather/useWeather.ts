import { useState } from 'react';
import useSWR from 'swr';
import { fetchWeather } from './weatherApi';
import type { GeoLocation, WeatherData } from '@/types';

export function useWeather(location: GeoLocation | null) {
  const [overrideLoc, setOverrideLoc] = useState<GeoLocation | null>(null);
  const activeLoc = overrideLoc ?? location;

  const { data, isLoading, mutate } = useSWR<WeatherData | null>(
    activeLoc ? ['weather', activeLoc.lat, activeLoc.lng] : null,
    ([, lat, lng]: [string, number, number]) => fetchWeather(lat, lng),
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false },
  );

  function refresh(loc?: GeoLocation) {
    if (loc) setOverrideLoc(loc);
    mutate();
  }

  return { weather: data ?? null, loading: activeLoc === null || isLoading, activeLoc, refresh };
}
