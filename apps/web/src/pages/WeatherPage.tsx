import { useOutletContext } from 'react-router-dom';
import WeatherDetail from '@/features/weather/WeatherDetail';
import type { WeatherData } from '@/types';

interface Ctx {
  weather: WeatherData | null;
  wLoading: boolean;
}

export default function WeatherPage() {
  const { weather, wLoading } = useOutletContext<Ctx>();
  return <WeatherDetail weather={weather} loading={wLoading} />;
}
