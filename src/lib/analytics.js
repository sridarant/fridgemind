// src/lib/analytics.js
// Centralised GA4 funnel event tracking.
// All events use window._jiffGA (defined in index.html via gtag).
// Never throws — analytics must never break the product.
//
// Funnel: sign_up → trial_start → generation → paywall_shown → upgrade_clicked → subscribed

function fire(event, params = {}) {
  try {
    if (typeof window !== 'undefined' && window._jiffGA) {
      window._jiffGA(event, { ...params, app_version: '1.22' });
    }
  } catch {}
}

// ── Acquisition ─────────────────────────────────────────────────────
export const trackSignUp        = (method = 'google')  => fire('sign_up',          { method });
export const trackTrialStart    = (userId)              => fire('trial_start',       { user_id: userId });

// ── Engagement ──────────────────────────────────────────────────────
export const trackGeneration    = ({ cuisine, mealType, diet, isPremium, source = 'fridge' }) =>
  fire('recipe_generation', { cuisine, meal_type: mealType, diet, is_premium: isPremium, source });

export const trackRating        = ({ stars, cuisine, mealType }) =>
  fire('recipe_rated', { stars, cuisine, meal_type: mealType });

export const trackOnboarding    = (step) => fire('onboarding_step', { step });
export const trackOnboardingDone = ()    => fire('onboarding_complete');

// ── Monetisation funnel ─────────────────────────────────────────────
export const trackPaywallShown  = (trigger) => fire('paywall_shown',     { trigger });
export const trackUpgradeClick  = (trigger) => fire('upgrade_clicked',   { trigger });
export const trackSubscribed    = (plan)    => fire('subscribed',        { plan });

// ── Retention ───────────────────────────────────────────────────────
export const trackReturnVisit   = (daysAway) => fire('return_visit',    { days_away: daysAway });
export const trackChallengeComplete = (type) => fire('challenge_complete', { challenge_type: type });

// ── Sharing ─────────────────────────────────────────────────────────
export const trackWhatsAppShare = (context) => fire('whatsapp_share',   { context });
export const trackGroceryShare  = (method)  => fire('grocery_share',    { method });
