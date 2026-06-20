import { useState, useEffect, useCallback } from 'react';
import { STATIONS, getStatusFromLevel } from './rivers';
import { fetchWaterLevels } from './riverApi';

export function useRiverData() {
  const [riverData, setRiverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMock, setIsMock] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const levels = await fetchWaterLevels(STATIONS.map(s => s.id));
      const levelMap = Object.fromEntries(levels.map(l => [l.stationId, l]));

      if (levels[0]?.isMock) setIsMock(true);
      else setIsMock(false);

      const enriched = STATIONS.map(station => {
        const levelInfo = levelMap[station.id];
        const wl = levelInfo?.waterLevel ?? null;
        const status = getStatusFromLevel(wl, station.warnLevel, station.dangerLevel);
        return { ...station, waterLevel: wl, status, error: levelInfo?.error };
      });

      setRiverData(enriched);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5 * 60 * 1000); // 5분마다 갱신
    return () => clearInterval(interval);
  }, [refresh]);

  return { riverData, loading, error, lastUpdated, isMock, refresh };
}
