import { useOutletContext } from 'react-router-dom';
import WeatherDetail from '@/features/weather/WeatherDetail';
import type { WeatherData } from '@/types';

interface Ctx {
  weather: WeatherData | null;
  wLoading: boolean;
  locationLabel: string;
}

export default function WeatherPage() {
  const { weather, wLoading, locationLabel } = useOutletContext<Ctx>();
  return <WeatherDetail weather={weather} loading={wLoading} locationLabel={locationLabel} />;
}
