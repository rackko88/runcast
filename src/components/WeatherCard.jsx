export default function WeatherCard({ weather, loading, error }) {
  if (loading) return (
    <div className="weather-card skeleton">
      <div className="skeleton-line w-60" />
      <div className="skeleton-line w-40" />
    </div>
  );

  if (error || !weather) return (
    <div className="weather-card error">
      <span>날씨 정보를 불러올 수 없습니다</span>
    </div>
  );

  const rainAlert = weather.isRaining || (weather.precipProbability ?? 0) >= 60;

  return (
    <div className={`weather-card ${rainAlert ? 'rain-alert' : ''}`}>
      <div className="weather-main">
        <span className="weather-icon">{weather.icon}</span>
        <div className="weather-temp">
          <span className="temp-value">{weather.temperature}°</span>
          <span className="temp-desc">{weather.description}</span>
        </div>
        {rainAlert && <div className="rain-badge">⚠️ 강수 주의</div>}
      </div>

      <div className="weather-source">
        출처: {weather.source === 'KMA' ? '기상청' : 'Open-Meteo'}
      </div>

      <div className="weather-details">
        {weather.precipProbability !== null && (
          <div className="weather-detail-item">
            <span className="detail-label">강수확률</span>
            <span className="detail-value rain">{weather.precipProbability}%</span>
          </div>
        )}
        {weather.precipNext3h !== null && (
          <div className="weather-detail-item">
            <span className="detail-label">3시간 강수량</span>
            <span className="detail-value rain">{weather.precipNext3h}mm</span>
          </div>
        )}
        <div className="weather-detail-item">
          <span className="detail-label">현재 강수</span>
          <span className="detail-value">{weather.precipitation}mm</span>
        </div>
        <div className="weather-detail-item">
          <span className="detail-label">바람</span>
          <span className="detail-value">{weather.windSpeed}km/h</span>
        </div>
        <div className="weather-detail-item">
          <span className="detail-label">습도</span>
          <span className="detail-value">{weather.humidity}%</span>
        </div>
      </div>
    </div>
  );
}
