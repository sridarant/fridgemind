import en from './en';
import hi from './hi';
import ta from './ta';
import es from './es';

export const SUPPORTED_LANGUAGES = [
  { id: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
  { id: 'hi', label: 'हिन्दी',    flag: '🇮🇳', dir: 'ltr' },
  { id: 'ta', label: 'தமிழ்',    flag: '🇮🇳', dir: 'ltr' },
  { id: 'es', label: 'Español',  flag: '🇪🇸', dir: 'ltr' },
];

const TRANSLATIONS = { en, hi, ta, es };

// Translate with optional variable interpolation
// t('hello_{name}', { name: 'Sri' }) → 'Hello Sri'
export function translate(lang, key, vars = {}) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp(`{${k}}`, 'g'), v);
  });
  return str;
}

export default TRANSLATIONS;
