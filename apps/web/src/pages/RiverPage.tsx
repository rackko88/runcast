import { useOutletContext } from 'react-router-dom';
import RiverDetail from '@/features/river/RiverDetail';
import type { RiverStation } from '@/types';

interface Ctx {
  riverData: RiverStation[];
  rLoading: boolean;
  isMock: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

export default function RiverPage() {
  const { riverData, rLoading, isMock, lastUpdated, refresh } = useOutletContext<Ctx>();
  return <RiverDetail riverData={riverData} loading={rLoading} isMock={isMock} lastUpdated={lastUpdated} onRefresh={refresh} />;
}
