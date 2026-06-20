function pmGrade(pm10, pm25) {
  if (pm10 == null) return null;
  if (pm10 <= 30 && pm25 <= 15) return { text: '좋음', color: '#22c55e' };
  if (pm10 <= 80 && pm25 <= 35) return { text: '보통', color: '#f59e0b' };
  if (pm10 <= 150 && pm25 <= 75) return { text: '나쁨', color: '#ef4444' };
  return { text: '매우나쁨', color: '#7c3aed' };
}

export default function WeatherFloat({ weather, loading }) {
  if (loading || !weather) return null;

  const isAlert = weather.isRaining || (weather.precipProbability ?? 0) >= 60;
  const grade = pmGrade(weather.pm10, weather.pm25);

  return (
    <div className={`weather-float${isAlert ? ' alert' : ''}`}>
      {/* 현재 날씨 */}
      <div className="wf-top">
        <span className="wf-icon">{weather.icon}</span>
        <div className="wf-info">
          <div className="wf-temp-row">
            <span className="wf-temp">{weather.temperature}°</span>
            {weather.tempMax != null && (
              <span className="wf-range">↑{weather.tempMax}° ↓{weather.tempMin}°</span>
            )}
          </div>
          <span className="wf-desc">{weather.description}</span>
        </div>
        <span className="wf-hum">💧{weather.humidity}%</span>
      </div>

      {/* 일출·일몰 */}
      {weather.sunrise && (
        <div className="wf-sun">
          <span>🌅 {weather.sunrise}</span>
          <span>🌇 {weather.sunset}</span>
        </div>
      )}

      {/* 미세먼지 */}
      {grade && (
        <div className="wf-air">
          <span className="wf-air-grade" style={{ color: grade.color }}>● {grade.text}</span>
          <span className="wf-air-vals">PM10 {weather.pm10} · PM2.5 {weather.pm25}㎍</span>
        </div>
      )}

      {/* 강수 */}
      {weather.precipitation > 0 && (
        <div className="wf-rain">💧 {weather.precipitation}mm</div>
      )}
      {(weather.precipProbability ?? 0) > 0 && !weather.isRaining && (
        <div className="wf-pop">강수 {weather.precipProbability}%</div>
      )}
    </div>
  );
}
