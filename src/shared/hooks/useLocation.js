import { useState, useEffect } from 'react';

const DEFAULT_LOCATION = { lat: 37.5665, lng: 126.9780 }; // 서울 시청

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(DEFAULT_LOCATION);
      setError('위치 서비스를 지원하지 않는 브라우저입니다');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setLocation(DEFAULT_LOCATION);
        setError('위치 접근이 거부되었습니다. 서울 시청 기준으로 표시합니다.');
        setLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  return { location, error, loading };
}
