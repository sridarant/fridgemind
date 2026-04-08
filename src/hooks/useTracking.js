export default function useTracking() {
  const trackEvent = (event, data = {}) => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data, ts: Date.now() })
    }).catch(() => {});
  };
  return { trackEvent };
}
