// src/lib/notificationService.js
// Lightweight notification system — browser PWA + localStorage scheduling.
// Rules: max 1 notification per day, respects user preference, no spam.
// Pure functions + async — no React deps.

const NOTIF_KEY       = 'jiff-notif-lastSent';
const NOTIF_PREF_KEY  = 'jiff-notif-enabled';
const MS_PER_DAY      = 86400000;

export function isNotificationsEnabled() {
  try { return localStorage.getItem(NOTIF_PREF_KEY) !== 'false'; } catch { return true; }
}

export function setNotificationsEnabled(val) {
  try { localStorage.setItem(NOTIF_PREF_KEY, val ? 'true' : 'false'); } catch {}
}

function getLastSent() {
  try { return parseInt(localStorage.getItem(NOTIF_KEY) || '0'); } catch { return 0; }
}

function markSent() {
  try { localStorage.setItem(NOTIF_KEY, Date.now().toString()); } catch {}
}

function canSendToday() {
  return (Date.now() - getLastSent()) > MS_PER_DAY;
}

// ── Request permission ────────────────────────────────────────────
export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  const result = await Notification.requestPermission();
  return result;
}

// ── Send a notification ───────────────────────────────────────────
// Respects: user pref, daily limit, browser permission.
export async function sendNotification({ title, body, tag = 'jiff', icon = '/logo192.png' } = {}) {
  if (!isNotificationsEnabled()) return false;
  if (!canSendToday()) return false;
  if (!('Notification' in window)) return false;

  const perm = Notification.permission;
  if (perm !== 'granted') return false;

  try {
    new Notification(title, { body, tag, icon, silent: false });
    markSent();
    return true;
  } catch { return false; }
}

// ── Context-aware notification chooser ───────────────────────────
// Called once per session from the app root (after auth + profile loaded).
export function buildNotificationPayload({ mealHistory = [], activeEvent = null, profile = null } = {}) {
  const h = new Date().getHours();

  // Event-based (highest priority)
  if (activeEvent && activeEvent.phase === 'before') {
    return { title: 'Jiff 🍳', body: activeEvent.message || 'Time to plan your meal!' };
  }

  // Continuity: check what was cooked yesterday
  const yesterday = Date.now() - MS_PER_DAY;
  const twoDaysAgo = Date.now() - 2 * MS_PER_DAY;
  const recentMeals = (mealHistory || []).filter(m => {
    const ts = new Date(m.generated_at || m.created_at || 0).getTime();
    return ts > twoDaysAgo && ts < yesterday + MS_PER_DAY;
  });
  const cookedLight = recentMeals.some(m =>
    (m.meal?.tags || []).some(t => t === 'light' || t === 'healthy')
  );

  // Time-based
  if (h >= 7 && h < 9) {
    if (cookedLight) return { title: 'Jiff 🌅', body: "You cooked light yesterday — continue today?" };
    return { title: 'Jiff 🌅', body: "Dinner time? I've got something quick" };
  }
  if (h >= 12 && h < 13) {
    return { title: 'Jiff ☀️', body: "Lunch break — what are you making today?" };
  }
  if (h >= 18 && h < 20) {
    if (activeEvent && activeEvent.phase === 'during') {
      return { title: 'Jiff 🍳', body: activeEvent.messageDuring || 'Dinner time?' };
    }
    return { title: 'Jiff 🌙', body: "Dinner time? I've got something quick" };
  }

  return null; // outside notification hours → don't send
}

// ── Schedule notifications for the session ───────────────────────
// Call once on app load. Uses setTimeout for simple in-session scheduling.
// Does NOT persist across tabs — intentionally lightweight.
export function scheduleSessionNotifications({ mealHistory = [], activeEvent = null, profile = null } = {}) {
  if (!isNotificationsEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const h   = new Date().getHours();
  const min = new Date().getMinutes();

  // Schedule dinner reminder at 18:30 if it's before that
  const dinnerMs = ((18 - h) * 60 + (30 - min)) * 60000;
  if (dinnerMs > 0 && dinnerMs < 12 * 3600000) {
    setTimeout(() => {
      const payload = buildNotificationPayload({ mealHistory, activeEvent, profile });
      if (payload) sendNotification(payload);
    }, dinnerMs);
  }
}
