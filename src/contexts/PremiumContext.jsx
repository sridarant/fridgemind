import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PremiumContext = createContext(null);
export const usePremium = () => useContext(PremiumContext);

const STORAGE_KEY  = 'jiff-premium';
const USAGE_KEY    = 'jiff-usage';
const FREE_DAILY   = 5;   // free meal suggestions per day
const FREE_PLANS   = 1;   // free weekly plans per month

const PLANS = {
  monthly:  { id: 'monthly',  label: 'Monthly',  price: '₹99',  period: '/month',  saving: null },
  annual:   { id: 'annual',   label: 'Annual',   price: '₹799', period: '/year',   saving: 'Save 33%' },
  lifetime: { id: 'lifetime', label: 'Lifetime', price: '₹2,999',period: 'once',   saving: 'Best value' },
};

function loadPremium() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expired?
    if (data.expiresAt && data.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch { return null; }
}

function savePremium(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function loadUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: today(), suggestions: 0, plans: 0 };
    const data = JSON.parse(raw);
    // Reset counts if it's a new day
    if (data.date !== today()) return { date: today(), suggestions: 0, plans: 0 };
    return data;
  } catch { return { date: today(), suggestions: 0, plans: 0 }; }
}

function saveUsage(data) {
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(data)); } catch {}
}

function today() {
  return new Date().toISOString().slice(0, 10); // "2025-03-21"
}

export function PremiumProvider({ children }) {
  const [premium,   setPremiumState] = useState(() => loadPremium());
  const [usage,     setUsageState]   = useState(() => loadUsage());
  const [showGate,  setShowGate]     = useState(false); // upgrade modal trigger
  const [gateReason,setGateReason]   = useState('');    // why the gate showed

  const isPremium = !!premium;

  // ── Usage checks ──────────────────────────────────
  const canSuggest = isPremium || usage.suggestions < FREE_DAILY;
  const canPlan    = isPremium || usage.plans < FREE_PLANS;
  const suggestionsLeft = isPremium ? Infinity : Math.max(0, FREE_DAILY - usage.suggestions);
  const plansLeft       = isPremium ? Infinity : Math.max(0, FREE_PLANS - usage.plans);

  const recordSuggestion = useCallback(() => {
    if (isPremium) return true;
    if (usage.suggestions >= FREE_DAILY) {
      setGateReason('suggestions');
      setShowGate(true);
      return false;
    }
    const next = { ...usage, suggestions: usage.suggestions + 1 };
    setUsageState(next);
    saveUsage(next);
    return true;
  }, [isPremium, usage]);

  const recordPlan = useCallback(() => {
    if (isPremium) return true;
    if (usage.plans >= FREE_PLANS) {
      setGateReason('plans');
      setShowGate(true);
      return false;
    }
    const next = { ...usage, plans: usage.plans + 1 };
    setUsageState(next);
    saveUsage(next);
    return true;
  }, [isPremium, usage]);

  // ── Razorpay checkout ──────────────────────────────
  const openCheckout = useCallback(async (planId) => {
    const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;

    // Load Razorpay script dynamically
    await new Promise((resolve, reject) => {
      if (window.Razorpay) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });

    // Create order server-side
    const orderRes = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    const { orderId, amount, currency, error } = await orderRes.json();
    if (error) throw new Error(error);

    const plan = PLANS[planId];

    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: 'Jiff',
        description: `Jiff Premium — ${plan.label}`,
        order_id: orderId,
        theme: { color: '#FF4500' },
        handler: async (response) => {
          try {
            // Verify payment server-side
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, planId }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyData.verified) throw new Error('Payment verification failed');

            // Store premium status
            const premiumData = {
              planId,
              paymentId: response.razorpay_payment_id,
              activatedAt: Date.now(),
              expiresAt: verifyData.expiresAt,
            };
            savePremium(premiumData);
            setPremiumState(premiumData);
            setShowGate(false);
            resolve(premiumData);
          } catch (err) { reject(err); }
        },
        modal: { ondismiss: () => reject(new Error('dismissed')) },
      });
      rzp.open();
    });
  }, []);

  // ── Expose test mode (no Razorpay key = dev mode) ──
  const activateTestPremium = () => {
    const data = { planId: 'monthly', paymentId: 'test', activatedAt: Date.now(), expiresAt: Date.now() + 30*24*60*60*1000, test: true };
    savePremium(data);
    setPremiumState(data);
    setShowGate(false);
  };

  const clearPremium = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPremiumState(null);
  };

  const value = {
    isPremium, premium, plans: PLANS,
    canSuggest, canPlan,
    suggestionsLeft, plansLeft,
    freeDailyLimit: FREE_DAILY,
    freePlansLimit: FREE_PLANS,
    recordSuggestion, recordPlan,
    openCheckout, activateTestPremium, clearPremium,
    showGate, setShowGate, gateReason,
    razorpayEnabled: !!process.env.REACT_APP_RAZORPAY_KEY_ID,
  };

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}
