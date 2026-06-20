export default function WeatherFloat({ weather, loading }) {
  if (loading || !weather) return null;

  const isAlert = weather.isRaining || (weather.precipProbability ?? 0) >= 60;

  return (
    <div className={`weather-float ${isAlert ? 'alert' : ''}`}>
      <span className="wf-icon">{weather.icon}</span>
      <div className="wf-info">
        <span className="wf-temp">{weather.temperature}°</span>
        <span className="wf-desc">{weather.description}</span>
      </div>
      {weather.precipitation > 0 && (
        <div className="wf-rain">
          💧 {weather.precipitation}mm
        </div>
      )}
      {(weather.precipProbability ?? 0) > 0 && (
        <div className="wf-pop">
          강수 {weather.precipProbability}%
        </div>
      )}
    </div>
  );
}
