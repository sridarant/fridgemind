// src/lib/notificationService.js
// Browser notification scheduling: breakfast 8 AM · lunch 1 PM · dinner 7 PM
// Rules: respects per-meal-type user preference, max 1 per window per day.
// Schedules all three windows once per session via setTimeout.

const PREF_KEY     = 'jiff-notif-enabled';
const SENT_KEY     = 'jiff-notif-sent';   // JSON object: { breakfast, lunch, dinner } → date strings
const MS_PER_DAY   = 86400000;

// ── Preferences ───────────────────────────────────────────────────
export function isNotificationsEnabled() {
  try { return localStorage.getItem(PREF_KEY) !== 'false'; } catch { return true; }
}
export function setNotificationsEnabled(val) {
  try { localStorage.setItem(PREF_KEY, val ? 'true' : 'false'); } catch {}
}

function getMealPref(meal) {
  try { return localStorage.getItem('jiff-notif-' + meal) !== 'false'; } catch { return true; }
}

// ── Sent-today tracking (per window, not global) ──────────────────
function sentToday(window) {
  try {
    const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    if (!d[window]) return false;
    return (Date.now() - new Date(d[window]).getTime()) < MS_PER_DAY;
  } catch { return false; }
}

function markSent(window) {
  try {
    const d = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    d[window] = new Date().toISOString();
    localStorage.setItem(SENT_KEY, JSON.stringify(d));
  } catch {}
}

// ── Permission ────────────────────────────────────────────────────
export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  return Notification.requestPermission();
}

// ── Send one notification ─────────────────────────────────────────
async function send(window, payload) {
  if (!isNotificationsEnabled())              return false;
  if (!getMealPref(window))                   return false;
  if (sentToday(window))                      return false;
  if (!('Notification' in window))            return false;
  if (Notification.permission !== 'granted')  return false;
  try {
    new Notification(payload.title, {
      body: payload.body,
      tag:  'jiff-' + window,
      icon: '/logo192.png',
      silent: false,
    });
    markSent(window);
    return true;
  } catch { return false; }
}

// ── Build context-aware copy ──────────────────────────────────────
function buildPayload(window, mealHistory = []) {
  const recent2d = Date.now() - 2 * MS_PER_DAY;
  const recent = (mealHistory || []).filter(m =>
    new Date(m.generated_at || m.created_at || 0).getTime() > recent2d
  );
  const hadLight = recent.some(m => (m.meal?.tags || []).some(t => t === 'light' || t === 'healthy'));
  const hadHeavy = recent.some(m => (m.meal?.tags || []).some(t => t === 'heavy' || t === 'indulgent'));

  if (window === 'breakfast') {
    if (hadLight) return { title: 'Jiff 🌅', body: 'Keeping it light again today?' };
    return { title: 'Jiff 🌅', body: 'Ready to cook something?' };
  }
  if (window === 'lunch') {
    if (hadHeavy) return { title: 'Jiff ☀️', body: 'Something lighter for lunch today?' };
    return { title: 'Jiff ☀️', body: 'Ready to cook something?' };
  }
  if (window === 'dinner') {
    if (hadLight) return { title: 'Jiff 🌙', body: 'Something quick for this evening?' };
    if (hadHeavy) return { title: 'Jiff 🌙', body: 'Something lighter this evening?' };
    return { title: 'Jiff 🌙', body: 'Ready to cook something?' };
  }
  return { title: 'Jiff 🍳', body: 'Ready to cook something?' };
}

// ── Schedule all three windows for the current session ────────────
// Called once on app load. Uses setTimeout per window.
// Breakfast 8:00 · Lunch 13:00 · Dinner 19:00
export function scheduleSessionNotifications({ mealHistory = [] } = {}) {
  if (!isNotificationsEnabled()) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const WINDOWS = [
    { name: 'breakfast', targetH: 8,  targetM: 0  },
    { name: 'lunch',     targetH: 13, targetM: 0  },
    { name: 'dinner',    targetH: 19, targetM: 0  },
  ];

  const now = new Date();
  const h   = now.getHours();
  const min = now.getMinutes();

  WINDOWS.forEach(({ name, targetH, targetM }) => {
    const msUntil = ((targetH - h) * 60 + (targetM - min)) * 60000;
    // Only schedule if target is in the future and within the next 24h
    if (msUntil > 0 && msUntil < MS_PER_DAY) {
      setTimeout(() => {
        const payload = buildPayload(name, mealHistory);
        send(name, payload);
      }, msUntil);
    }
  });
}

// Kept for backward compat
export { buildPayload as buildNotificationPayload };
export async function sendNotification(payload) {
  return send('general', payload);
}
