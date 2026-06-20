import { useOutletContext } from 'react-router-dom';
import RiverDetail from '@/features/river/RiverDetail';

export default function RiverPage() {
  const { riverData, rLoading, isMock, lastUpdated, refresh } = useOutletContext();
  return <RiverDetail riverData={riverData} loading={rLoading} isMock={isMock} lastUpdated={lastUpdated} onRefresh={refresh} />;
}
