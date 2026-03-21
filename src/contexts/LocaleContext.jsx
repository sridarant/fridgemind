import { createContext, useContext, useState, useCallback } from 'react';
import { translate, SUPPORTED_LANGUAGES } from '../i18n';

const LocaleContext = createContext(null);
export const useLocale = () => useContext(LocaleContext);

// Currency config per country code
export const CURRENCY_MAP = {
  IN: { code: 'INR', symbol: '₹', plans: { monthly: '₹99',  annual: '₹799',  lifetime: '₹2,999' }, amounts: { monthly: 9900,   annual: 79900,   lifetime: 299900  }, gateway: 'razorpay' },
  US: { code: 'USD', symbol: '$', plans: { monthly: '$2.99',annual: '$19.99',lifetime: '$39.99'  }, amounts: { monthly: 299,    annual: 1999,    lifetime: 3999    }, gateway: 'stripe'   },
  GB: { code: 'GBP', symbol: '£', plans: { monthly: '£2.49',annual: '£17.99',lifetime: '£34.99' }, amounts: { monthly: 249,    annual: 1799,    lifetime: 3499    }, gateway: 'stripe'   },
  AU: { code: 'AUD', symbol: 'A$',plans: { monthly: 'A$4',  annual: 'A$29',  lifetime: 'A$59'   }, amounts: { monthly: 400,    annual: 2900,    lifetime: 5900    }, gateway: 'stripe'   },
  SG: { code: 'SGD', symbol: 'S$',plans: { monthly: 'S$3',  annual: 'S$24',  lifetime: 'S$49'   }, amounts: { monthly: 300,    annual: 2400,    lifetime: 4900    }, gateway: 'stripe'   },
  CA: { code: 'CAD', symbol: 'C$',plans: { monthly: 'C$3',  annual: 'C$24',  lifetime: 'C$49'   }, amounts: { monthly: 300,    annual: 2400,    lifetime: 4900    }, gateway: 'stripe'   },
  DEFAULT: { code: 'USD', symbol: '$', plans: { monthly: '$2.99', annual: '$19.99', lifetime: '$39.99' }, amounts: { monthly: 299, annual: 1999, lifetime: 3999 }, gateway: 'stripe' },
};

// Best-guess country from browser locale (fallback — real detection via IP is server-side)
function guessCountry() {
  try {
    const saved = localStorage.getItem('jiff-country');
    if (saved) return saved;
    const locale = navigator.language || 'en-US';
    const tag = locale.split('-')[1]?.toUpperCase();
    return tag || 'US';
  } catch { return 'US'; }
}

function getLang() {
  try { return localStorage.getItem('jiff-lang') || 'en'; } catch { return 'en'; }
}
function getUnits() {
  try { return localStorage.getItem('jiff-units') || 'metric'; } catch { return 'metric'; }
}
function getCountry() {
  return guessCountry();
}

export function LocaleProvider({ children }) {
  const [lang,    setLangState]    = useState(getLang);
  const [units,   setUnitsState]   = useState(getUnits);
  const [country, setCountryState] = useState(getCountry);

  const currency = CURRENCY_MAP[country] || CURRENCY_MAP.DEFAULT;

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('jiff-lang', l); } catch {}
    // Set document lang for accessibility + font rendering
    document.documentElement.lang = l;
  }, []);

  const setUnits = useCallback((u) => {
    setUnitsState(u);
    try { localStorage.setItem('jiff-units', u); } catch {}
  }, []);

  const setCountry = useCallback((c) => {
    setCountryState(c);
    try { localStorage.setItem('jiff-country', c); } catch {}
  }, []);

  // t() shorthand — use throughout the app: t('hero_title1')
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  // Time option values — always in the current language's labels but same ids
  const TIME_OPTIONS = [
    { id: '15 min',        label: t('time_15') },
    { id: '30 min',        label: t('time_30') },
    { id: '1 hour',        label: t('time_60') },
    { id: 'no time limit', label: t('time_any') },
  ];

  const DIET_OPTIONS = [
    { id: 'none',        label: t('diet_none') },
    { id: 'vegetarian',  label: t('diet_veg') },
    { id: 'vegan',       label: t('diet_vegan') },
    { id: 'gluten-free', label: t('diet_gf') },
    { id: 'dairy-free',  label: t('diet_df') },
    { id: 'low-carb',    label: t('diet_lowCarb') },
  ];

  const CUISINE_OPTIONS = [
    { id: 'any',           label: t('cuisine_any'),           flag: '🌍' },
    { id: 'Indian',        label: t('cuisine_indian'),        flag: '🇮🇳' },
    { id: 'Italian',       label: t('cuisine_italian'),       flag: '🇮🇹' },
    { id: 'Chinese',       label: t('cuisine_chinese'),       flag: '🇨🇳' },
    { id: 'Mexican',       label: t('cuisine_mexican'),       flag: '🇲🇽' },
    { id: 'Mediterranean', label: t('cuisine_mediterranean'), flag: '🫒' },
    { id: 'Thai',          label: t('cuisine_thai'),          flag: '🇹🇭' },
    { id: 'Japanese',      label: t('cuisine_japanese'),      flag: '🇯🇵' },
    { id: 'Korean',        label: t('cuisine_korean'),        flag: '🇰🇷' },
    { id: 'American',      label: t('cuisine_american'),      flag: '🇺🇸' },
    { id: 'Middle Eastern',label: t('cuisine_middleEastern'), flag: '🌙' },
    { id: 'French',        label: t('cuisine_french'),        flag: '🇫🇷' },
    { id: 'Brazilian',     label: t('cuisine_brazilian'),     flag: '🇧🇷' },
  ];

  const value = {
    lang, setLang, t,
    units, setUnits,
    country, setCountry, currency,
    supportedLanguages: SUPPORTED_LANGUAGES,
    TIME_OPTIONS, DIET_OPTIONS, CUISINE_OPTIONS,
    isMetric: units === 'metric',
    isImperial: units === 'imperial',
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
