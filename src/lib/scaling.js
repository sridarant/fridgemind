// src/lib/scaling.js — Ingredient quantity parsing, scaling, and nutrition scaling
// Pure functions — no React dependencies. Fully testable.

export const FRACTIONS = {
  '¼':0.25,'½':0.5,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875
};
const FRAC_CHARS = Object.keys(FRACTIONS).join('');
export const QTY_RE = new RegExp(
  `^(\\*?\\s*)(\\d+(?:\\.\\d+)?)?\\s*([${FRAC_CHARS}])?(?:\\s*(\\d+)\\s*\\/\\s*(\\d+))?`
);

/**
 * Parse a leading quantity from an ingredient string.
 * Returns { value, rest, prefix } — value is null if no quantity found.
 */
export function parseQty(str) {
  const m = str.match(QTY_RE);
  if (!m) return { value: null, rest: str, prefix: '' };
  const prefix = m[1] || '';
  const whole  = m[2] ? parseFloat(m[2]) : 0;
  const frac   = m[3] ? FRACTIONS[m[3]] : 0;
  const slash  = m[4] && m[5] ? parseInt(m[4]) / parseInt(m[5]) : 0;
  const value  = whole + frac + slash;
  return value > 0
    ? { value, rest: str.slice(m[0].length).trimStart(), prefix }
    : { value: null, rest: str, prefix: '' };
}

/**
 * Format a number as a nice fraction string where possible.
 * e.g. 0.5 → "½", 1.5 → "1½", 2.333 → "2⅓"
 */
export function toNiceNumber(n) {
  if (n === 0) return '0';
  const r = Math.round(n * 100) / 100;
  const niceFragments = [
    [0.125,'⅛'],[0.25,'¼'],[0.333,'⅓'],[0.375,'⅜'],
    [0.5,'½'],[0.625,'⅝'],[0.667,'⅔'],[0.75,'¾'],[0.875,'⅞']
  ];
  const whole = Math.floor(r);
  const frac  = Math.round((r - whole) * 1000) / 1000;
  if (frac === 0) return String(whole || r);
  for (const [val, sym] of niceFragments) {
    if (Math.abs(frac - val) < 0.02) return whole > 0 ? `${whole}${sym}` : sym;
  }
  return r < 10 ? r.toFixed(1).replace(/\.0$/, '') : String(Math.round(r));
}

/**
 * Scale an ingredient string by a ratio.
 * e.g. scaleIngredient("2 cups rice", 1.5) → "3 cups rice"
 */
export function scaleIngredient(str, ratio) {
  if (ratio === 1) return str;
  const { value, rest, prefix } = parseQty(str);
  if (value === null) return str;
  return `${prefix}${toNiceNumber(value * ratio)} ${rest}`.trim();
}

/**
 * Scale a nutrition value string by a ratio.
 * e.g. scaleNutrition("320 kcal", 1.5) → "480 kcal"
 */
export function scaleNutrition(val, ratio) {
  if (ratio === 1) return val;
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${Math.round(n * ratio)}${val.replace(/^[\d.]+/, '').trim()}`;
}
