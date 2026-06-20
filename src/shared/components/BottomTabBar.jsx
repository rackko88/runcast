const TABS = [
  { id: 'map',    icon: '🗺️', label: '지도' },
  { id: 'notice', icon: '📋', label: '공지' },
  { id: 'weather',icon: '🌤️', label: '날씨' },
  { id: 'river',  icon: '💧', label: '하천' },
];

export default function BottomTabBar({ activeTab, onChange, alertCount, hasEmergency }) {
  return (
    <nav className="bottom-tabs">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
          {tab.id === 'river' && alertCount > 0 && (
            <span className="tab-badge">{alertCount}</span>
          )}
          {tab.id === 'notice' && hasEmergency && (
            <span className="tab-badge">!</span>
          )}
        </button>
      ))}
    </nav>
  );
}
