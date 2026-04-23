// src/lib/notificationService.js
// Lightweight notification system — browser PWA + localStorage scheduling.
// Rules: max 1 notification per day, respects user preference, no spam.
// Priority: event-based > continuity > time-based.

const NOTIF_KEY      = 'jiff-notif-lastSent';
const NOTIF_PREF_KEY = 'jiff-notif-enabled';
const MS_PER_DAY     = 86400000;

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

export async function requestPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  return Notification.requestPermission();
}

export async function sendNotification({ title, body, tag = 'jiff', icon = '/logo192.png' } = {}) {
  if (!isNotificationsEnabled()) return false;
  if (!canSendToday()) return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, tag, icon, silent: false });
    markSent();
    return true;
  } catch { return false; }
}

// ── Context-aware payload builder ─────────────────────────────────
// Priority: 1. event-based  2. continuity  3. time-based
// Returns null if nothing suitable (→ no notification sent)
export function buildNotificationPayload({ mealHistory = [], activeEvent = null } = {}) {
  const h = new Date().getHours();

  // 1. Event-based — highest priority
  if (activeEvent) {
    if (activeEvent.type === 'festival') {
      return { title: 'Jiff ' + activeEvent.emoji, body: activeEvent.messageDuring || 'Festive ideas ready for you!' };
    }
    if (activeEvent.phase === 'before' && activeEvent.messageBefore) {
      return { title: 'Jiff 🍳', body: activeEvent.messageBefore + ' Snack ideas ready.' };
    }
    if (activeEvent.phase === 'during' && activeEvent.messageDuring) {
      return { title: 'Jiff ' + (activeEvent.emoji || '🍳'), body: activeEvent.messageDuring };
    }
  }

  // 2. Continuity — what did they cook recently?
  const recentCutoff = Date.now() - 2 * MS_PER_DAY;
  const recentMeals  = (mealHistory || []).filter(m => {
    const ts = new Date(m.generated_at || m.created_at || 0).getTime();
    return ts > recentCutoff;
  });
  const cookedLight = recentMeals.some(m =>
    (m.meal?.tags || []).some(t => t === 'light' || t === 'healthy')
  );
  const cookedHeavy = recentMeals.some(m =>
    (m.meal?.tags || []).some(t => t === 'heavy' || t === 'indulgent')
  );

  // 3. Time-based — personalised copy, no generic messages
  if (h >= 7 && h < 9) {
    if (cookedLight) return { title: 'Jiff 🌅', body: 'Light yesterday — keeping it going today?' };
    return { title: 'Jiff 🌅', body: 'Morning — something quick before you head out?' };
  }
  if (h >= 12 && h < 13) {
    if (cookedHeavy) return { title: 'Jiff ☀️', body: 'Heavy yesterday — how about something lighter today?' };
    return { title: 'Jiff ☀️', body: 'Lunch time — I\'ve got something that fits.' };
  }
  if (h >= 17 && h < 21) {
    if (cookedLight) return { title: 'Jiff 🌙', body: 'Dinner time? This should work for today.' };
    if (cookedHeavy) return { title: 'Jiff 🌙', body: 'Something lighter for dinner tonight?' };
    return { title: 'Jiff 🌙', body: 'Dinner time? This should work for today.' };
  }

  return null; // outside hours → skip
}

// ── Session scheduler ─────────────────────────────────────────────
// Call once on app load. Schedules a dinner reminder via setTimeout.
export function scheduleSessionNotifications({ mealHistory = [], activeEvent = null } = {}) {
  if (!isNotificationsEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now    = new Date();
  const h      = now.getHours();
  const min    = now.getMinutes();

  // Schedule at 18:30 if we haven't passed it yet today
  const targetH = 18, targetM = 30;
  const msUntil = ((targetH - h) * 60 + (targetM - min)) * 60000;
  if (msUntil > 0 && msUntil < 12 * 3600000) {
    setTimeout(() => {
      const payload = buildNotificationPayload({ mealHistory, activeEvent });
      if (payload) sendNotification(payload);
    }, msUntil);
  }
}
