import { useOutletContext } from 'react-router-dom';
import NoticeBoard from '@/features/notice/NoticeBoard';
import type { Notice } from '@/types';

interface Ctx {
  notices: Notice[];
  nLoading: boolean;
  nUpdated: Date | null;
  nRefresh: () => void;
}

export default function NoticePage() {
  const { notices, nLoading, nUpdated, nRefresh } = useOutletContext<Ctx>();
  return <NoticeBoard notices={notices} loading={nLoading} lastUpdated={nUpdated} onRefresh={nRefresh} />;
}
