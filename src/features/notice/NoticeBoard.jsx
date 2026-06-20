export default function NoticeBoard({ notices, loading, lastUpdated, onRefresh }) {
  if (loading) {
    return (
      <div className="notice-board">
        <div className="notice-board-header">
          <span className="notice-board-title">공지사항</span>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="notice-item skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="notice-board">
      <div className="notice-board-header">
        <span className="notice-board-title">공지사항</span>
        <div className="notice-board-meta">
          {lastUpdated && (
            <span className="notice-update-time">
              {lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className="refresh-btn" onClick={onRefresh}>↻</button>
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="notice-empty">새 공지사항이 없습니다</div>
      ) : (
        <ul className="notice-list">
          {notices.map((n, i) => (
            <li key={i} className={`notice-item${n.isEmergency ? ' emergency' : ''}`}>
              <a href={n.url} target="_blank" rel="noopener noreferrer">
                <span className="notice-source" style={{ background: n.color }}>
                  {n.source}
                </span>
                <span className="notice-title">{n.title}</span>
                {n.date && <span className="notice-date">{n.date}</span>}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
