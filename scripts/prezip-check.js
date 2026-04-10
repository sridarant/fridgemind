#!/usr/bin/env node
// scripts/prezip-check.js — Run before every zip/deploy
// Checks: structural syntax, missing exports, braceless-if, API count, vercel.json
// Usage: node scripts/prezip-check.js

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let errors = 0, warnings = 0;
const err  = msg => { console.error('  ✗', msg); errors++; };
const warn = msg => { console.warn( '  ⚠', msg); warnings++; };
const ok   = msg => console.log('  ✓', msg);

// ── Collect all JS/JSX files ──────────────────────────────────────
function collect(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory() && !['node_modules','.git','playwright-report'].includes(f))
      collect(full, out);
    else if ((f.endsWith('.jsx') || f.endsWith('.js')) && fs.statSync(full).isFile())
      out.push(full);
  }
  return out;
}
const srcFiles = collect(path.join(ROOT, 'src'));
const apiFiles = fs.readdirSync(path.join(ROOT, 'api'))
  .filter(f => f.endsWith('.js'))
  .map(f => path.join(ROOT, 'api', f));
const allFiles = [...srcFiles, ...apiFiles];

// ── 1. Braceless if-with-comment-body (the Profile.jsx class of error) ──
console.log('\n── Braceless if + comment body ──');
let ifClean = 0;
for (const file of allFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const cur  = lines[i].trim();
    const next = lines[i + 1]?.trim() || '';
    // if (...) with no opening brace, followed immediately by a comment = syntax error
    if (/^if\s*\(.*\)\s*$/.test(cur) && !cur.endsWith('{') && next.startsWith('//')) {
      err(`${path.relative(ROOT, file)}:${i + 2} — braceless if followed by comment (empty body)`);
    } else {
      ifClean++;
    }
  }
}
if (errors === 0) ok(`Braceless if check: ${ifClean} lines scanned, 0 issues`);


// ── 2. Unescaped apostrophe inside single-quoted JS string values ──
// Catches: 'what\'s', 'today\'s' assigned as JS string values (=, :, [, ()
// Specifically: after = or : or , or ( or [, find 'text with word'word'
// JSX text nodes and comments are excluded by requiring the string assign context.
// Pattern: assignment/delimiter then single-quote then word-apostrophe-word
console.log('\n── Unescaped apostrophe in JS string values ──');
let apostropheIssues = 0, linesScanned = 0;
// Matches: optional whitespace, then = or : or , or ( or [, then optional space,
// then single-quote, then any chars, then \w'\w (the bug pattern)
const assignedStringApostrophe = /(?:=|:|,|\(|\[)\s*'[^'\n]*\w'\w/;
for (const file of allFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Strip template literals, double-quoted strings, and line comments
    line = line
      .replace(/`(?:[^`\\]|\\.)*`/g, '``')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/\/\/.*/g, '');
    linesScanned++;
    if (assignedStringApostrophe.test(line)) {
      // Extra guard: skip if the apostrophe is escaped
      if (!/\\'./.test(line)) {
        err(`${path.relative(ROOT, file)}:${i + 1} — unescaped apostrophe in single-quoted string value: ${lines[i].trim().slice(0, 70)}`);
        apostropheIssues++;
      }
    }
  }
}
if (apostropheIssues === 0) ok(`Apostrophe check: ${linesScanned} lines scanned, 0 issues`);


// ── 3. Template literal patterns that cause Babel parse errors ──────────
// Two confirmed failure patterns in Vercel's Babel version:
// A) CSS prop with template literal: border:`1.5px solid ${expr}` (numeric + identifier)
// B) JSX text ternary with template: {cond ? `text ${expr}` : ''} (text node context)
// NOT flagged: className={`x ${y}`} — works fine in production (standard JSX)
console.log('\n── Template literal Babel parse patterns ──');
let styleTemplateIssues = 0, styleTemplateClean = 0;
// Pattern A: CSS property in style object with template literal
const cssPropsRe = /(?:border|background|color|boxShadow|outline|padding|margin|width|height|fontSize|borderRadius|transform|opacity|flex|gridTemplateColumns):`[^`]*\$\{/;
// Pattern B: JSX text node ternary with template literal
// {expr ? `text ${var}` : ''}  — dangerous in JSX text position
const jsxTextTernaryRe = /\{[^}]+\?\s*`[^`]*\$\{[^}]+\}[^`]*`\s*:/;

for (const file of srcFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (cssPropsRe.test(line)) {
      err(`${path.relative(ROOT, file)}:${i + 1} — template literal in CSS style prop (use string concat): ${line.trim().slice(0, 75)}`);
      styleTemplateIssues++;
    } else if (jsxTextTernaryRe.test(line)) {
      err(`${path.relative(ROOT, file)}:${i + 1} — template literal in JSX text ternary (use string concat): ${line.trim().slice(0, 75)}`);
      styleTemplateIssues++;
    } else {
      styleTemplateClean++;
    }
  }
}
if (styleTemplateIssues === 0) ok(`Template literal check: ${styleTemplateClean} lines scanned, 0 issues`);


// ── 4. Corrupted template literals (JSX content swallowed into template) ──
// Catches: lines where a template literal has swallowed JSX markup
// Pattern: backtick + JSX closing tag or JSX attribute on the SAME line after ${}
// This is the specific corruption caused by partial string replacements
console.log('\n── Corrupted template literal check ──');
let unterminatedIssues = 0, unterminatedClean = 0;
// The corruption pattern: template literal followed immediately by JSX angle-bracket content
// e.g. `...${expr}days              <div className="card">
const corruptedTemplateRe = /`[^`]*\$\{[^`]*<(?:div|span|p|button|a|h[1-6]|section|nav|header|footer)\b/;
for (const file of srcFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (corruptedTemplateRe.test(line)) {
      err(`${path.relative(ROOT, file)}:${i + 1} — template literal may have swallowed JSX content: ${line.trim().slice(0, 80)}`);
      unterminatedIssues++;
    }
    unterminatedClean++;
  }
}
if (unterminatedIssues === 0) ok(`Corrupted template check: ${unterminatedClean} lines scanned, 0 issues`);


// ── 5. JSX block comment inside opening tag (invalid between props) ──
// Catches: <Comp prop={x} {/* comment */} /> — must use // instead
console.log('\n── Block comment inside JSX tag ──');
let jsxCommentIssues = 0, jsxCommentClean = 0;
for (const file of srcFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i].trim();
    // Line is a standalone {/* */} comment block
    if (cur.startsWith('{/*') && cur.endsWith('*/}')) {
      // Check the previous non-empty line to see if we're inside a JSX tag
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prev = lines[j].trim();
        if (!prev) continue;
        // If previous line ends with a JSX prop assignment, we're inside a tag
        if (/=\{[^}]*\}$/.test(prev) || /=["'][^"']*["']$/.test(prev)) {
          err(`${path.relative(ROOT, file)}:${i + 1} — block comment inside JSX tag (use // instead): ${cur.slice(0, 60)}`);
          jsxCommentIssues++;
        }
        break;
      }
    }
    jsxCommentClean++;
  }
}
if (jsxCommentIssues === 0) ok(`Block comment check: ${jsxCommentClean} lines scanned, 0 issues`);


