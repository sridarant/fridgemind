// src/services/userService.js
// User-related API calls: streak, profile updates, feedback, waitlist.
// No UI imports, no React deps.

const ADMIN = '/api/admin';
const COMMS  = '/api/comms';

/**
 * Update user streak in Supabase profiles.
 * @param {string} userId
 * @param {number} streak
 */
export async function updateStreak(userId, streak) {
  if (!userId) return;
  await fetch(`${ADMIN}?action=update-streak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, streak, lastCooked: new Date().toISOString() }),
  }).catch(() => {});
}

/**
 * Compute new streak count from localStorage and return it.
 * @param {number} currentStreak
 * @returns {number}
 */
export function computeNextStreak(currentStreak) {
  try {
    const today     = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const stored    = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
    const newCount  = stored.lastDate === yesterday ? (stored.count || 0) + 1 : 1;
    try { localStorage.setItem('jiff-streak', JSON.stringify({ count: newCount, lastDate: today })); } catch {}
    return newCount;
  } catch {
    return currentStreak;
  }
}

/**
 * Submit user feedback.
 * @param {object} params
 */
export async function submitFeedback({ message, type = 'general', email = '' }) {
  await fetch(`${COMMS}?action=feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, type, email }),
  }).catch(() => {});
}

/**
 * Submit waitlist email.
 * @param {string} email
 * @param {string} source  e.g. 'landing', 'pricing'
 */
export async function submitWaitlist(email, source = 'app') {
  await fetch(`${COMMS}?action=email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  }).catch(() => {});
}

/**
 * Fetch system notifications (broadcasts from Supabase).
 * @returns {Promise<object[]>}
 */
export async function fetchBroadcasts() {
  try {
    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase
      .from('broadcasts')
      .select('id,message,created_at')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(10);
    return data || [];
  } catch {
    return [];
  }
}

/**
 * Mark notifications as read in Supabase profiles.
 * @param {string} userId
 */
export async function markNotificationsRead(userId) {
  if (!userId) return;
  const sbUrl  = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  if (!sbUrl || !anonKey) return;
  await fetch(`${sbUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ last_notification_read_at: new Date().toISOString() }),
  }).catch(() => {});
}

/**
 * Fetch video for a recipe via YouTube API.
 * @param {string} recipeName
 * @param {string} cuisine
 * @param {string} lang
 * @returns {Promise<object|null>}
 */
export async function fetchRecipeVideo(recipeName, cuisine = '', lang = 'en') {
  const res = await fetch(
    `/api/videos?recipe=${encodeURIComponent(recipeName)}&cuisine=${encodeURIComponent(cuisine)}&lang=${lang}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error === 'YouTube API not configured') return { unconfigured: true };
  return data.videos?.[0] || null;
}

/**
 * Fetch admin stats overview.
 * @returns {Promise<object>}
 */
export async function fetchStats() {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('Stats fetch failed');
  return res.json();
}
