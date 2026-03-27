// src/lib/weather.js — Location, time, and weather utilities
// Uses OpenWeatherMap free API (2.5 endpoint, no key needed for basic)
// For production: get free key at openweathermap.org (1000 calls/day free)

const OWM_KEY = process.env.REACT_APP_OPENWEATHER_KEY || '';
const CACHE_KEY = 'jiff-weather-cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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
    const city    = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
    const country = data.address?.country || '';
    const state   = data.address?.state || '';
    return { city, state, country, display: city ? `${city}, ${country}` : country };
  } catch {
    return { city: '', state: '', country: '', display: '' };
  }
}

// ── Fetch weather from OpenWeatherMap ─────────────────────────────
export async function fetchWeather(lat, lon) {
  // Check cache first
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    if (cached.lat === lat && cached.lon === lon && cached.ts > Date.now() - CACHE_TTL) {
      return cached.data;
    }
  } catch {}

  try {
    const keyParam = OWM_KEY ? `&appid=${OWM_KEY}` : '';
    // Without API key, use a proxy or fallback to a free weather service
    const url = OWM_KEY
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric${keyParam}`
      : `https://wttr.in/~${lat},${lon}?format=j1`; // fallback: wttr.in

    const res  = await fetch(url);
    const raw  = await res.json();

    let weather;
    if (OWM_KEY) {
      // OpenWeatherMap format
      weather = {
        temp:        Math.round(raw.main?.temp || 0),
        feels_like:  Math.round(raw.main?.feels_like || 0),
        condition:   raw.weather?.[0]?.main || 'Clear',
        description: raw.weather?.[0]?.description || '',
        icon:        raw.weather?.[0]?.icon || '',
        humidity:    raw.main?.humidity || 0,
        isRaining:   ['Rain','Drizzle','Thunderstorm'].includes(raw.weather?.[0]?.main),
        isCold:      (raw.main?.temp || 20) < 15,
        isHot:       (raw.main?.temp || 20) > 35,
        emoji:       getWeatherEmoji(raw.weather?.[0]?.main, raw.weather?.[0]?.icon),
      };
    } else {
      // wttr.in format fallback
      const cur = raw.current_condition?.[0];
      const desc = cur?.weatherDesc?.[0]?.value || 'Clear';
      const temp = parseInt(cur?.temp_C || '25');
      weather = {
        temp,
        feels_like:  parseInt(cur?.FeelsLikeC || String(temp)),
        condition:   desc,
        description: desc.toLowerCase(),
        isRaining:   desc.toLowerCase().includes('rain') || desc.toLowerCase().includes('drizzle'),
        isCold:      temp < 15,
        isHot:       temp > 35,
        emoji:       getWeatherEmojiFromDesc(desc),
      };
    }

    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lon, ts: Date.now(), data: weather })); } catch {}
    return weather;
  } catch {
    return { temp: null, condition: 'Unknown', emoji: '🌤️', isRaining: false, isCold: false, isHot: false };
  }
}

function getWeatherEmoji(condition, icon = '') {
  const isNight = icon?.includes('n');
  const map = {
    'Clear':         isNight ? '🌙' : '☀️',
    'Clouds':        isNight ? '☁️' : '⛅',
    'Rain':          '🌧️',
    'Drizzle':       '🌦️',
    'Thunderstorm':  '⛈️',
    'Snow':          '❄️',
    'Mist':          '🌫️',
    'Fog':           '🌫️',
    'Haze':          '🌫️',
    'Dust':          '💨',
    'Sand':          '💨',
    'Wind':          '💨',
  };
  return map[condition] || '🌤️';
}

function getWeatherEmojiFromDesc(desc) {
  const d = desc.toLowerCase();
  if (d.includes('thunder'))   return '⛈️';
  if (d.includes('snow'))      return '❄️';
  if (d.includes('rain') || d.includes('drizzle')) return '🌧️';
  if (d.includes('fog') || d.includes('mist') || d.includes('haze')) return '🌫️';
  if (d.includes('cloud') || d.includes('overcast')) return '⛅';
  if (d.includes('clear') || d.includes('sunny')) return '☀️';
  return '🌤️';
}

// ── Get local time info ────────────────────────────────────────────
export function getTimeInfo() {
  const now  = new Date();
  const hour = now.getHours();
  const mins = now.getMinutes();

  let period, greeting, mealType;
  if (hour >= 5 && hour < 11) {
    period = 'morning'; greeting = 'Good morning'; mealType = 'breakfast';
  } else if (hour >= 11 && hour < 15) {
    period = 'afternoon'; greeting = 'Good afternoon'; mealType = 'lunch';
  } else if (hour >= 15 && hour < 18) {
    period = 'evening'; greeting = 'Good evening'; mealType = 'snack';
  } else if (hour >= 18 && hour < 22) {
    period = 'evening'; greeting = 'Good evening'; mealType = 'dinner';
  } else {
    period = 'night'; greeting = 'Good late night'; mealType = 'snack';
  }

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { period, greeting, mealType, timeStr, hour, mins };
}

// ── Suggest a recipe based on context ─────────────────────────────
export function suggestContextualRecipe(weather, timeInfo, location) {
  const isIndia = location?.country?.toLowerCase().includes('india');
  const { isRaining, isCold, isHot, condition } = weather || {};
  const { mealType, period } = timeInfo;

  // Context-aware suggestions
  if (isRaining && isIndia && period === 'evening')   return { dish: 'Pakoda', emoji: '🧅', reason: `Rainy evening in ${location?.city || 'India'} — pakoda time!` };
  if (isRaining && period === 'evening')               return { dish: 'Hot Soup', emoji: '🍲', reason: `Rainy weather calls for something warm` };
  if (isCold && mealType === 'breakfast')              return { dish: 'Upma', emoji: '🍚', reason: `Warm and filling for a cold morning` };
  if (isHot && mealType === 'lunch')                   return { dish: 'Curd Rice', emoji: '🍚', reason: `Cool and light for a hot day` };
  if (isHot && period === 'afternoon')                 return { dish: 'Lassi', emoji: '🥛', reason: `Beat the heat` };
  if (mealType === 'breakfast' && isIndia)             return { dish: 'Masala Dosa', emoji: '🫓', reason: `Classic Tamil Nadu breakfast` };
  if (mealType === 'lunch' && isIndia)                 return { dish: 'Dal Rice', emoji: '🍛', reason: `Comforting midday meal` };
  if (mealType === 'dinner' && isIndia)                return { dish: 'Roti & Sabzi', emoji: '🫓', reason: `Light and balanced dinner` };
  if (mealType === 'snack')                            return { dish: 'Chai & Biscuits', emoji: '☕', reason: `Perfect snack time combo` };
  return { dish: 'Something delicious', emoji: '⚡', reason: `Jiff has ideas` };
}

// ── Full context fetch ─────────────────────────────────────────────
export async function getUserContext() {
  const timeInfo = getTimeInfo();
  try {
    const coords  = await getCoords();
    const [loc, weather] = await Promise.all([
      reverseGeocode(coords.lat, coords.lon),
      fetchWeather(coords.lat, coords.lon),
    ]);
    const suggestion = suggestContextualRecipe(weather, timeInfo, loc);
    return { timeInfo, location: loc, weather, suggestion, hasLocation: true };
  } catch {
    return { timeInfo, location: null, weather: null, suggestion: null, hasLocation: false };
  }
}
