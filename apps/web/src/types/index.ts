export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface HourlyWeather {
  hour: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  precipProbability: number;
  windSpeed: number;
  icon: string;
  description: string;
}

export interface DailyWeather {
  date: string;
  dayLabel: string;
  tempMax: number;
  tempMin: number;
  humidity: number;
  precipProbabilityMax: number;
  precipSum: number;
  icon: string;
  description: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike?: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection?: number;
  description: string;
  icon: string;
  precipProbability?: number;
  isRaining: boolean;
  source?: string;
  tempMax?: number;
  tempMin?: number;
  sunrise?: string;
  sunset?: string;
  pm10?: number;
  pm25?: number;
  uvIndex?: number;
  hourly?: HourlyWeather[];
  weekly?: DailyWeather[];
}

export type RiverStatus = '정상' | '주의' | '경계' | '위험' | '통제' | '오류';

export interface StationConfig {
  id: string;
  name: string;
  river: string;
  lat: number;
  lng: number;
  warnLevel: number;
  dangerLevel: number;
}

export interface RiverStation extends StationConfig {
  waterLevel: number | null;
  status: RiverStatus;
  error?: string;
}

export interface Notice {
  source: string;
  color?: string;
  title: string;
  date: string;
  url?: string;
  isEmergency: boolean;
  isNew?: boolean;
  content?: string | null;
}
