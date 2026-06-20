import { RIVER_COLORS } from '../data/rivers';

const STATUS_LABEL = { 정상:'정상', 주의:'주의', 경계:'경계', 위험:'위험', 통제:'통제', 오류:'-' };

function worstStatus(stations) {
  for (const s of ['통제', '위험', '경계', '주의', '정상']) {
    if (stations.some(st => st.status === s)) return s;
  }
  return '오류';
}

function groupByRiver(data) {
  return data.reduce((acc, s) => {
    (acc[s.river] = acc[s.river] || []).push(s);
    return acc;
  }, {});
}

export default function RiverDetail({ riverData, loading, isMock, lastUpdated, onRefresh }) {
  const grouped = groupByRiver(riverData);

  return (
    <div className="river-detail">
      <div className="rd-header">
        <div className="rd-meta">
          {isMock && <span className="mock-tag">샘플</span>}
          {lastUpdated && (
            <span className="rd-time">
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
            </span>
          )}
        </div>
        <button className="refresh-btn" onClick={onRefresh}>↻</button>
      </div>

      {/* 하천 카드 */}
      <div className="river-cards">
        {loading ? (
          [1,2,3,4,5].map(i => <div key={i} className="river-card skeleton" />)
        ) : (
          Object.entries(grouped).map(([name, stations]) => {
            const status = worstStatus(stations);
            const color = RIVER_COLORS[status];
            return (
              <div key={name} className="river-card" style={{ borderTopColor: color }}>
                <span className="rc-name">{name}</span>
                <span className="rc-status" style={{ color }}>{STATUS_LABEL[status]}</span>
                <div className="rc-stations">
                  {stations.map(s => (
                    <div key={s.id} className="rc-station">
                      <span className="rc-dot" style={{ background: RIVER_COLORS[s.status] }} />
                      <span className="rc-sname">{s.name.replace(/.*\(/, '').replace(')', '')}</span>
                      <span className="rc-wl">{s.waterLevel !== null ? `${s.waterLevel.toFixed(2)}m` : '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 수위 바 상세 */}
      <div className="rd-bars">
        {Object.entries(grouped).map(([name, stations]) => (
          <div key={name} className="detail-group">
            <div className="detail-group-title">{name}</div>
            {stations.map(s => (
              <div key={s.id} className="detail-station">
                <span className="ds-name">{s.name}</span>
                <div className="ds-bar-wrap">
                  <div className="ds-bar">
                    <div
                      className="ds-fill"
                      style={{
                        width: `${Math.min(100, s.waterLevel != null ? (s.waterLevel / s.dangerLevel) * 100 : 0)}%`,
                        background: RIVER_COLORS[s.status],
                      }}
                    />
                    <span className="ds-warn-mark" style={{ left: `${(s.warnLevel / s.dangerLevel) * 100}%` }} />
                  </div>
                  <span className="ds-wl" style={{ color: RIVER_COLORS[s.status] }}>
                    {s.waterLevel !== null ? `${s.waterLevel.toFixed(2)}m` : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
