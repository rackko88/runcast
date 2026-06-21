import { useOutletContext, useNavigate } from 'react-router-dom';
import RiverDetail from '@/features/river/RiverDetail';
import type { RiverStation } from '@/types';

interface Ctx {
  riverData: RiverStation[];
  rLoading: boolean;
  isMock: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
  moveToRef: React.MutableRefObject<((lat: number, lng: number) => void) | null>;
}

export default function RiverPage() {
  const { riverData, rLoading, isMock, lastUpdated, refresh, moveToRef } = useOutletContext<Ctx>();
  const navigate = useNavigate();

  function handleStationClick(lat: number, lng: number) {
    moveToRef.current?.(lat, lng);
    navigate('/');
  }

  return (
    <RiverDetail
      riverData={riverData} loading={rLoading} isMock={isMock}
      lastUpdated={lastUpdated} onRefresh={refresh}
      onStationClick={handleStationClick}
    />
  );
}
