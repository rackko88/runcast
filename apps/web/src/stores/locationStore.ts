import { create } from 'zustand';
import type { GeoLocation } from '@/types';

interface LocationState {
  location: GeoLocation | null;
  error: string | null;
}

const DEFAULT: GeoLocation = { lat: 37.5665, lng: 126.978 }; // 서울 시청

export const useLocationStore = create<LocationState>(() => ({
  location: null,
  error: null,
}));

export function initLocation(): void {
  if (!navigator.geolocation) {
    useLocationStore.setState({ location: DEFAULT, error: '위치 서비스를 지원하지 않는 브라우저입니다' });
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => useLocationStore.setState({
      location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
      error: null,
    }),
    () => useLocationStore.setState({
      location: DEFAULT,
      error: '위치 접근이 거부되었습니다. 서울 시청 기준으로 표시합니다.',
    }),
    { timeout: 8000, enableHighAccuracy: true },
  );
}
