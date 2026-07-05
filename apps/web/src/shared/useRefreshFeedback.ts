import { useState } from 'react';

/**
 * 새로고침 버튼 공통 피드백.
 * - refreshing: 재조회 진행 중 (스피너/비활성화용)
 * - justDone: 완료 직후 doneMs 동안 true ("✓ 갱신됨" 표시용)
 * onRefresh 는 SWR mutate() 프로미스를 반환하므로 await 하여 완료 시점을 감지한다.
 */
export function useRefreshFeedback(onRefresh: () => void | Promise<unknown>, doneMs = 1800) {
  const [refreshing, setRefreshing] = useState(false);
  const [justDone, setJustDone] = useState(false);

  async function handleRefresh() {
    if (refreshing) return;
    setJustDone(false);
    setRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setRefreshing(false);
      setJustDone(true);
      setTimeout(() => setJustDone(false), doneMs);
    }
  }

  return { refreshing, justDone, handleRefresh };
}
