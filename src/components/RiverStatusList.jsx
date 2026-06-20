import { RIVER_COLORS } from '../data/rivers';

const STATUS_LABEL = {
  정상: '정상',
  주의: '주의',
  경계: '경계',
  위험: '위험',
  통제: '통제 중',
  오류: '정보없음',
};

function groupByRiver(riverData) {
  return riverData.reduce((acc, s) => {
    if (!acc[s.river]) acc[s.river] = [];
    acc[s.river].push(s);
    return acc;
  }, {});
}

function worstStatus(stations) {
  const order = ['통제', '위험', '경계', '주의', '정상', '오류'];
  for (const s of order) {
    if (stations.some(st => st.status === s)) return s;
  }
  return '오류';
}

export default function RiverStatusList({ riverData, loading, isMock, lastUpdated, onRefresh }) {
  if (loading) return (
    <div className="river-list">
      {[1,2,3].map(i => (
        <div key={i} className="river-group skeleton">
          <div className="skeleton-line w-40" />
          <div className="skeleton-line w-full" />
        </div>
      ))}
    </div>
  );

  const grouped = groupByRiver(riverData);

  return (
    <div className="river-list">
      {isMock && (
        <div className="mock-banner">
          🔑 API 키 미설정 — 샘플 데이터로 표시 중입니다
        </div>
      )}
      {lastUpdated && (
        <div className="update-row">
          <span className="update-time">
            {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
          </span>
          <button className="refresh-btn" onClick={onRefresh}>↻ 새로고침</button>
        </div>
      )}
      {Object.entries(grouped).map(([riverName, stations]) => {
        const overall = worstStatus(stations);
        const color = RIVER_COLORS[overall];
        return (
          <div key={riverName} className="river-group">
            <div className="river-group-header">
              <span className="river-name">{riverName}</span>
              <span className="river-badge" style={{ background: color }}>
                {STATUS_LABEL[overall]}
              </span>
            </div>
            <div className="station-list">
              {stations.map(s => (
                <div key={s.id} className="station-item">
                  <div className="station-dot" style={{ background: RIVER_COLORS[s.status] }} />
                  <div className="station-info">
                    <span className="station-name">{s.name}</span>
                    {s.waterLevel !== null && (
                      <span className="station-level">
                        수위 {s.waterLevel.toFixed(2)}m
                        <span className="level-bar">
                          <span
                            className="level-fill"
                            style={{
                              width: `${Math.min(100, (s.waterLevel / s.dangerLevel) * 100)}%`,
                              background: RIVER_COLORS[s.status],
                            }}
                          />
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="station-status" style={{ color: RIVER_COLORS[s.status] }}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
