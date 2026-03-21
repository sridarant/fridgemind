import { createContext, useContext, useState, useCallback } from 'react';

const PremiumContext = createContext(null);
export const usePremium = () => useContext(PremiumContext);

const STORAGE_KEY = 'jiff-premium';
const USAGE_KEY   = 'jiff-usage';
const FREE_DAILY  = 5;
const FREE_PLANS  = 1;

// Plans — labels only, prices come from LocaleContext.currency
export const PLAN_IDS = {
  monthly:  { id: 'monthly',  label: 'Monthly',  period: '/month',  saving: null },
  annual:   { id: 'annual',   label: 'Annual',   period: '/year',   saving: 'Save 33%' },
  lifetime: { id: 'lifetime', label: 'Lifetime', price: null,       period: 'once',    saving: 'Best value' },
};

function today() { return new Date().toISOString().slice(0, 10); }

function loadPremium() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.expiresAt && data.expiresAt < Date.now()) { localStorage.removeItem(STORAGE_KEY); return null; }
    return data;
  } catch { return null; }
}
function savePremium(data) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

function loadUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: today(), suggestions: 0, plans: 0 };
    const data = JSON.parse(raw);
    if (data.date !== today()) return { date: today(), suggestions: 0, plans: 0 };
    return data;
  } catch { return { date: today(), suggestions: 0, plans: 0 }; }
}
function saveUsage(data) { try { localStorage.setItem(USAGE_KEY, JSON.stringify(data)); } catch {} }

export function PremiumProvider({ children }) {
  const [premium,    setPremiumState] = useState(() => loadPremium());
  const [usage,      setUsageState]   = useState(() => loadUsage());
  const [showGate,   setShowGate]     = useState(false);
  const [gateReason, setGateReason]   = useState('');

  const isPremium = !!premium;
  const canSuggest = isPremium || usage.suggestions < FREE_DAILY;
  const canPlan    = isPremium || usage.plans < FREE_PLANS;
  const suggestionsLeft = isPremium ? Infinity : Math.max(0, FREE_DAILY - usage.suggestions);
  const plansLeft       = isPremium ? Infinity : Math.max(0, FREE_PLANS  - usage.plans);

  const recordSuggestion = useCallback(() => {
    if (isPremium) return true;
    if (usage.suggestions >= FREE_DAILY) { setGateReason('suggestions'); setShowGate(true); return false; }
    const next = { ...usage, suggestions: usage.suggestions + 1 };
    setUsageState(next); saveUsage(next); return true;
  }, [isPremium, usage]);

  const recordPlan = useCallback(() => {
    if (isPremium) return true;
    if (usage.plans >= FREE_PLANS) { setGateReason('plans'); setShowGate(true); return false; }
    const next = { ...usage, plans: usage.plans + 1 };
    setUsageState(next); saveUsage(next); return true;
  }, [isPremium, usage]);

  // ── Razorpay checkout (India) ──────────────────────
  const openRazorpayCheckout = useCallback(async (planId, currencyConfig) => {
    const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
    await new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });

    const orderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    const { orderId, amount, currency, error } = await orderRes.json();
    if (error) throw new Error(error);

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: keyId, amount, currency,
        name: 'Jiff', description: `Jiff Premium — ${PLAN_IDS[planId]?.label}`,
        order_id: orderId, theme: { color: '#FF4500' },
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, planId }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.verified) throw new Error('Verification failed');
            const pd = { planId, paymentId: response.razorpay_payment_id, activatedAt: Date.now(), expiresAt: verifyData.expiresAt, gateway: 'razorpay' };
            savePremium(pd); setPremiumState(pd); setShowGate(false); resolve(pd);
          } catch (err) { reject(err); }
        },
        modal: { ondismiss: () => reject(new Error('dismissed')) },
      });
      rzp.open();
    });
  }, []);

  // ── Stripe checkout (international) ───────────────
  const openStripeCheckout = useCallback(async (planId, currencyConfig) => {
    const pubKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
    if (!pubKey) throw new Error('Stripe not configured');

    const amount = currencyConfig.amounts[planId];
    const currency = currencyConfig.code;

    const sessionRes = await fetch('/api/stripe-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, currency, amount }),
    });
    const { url, error } = await sessionRes.json();
    if (error) throw new Error(error);

    // Stripe hosted checkout — redirect to their page
    // On return, URL will have ?success=1&plan=planId
    window.location.href = url;
  }, []);

  // ── Main checkout — picks gateway based on country ─
  const openCheckout = useCallback(async (planId, currencyConfig) => {
    const gateway = currencyConfig?.gateway || 'razorpay';
    if (gateway === 'stripe') {
      return openStripeCheckout(planId, currencyConfig);
    } else {
      return openRazorpayCheckout(planId, currencyConfig);
    }
  }, [openRazorpayCheckout, openStripeCheckout]);

  // ── Handle Stripe success redirect ────────────────
  const handleStripeSuccess = useCallback((planId) => {
    const EXPIRY = {
      monthly:  Date.now() + 30  * 24 * 60 * 60 * 1000,
      annual:   Date.now() + 365 * 24 * 60 * 60 * 1000,
      lifetime: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000,
    };
    const pd = { planId, paymentId: 'stripe', activatedAt: Date.now(), expiresAt: EXPIRY[planId] || EXPIRY.monthly, gateway: 'stripe' };
    savePremium(pd); setPremiumState(pd); setShowGate(false);
    return pd;
  }, []);

  const activateTestPremium = () => {
    const data = { planId: 'monthly', paymentId: 'test', activatedAt: Date.now(), expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, test: true };
    savePremium(data); setPremiumState(data); setShowGate(false);
  };

  const clearPremium = () => { localStorage.removeItem(STORAGE_KEY); setPremiumState(null); };

  const value = {
    isPremium, premium, plans: PLAN_IDS,
    canSuggest, canPlan, suggestionsLeft, plansLeft,
    freeDailyLimit: FREE_DAILY, freePlansLimit: FREE_PLANS,
    recordSuggestion, recordPlan,
    openCheckout, handleStripeSuccess,
    activateTestPremium, clearPremium,
    showGate, setShowGate, gateReason,
    razorpayEnabled: !!process.env.REACT_APP_RAZORPAY_KEY_ID,
    stripeEnabled:   !!process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY,
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}
