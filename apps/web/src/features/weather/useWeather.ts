import useSWR from 'swr';
import { fetchWeather } from './weatherApi';
import type { GeoLocation, WeatherData } from '@/types';

export function useWeather(location: GeoLocation | null) {
  const { data, isLoading } = useSWR<WeatherData | null>(
    location ? ['weather', location.lat, location.lng] : null,
    ([, lat, lng]: [string, number, number]) => fetchWeather(lat, lng),
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false },
  );
  return { weather: data ?? null, loading: isLoading };
}
