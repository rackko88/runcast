import { useOutletContext } from 'react-router-dom';
import NoticeBoard from '@/features/notice/NoticeBoard';

export default function NoticePage() {
  const { notices, nLoading, nUpdated, nRefresh } = useOutletContext();
  return <NoticeBoard notices={notices} loading={nLoading} lastUpdated={nUpdated} onRefresh={nRefresh} />;
}
