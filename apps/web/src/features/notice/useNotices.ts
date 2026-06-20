import useSWR from 'swr';
import type { Notice } from '@/types';

interface NoticesResponse {
  notices: Notice[];
  updatedAt: string;
}

async function fetcher(): Promise<NoticesResponse> {
  const res = await fetch('/api/notices');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<NoticesResponse>;
}

export function useNotices() {
  const { data, isLoading, mutate } = useSWR<NoticesResponse>('notices', fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
    onErrorRetry: () => {},
  });

  return {
    notices: data?.notices ?? [],
    loading: isLoading,
    lastUpdated: data?.updatedAt ? new Date(data.updatedAt) : null,
    refresh: mutate,
  };
}
