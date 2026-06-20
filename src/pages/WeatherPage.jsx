import { useOutletContext } from 'react-router-dom';
import WeatherDetail from '@/features/weather/WeatherDetail';

export default function WeatherPage() {
  const { weather, wLoading } = useOutletContext();
  return <WeatherDetail weather={weather} loading={wLoading} />;
}
