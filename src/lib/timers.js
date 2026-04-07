// src/lib/timers.js — Recipe step timer parsing and formatting
// Pure functions — no React dependencies.

/**
 * Parse a time duration from a recipe step string.
 * Returns seconds, or null if no valid duration found.
 * e.g. "simmer for 10 minutes" → 600
 *      "cook 1-2 hours" → 5400 (midpoint)
 */
export function parseStepTime(text) {
  if (!text || typeof text !== 'string') return null;
  const t = text.toLowerCase();
  if (/half\s+an?\s+hour/.test(t)) return 1800;
  let total = 0;

  // Hour ranges: "1-2 hours"
  const hr = t.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*h(?:ou?r?s?|rs?)/);
  const hs = t.match(/(\d+(?:\.\d+)?)\s*h(?:ou?r?s?|rs?)/);
  if (hr)      total += ((parseFloat(hr[1]) + parseFloat(hr[2])) / 2) * 3600;
  else if (hs) total += parseFloat(hs[1]) * 3600;

  // Minute ranges: "5-10 minutes"
  const mr = t.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?s?)/);
  const ms = t.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?s?)/);
  if (mr)      total += ((parseFloat(mr[1]) + parseFloat(mr[2])) / 2) * 60;
  else if (ms) total += parseFloat(ms[1]) * 60;

  // Seconds
  const sec = t.match(/(\d+)\s*s(?:ec(?:onds?)?s?)/);
  if (sec) total += parseInt(sec[1]);

  // Ignore if less than 10s or more than 12h — likely not a cook timer
  return (total < 10 || total > 43200) ? null : Math.round(total);
}

/**
 * Format seconds as MM:SS or H:MM:SS
 * e.g. 90 → "01:30", 3661 → "1:01:01"
 */
export function formatTime(s) {
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
    : `${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`;
}
