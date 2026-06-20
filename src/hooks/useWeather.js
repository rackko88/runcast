import { useState, useEffect } from 'react';
import { fetchWeather } from '../services/weatherApi';

export function useWeather(location) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;
    setLoading(true);
    setError(null);
    fetchWeather(location.lat, location.lng)
      .then(setWeather)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [location?.lat, location?.lng]);

  return { weather, loading, error };
}
