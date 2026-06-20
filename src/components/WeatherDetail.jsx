function pmGrade(pm10, pm25) {
  if (pm10 == null) return null;
  if (pm10 <= 30 && pm25 <= 15) return { text: '좋음', color: '#22c55e' };
  if (pm10 <= 80 && pm25 <= 35) return { text: '보통', color: '#f59e0b' };
  if (pm10 <= 150 && pm25 <= 75) return { text: '나쁨', color: '#ef4444' };
  return { text: '매우나쁨', color: '#7c3aed' };
}

function runScore(w) {
  if (!w) return null;
  let s = 100;
  if (w.isRaining) s -= 40;
  else if ((w.precipProbability ?? 0) >= 60) s -= 20;
  else if ((w.precipProbability ?? 0) >= 30) s -= 10;
  const t = w.temperature;
  if (t < -5 || t > 38) s -= 40;
  else if (t < 0 || t > 35) s -= 25;
  else if (t < 5 || t > 30) s -= 10;
  if (w.windSpeed > 50) s -= 30;
  else if (w.windSpeed > 35) s -= 15;
  if ((w.pm10 ?? 0) > 150) s -= 30;
  else if ((w.pm10 ?? 0) > 80) s -= 15;
  return Math.max(0, s);
}

function scoreInfo(score) {
  if (score >= 80) return { text: '최적', color: '#22c55e' };
  if (score >= 60) return { text: '양호', color: '#f59e0b' };
  if (score >= 40) return { text: '보통', color: '#f97316' };
  return { text: '비추천', color: '#ef4444' };
}

function Cell({ label, value }) {
  return (
    <div className="wd-cell">
      <span className="wd-cell-label">{label}</span>
      <span className="wd-cell-val">{value}</span>
    </div>
  );
}

export default function WeatherDetail({ weather, loading }) {
  if (loading) return <div className="wd-placeholder">날씨 불러오는 중…</div>;
  if (!weather) return <div className="wd-placeholder">날씨 정보를 가져올 수 없습니다</div>;

  const grade = pmGrade(weather.pm10, weather.pm25);
  const score = runScore(weather);
  const si = scoreInfo(score);

  return (
    <div className="weather-detail">
      {/* 러닝 적합도 */}
      <div className="wd-score-card">
        <div className="wd-score-header">
          <span className="wd-score-title">러닝 적합도</span>
          <span className="wd-score-text" style={{ color: si.color }}>{score}점 · {si.text}</span>
        </div>
        <div className="wd-score-track">
          <div className="wd-score-fill" style={{ width: `${score}%`, background: si.color }} />
        </div>
      </div>

      {/* 현재 날씨 */}
      <div className="wd-section">
        <div className="wd-section-title">현재 날씨</div>
        <div className="wd-current">
          <span className="wd-big-icon">{weather.icon}</span>
          <div>
            <div className="wd-big-temp">{weather.temperature}°C</div>
            <div className="wd-big-desc">{weather.description}</div>
          </div>
        </div>
        <div className="wd-grid">
          <Cell label="습도" value={`${weather.humidity}%`} />
          <Cell label="풍속" value={`${weather.windSpeed}km/h`} />
          {weather.precipitation > 0 && <Cell label="강수량" value={`${weather.precipitation}mm`} />}
          {(weather.precipProbability ?? 0) > 0 && <Cell label="강수확률" value={`${weather.precipProbability}%`} />}
        </div>
      </div>

      {/* 오늘 예보 */}
      {(weather.tempMax != null || weather.sunrise) && (
        <div className="wd-section">
          <div className="wd-section-title">오늘 예보</div>
          <div className="wd-grid">
            {weather.tempMax != null && (
              <>
                <Cell label="최고기온" value={`${weather.tempMax}°C`} />
                <Cell label="최저기온" value={`${weather.tempMin}°C`} />
              </>
            )}
            {weather.sunrise && (
              <>
                <Cell label="일출" value={`🌅 ${weather.sunrise}`} />
                <Cell label="일몰" value={`🌇 ${weather.sunset}`} />
              </>
            )}
          </div>
        </div>
      )}

      {/* 대기질 */}
      {grade && (
        <div className="wd-section">
          <div className="wd-section-title">대기질</div>
          <div className="wd-air-summary" style={{ color: grade.color }}>● {grade.text}</div>
          <div className="wd-grid">
            <Cell label="미세먼지 PM10" value={`${weather.pm10}㎍/m³`} />
            <Cell label="초미세먼지 PM2.5" value={`${weather.pm25}㎍/m³`} />
          </div>
        </div>
      )}

      {weather.source && (
        <div className="wd-source">출처: {weather.source} · Open-Meteo</div>
      )}
    </div>
  );
}
