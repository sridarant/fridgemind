// serviceWorkerRegistration.js — SW registration disabled.
// Kept for backward compat with any stale imports.
export function registerSW()   {} // no-op
export function unregisterSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  }
}
