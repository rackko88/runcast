import { useState, useEffect, useCallback } from 'react';

export function useNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notices');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNotices(data.notices ?? []);
      setLastUpdated(new Date(data.updatedAt));
    } catch (e) {
      // API not available in local vite dev — just show empty
      setNotices([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 10 * 60 * 1000); // 10분마다
    return () => clearInterval(id);
  }, [refresh]);

  return { notices, loading, error, lastUpdated, refresh };
}
