// src/lib/analytics.js
// Centralised GA4 + Supabase event tracking.
// Never throws — analytics must never block the product.
//
// Funnel: sign_up → trial_start → generation → paywall_shown → upgrade_clicked → subscribed
// Decision funnel: primary_shown → accepted / rejected / swapped

const ADMIN = '/api/admin';

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5  && h < 11) return 'morning';
  if (h >= 11 && h < 16) return 'afternoon';
  if (h >= 16 && h < 19) return 'evening';
  return 'night';
}

// ── Core fire() — GA4 only, synchronous ──────────────────────────
function fire(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && window._jiffGA) {
      window._jiffGA(event, { ...params, app_version: '1.22' });
    }
  } catch {}
}

// ── trackEvent() — GA4 + Supabase, async fire-and-forget ─────────
// payload must contain: meal_id (or event-specific identifier)
// timestamp and time_of_day are always injected automatically.
export function trackEvent(eventName, payload = {}) {
  const enriched = {
    ...payload,
    timestamp:   new Date().toISOString(),
    time_of_day: getTimeOfDay(),
  };
  // GA4
  fire(eventName, enriched);
  // Supabase events table (async, never awaited)
  try {
    fetch(`${ADMIN}?action=log-event`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        userId:    (typeof window !== 'undefined' && window._jiffUserId) || null,
        eventName,
        metadata:  enriched,
      }),
    }).catch(() => {});
  } catch {}
}

// ── Decision funnel ───────────────────────────────────────────────
// Called when the primary card renders (once per session per card).
export function trackPrimaryShown({ mealId, mealName, cuisine, score }) {
  trackEvent('primary_shown', { meal_id: mealId, meal_name: mealName, cuisine, score });
}

// Called when "Cook this →" is tapped on the primary card.
export function trackRecommendationAccepted({ mealId, mealName, cuisine, position = 0 }) {
  trackEvent('recommendation_accepted', { meal_id: mealId, meal_name: mealName, cuisine, position });
}

// Called when "✕ Not for me" is tapped.
export function trackRecommendationRejected({ mealId, mealName, cuisine, position = 0 }) {
  trackEvent('recommendation_rejected', { meal_id: mealId, meal_name: mealName, cuisine, position });
}

// Called when an alternate "Cook →" is tapped after the primary was shown.
export function trackRecommendationSwapped({ mealId, mealName, cuisine, position }) {
  trackEvent('recommendation_swapped', { meal_id: mealId, meal_name: mealName, cuisine, position });
}

// ── Acquisition ───────────────────────────────────────────────────
export const trackSignUp         = (method = 'google')  => fire('sign_up',          { method });
export const trackTrialStart     = (userId)              => fire('trial_start',       { user_id: userId });

// ── Engagement ────────────────────────────────────────────────────
export const trackGeneration     = ({ cuisine, mealType, diet, isPremium, source = 'fridge' }) =>
  fire('recipe_generation', { cuisine, meal_type: mealType, diet, is_premium: isPremium, source });

export const trackRating         = ({ stars, cuisine, mealType }) =>
  fire('recipe_rated', { stars, cuisine, meal_type: mealType });

export const trackOnboarding     = (step) => fire('onboarding_step',    { step });
export const trackOnboardingDone = ()     => fire('onboarding_complete');

// ── Monetisation funnel ───────────────────────────────────────────
export const trackPaywallShown   = (trigger) => fire('paywall_shown',   { trigger });
export const trackUpgradeClick   = (trigger) => fire('upgrade_clicked', { trigger });
export const trackSubscribed     = (plan)    => fire('subscribed',      { plan });

// ── Retention ─────────────────────────────────────────────────────
export const trackReturnVisit        = (daysAway) => fire('return_visit',       { days_away: daysAway });
export const trackChallengeComplete  = (type)     => fire('challenge_complete', { challenge_type: type });

// ── Sharing ───────────────────────────────────────────────────────
export const trackWhatsAppShare  = (context) => fire('whatsapp_share', { context });
export const trackGroceryShare   = (method)  => fire('grocery_share',  { method });
