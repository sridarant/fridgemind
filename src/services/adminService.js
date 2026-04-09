// src/services/adminService.js
// All admin portal API calls. Used by AdminShell and admin tab components.
// No UI imports, no React deps.

const ADMIN = '/api/admin';

export async function fetchAdminStats()      { return _get(`${ADMIN}?action=stats`); }
export async function fetchUsers()           { return _get(`${ADMIN}?action=users`); }
export async function fetchWaitlist()        { return _get(`${ADMIN}?action=waitlist`); }
export async function fetchFeedback()        { return _get(`${ADMIN}?action=feedback`); }
export async function fetchReleases()        { return _get(`${ADMIN}?action=releases`); }
export async function fetchTokenStats()      { return _get(`${ADMIN}?action=token-stats`); }

export async function saveSetting(key, value) {
  return _post(`${ADMIN}?action=save-setting`, { key, value });
}

export async function resetTrial(userId) {
  return _post(`${ADMIN}?action=reset-trial`, { userId });
}

export async function broadcastMessage(message) {
  return _post(`${ADMIN}?action=broadcast`, { message });
}

export async function triggerDeploy(hook) {
  const res = await fetch('/api/deploy-hook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hook }),
  });
  return res.json();
}

// ── Helpers ────────────────────────────────────────────────────────
async function _get(url) {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Admin GET failed: ${res.status}`);
  return res.json();
}

async function _post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Admin POST failed: ${res.status}`);
  return res.json();
}
