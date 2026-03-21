import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePremium } from '../contexts/PremiumContext';

// Favourites managed by AuthContext

// ── Serving scaler ────────────────────────────────────
const FRACTIONS = { '¼':0.25,'½':0.5,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅛':0.125,'⅜':0.375,'⅝':0.625,'⅞':0.875 };
const FRAC_CHARS = Object.keys(FRACTIONS).join('');
const QTY_RE = new RegExp(`^(\\*?\\s*)(\\d+(?:\\.\\d+)?)?\\s*([${FRAC_CHARS}])?(?:\\s*(\\d+)\\s*\\/\\s*(\\d+))?`);
function parseQty(str) {
  const m = str.match(QTY_RE);
  if (!m) return { value: null, rest: str, prefix: '' };
  const prefix = m[1]||'', whole = m[2]?parseFloat(m[2]):0;
  const frac = m[3]?FRACTIONS[m[3]]:0, slash = m[4]&&m[5]?parseInt(m[4])/parseInt(m[5]):0;
  const value = whole + frac + slash;
  return value > 0 ? { value, rest: str.slice(m[0].length).trimStart(), prefix } : { value:null, rest:str, prefix:'' };
}
function toNiceNumber(n) {
  if (n===0) return '0';
  const r = Math.round(n*100)/100;
  const niceFracs=[[0.125,'⅛'],[0.25,'¼'],[0.333,'⅓'],[0.375,'⅜'],[0.5,'½'],[0.625,'⅝'],[0.667,'⅔'],[0.75,'¾'],[0.875,'⅞']];
  const whole=Math.floor(r), frac=Math.round((r-whole)*1000)/1000;
  if (frac===0) return String(whole||r);
  for (const [val,sym] of niceFracs) if (Math.abs(frac-val)<0.02) return whole>0?`${whole}${sym}`:sym;
  return r<10?r.toFixed(1).replace(/\.0$/,''):String(Math.round(r));
}
function scaleIngredient(str, ratio) {
  if (ratio===1) return str;
  const { value, rest, prefix } = parseQty(str);
  if (value===null) return str;
  return `${prefix}${toNiceNumber(value*ratio)} ${rest}`.trim();
}
function scaleNutrition(val, ratio) {
  if (ratio===1) return val;
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  return `${Math.round(n*ratio)}${val.replace(/^[\d.]+/,'').trim()}`;
}

// ── Timer engine ──────────────────────────────────────
// Parses a step string and extracts the most relevant cooking duration in seconds.
// Handles: "5 minutes", "10-15 minutes" (uses midpoint), "1 hour 30 minutes",
// "2 hours", "45 seconds", "half an hour", ordinals with time in parens, etc.

function parseStepTime(text) {
  const t = text.toLowerCase();

  // "half an hour" / "half hour"
  if (/half\s+an?\s+hour/.test(t)) return 1800;

  let totalSeconds = 0;

  // Hours — range or single: "1-2 hours", "1 hour", "2hrs"
  const hourRange = t.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*h(?:ou?r?s?|rs?)/);
  const hourSingle = t.match(/(\d+(?:\.\d+)?)\s*h(?:ou?r?s?|rs?)/);
  if (hourRange) {
    totalSeconds += ((parseFloat(hourRange[1]) + parseFloat(hourRange[2])) / 2) * 3600;
  } else if (hourSingle) {
    totalSeconds += parseFloat(hourSingle[1]) * 3600;
  }

  // Minutes — range or single: "10-15 minutes", "5 mins", "30 min"
  const minRange = t.match(/(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?s?)/);
  const minSingle = t.match(/(\d+(?:\.\d+)?)\s*m(?:in(?:utes?)?s?)/);
  if (minRange) {
    totalSeconds += ((parseFloat(minRange[1]) + parseFloat(minRange[2])) / 2) * 60;
  } else if (minSingle) {
    totalSeconds += parseFloat(minSingle[1]) * 60;
  }

  // Seconds
  const secMatch = t.match(/(\d+)\s*s(?:ec(?:onds?)?s?)/);
  if (secMatch) totalSeconds += parseInt(secMatch[1]);

  // Must be a meaningful duration: at least 10s, at most 12 hours
  // Also skip if the text is just describing serving ("serve for 4", "cook for 2 people" etc.)
  if (totalSeconds < 10 || totalSeconds > 43200) return null;

  return Math.round(totalSeconds);
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ── StepTimer component ───────────────────────────────
function StepTimer({ totalSeconds }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running,   setRunning]   = useState(false);
  const [done,      setDone]      = useState(false);
  const intervalRef = useRef(null);

  // Clean up on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            // Vibrate if supported (mobile)
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const start  = e => { e.stopPropagation(); setRunning(true);  setDone(false); };
  const pause  = e => { e.stopPropagation(); setRunning(false); };
  const reset  = e => { e.stopPropagation(); setRunning(false); setRemaining(totalSeconds); setDone(false); };

  const pct = ((totalSeconds - remaining) / totalSeconds) * 100;

  if (done) {
    return (
      <div className="step-timer done" onClick={e => e.stopPropagation()}>
        <span className="timer-done-icon">🔔</span>
        <span className="timer-done-text">Done!</span>
        <button className="timer-reset-btn" onClick={reset} title="Reset">↺</button>
      </div>
    );
  }

  if (!running && remaining === totalSeconds) {
    // Idle state — show start button with duration hint
    return (
      <button className="step-timer idle" onClick={start} title={`Start ${formatTime(totalSeconds)} timer`}>
        <span className="timer-icon">⏱</span>
        <span className="timer-idle-label">{formatTime(totalSeconds)}</span>
      </button>
    );
  }

  return (
    <div className={`step-timer active ${running ? 'ticking' : 'paused'}`} onClick={e => e.stopPropagation()}>
      {/* Arc progress ring */}
      <div className="timer-ring-wrap">
        <svg className="timer-ring" viewBox="0 0 36 36">
          <circle className="timer-ring-track" cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"/>
          <circle
            className="timer-ring-fill"
            cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeDashoffset="25"
          />
        </svg>
        <span className="timer-display">{formatTime(remaining)}</span>
      </div>
      <div className="timer-controls">
        {running
          ? <button className="timer-ctrl-btn pause" onClick={pause}>⏸</button>
          : <button className="timer-ctrl-btn play"  onClick={start}>▶</button>
        }
        <button className="timer-ctrl-btn reset" onClick={reset}>↺</button>
      </div>
    </div>
  );
}

