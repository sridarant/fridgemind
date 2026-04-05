// src/lib/weather.js — Location, time, and weather utilities
// Uses Open-Meteo (free, no API key needed, GPS-accurate) as primary
// Falls back to OpenWeatherMap if REACT_APP_OPENWEATHER_KEY is set

const OWM_KEY    = process.env.REACT_APP_OPENWEATHER_KEY || '';
const CACHE_KEY  = 'jiff-weather-cache';
const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes

// ── Get user's coordinates via browser Geolocation API ────────────
export function getCoords() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('No geolocation'));
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 8000, maximumAge: 600000 }
    );
  });
}

// ── Reverse geocode to city + country ─────────────────────────────
export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      { headers: { 'User-Agent': 'Jiff-App/1.0' } }
    );
    const data = await res.json();
    const city    = data.address?.suburb || data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
    const country = data.address?.country || '';
    const state   = data.address?.state || '';
    return { city, state, country, display: city ? city + ', ' + country : country };
  } catch {
    return { city: '', state: '', country: '', display: '' };
  }
}

// ── WMO weather code → description + emoji ────────────────────────
function wmoToCondition(code) {
  if (code === 0)            return { condition: 'Clear',        emoji: '☀️' };
  if (code <= 2)             return { condition: 'Partly cloudy',emoji: '⛅' };
  if (code === 3)            return { condition: 'Overcast',     emoji: '☁️' };
  if (code <= 49)            return { condition: 'Foggy',        emoji: '🌫️' };
  if (code <= 57)            return { condition: 'Drizzle',      emoji: '🌦️' };
  if (code <= 67)            return { condition: 'Rainy',        emoji: '🌧️' };
  if (code <= 77)            return { condition: 'Snowy',        emoji: '❄️' };
  if (code <= 82)            return { condition: 'Rain showers', emoji: '🌧️' };
  if (code <= 86)            return { condition: 'Snow showers', emoji: '❄️' };
  if (code >= 95)            return { condition: 'Thunderstorm', emoji: '⛈️' };
  return                            { condition: 'Cloudy',       emoji: '🌤️' };
}

// ── Fetch weather — Open-Meteo primary, OWM fallback ──────────────
export async function fetchWeather(lat, lon) {
  // Cache check
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cached.lat === lat && cached.lon === lon && cached.ts > Date.now() - CACHE_TTL) {
      return cached.data;
    }
  } catch {}

  let weather = null;

  // Primary: Open-Meteo (free, no key, GPS-accurate)
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m&timezone=auto`;
    const res  = await fetch(url);
    const raw  = await res.json();
    const cur  = raw.current || {};
    const temp = Math.round(cur.temperature_2m ?? 25);
    const { condition, emoji } = wmoToCondition(cur.weather_code ?? 0);
    weather = {
      temp,
      feels_like:  Math.round(cur.apparent_temperature ?? temp),
      condition,
      description: condition.toLowerCase(),
      humidity:    cur.relative_humidity_2m || 0,
      isRaining:   (cur.weather_code ?? 0) >= 51 && (cur.weather_code ?? 0) <= 82,
      isCold:      temp < 15,
      isHot:       temp > 35,
      emoji,
    };
  } catch {}

  // Fallback: OpenWeatherMap (if API key is configured)
  if (!weather && OWM_KEY) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_KEY}`
      );
      const raw = await res.json();
      const temp = Math.round(raw.main?.temp || 25);
      weather = {
        temp,
        feels_like:  Math.round(raw.main?.feels_like || temp),
        condition:   raw.weather?.[0]?.main || 'Clear',
        description: raw.weather?.[0]?.description || '',
        humidity:    raw.main?.humidity || 0,
        isRaining:   ['Rain','Drizzle','Thunderstorm'].includes(raw.weather?.[0]?.main),
        isCold:      temp < 15,
        isHot:       temp > 35,
        emoji:       getOwmEmoji(raw.weather?.[0]?.main, raw.weather?.[0]?.icon),
      };
    } catch {}
  }

  if (!weather) {
    return { temp: null, condition: 'Unknown', emoji: '🌤️', isRaining: false, isCold: false, isHot: false };
  }

  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, ts: Date.now(), data: weather })); } catch {}
  return weather;
}

function getOwmEmoji(condition, icon = '') {
  const isNight = icon?.includes('n');
  const map = {
    'Clear': isNight ? '🌙' : '☀️',
    'Clouds': isNight ? '☁️' : '⛅',
    'Rain': '🌧️', 'Drizzle': '🌦️', 'Thunderstorm': '⛈️',
    'Snow': '❄️', 'Mist': '🌫️', 'Fog': '🌫️', 'Haze': '🌫️',
  };
  return map[condition] || '🌤️';
}

// ── Full user context (location + time + weather) ─────────────────
export async function getUserContext() {
  const now = new Date();
  const hours = now.getHours();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

  const timeOfDay = hours < 6 ? 'night' : hours < 12 ? 'morning' : hours < 17 ? 'afternoon' : hours < 21 ? 'evening' : 'night';

  let location = { city: '', country: '', display: '' };
  let weather  = null;
  let coords   = null;

  try {
    coords   = await getCoords();
    location = await reverseGeocode(coords.lat, coords.lon);
    weather  = await fetchWeather(coords.lat, coords.lon);
  } catch {}

  return { timeOfDay, timeStr, location, weather, coords };
}