// ── 6. JSX return div balance (catches orphaned closing tags) ────────────
// Counts <div opens vs </div closes — excludes self-closing <div ... />
console.log('\n── JSX div balance check ──');
let divBalanceIssues = 0;
for (const file of srcFiles) {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('return (') && !src.includes('return(')) continue;
  // Remove self-closing divs first so they don't inflate open count
  const stripped   = src.replace(/<div[^>]*\/>/g, '');
  const opens      = (stripped.match(/<div[\s>]/g)  || []).length;
  const closes     = (stripped.match(/<\/div>/g) || []).length;
  const delta      = Math.abs(opens - closes);
  if (delta > 5) {  // threshold >5 avoids false positives from fragment structures
    err(`${path.relative(ROOT, file)} — div imbalance: ${opens} opens vs ${closes} closes (delta ${delta})`);
    divBalanceIssues++;
  }
}
if (divBalanceIssues === 0) ok(`Div balance check: all JSX files balanced`);
// ── 7. Named import ↔ export cross-check ─────────────────────────
console.log('\n── Named import/export verification ──');
let exportChecked = 0, exportFailed = 0;
for (const file of srcFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const importRe = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRe.exec(src)) !== null) {
    const [, names, specifier] = m;
    if (!specifier.startsWith('.')) continue;
    const base = path.resolve(path.dirname(file), specifier);
    const target = [base, base + '.jsx', base + '.js',
                    base + '/index.jsx', base + '/index.js']
      .find(p => { try { const s=fs.statSync(p); return s.isFile(); } catch { return false; } });
    if (!target) { warn(`${path.relative(ROOT, file)}: missing file '${specifier}'`); continue; }
    const tsrc = fs.readFileSync(target, 'utf8');
    for (const raw of names.split(',')) {
      const name = raw.trim().replace(/\s+as\s+\w+$/, '');
      if (!name) continue;
      const exported =
        tsrc.includes(`export function ${name}`) ||
        tsrc.includes(`export async function ${name}`) ||
        tsrc.includes(`export const ${name} `) ||
        tsrc.includes(`export class ${name}`) ||
        new RegExp(`export\\s*\\{[^}]*\\b${name}\\b`).test(tsrc) ||
        tsrc.includes(`export default function ${name}`);
      if (!exported) {
        err(`'${name}' not exported from ${path.relative(ROOT, target)} (needed by ${path.relative(ROOT, file)})`);
        exportFailed++;
      } else {
        exportChecked++;
      }
    }
  }
}
if (exportFailed === 0) ok(`Exports: ${exportChecked} named imports verified`);

// ── 8. API function count ─────────────────────────────────────────
console.log('\n── API function count (Vercel Hobby limit: 12) ──');
const apiCount = apiFiles.length;
if (apiCount > 12) err(`${apiCount}/12 — over limit`);
else ok(`${apiCount}/12 (${12 - apiCount} slots free): ${apiFiles.map(f => path.basename(f)).join(', ')}`);