// ── StepWithTimer — renders a step, injecting a timer if time detected ──
function StepWithTimer({ text }) {
  const seconds = parseStepTime(text);
  return (
    <li>
      <span className="step-text">{text}</span>
      {seconds && <StepTimer key={text} totalSeconds={seconds} />}
    </li>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --jiff: #FF4500; --jiff-dark: #CC3700; --ink: #1C0A00;
    --cream: #FFFAF5; --warm: #FFF0E5; --muted: #7C6A5E;
    --border: rgba(28,10,0,0.10); --border-mid: rgba(28,10,0,0.18);
    --shadow: 0 4px 28px rgba(28,10,0,0.08);
    --fav: #E53E3E; --fav-bg: #FFF5F5; --fav-border: rgba(229,62,62,0.2);
    --whatsapp: #25D366; --whatsapp-dark: #1DA851;
    --need-bg: #FEF3E2; --need-text: #92400E;
    --have-bg: #ECFDF5; --have-text: #065F46;
    --timer-idle: #FF6B35; --timer-active: #2D6A4F; --timer-done: #1D9E75;
  }
  body { background: var(--cream); font-family: 'DM Sans', sans-serif; color: var(--ink); }
  .app { min-height: 100vh; background: var(--cream);
    background-image: radial-gradient(ellipse at 15% 0%, rgba(255,69,0,0.06) 0%, transparent 40%),
      radial-gradient(ellipse at 85% 90%, rgba(255,184,0,0.05) 0%, transparent 40%); }

  .header { display: flex; align-items: center; justify-content: space-between; padding: 18px 36px; border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 20; background: rgba(255,250,245,0.93); backdrop-filter: blur(12px); }
  .logo { display: flex; align-items: center; gap: 8px; cursor: pointer; }
  .logo-name { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: var(--ink); letter-spacing: -0.5px; }
  .logo-name span { color: var(--jiff); }
  .header-right { display: flex; align-items: center; gap: 8px; }
  .header-tag { font-size: 10px; background: var(--jiff); color: white; padding: 3px 10px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; }
  .fav-header-btn { display: flex; align-items: center; gap: 6px; background: none; border: 1.5px solid var(--border-mid); border-radius: 8px; padding: 6px 12px; font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.18s; white-space: nowrap; }
  .fav-header-btn:hover { border-color: var(--fav); color: var(--fav); }
  .fav-header-btn.has-favs { border-color: var(--fav); color: var(--fav); background: var(--fav-bg); }
  .fav-header-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
  .fav-badge { background: var(--fav); color: white; font-size: 10px; font-weight: 700; border-radius: 20px; padding: 1px 6px; margin-left: 2px; }

  .hero { max-width: 760px; margin: 0 auto; padding: 52px 24px 0; text-align: center; }
  .hero-eyebrow { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--jiff); font-weight: 500; margin-bottom: 14px; }
  .hero-title { font-family: 'Fraunces', serif; font-size: clamp(34px, 6vw, 58px); font-weight: 900; line-height: 1.05; color: var(--ink); margin-bottom: 14px; letter-spacing: -2px; }
  .hero-title em { font-style: italic; color: var(--jiff); }
  .hero-sub { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 420px; margin: 0 auto 40px; font-weight: 300; }

  .card { background: white; border: 1px solid var(--border); border-radius: 22px; padding: 32px; box-shadow: var(--shadow); max-width: 720px; margin: 0 auto; }
  .section { margin-bottom: 26px; }
  .section-label { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 500; margin-bottom: 11px; display: flex; align-items: center; gap: 8px; }
  .section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
  .ingredient-box { border: 1.5px solid var(--border-mid); border-radius: 12px; padding: 12px 14px; background: var(--cream); min-height: 88px; cursor: text; display: flex; flex-wrap: wrap; gap: 7px; align-items: flex-start; transition: border-color 0.2s; }
  .ingredient-box:focus-within { border-color: var(--jiff); box-shadow: 0 0 0 3px rgba(255,69,0,0.1); }
  .tag { background: var(--ink); color: white; padding: 5px 12px 5px 13px; border-radius: 20px; font-size: 13px; display: flex; align-items: center; gap: 6px; animation: tagIn 0.2s ease; white-space: nowrap; }
  @keyframes tagIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .tag-remove { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 16px; padding: 0; line-height: 1; transition: color 0.15s; }
  .tag-remove:hover { color: white; }
  .tag-input { border: none; outline: none; font-family: 'DM Sans', sans-serif; font-size: 14px; color: var(--ink); flex: 1; min-width: 140px; background: transparent; padding: 4px 0; }
  .tag-input::placeholder { color: var(--muted); }
  .tag-hint { font-size: 11.5px; color: var(--muted); margin-top: 7px; font-weight: 300; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .chip { border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 7px 15px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); }
  .chip:hover { border-color: var(--jiff); color: var(--ink); }
  .chip.active { background: var(--ink); border-color: var(--ink); color: white; font-weight: 500; }
  .chip.diet.active { background: var(--jiff); border-color: var(--jiff); }
  .cuisine-chips { display: flex; flex-wrap: wrap; gap: 7px; }
  .cuisine-chip { border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 7px 14px; font-size: 13px; cursor: pointer; transition: all 0.18s; font-family: 'DM Sans', sans-serif; background: white; color: var(--muted); display: flex; align-items: center; gap: 6px; }
  .cuisine-chip:hover { border-color: var(--jiff); color: var(--ink); transform: translateY(-1px); }
  .cuisine-chip.active { background: var(--jiff); border-color: var(--jiff); color: white; font-weight: 500; transform: translateY(-1px); box-shadow: 0 3px 12px rgba(255,69,0,0.25); }
  .cuisine-chip.active-any { background: var(--ink); border-color: var(--ink); color: white; font-weight: 500; }
  .cuisine-flag { font-size: 16px; line-height: 1; }
  .cta-wrap { text-align: center; padding-top: 4px; }
  .cta-btn { background: var(--jiff); color: white; border: none; border-radius: 14px; padding: 17px 44px; font-size: 16px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 10px; }
  .cta-btn:hover:not(:disabled) { background: var(--jiff-dark); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,69,0,0.35); }
  .cta-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .cta-note { font-size: 12px; color: var(--muted); margin-top: 10px; }

  .loading-wrap { text-align: center; padding: 72px 24px; max-width: 480px; margin: 0 auto; }
  .spinner { width: 44px; height: 44px; border: 3px solid var(--border-mid); border-top-color: var(--jiff); border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto 24px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-title { font-family: 'Fraunces', serif; font-size: 24px; font-weight: 700; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.5px; }
  .loading-sub { font-size: 14px; color: var(--muted); font-weight: 300; margin-bottom: 28px; }
  .loading-fact { font-size: 13px; color: var(--muted); padding: 12px 0; border-top: 1px solid var(--border); animation: fadeIn 0.4s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .results-header { max-width: 780px; margin: 44px auto 0; padding: 0 24px; }
  .results-title { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 900; color: var(--ink); margin-bottom: 5px; letter-spacing: -0.5px; }
  .results-sub { font-size: 14px; color: var(--muted); font-weight: 300; }
  .result-filters { max-width: 780px; margin: 10px auto 0; padding: 0 24px; display: flex; flex-wrap: wrap; gap: 7px; }
  .filter-pill { background: white; border: 1px solid var(--border-mid); border-radius: 20px; padding: 4px 12px; font-size: 12px; color: var(--muted); }

  .meals-grid { max-width: 780px; margin: 22px auto; padding: 0 24px 60px; display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; }
  .meal-card { background: white; border: 1px solid var(--border); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow); animation: slideUp 0.35s ease both; transition: transform 0.2s, box-shadow 0.2s; }
  .meal-card:not(.expanded) { cursor: pointer; }
  .meal-card:not(.expanded):hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(28,10,0,0.12); }
  .meal-card.is-fav { border-color: var(--fav-border); }
  .meal-card:nth-child(2) { animation-delay: 0.07s; }
  .meal-card:nth-child(3) { animation-delay: 0.14s; }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .meal-hdr { padding: 20px 20px 12px; }
  .meal-hdr-top { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 8px; }
  .meal-hdr-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .meal-num { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 600; }
  .meal-name { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 700; color: var(--ink); margin-bottom: 9px; line-height: 1.2; letter-spacing: -0.3px; }
  .meal-meta { display: flex; gap: 12px; flex-wrap: wrap; }
  .meal-meta-item { font-size: 12px; color: var(--muted); }
  .meal-desc { padding: 0 20px 14px; font-size: 13.5px; color: var(--muted); line-height: 1.6; font-weight: 300; }

  .heart-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; flex-shrink: 0; padding: 0; }
  .heart-btn:hover { border-color: var(--fav); background: var(--fav-bg); }
  .heart-btn.saved { border-color: var(--fav); background: var(--fav-bg); }
  .heart-btn svg { width: 15px; height: 15px; }
  .heart-btn.saved svg { animation: heartPop 0.3s ease; }
  @keyframes heartPop { 0%{transform:scale(1)}40%{transform:scale(1.4)}100%{transform:scale(1)} }

  .share-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 8px; padding: 5px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif; color: var(--muted); cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.18s; flex-shrink: 0; }
  .share-btn:hover { border-color: var(--jiff); color: var(--jiff); }
  .share-btn svg { width: 13px; height: 13px; }
  .share-drawer { border-top: 1px solid var(--border); padding: 12px 20px 16px; animation: drawerIn 0.2s ease; background: var(--cream); }
  @keyframes drawerIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  .share-drawer-label { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 10px; }
  .share-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .share-wa { display: flex; align-items: center; gap: 7px; background: var(--whatsapp); color: white; border: none; border-radius: 9px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.18s; text-decoration: none; flex: 1; }
  .share-wa:hover { background: var(--whatsapp-dark); transform: translateY(-1px); }
  .share-wa svg { width: 15px; height: 15px; flex-shrink: 0; }
  .share-copy { display: flex; align-items: center; gap: 7px; background: white; color: var(--ink); border: 1.5px solid var(--border-mid); border-radius: 9px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.18s; flex: 1; }
  .share-copy:hover { border-color: var(--ink); }
  .share-copy.copied { border-color: var(--jiff); color: var(--jiff); }
  .share-copy svg { width: 14px; height: 14px; flex-shrink: 0; }
  .share-native { display: flex; align-items: center; gap: 7px; background: var(--warm); color: var(--ink); border: 1.5px solid var(--border); border-radius: 9px; padding: 9px 16px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.18s; flex: 1; }
  .share-native svg { width: 14px; height: 14px; flex-shrink: 0; }

  .grocery-trigger { margin: 0 20px 16px; width: calc(100% - 40px); background: none; border: 1.5px dashed rgba(255,69,0,0.3); border-radius: 10px; padding: 10px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--jiff); font-weight: 500; display: flex; align-items: center; justify-content: space-between; transition: all 0.18s; }
  .grocery-trigger:hover { background: rgba(255,69,0,0.04); border-color: var(--jiff); }
  .grocery-trigger svg { width: 14px; height: 14px; }
  .grocery-panel { margin: 0 20px 16px; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; animation: drawerIn 0.2s ease; }
  .grocery-header { background: var(--ink); padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
  .grocery-header-left { display: flex; align-items: center; gap: 8px; }
  .grocery-header-title { font-size: 13px; font-weight: 500; color: white; }
  .grocery-header-sub { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 1px; }
  .grocery-close { background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 18px; padding: 0; line-height: 1; }
  .grocery-close:hover { color: white; }
  .grocery-section { padding: 12px 14px; }
  .grocery-section + .grocery-section { border-top: 1px solid var(--border); }
  .grocery-section-title { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; font-weight: 500; margin-bottom: 9px; display: flex; align-items: center; gap: 6px; }
  .grocery-section-title.need { color: #92400E; }
  .grocery-section-title.have { color: #065F46; }
  .grocery-count { font-size: 10px; font-weight: 500; padding: 2px 7px; border-radius: 20px; margin-left: auto; }
  .grocery-count.need { background: var(--need-bg); color: var(--need-text); }
  .grocery-count.have { background: var(--have-bg); color: var(--have-text); }
  .grocery-items { display: flex; flex-direction: column; gap: 5px; }
  .grocery-item { display: flex; align-items: flex-start; gap: 9px; padding: 7px 9px; border-radius: 8px; font-size: 13px; line-height: 1.4; font-weight: 300; cursor: pointer; }
  .grocery-item.need { background: var(--need-bg); color: var(--need-text); }
  .grocery-item.have { background: var(--have-bg); color: var(--have-text); cursor: default; }
  .grocery-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .grocery-item.need .grocery-dot { background: #F59E0B; }
  .grocery-item.have .grocery-dot { background: #10B981; }
  .grocery-checkbox { width: 15px; height: 15px; border-radius: 4px; border: 1.5px solid currentColor; flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .grocery-checkbox.checked { background: currentColor; }
  .grocery-checkbox.checked svg { display: block; }
  .grocery-checkbox svg { display: none; width: 9px; height: 9px; stroke: white; stroke-width: 2.5; }
  .grocery-item-text { flex: 1; }
  .grocery-item-text.checked-text { text-decoration: line-through; opacity: 0.5; }
  .grocery-empty { font-size: 13px; color: var(--muted); text-align: center; padding: 4px 0; }
  .grocery-actions { padding: 10px 14px; border-top: 1px solid var(--border); display: flex; gap: 8px; background: var(--cream); }
  .grocery-action-btn { flex: 1; padding: 8px 10px; font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 500; border-radius: 8px; cursor: pointer; transition: all 0.18s; display: flex; align-items: center; justify-content: center; gap: 5px; }
  .grocery-action-btn.copy { background: white; color: var(--ink); border: 1px solid var(--border-mid); }
  .grocery-action-btn.copy:hover { border-color: var(--ink); }
  .grocery-action-btn.copy.copied { color: var(--jiff); border-color: var(--jiff); }
  .grocery-action-btn.wa { background: var(--whatsapp); color: white; border: none; text-decoration: none; }
  .grocery-action-btn.wa:hover { background: var(--whatsapp-dark); }
  .grocery-action-btn svg { width: 13px; height: 13px; flex-shrink: 0; }

  /* Scaler */
  .scaler-bar { padding: 12px 16px; background: var(--warm); border: 1px solid rgba(255,69,0,0.15); border-radius: 10px 10px 0 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .scaler-label { font-size: 12px; font-weight: 500; color: var(--ink); display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .scaler-label svg { width: 14px; height: 14px; color: var(--jiff); flex-shrink: 0; }
  .scaler-controls { display: flex; align-items: center; gap: 0; border: 1.5px solid rgba(255,69,0,0.25); border-radius: 8px; overflow: hidden; flex-shrink: 0; }
  .scaler-btn { background: white; border: none; width: 32px; height: 32px; font-size: 18px; color: var(--jiff); cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: 300; transition: background 0.15s; line-height: 1; }
  .scaler-btn:hover:not(:disabled) { background: var(--fav-bg); }
  .scaler-btn:disabled { color: var(--muted); cursor: not-allowed; }
  .scaler-count { background: white; min-width: 44px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 500; color: var(--ink); border-left: 1px solid rgba(255,69,0,0.15); border-right: 1px solid rgba(255,69,0,0.15); user-select: none; }
  .scaler-orig { font-size: 11px; color: var(--muted); font-weight: 300; white-space: nowrap; margin-left: auto; }
  .scaler-badge { font-size: 10px; font-weight: 500; background: rgba(255,69,0,0.1); color: var(--jiff); padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
  .scaled-highlight { color: var(--jiff); font-weight: 500; transition: color 0.2s; }

  /* Recipe */
  .expand-btn { margin: 0 20px 16px; background: var(--warm); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--ink); font-weight: 500; width: calc(100% - 40px); text-align: left; display: flex; justify-content: space-between; align-items: center; transition: all 0.18s; }
  .expand-btn:hover { background: var(--jiff); color: white; border-color: var(--jiff); }
  .recipe { padding: 0 20px 20px; border-top: 1px solid var(--border); }
  .recipe-sec { font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--jiff); font-weight: 600; margin: 16px 0 9px; }
  .ing-list { list-style: none; }
  .ing-list li { font-size: 13px; color: var(--ink); padding: 5px 0; border-bottom: 1px solid rgba(0,0,0,0.04); display: flex; align-items: center; gap: 8px; font-weight: 300; }
  .ing-list li::before { content: '·'; color: var(--jiff); font-size: 20px; line-height: 0; flex-shrink: 0; }

  /* ── Steps with timers ── */
  .steps-list { counter-reset: step; list-style: none; }
  .steps-list li {
    font-size: 13px; color: var(--ink);
    padding: 10px 0 10px 28px;
    border-bottom: 1px solid rgba(0,0,0,0.04);
    position: relative; line-height: 1.6; font-weight: 300;
    counter-increment: step;
    display: flex; flex-direction: column; gap: 8px;
  }
  .steps-list li::before {
    content: counter(step);
    position: absolute; left: 0; top: 12px;
    width: 18px; height: 18px;
    background: var(--jiff); color: white;
    font-size: 10px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 600; flex-shrink: 0;
  }
  .step-text { flex: 1; }

  /* Timer — idle (pill button) */
  .step-timer.idle {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,69,0,0.08);
    border: 1.5px solid rgba(255,69,0,0.2);
    border-radius: 20px;
    padding: 5px 12px 5px 10px;
    font-size: 12px; font-weight: 500; color: var(--timer-idle);
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: all 0.18s;
  }
  .step-timer.idle:hover { background: rgba(255,69,0,0.14); border-color: var(--jiff); }
  .timer-icon { font-size: 13px; line-height: 1; }
  .timer-idle-label { letter-spacing: 0.3px; }

  /* Timer — active / paused */
  .step-timer.active {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 10px;
    background: rgba(45,106,79,0.07);
    border: 1.5px solid rgba(45,106,79,0.2);
    border-radius: 12px;
    padding: 8px 12px;
    animation: timerPulse 2s ease-in-out infinite;
  }
  .step-timer.paused {
    background: var(--warm);
    border-color: rgba(28,10,0,0.12);
    animation: none;
  }
  @keyframes timerPulse {
    0%, 100% { border-color: rgba(45,106,79,0.2); }
    50%       { border-color: rgba(45,106,79,0.5); }
  }

  /* SVG ring progress */
  .timer-ring-wrap { position: relative; width: 44px; height: 44px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .timer-ring { width: 44px; height: 44px; transform: rotate(-90deg); position: absolute; }
  .timer-ring-track { stroke: rgba(45,106,79,0.12); }
  .timer-ring-fill {
    stroke: var(--timer-active);
    stroke-linecap: round;
    transition: stroke-dasharray 1s linear;
  }
  .step-timer.paused .timer-ring-fill { stroke: var(--muted); }
  .timer-display {
    font-size: 11px; font-weight: 600; color: var(--timer-active);
    font-family: var(--font-mono, monospace);
    position: relative; z-index: 1; letter-spacing: -0.5px;
  }
  .step-timer.paused .timer-display { color: var(--muted); }

  /* Timer controls */
  .timer-controls { display: flex; gap: 4px; }
  .timer-ctrl-btn {
    width: 28px; height: 28px; border-radius: 7px;
    border: none; cursor: pointer;
    font-size: 13px; display: flex; align-items: center; justify-content: center;
    transition: all 0.15s;
  }
  .timer-ctrl-btn.play  { background: rgba(45,106,79,0.1); color: var(--timer-active); }
  .timer-ctrl-btn.play:hover  { background: rgba(45,106,79,0.2); }
  .timer-ctrl-btn.pause { background: rgba(45,106,79,0.1); color: var(--timer-active); }
  .timer-ctrl-btn.pause:hover { background: rgba(45,106,79,0.2); }
  .timer-ctrl-btn.reset { background: rgba(28,10,0,0.06); color: var(--muted); font-size: 14px; }
  .timer-ctrl-btn.reset:hover { background: rgba(28,10,0,0.1); color: var(--ink); }

  /* Timer — done */
  .step-timer.done {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(29,158,117,0.1);
    border: 1.5px solid rgba(29,158,117,0.3);
    border-radius: 20px; padding: 6px 14px 6px 10px;
    animation: doneFlash 0.4s ease;
  }
  @keyframes doneFlash {
    0%   { transform: scale(0.9); opacity: 0; }
    60%  { transform: scale(1.05); }
    100% { transform: scale(1); opacity: 1; }
  }
  .timer-done-icon { font-size: 16px; animation: bellShake 0.6s ease 0.1s; }
  @keyframes bellShake {
    0%,100%{transform:rotate(0)} 20%{transform:rotate(-15deg)} 40%{transform:rotate(15deg)} 60%{transform:rotate(-10deg)} 80%{transform:rotate(10deg)}
  }
  .timer-done-text { font-size: 13px; font-weight: 600; color: var(--timer-done); }
  .timer-reset-btn { background: none; border: none; color: rgba(29,158,117,0.6); font-size: 15px; cursor: pointer; padding: 0; line-height: 1; transition: color 0.15s; }
  .timer-reset-btn:hover { color: var(--timer-done); }

  .nutr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 7px; }
  .nutr-item { background: var(--warm); border-radius: 9px; padding: 9px; text-align: center; }
  .nutr-val { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 700; color: var(--ink); }
  .nutr-lbl { font-size: 10px; color: var(--muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
  .collapse-btn { margin-top: 12px; width: 100%; background: var(--warm); border: 1px solid var(--border); border-radius: 9px; padding: 8px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); display: flex; justify-content: space-between; transition: all 0.18s; }
  .collapse-btn:hover { color: var(--jiff); border-color: rgba(255,69,0,0.3); }

  /* Favourites */
  .favs-panel { max-width: 780px; margin: 0 auto; padding: 0 24px; animation: fadeIn 0.25s ease; }
  .favs-panel-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 0 14px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
  .favs-panel-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 900; color: var(--ink); letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; }
  .favs-panel-sub { font-size: 13px; color: var(--muted); font-weight: 300; margin-top: 2px; }
  .favs-close-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 8px; padding: 7px 14px; font-size: 12px; font-family: 'DM Sans', sans-serif; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.18s; }
  .favs-close-btn:hover { border-color: var(--jiff); color: var(--jiff); }
  .favs-empty { text-align: center; padding: 48px 24px; border: 2px dashed var(--border-mid); border-radius: 18px; margin-bottom: 32px; }
  .favs-empty-icon { font-size: 36px; margin-bottom: 12px; }
  .favs-empty-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
  .favs-empty-sub { font-size: 14px; color: var(--muted); font-weight: 300; }
  .favs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px; padding-bottom: 40px; }

  .reset-wrap { text-align: center; padding: 0 24px 60px; }
  .reset-btn { background: none; border: 1.5px solid var(--border-mid); border-radius: 10px; padding: 11px 28px; font-size: 14px; font-family: 'DM Sans', sans-serif; cursor: pointer; color: var(--muted); transition: all 0.18s; }
  .reset-btn:hover { border-color: var(--jiff); color: var(--jiff); }
  .error-wrap { text-align: center; padding: 64px 24px; max-width: 460px; margin: 0 auto; }
  .error-icon { font-size: 40px; margin-bottom: 14px; }
  .error-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
  .error-msg { font-size: 14px; color: var(--muted); margin-bottom: 24px; font-weight: 300; }

  @media (max-width: 600px) {
    .header { padding: 16px 18px; }
    .hero { padding: 36px 18px 0; }
    .card { padding: 22px 16px; }
    .meals-grid, .favs-grid { grid-template-columns: 1fr; padding-left: 18px; padding-right: 18px; }
    .nutr-grid { grid-template-columns: repeat(2, 1fr); }
    .share-actions { flex-direction: column; }
    .favs-panel { padding: 0 18px; }
    .scaler-orig { display: none; }
    .gate-plans { grid-template-columns: 1fr; }
    .gate-card { padding: 28px 20px; }
  }

  /* ── Premium styles ── */
  .usage-bar {
    max-width: 780px; margin: 12px auto 0; padding: 0 24px;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  }
  .usage-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: white; border: 1px solid var(--border-mid);
    border-radius: 20px; padding: 5px 12px; font-size: 12px; color: var(--muted);
  }
  .usage-pill.low { border-color: rgba(255,69,0,0.3); color: var(--jiff); background: rgba(255,69,0,0.05); }
  .usage-pip { width: 7px; height: 7px; border-radius: 50%; background: var(--jiff); }
  .usage-pip.empty { background: var(--border-mid); }
  .premium-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(255,184,0,0.1); border: 1px solid rgba(255,184,0,0.25);
    border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; color: #854F0B;
  }
  /* Upgrade gate modal */
  .gate-overlay {
    position: fixed; inset: 0; background: rgba(28,10,0,0.5);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 20px; animation: fadeIn 0.2s ease;
  }
  .gate-card {
    background: white; border-radius: 24px; padding: 36px 32px;
    max-width: 440px; width: 100%; text-align: center;
    box-shadow: 0 24px 64px rgba(28,10,0,0.2);
    animation: slideUp 0.25s ease;
  }
  .gate-icon { font-size: 44px; margin-bottom: 14px; }
  .gate-title { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 900; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.5px; }
  .gate-sub { font-size: 15px; color: var(--muted); font-weight: 300; line-height: 1.65; margin-bottom: 28px; }
  .gate-plans { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-bottom: 20px; }
  .gate-plan { border: 1.5px solid var(--border-mid); border-radius: 12px; padding: 14px 10px; cursor: pointer; transition: all 0.15s; text-align: center; }
  .gate-plan:hover { border-color: var(--jiff); }
  .gate-plan.selected { border-color: var(--jiff); background: rgba(255,69,0,0.05); }
  .gate-plan-price { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 900; color: var(--ink); }
  .gate-plan-label { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .gate-plan-saving { font-size: 10px; font-weight: 600; color: var(--jiff); margin-top: 3px; }
  .gate-cta { background: var(--jiff); color: white; border: none; border-radius: 12px; padding: 15px 32px; font-size: 15px; font-weight: 500; cursor: pointer; width: 100%; font-family: 'DM Sans', sans-serif; margin-bottom: 10px; transition: all 0.18s; }
  .gate-cta:hover { background: var(--jiff-dark); }
  .gate-skip { background: none; border: none; color: var(--muted); font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; padding: 4px; }
  .gate-skip:hover { color: var(--ink); }
`;

const TIME_OPTIONS = [
  { id: '15 min', label: '⚡ 15 min' },
  { id: '30 min', label: '🍳 30 min' },
  { id: '1 hour', label: '🥘 1 hour' },
  { id: 'no time limit', label: '🌿 No limit' },
];
const DIET_OPTIONS = [
  { id: 'none', label: 'No restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'dairy-free', label: 'Dairy-free' },
  { id: 'low-carb', label: 'Low-carb' },
];
const CUISINE_OPTIONS = [
  { id: 'any', label: 'Any cuisine', flag: '🌍' },
  { id: 'Indian', label: 'Indian', flag: '🇮🇳' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
  { id: 'Mexican', label: 'Mexican', flag: '🇲🇽' },
  { id: 'Mediterranean', label: 'Mediterranean', flag: '🫒' },
  { id: 'Thai', label: 'Thai', flag: '🇹🇭' },
];
const FACTS = [
  'Raiding your fridge…',
  'Cross-referencing 10,000+ recipes…',
  'Matching cuisine and flavour profile…',
  'Crunching nutrition numbers…',
  'Almost ready to Jiff…',
];

function mealKey(meal) { return `${meal.name}-${meal.emoji}`.toLowerCase().replace(/\s+/g,'-'); }
function extractCoreName(str) {
  return str.toLowerCase().replace(/^\*?\s*/,'').replace(/[\d¼½¾⅓⅔⅛]+[\s-]*/g,'')
    .replace(/\b(g|kg|ml|l|oz|lb|tbsp|tsp|cup|cups|cloves?|piece|pieces|slice|slices|medium|large|small|fresh|dried|minced|chopped|diced|sliced|grated|handful|pinch|bunch|can|cans|tin|tins|pack|packet|to taste|of)\b/gi,'')
    .replace(/[,()]/g,'').trim().split(/\s+/).filter(Boolean).join(' ');
}
function isAvailable(core, fridge) {
  const r = core.toLowerCase();
  return fridge.some(f=>{const fr=f.toLowerCase().trim();return r.includes(fr)||fr.includes(r)||fr.split(' ').some(w=>w.length>2&&r.includes(w));});
}
function buildGroceryList(recipeIngs, fridgeIngs) {
  const need=[], have=[];
  recipeIngs.forEach(ing=>{const core=extractCoreName(ing);if(!core)return;(isAvailable(core,fridgeIngs)?have:need).push(ing.replace(/^\*\s*/,''));});
  return {need,have};
}
function buildShareText(meal) {
  return [`⚡ *Jiff Recipe*`,``,`${meal.emoji} *${meal.name}*`,`⏱ ${meal.time}  |  👥 ${meal.servings} servings  |  📊 ${meal.difficulty}`,``,meal.description,``,`*Ingredients:*`,meal.ingredients?.slice(0,6).join(', ')||'',``,`*Method:*`,meal.steps?.slice(0,3).map((s,i)=>`${i+1}. ${s}`).join('\n')||'',``,`🔥 ${meal.calories} cal  |  💪 ${meal.protein} protein`,``,`_Jiffed by Jiff — jiff.app_`].join('\n');
}
function buildGroceryText(name, need) {
  return [`🛒 *Shopping list for ${name}*`,``,need.map(i=>`• ${i}`).join('\n'),``,`_From Jiff — jiff.app_`].join('\n');
}

// ── Icons ─────────────────────────────────────────────
const IconHeart = ({filled}) => <svg viewBox="0 0 24 24" fill={filled?'#E53E3E':'none'} stroke={filled?'#E53E3E':'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const IconShare = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const IconCopy = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IconCart = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61H19a2 2 0 001.98-1.71L23 6H6"/></svg>;
const IconWA = () => <svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 0C7.164 0 0 7.163 0 16c0 2.82.736 5.469 2.027 7.77L0 32l8.469-2.004A15.938 15.938 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0zm0 29.333a13.27 13.27 0 01-6.771-1.852l-.485-.288-5.027 1.189 1.213-4.899-.315-.503A13.257 13.257 0 012.667 16C2.667 8.636 8.636 2.667 16 2.667S29.333 8.636 29.333 16 23.364 29.333 16 29.333zm7.27-9.878c-.397-.198-2.35-1.16-2.714-1.291-.363-.132-.627-.198-.89.198-.264.397-1.023 1.291-1.253 1.556-.231.264-.462.297-.858.099-.397-.198-1.675-.617-3.19-1.97-1.18-1.052-1.977-2.35-2.208-2.747-.231-.397-.025-.611.173-.809.178-.178.397-.462.595-.693.198-.231.264-.397.397-.661.132-.265.066-.496-.033-.694-.099-.198-.89-2.148-1.22-2.942-.32-.772-.647-.667-.89-.68-.23-.012-.496-.015-.76-.015-.264 0-.694.099-1.057.496-.363.397-1.386 1.354-1.386 3.303 0 1.95 1.419 3.834 1.617 4.099.198.264 2.793 4.266 6.766 5.982.946.408 1.684.652 2.26.834.95.302 1.814.26 2.497.158.761-.114 2.35-.961 2.68-1.889.332-.927.332-1.722.232-1.889-.099-.165-.363-.264-.76-.462z"/></svg>;
const IconScaler = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ── Sub-components ────────────────────────────────────

function GroceryPanel({ meal, fridgeIngredients, onClose }) {
  const {need,have} = buildGroceryList(meal.ingredients||[], fridgeIngredients);
  const [checked, setChecked] = useState({});
  const [copied, setCopied] = useState(false);
  const toggle = k => setChecked(p=>({...p,[k]:!p[k]}));
  const handleCopy = async e => {
    e.stopPropagation();
    const text = need.length>0?buildGroceryText(meal.name,need):`Nothing to buy for ${meal.name}!`;
    try{await navigator.clipboard.writeText(text);}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}
    setCopied(true);setTimeout(()=>setCopied(false),2500);
  };
  const waUrl=`https://wa.me/?text=${encodeURIComponent(need.length>0?buildGroceryText(meal.name,need):`I have everything for ${meal.name}! 🎉`)}`;
  return (
    <div className="grocery-panel" onClick={e=>e.stopPropagation()}>
      <div className="grocery-header">
        <div className="grocery-header-left"><span style={{fontSize:15}}>🛒</span><div><div className="grocery-header-title">Grocery list</div><div className="grocery-header-sub">{need.length===0?'You have everything!':`${need.length} to buy · ${have.length} in fridge`}</div></div></div>
        <button className="grocery-close" onClick={e=>{e.stopPropagation();onClose();}}>×</button>
      </div>
      <div className="grocery-section">
        <div className="grocery-section-title need"><span>Need to buy</span><span className="grocery-count need">{need.length}</span></div>
        {need.length===0?<div className="grocery-empty">🎉 Nothing — you have it all!</div>:(
          <div className="grocery-items">
            {need.map((ing,i)=>(
              <div key={i} className="grocery-item need" onClick={()=>toggle(`n-${i}`)}>
                <div className={`grocery-checkbox ${checked[`n-${i}`]?'checked':''}`}><svg viewBox="0 0 12 12"><polyline points="10 2 5 9 2 6" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                <div className={`grocery-item-text ${checked[`n-${i}`]?'checked-text':''}`}>{ing}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      {have.length>0&&<div className="grocery-section"><div className="grocery-section-title have"><span>Already in fridge</span><span className="grocery-count have">{have.length}</span></div><div className="grocery-items">{have.map((ing,i)=><div key={i} className="grocery-item have"><div className="grocery-dot"/><div className="grocery-item-text">{ing}</div></div>)}</div></div>}
      <div className="grocery-actions">
        <button className={`grocery-action-btn copy ${copied?'copied':''}`} onClick={handleCopy}>{copied?<IconCheck/>:<IconCopy/>}{copied?'Copied!':'Copy list'}</button>
        <a className="grocery-action-btn wa" href={waUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}><IconWA/>WhatsApp</a>
      </div>
    </div>
  );
}

function ShareDrawer({ meal }) {
  const [copied,setCopied]=useState(false);
  const text=buildShareText(meal), waUrl=`https://wa.me/?text=${encodeURIComponent(text)}`;
  const hasNative=typeof navigator!=='undefined'&&!!navigator.share;
  const handleCopy=async e=>{e.stopPropagation();try{await navigator.clipboard.writeText(text);}catch{const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta);}setCopied(true);setTimeout(()=>setCopied(false),2500);};
  return(
    <div className="share-drawer" onClick={e=>e.stopPropagation()}>
      <div className="share-drawer-label">Share this recipe</div>
      <div className="share-actions">
        <a className="share-wa" href={waUrl} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}><IconWA/>WhatsApp</a>
        <button className={`share-copy ${copied?'copied':''}`} onClick={handleCopy}>{copied?<IconCheck/>:<IconCopy/>}{copied?'Copied!':'Copy text'}</button>
        {hasNative&&<button className="share-native" onClick={async e=>{e.stopPropagation();try{await navigator.share({title:`${meal.emoji} ${meal.name}`,text});}catch{}}}><IconShare/>More</button>}
      </div>
    </div>
  );
}

function MealCard({ meal, index, isFavourite, onToggleFav, fridgeIngredients=[], showFavTag=false, animDelay=0 }) {
  const baseServings = parseInt(meal.servings)||2;
  const [expanded,    setExpanded]    = useState(false);
  const [shareOpen,   setShareOpen]   = useState(false);
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [servings,    setServings]    = useState(baseServings);
  const ratio = servings / baseServings;
  const isScaled = ratio !== 1;

  const scaledIngs  = (meal.ingredients||[]).map(ing=>scaleIngredient(ing,ratio));
  const scaledCal   = scaleNutrition(meal.calories||'',ratio);
  const scaledPro   = scaleNutrition(meal.protein||'',ratio);
  const scaledCarbs = scaleNutrition(meal.carbs||'',ratio);
  const scaledFat   = scaleNutrition(meal.fat||'',ratio);

  return (
    <div className={`meal-card ${expanded?'expanded':''} ${isFavourite?'is-fav':''}`} style={{animationDelay:`${animDelay}s`}}
      onClick={()=>{ if(!expanded&&!shareOpen&&!groceryOpen) setExpanded(true); }}>
      <div className="meal-hdr">
        <div className="meal-hdr-top">
          <div className="meal-num">{showFavTag?'❤️ Saved':`Option ${index+1}`}</div>
          <div className="meal-hdr-actions">
            <button className={`heart-btn ${isFavourite?'saved':''}`} onClick={e=>{e.stopPropagation();onToggleFav(meal);}}><IconHeart filled={isFavourite}/></button>
            <button className="share-btn" onClick={e=>{e.stopPropagation();setShareOpen(p=>!p);}}><IconShare/>{shareOpen?'Close':'Share'}</button>
          </div>
        </div>
        <div className="meal-name">{meal.emoji} {meal.name}</div>
        <div className="meal-meta">
          <span className="meal-meta-item">⏱ {meal.time}</span>
          <span className="meal-meta-item">👥 {servings} serving{servings!==1?'s':''}{isScaled?` (was ${baseServings})`:''}</span>
          <span className="meal-meta-item">📊 {meal.difficulty}</span>
        </div>
      </div>
      <div className="meal-desc">{meal.description}</div>
      {shareOpen&&<ShareDrawer meal={meal}/>}
      {fridgeIngredients.length>0&&(!groceryOpen?(
        <button className="grocery-trigger" onClick={e=>{e.stopPropagation();setGroceryOpen(true);}}>
          <span style={{display:'flex',alignItems:'center',gap:6}}><IconCart/>What do I need to buy?</span>
          <span style={{fontSize:11,color:'var(--muted)',fontWeight:400}}>See list →</span>
        </button>
      ):<GroceryPanel meal={meal} fridgeIngredients={fridgeIngredients} onClose={()=>setGroceryOpen(false)}/>)}
      {!expanded?(
        <button className="expand-btn" onClick={e=>{e.stopPropagation();setExpanded(true);}}><span>See full recipe</span><span>→</span></button>
      ):(
        <div className="recipe" onClick={e=>e.stopPropagation()}>
          {/* Scaler */}
          <div className="scaler-bar">
            <div className="scaler-label"><IconScaler/>Servings</div>
            <div className="scaler-controls">
              <button className="scaler-btn" disabled={servings<=1} onClick={e=>{e.stopPropagation();setServings(s=>Math.max(1,s-1));}}>−</button>
              <div className="scaler-count">{servings}</div>
              <button className="scaler-btn" disabled={servings>=20} onClick={e=>{e.stopPropagation();setServings(s=>Math.min(20,s+1));}}>+</button>
            </div>
            {isScaled?<span className="scaler-badge">×{ratio%1===0?ratio:ratio.toFixed(2).replace(/\.?0+$/, '')}</span>:<span className="scaler-orig">Base: {baseServings} servings</span>}
          </div>

          {/* Ingredients */}
          <div className="recipe-sec" style={{marginTop:0,paddingTop:14,borderTop:'1px solid rgba(255,69,0,0.12)'}}>Ingredients</div>
          <ul className="ing-list">
            {scaledIngs.map((ing,j)=>(
              <li key={j}><span className={ing!==(meal.ingredients?.[j]||'')&&isScaled?'scaled-highlight':''}>{ing}</span></li>
            ))}
          </ul>

          {/* Steps — with timers */}
          <div className="recipe-sec">Method</div>
          <ol className="steps-list">
            {meal.steps?.map((s,j)=><StepWithTimer key={j} text={s}/>)}
          </ol>

          {/* Nutrition */}
          <div className="recipe-sec">
            Nutrition per serving
            {isScaled&&<span style={{marginLeft:8,fontSize:10,color:'var(--muted)',fontWeight:400,textTransform:'none',letterSpacing:0}}>scaled for {servings}</span>}
          </div>
          <div className="nutr-grid">
            {[['Calories',scaledCal],['Protein',scaledPro],['Carbs',scaledCarbs],['Fat',scaledFat]].map(([lbl,val])=>(
              <div key={lbl} className="nutr-item"><div className={`nutr-val ${isScaled?'scaled-highlight':''}`}>{val}</div><div className="nutr-lbl">{lbl}</div></div>
            ))}
          </div>
          <button className="collapse-btn" onClick={()=>setExpanded(false)}><span>Collapse</span><span>↑</span></button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────
export default function Jiff() {
  const navigate = useNavigate();
  const { user, profile, pantry, favourites, toggleFavourite, isFav, signInWithGoogle, signInWithEmail, isAuthDismissed, dismissAuth, supabaseEnabled } = useAuth();
  const { isPremium, plans, suggestionsLeft, freeDailyLimit, canSuggest, recordSuggestion, showGate, setShowGate, gateReason, openCheckout, activateTestPremium, razorpayEnabled } = usePremium();
  const [gatePlan, setGatePlan] = useState('annual');
  const [gateLoading, setGateLoading] = useState(false);
  const [ingredients,setIngredients]=useState([]);
  const [inputVal,setInputVal]=useState('');
  const [time,setTime]=useState('30 min');
  const [diet,setDiet]=useState('none');
  const [cuisine,setCuisine]=useState('any');
  const [view,setView]=useState('input');
  const [meals,setMeals]=useState([]);
  const [factIdx,setFactIdx]=useState(0);
  const [errorMsg,setErrorMsg]=useState('');
  const [showFavs,setShowFavs]=useState(false);
  const [showAuthPrompt,setShowAuthPrompt]=useState(false);
  const [emailInput,setEmailInput]=useState('');
  const [emailSent,setEmailSent]=useState(false);
  const [pantryLoaded,setPantryLoaded]=useState(false);
  const inputRef=useRef(null);
  const timerRef=useRef(null);

  // Pre-fill pantry ingredients on first load
  useEffect(()=>{
    if(!pantryLoaded && pantry?.length) {
      setIngredients(pantry);
      setPantryLoaded(true);
    }
  },[pantry, pantryLoaded]);

  useEffect(()=>{
    if(view==='loading') timerRef.current=setInterval(()=>setFactIdx(f=>(f+1)%FACTS.length),1400);
    return ()=>clearInterval(timerRef.current);
  },[view]);

  const addIng=val=>{const v=val.trim().replace(/,$/,'');if(v&&!ingredients.includes(v))setIngredients(p=>[...p,v]);setInputVal('');};
  const onKey=e=>{if(e.key==='Enter'||e.key===','){e.preventDefault();addIng(inputVal);}else if(e.key==='Backspace'&&!inputVal&&ingredients.length)setIngredients(p=>p.slice(0,-1));};

  const handleSubmit=async()=>{
    if(!ingredients.length)return;
    // Check free tier limit
    if(!recordSuggestion()) return; // recordSuggestion shows gate if over limit
    setView('loading');setFactIdx(0);setShowFavs(false);
    try{
      const res=await fetch('/api/suggest',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          ingredients, time, diet, cuisine,
          tasteProfile: profile ? {
            spice_level: profile.spice_level,
            allergies: profile.allergies,
            preferred_cuisines: profile.preferred_cuisines,
            skill_level: profile.skill_level,
          } : null,
        }),
      });
      const data=await res.json();
      if(data.meals?.length>0){
        setMeals(data.meals);
        setView('results');
        // Show auth prompt after first generation for guests
        if(!user && !isAuthDismissed() && supabaseEnabled) {
          setTimeout(()=>setShowAuthPrompt(true), 1500);
        }
      }
      else{setErrorMsg(data.error||'Could not generate suggestions.');setView('error');}
    }catch{setErrorMsg('Connection error. Please try again.');setView('error');}
  };

  const handleEmailSignIn = async () => {
    const {error} = await signInWithEmail(emailInput);
    if (!error) setEmailSent(true);
  };

  const reset=()=>{setView('input');setMeals([]);setIngredients(pantry||[]);setInputVal('');setShowFavs(false);setShowAuthPrompt(false);setPantryLoaded(true);};
  const activeCuisine=CUISINE_OPTIONS.find(c=>c.id===cuisine);

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* ── Upgrade gate modal ── */}
        {showGate && (
          <div className="gate-overlay" onClick={()=>setShowGate(false)}>
            <div className="gate-card" onClick={e=>e.stopPropagation()}>
              <div className="gate-icon">⚡</div>
              <div className="gate-title">
                {gateReason==='suggestions' ? "You've used today's free meals" : "Weekly planner limit reached"}
              </div>
              <div className="gate-sub">
                {gateReason==='suggestions'
                  ? `Free users get ${freeDailyLimit} meal suggestions per day. Upgrade for unlimited — any meal, any time.`
                  : 'Free users get 1 weekly plan per month. Upgrade for unlimited planning.'}
              </div>
              <div className="gate-plans">
                {Object.values(plans).map(plan=>(
                  <div key={plan.id} className={`gate-plan ${gatePlan===plan.id?'selected':''}`} onClick={()=>setGatePlan(plan.id)}>
                    <div className="gate-plan-price">{plan.price}</div>
                    <div className="gate-plan-label">{plan.label}<br/>{plan.period}</div>
                    {plan.saving&&<div className="gate-plan-saving">{plan.saving}</div>}
                  </div>
                ))}
              </div>
              <button className="gate-cta" disabled={gateLoading} onClick={async()=>{
                if(!razorpayEnabled){activateTestPremium();return;}
                setGateLoading(true);
                try{await openCheckout(gatePlan);setShowGate(false);}
                catch(e){if(e.message!=='dismissed')alert('Payment failed — please try again.');}
                finally{setGateLoading(false);}
              }}>
                {gateLoading?'⏳ Processing…':'⚡ Upgrade to Premium'}
              </button>
              <button className="gate-skip" onClick={()=>setShowGate(false)}>Maybe later</button>
              {!razorpayEnabled&&<div style={{fontSize:11,color:'var(--muted)',marginTop:8}}>Test mode — click to activate free premium</div>}
            </div>
          </div>
        )}

        <header className="header">
          <div className="logo" onClick={()=>navigate('/')}><span style={{fontSize:22}}>⚡</span><span className="logo-name"><span>J</span>iff</span></div>
          <div className="header-right">
            <button className={`fav-header-btn ${favourites.length>0?'has-favs':''}`} onClick={()=>setShowFavs(p=>!p)}>
              <IconHeart filled={favourites.length>0}/>Favourites{favourites.length>0&&<span className="fav-badge">{favourites.length}</span>}
            </button>
            <button onClick={()=>navigate('/planner')} style={{fontSize:12,fontWeight:500,color:'var(--muted)',background:'none',border:'1.5px solid var(--border-mid)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>📅 Week plan</button>
            {!isPremium && (
              <button onClick={()=>navigate('/pricing')} style={{fontSize:12,fontWeight:600,color:'#854F0B',background:'rgba(255,184,0,0.1)',border:'1px solid rgba(255,184,0,0.25)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",whiteSpace:'nowrap'}}>
                ⚡ Go Premium
              </button>
            )}
            {user ? (
              <button onClick={()=>navigate('/profile')} style={{fontSize:12,fontWeight:500,color:'var(--jiff)',background:'rgba(255,69,0,0.08)',border:'1.5px solid rgba(255,69,0,0.2)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif",display:'flex',alignItems:'center',gap:5}}>
                👤 {profile?.name?.split(' ')[0] || 'Profile'}
              </button>
            ) : supabaseEnabled ? (
              <button onClick={signInWithGoogle} style={{fontSize:12,fontWeight:500,color:'var(--ink)',background:'white',border:'1.5px solid var(--border-mid)',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>
                Sign in
              </button>
            ) : null}
            <div className="header-tag">AI-Powered</div>
          </div>
        </header>

        {showFavs&&(
          <div className="favs-panel">
            <div className="favs-panel-header">
              <div><div className="favs-panel-title"><IconHeart filled/>Your favourites</div><div className="favs-panel-sub">{favourites.length===0?'No saved recipes yet':`${favourites.length} saved recipe${favourites.length>1?'s':''}`}</div></div>
              <button className="favs-close-btn" onClick={()=>setShowFavs(false)}>Close ×</button>
            </div>
            {favourites.length===0?(
              <div className="favs-empty"><div className="favs-empty-icon">🤍</div><div className="favs-empty-title">Nothing saved yet</div><div className="favs-empty-sub">Tap the ♥ on any meal card to save it here.</div></div>
            ):(
              <div className="favs-grid">{favourites.map((meal,i)=><MealCard key={mealKey(meal)} meal={meal} index={i} isFavourite={isFav(meal)} onToggleFav={toggleFavourite} fridgeIngredients={[]} showFavTag animDelay={i*0.06}/>)}</div>
            )}
          </div>
        )}

        {/* ── Auth prompt banner ── */}
        {showAuthPrompt && !user && supabaseEnabled && (
          <div style={{background:'white',borderBottom:'1px solid var(--border)',padding:'14px 24px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',position:'sticky',top:70,zIndex:15,boxShadow:'0 4px 20px rgba(28,10,0,0.08)'}}>
            <span style={{fontSize:16}}>☁️</span>
            <div style={{flex:1,minWidth:200}}>
              <div style={{fontSize:13,fontWeight:500,color:'var(--ink)'}}>Save your favourites across all devices</div>
              <div style={{fontSize:12,color:'var(--muted)',fontWeight:300}}>Sign in to sync recipes, pantry & preferences</div>
            </div>
            {emailSent ? (
              <div style={{fontSize:13,color:'var(--timer-done)',fontWeight:500}}>✓ Check your email for the magic link!</div>
            ) : (
              <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                <button onClick={signInWithGoogle} style={{background:'var(--jiff)',color:'white',border:'none',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",whiteSpace:'nowrap'}}>
                  Sign in with Google
                </button>
                <div style={{display:'flex',gap:0,border:'1.5px solid var(--border-mid)',borderRadius:8,overflow:'hidden'}}>
                  <input value={emailInput} onChange={e=>setEmailInput(e.target.value)} placeholder="or email" style={{border:'none',outline:'none',padding:'6px 10px',fontSize:12,fontFamily:"'DM Sans', sans-serif",width:140,color:'var(--ink)',background:'white'}}/>
                  <button onClick={handleEmailSignIn} style={{background:'var(--warm)',border:'none',padding:'6px 10px',fontSize:12,fontWeight:500,cursor:'pointer',color:'var(--ink)',fontFamily:"'DM Sans', sans-serif",borderLeft:'1px solid var(--border-mid)'}}>Go</button>
                </div>
              </div>
            )}
            <button onClick={()=>{setShowAuthPrompt(false);dismissAuth();}} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:18,padding:'0 4px',lineHeight:1}}>×</button>
          </div>
        )}

        {/* ── Pantry pre-fill notice ── */}
        {view==='input' && pantry?.length>0 && !user && (
          <div style={{maxWidth:720,margin:'16px auto 0',padding:'0 24px'}}>
            <div style={{background:'rgba(255,69,0,0.06)',border:'1px solid rgba(255,69,0,0.15)',borderRadius:10,padding:'10px 14px',fontSize:12,color:'var(--jiff)',display:'flex',alignItems:'center',gap:8}}>
              🧂 Pantry ingredients pre-filled — <button onClick={()=>navigate('/profile')} style={{background:'none',border:'none',color:'var(--jiff)',cursor:'pointer',fontWeight:500,fontSize:12,padding:0,textDecoration:'underline'}}>manage your pantry</button>
            </div>
          </div>
        )}

        {view==='input'&&(
          <>
            <div className="hero">
              <div className="hero-eyebrow">Breakfast, lunch or dinner — sorted</div>
              <h1 className="hero-title">What can I make <em>right now?</em></h1>
              <p className="hero-sub">Type what's in your fridge. Pick a cuisine. Get 3 real meals with full recipes — in a jiff.</p>
            </div>
            <div className="card" style={{marginTop:28}}>
              <div className="section">
                <div className="section-label">What's in your fridge?</div>
                <div className="ingredient-box" onClick={()=>inputRef.current?.focus()}>
                  {ingredients.map(ing=>(
                    <span key={ing} className="tag">{ing}<button className="tag-remove" onClick={e=>{e.stopPropagation();setIngredients(p=>p.filter(i=>i!==ing));}}>×</button></span>
                  ))}
                  <input ref={inputRef} className="tag-input" value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={onKey} onBlur={()=>{if(inputVal.trim())addIng(inputVal);}} placeholder={ingredients.length===0?'eggs, onions, rice, tomatoes… press Enter after each':'add more…'}/>
                </div>
                <p className="tag-hint">Enter or comma to add · Backspace to remove last</p>
              </div>
              <div className="section">
                <div className="section-label">Cuisine</div>
                <div className="cuisine-chips">{CUISINE_OPTIONS.map(o=><button key={o.id} className={`cuisine-chip ${cuisine===o.id?(o.id==='any'?'active-any':'active'):''}`} onClick={()=>setCuisine(o.id)}><span className="cuisine-flag">{o.flag}</span><span>{o.label}</span></button>)}</div>
              </div>
              <div className="section">
                <div className="section-label">Time available</div>
                <div className="chips">{TIME_OPTIONS.map(o=><button key={o.id} className={`chip ${time===o.id?'active':''}`} onClick={()=>setTime(o.id)}>{o.label}</button>)}</div>
              </div>
              <div className="section">
                <div className="section-label">Dietary preference</div>
                <div className="chips">{DIET_OPTIONS.map(o=><button key={o.id} className={`chip diet ${diet===o.id?'active':''}`} onClick={()=>setDiet(o.id)}>{o.label}</button>)}</div>
              </div>
              <div className="cta-wrap">
                <button className="cta-btn" onClick={handleSubmit} disabled={!ingredients.length}>
                  <span>⚡</span><span>{cuisine==='any'?'Jiff a meal!':`Jiff me ${cuisine} meals`}</span>
                </button>
                {!ingredients.length&&<p className="cta-note">Add at least one ingredient to get started</p>}
              </div>
            </div>
          </>
        )}

        {view==='loading'&&(
          <div className="loading-wrap">
            <div className="spinner"/>
            <div className="loading-title">{cuisine!=='any'?`Finding ${cuisine} recipes…`:'Jiffing your meal…'}</div>
            <div className="loading-sub">Matching {ingredients.length} ingredient{ingredients.length>1?'s':''}{cuisine!=='any'?` to ${cuisine} cuisine`:' to the best meals'}</div>
            <div className="loading-fact">{FACTS[factIdx]}</div>
          </div>
        )}

        {view==='results'&&(
          <>
            {/* Usage bar */}
            {!isPremium && (
              <div className="usage-bar">
                <div className={`usage-pill ${suggestionsLeft <= 1 ? 'low' : ''}`}>
                  {[...Array(freeDailyLimit)].map((_,i)=>(
                    <div key={i} className={`usage-pip ${i < suggestionsLeft ? '' : 'empty'}`}/>
                  ))}
                  <span>{suggestionsLeft} of {freeDailyLimit} free meals left today</span>
                </div>
                <button onClick={()=>navigate('/pricing')} style={{fontSize:11,fontWeight:500,color:'var(--jiff)',background:'rgba(255,69,0,0.07)',border:'1px solid rgba(255,69,0,0.2)',borderRadius:20,padding:'4px 12px',cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>
                  Upgrade for unlimited →
                </button>
              </div>
            )}
            {isPremium && (
              <div className="usage-bar">
                <div className="premium-badge">⚡ Premium — unlimited meals</div>
              </div>
            )}

            <div className="results-header">
              <div className="results-title">Jiffed. ⚡ Here's your menu.</div>
              <div className="results-sub">
                Tap ♥ to save · expand for recipe + timers · use scaler to adjust servings
                {profile && <span style={{marginLeft:8,fontSize:12,color:'var(--jiff)',fontWeight:500}}>· personalised for {profile.name?.split(' ')[0]}</span>}
              </div>
            </div>
            <div className="result-filters">
              {cuisine!=='any'&&<span className="filter-pill">{activeCuisine?.flag} {cuisine}</span>}
              <span className="filter-pill">⏱ {time}</span>
              {diet!=='none'&&<span className="filter-pill">🥗 {diet}</span>}
              <span className="filter-pill">🥦 {ingredients.length} ingredient{ingredients.length>1?'s':''}</span>
            </div>
            <div className="meals-grid">
              {meals.map((meal,i)=><MealCard key={mealKey(meal)+i} meal={meal} index={i} isFavourite={isFav(meal)} onToggleFav={toggleFavourite} fridgeIngredients={ingredients} animDelay={i*0.07}/>)}
            </div>
            <div className="reset-wrap"><button className="reset-btn" onClick={reset}>← Try different ingredients</button></div>
          </>
        )}

        {view==='error'&&(
          <div className="error-wrap">
            <div className="error-icon">😕</div>
            <div className="error-title">Something went wrong</div>
            <div className="error-msg">{errorMsg}</div>
            <button className="cta-btn" onClick={reset}>← Start over</button>
          </div>
        )}
      </div>
    </>
  );
}
