import { createContext, useContext, useState, useCallback } from 'react';
import { translate, SUPPORTED_LANGUAGES } from '../i18n';

const LocaleContext = createContext(null);
export const useLocale = () => useContext(LocaleContext);

// Countries where Jiff is fully live with payments
export const ENABLED_COUNTRIES = ['IN', 'SG', 'GB', 'AU', 'US'];

export const CURRENCY_MAP = {
  IN: { code:'INR', symbol:'₹', plans:{ monthly:'₹99', annual:'₹799', lifetime:'₹2,999' }, amounts:{ monthly:9900, annual:79900, lifetime:299900 }, gateway:'razorpay' },
  SG: { code:'SGD', symbol:'S$', plans:{ monthly:'S$3', annual:'S$24', lifetime:'S$49' }, amounts:{ monthly:300, annual:2400, lifetime:4900 }, gateway:'stripe' },
  US: { code:'USD', symbol:'$', plans:{ monthly:'$2.99', annual:'$19.99', lifetime:'$39.99' }, amounts:{ monthly:299, annual:1999, lifetime:3999 }, gateway:'stripe' },
  GB: { code:'GBP', symbol:'£', plans:{ monthly:'£2.49', annual:'£17.99', lifetime:'£34.99' }, amounts:{ monthly:249, annual:1799, lifetime:3499 }, gateway:'stripe' },
  AU: { code:'AUD', symbol:'A$', plans:{ monthly:'A$4', annual:'A$29', lifetime:'A$59' }, amounts:{ monthly:400, annual:2900, lifetime:5900 }, gateway:'stripe' },
  DEFAULT: { code:'USD', symbol:'$', plans:{ monthly:'$2.99', annual:'$19.99', lifetime:'$39.99' }, amounts:{ monthly:299, annual:1999, lifetime:3999 }, gateway:'stripe' },
};

// Food type categories (Veg/Non-veg/Jain etc) — item w
export const FOOD_TYPE_OPTIONS = [
  { id:'non-veg',     label:'Non-vegetarian', emoji:'🍗', desc:'Includes meat, fish, eggs' },
  { id:'veg',         label:'Vegetarian',      emoji:'🥦', desc:'No meat/fish. Includes dairy and eggs' },
  { id:'eggetarian',  label:'Eggetarian',      emoji:'🥚', desc:'Vegetarian + eggs' },
  { id:'vegan',       label:'Vegan',            emoji:'🌱', desc:'No animal products' },
  { id:'jain',        label:'Jain',             emoji:'🙏', desc:'No meat, eggs, or root veg (onion, garlic, potato, carrot)' },
  { id:'halal',       label:'Halal',            emoji:'☪️',  desc:'Halal-certified meats, no pork/alcohol' },
  { id:'kosher',      label:'Kosher',           emoji:'✡️',  desc:'No pork, no shellfish, no mixing meat+dairy' },
  { id:'pescatarian', label:'Pescatarian',      emoji:'🐟', desc:'No meat but includes fish/seafood' },
];

// Diet requirements (medical/health) — item k
export const DIET_REQUIREMENTS = [
  { id:'diabetic',     label:'Diabetic-friendly', emoji:'💊', desc:'Low GI, controlled sugar' },
  { id:'low-sodium',   label:'Low sodium',         emoji:'🧂', desc:'Heart-healthy, low salt' },
  { id:'low-fat',      label:'Low fat',            emoji:'⚖️', desc:'Reduced fat' },
  { id:'keto',         label:'Keto',               emoji:'🥑', desc:'Very low carb, high fat' },
  { id:'high-protein', label:'High protein',       emoji:'💪', desc:'30g+ protein per meal' },
  { id:'low-calorie',  label:'Low calorie',        emoji:'🌿', desc:'Under 400 cal per meal' },
  { id:'gluten-free',  label:'Gluten-free',        emoji:'🌾', desc:'No wheat, barley, rye' },
  { id:'dairy-free',   label:'Dairy-free',         emoji:'🥛', desc:'No milk, cheese, butter' },
];

// Indian sub-cuisines — item w
export const INDIAN_CUISINES = [
  { id:'Tamil Nadu',    label:'Tamil Nadu',     flag:'🌶️' },
  { id:'Kerala',        label:'Kerala',         flag:'🥥' },
  { id:'Andhra',        label:'Andhra',         flag:'🌶️' },
  { id:'Karnataka',     label:'Karnataka',      flag:'🏯' },
  { id:'Punjabi',       label:'Punjabi',        flag:'🧡' },
  { id:'Mughlai',       label:'Mughlai',        flag:'🍖' },
  { id:'Gujarati',      label:'Gujarati',       flag:'🙏' },
  { id:'Rajasthani',    label:'Rajasthani',     flag:'🏜️' },
  { id:'Bengali',       label:'Bengali',        flag:'🐟' },
  { id:'Maharashtrian', label:'Maharashtrian',  flag:'🫓' },
  { id:'Kashmiri',      label:'Kashmiri',       flag:'❄️' },
  { id:'Goan',          label:'Goan',           flag:'🌊' },
  { id:'Hyderabadi',    label:'Hyderabadi',     flag:'🍚' },
];

