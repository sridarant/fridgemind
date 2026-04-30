// src/lib/notificationService.js — v1.23.15
// Push notification system removed — it was never called and requires browser permission.
// In-app nudges are handled by RetentionNudges.jsx via useRetention.
// This file is kept minimal to avoid breaking any imports.

export function isNotificationsEnabled() {
  try { return localStorage.getItem('jiff-notif-enabled') !== 'false'; } catch { return true; }
}
export function setNotificationsEnabled(val) {
  try { localStorage.setItem('jiff-notif-enabled', val ? 'true' : 'false'); } catch {}
}
// Stubs — no-ops replacing the removed push notification functions
export function scheduleSessionNotifications() {}
export async function requestPermission()      { return 'unsupported'; }
export async function sendNotification()       { return false; }
export function buildNotificationPayload()     { return null; }
