import en from './en';
import hi from './hi';
import ta from './ta';
import es from './es';
import fr from './fr';
import de from './de';
import bn from './bn';
import te from './te';
import kn from './kn';
import mr from './mr';

export const SUPPORTED_LANGUAGES = [
  { id: 'en', label: 'English',    flag: '🇬🇧', dir: 'ltr', region: 'Global' },
  { id: 'hi', label: 'हिन्दी',     flag: '🇮🇳', dir: 'ltr', region: 'India'  },
  { id: 'ta', label: 'தமிழ்',     flag: '🇮🇳', dir: 'ltr', region: 'India'  },
  { id: 'te', label: 'తెలుగు',    flag: '🇮🇳', dir: 'ltr', region: 'India'  },
  { id: 'kn', label: 'ಕನ್ನಡ',     flag: '🇮🇳', dir: 'ltr', region: 'India'  },
  { id: 'bn', label: 'বাংলা',     flag: '🇮🇳', dir: 'ltr', region: 'India'  },
  { id: 'mr', label: 'मराठी',     flag: '🇮🇳', dir: 'ltr', region: 'India'  },
  { id: 'es', label: 'Español',    flag: '🇪🇸', dir: 'ltr', region: 'Global' },
  { id: 'fr', label: 'Français',   flag: '🇫🇷', dir: 'ltr', region: 'Global' },
  { id: 'de', label: 'Deutsch',    flag: '🇩🇪', dir: 'ltr', region: 'Global' },
];

const TRANSLATIONS = { en, hi, ta, te, kn, bn, mr, es, fr, de };

export function translate(lang, key, vars = {}) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let str = dict[key] ?? TRANSLATIONS.en[key] ?? key;
  if (typeof str !== 'string') return key;
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replace(new RegExp('{' + k + '}', 'g'), String(v));
  });
  return str;
}

export default TRANSLATIONS;