export const GLOBAL_CUISINES = [
  { id:'Italian',        label:'Italian',        flag:'🇮🇹' },
  { id:'Chinese',        label:'Chinese',        flag:'🇨🇳' },
  { id:'Mexican',        label:'Mexican',        flag:'🇲🇽' },
  { id:'Mediterranean',  label:'Mediterranean',  flag:'🫒' },
  { id:'Thai',           label:'Thai',           flag:'🇹🇭' },
  { id:'Japanese',       label:'Japanese',       flag:'🇯🇵' },
  { id:'Korean',         label:'Korean',         flag:'🇰🇷' },
  { id:'American',       label:'American',       flag:'🇺🇸' },
  { id:'Middle Eastern', label:'Middle Eastern', flag:'🌙' },
  { id:'French',         label:'French',         flag:'🇫🇷' },
  { id:'Brazilian',      label:'Brazilian',      flag:'🇧🇷' },
  { id:'Vietnamese',     label:'Vietnamese',     flag:'🇻🇳' },
  { id:'Greek',          label:'Greek',          flag:'🇬🇷' },
];

function guessCountry() {
  try {
    const saved = localStorage.getItem('jiff-country');
    if (saved) return saved;
    // Use timezone for accurate country detection — more reliable than navigator.language
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Calcutta') || tz.includes('Kolkata') || tz.includes('Asia/Colombo')) return 'IN';
    if (tz.includes('Singapore')) return 'SG';
    if (tz.includes('London') || tz.includes('Europe/London')) return 'GB';
    if (tz.includes('Sydney') || tz.includes('Melbourne') || tz.includes('Australia')) return 'AU';
    if (tz.includes('Dubai') || tz.includes('Asia/Muscat')) return 'AE';
    if (tz.includes('Kuala_Lumpur') || tz.includes('Malaysia')) return 'MY';
    if (tz.includes('Bangkok') || tz.includes('Asia/Bangkok')) return 'TH';
    if (tz.includes('Tokyo') || tz.includes('Asia/Tokyo')) return 'JP';
    if (tz.includes('Shanghai') || tz.includes('Asia/Hong_Kong')) return 'CN';
    if (tz.includes('Berlin') || tz.includes('Europe/Paris') || tz.includes('Europe/Amsterdam')) return 'DE';
    // Fall back to navigator.language
    const lang = (navigator.language || 'en-US').split('-')[1]?.toUpperCase() || 'US';
    return lang;
  } catch { return 'US'; }
}
function getLang()  { try { return localStorage.getItem('jiff-lang')||'en';     } catch { return 'en';     } }
function getUnits() { try { return localStorage.getItem('jiff-units')||'metric';} catch { return 'metric'; } }

export function LocaleProvider({ children }) {
  const [lang,    setLangState]    = useState(getLang);
  const [units,   setUnitsState]   = useState(getUnits);
  const [country, setCountryState] = useState(guessCountry);

  const currency = CURRENCY_MAP[country] || CURRENCY_MAP.DEFAULT;

  const setLang = useCallback((l) => {
    setLangState(l);
    try { localStorage.setItem('jiff-lang', l); } catch {}
    document.documentElement.lang = l;
  }, []);

  const setUnits = useCallback((u) => {
    setUnitsState(u); try { localStorage.setItem('jiff-units', u); } catch {}
  }, []);

  const setCountry = useCallback((c) => {
    setCountryState(c); try { localStorage.setItem('jiff-country', c); } catch {}
  }, []);

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  const TIME_OPTIONS = [
    { id:'15 min',        label:t('time_15') },
    { id:'30 min',        label:t('time_30') },
    { id:'1 hour',        label:t('time_60') },
    { id:'no time limit', label:t('time_any') },
  ];

  const DIET_OPTIONS = [
    { id:'none',        label:t('diet_none') },
    { id:'vegetarian',  label:t('diet_veg') },
    { id:'vegan',       label:t('diet_vegan') },
    { id:'gluten-free', label:t('diet_gf') },
    { id:'dairy-free',  label:t('diet_df') },
    { id:'low-carb',    label:t('diet_lowCarb') },
  ];

  const CUISINE_OPTIONS = [
    { id:'any', label:t('cuisine_any'), flag:'🌍', group:'global' },
    ...INDIAN_CUISINES.map(c => ({ ...c, group:'indian' })),
    ...GLOBAL_CUISINES.filter(c => c.id !== 'any').map(c => ({ ...c, group:'global' })),
  ];

  const value = {
    lang, setLang, t,
    units, setUnits,
    country, setCountry, currency,
    supportedLanguages: SUPPORTED_LANGUAGES,
    TIME_OPTIONS, DIET_OPTIONS, CUISINE_OPTIONS,
    INDIAN_CUISINES, GLOBAL_CUISINES,
    FOOD_TYPE_OPTIONS, DIET_REQUIREMENTS,
    isMetric: units === 'metric', isImperial: units === 'imperial',
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