// ── 9. vercel.json rewrite destinations exist ─────────────────────
console.log('\n── vercel.json rewrite integrity ──');
const vj = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
let rewriteOk = 0;
for (const r of (vj.rewrites || [])) {
  if (!r.source.startsWith('/api/')) { rewriteOk++; continue; }
  const fname = (r.destination || '').replace('/api/', '').split('?')[0];
  if (fname && !fs.existsSync(path.join(ROOT, 'api', fname))) {
    err(`Broken rewrite: ${r.source} → ${r.destination} (file missing)`);
  } else {
    rewriteOk++;
  }
}
ok(`${rewriteOk}/${(vj.rewrites || []).length} rewrites valid`);

// ── 10. Key file existence ─────────────────────────────────────────
console.log('\n── Key file existence ──');
const required = [
  'src/pages/Admin.jsx',
  'src/pages/admin/AdminShell.jsx',
  'src/components/meal/MealCard.jsx',
  'src/components/meal/VideoButton.jsx',
  'src/components/meal/StepTimer.jsx',
  'src/components/meal/GroceryPanel.jsx',
  'src/components/meal/CookModeOverlay.jsx',
  'src/components/planner/PlannerComponents.jsx',
  'src/lib/scaling.js', 'src/lib/timers.js', 'src/lib/grocery.js',
  'src/lib/sharing.js', 'src/lib/mealKey.js', 'src/lib/festival.js',
  'api/deploy-hook.js', 'api/admin.js', 'api/suggest.js', 'api/videos.js',
  'tests/unit/lib.test.js', 'tests/jiff.spec.js',
];
let missing = 0;
for (const f of required) {
  if (!fs.existsSync(path.join(ROOT, f))) { err(`Missing: ${f}`); missing++; }
}
if (missing === 0) ok(`All ${required.length} required files present`);


// ── 11. Dangling comma in string concatenation ────────────────────
// Catches patterns like: + ',' propertyName: (comma swallowed into string)
console.log('\n── Dangling comma in string concat ──');
let danglingCommaIssues = 0;
for (const file of srcFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  lines.forEach((l, i) => {
    if (/\+ ','\s+\w+:/.test(l)) {
      err(`${path.relative(ROOT, file)}:${i+1} — dangling comma in string concat: ${l.trim().slice(0,80)}`);
      danglingCommaIssues++;
    }
  });
}
if (danglingCommaIssues === 0) ok('Dangling comma check: clean');



// ── 13. Valid Anthropic model strings ─────────────────────────────
// Catches invalid model names that cause 500s from the Anthropic API.
console.log('\n── Anthropic model string validation ──');
const VALID_MODELS = [
  'claude-opus-4-6',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
];
const MODEL_RE = /claude-[a-z0-9-]+/g;
let modelIssues = 0;
const modelApiFiles = fs.readdirSync(path.join(ROOT, 'api'))
  .filter(f => f.endsWith('.js'))
  .map(f => path.join(ROOT, 'api', f));
for (const file of modelApiFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const found = [...new Set([...src.matchAll(MODEL_RE)].map(m => m[0]))];
  for (const model of found) {
    if (!VALID_MODELS.includes(model)) {
      err(path.basename(file) + ': invalid model "' + model + '" — use ' + VALID_MODELS.join(', '));
      modelIssues++;
    }
  }
}
if (modelIssues === 0) ok('Model validation: all ' + VALID_MODELS.length + ' valid model strings confirmed');

// ── 12. Hook return completeness ──────────────────────────────────
// Verifies every hook's return {} contains all setters/handlers defined inside it.
// Catches the recurring "defined in hook, used by caller, not in return" bug.
console.log('\n── Hook return completeness ──');
const hookDir = path.join(ROOT, 'src/hooks');
let hookIssues = 0;
if (fs.existsSync(hookDir)) {
  fs.readdirSync(hookDir).filter(f => f.endsWith('.js')).forEach(file => {
    const src = fs.readFileSync(path.join(hookDir, file), 'utf8');
    // Find the return block
    const returnMatch = src.match(/return \{([^}]+)\}/s);
    if (!returnMatch) return;
    const returned = new Set(returnMatch[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(Boolean));
    // Find state setters declared in the hook
    const setters = [...src.matchAll(/const \[(\w+),\s*(\w+)\]/g)].map(m => m[2]);
    // Find useCallback functions
    const callbacks = [...src.matchAll(/const (\w+)\s*=\s*useCallback/g)].map(m => m[1]);
    const allDefined = [...setters, ...callbacks];
    const missing = allDefined.filter(name => !returned.has(name) && name !== 'setState');
    if (missing.length > 0) {
      err(file + ': defined but not in return: ' + missing.join(', '));
      hookIssues++;
    }
  });
}
if (hookIssues === 0) ok('Hook return completeness: all hooks export what they define');

// ── Summary ───────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(52));
if (errors > 0) {
  console.error(`\n✗ ${errors} error(s) — fix before zipping\n`);
  process.exit(1);
} else {
  console.log(`\n✓ All checks passed${warnings ? ` (${warnings} warning(s))` : ''} — safe to zip\n`);
}
