// src/components/meal/StepTimer.jsx
// Countdown timer for individual recipe steps.
// Reads parseStepTime from lib/timers.js — pure dep, no context needed.

import { useState, useEffect, useRef } from 'react';
import { parseStepTime, formatTime } from '../../lib/timers.js';

// ── StepTimer — the actual countdown widget ─────────────────────
export function StepTimer({ totalSeconds }) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running,   setRunning]   = useState(false);
  const [done,      setDone]      = useState(false);
  const intRef = useRef(null);

  useEffect(() => () => clearInterval(intRef.current), []);

  useEffect(() => {
    if (running) {
      intRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intRef.current);
            setRunning(false);
            setDone(true);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intRef.current);
    }
    return () => clearInterval(intRef.current);
  }, [running]);

  const start = e => { e.stopPropagation(); setRunning(true);  setDone(false); };
  const pause = e => { e.stopPropagation(); setRunning(false); };
  const reset = e => { e.stopPropagation(); setRunning(false); setRemaining(totalSeconds); setDone(false); };
  const pct   = ((totalSeconds - remaining) / totalSeconds) * 100;

  if (done) return (
    <div className="step-timer done" onClick={e => e.stopPropagation()}>
      <span className="timer-done-icon">🔔</span>
      <span className="timer-done-text">Done!</span>
      <button className="timer-reset-btn" onClick={reset}>↺</button>
    </div>
  );

  if (!running && remaining === totalSeconds) return (
    <button className="step-timer idle" onClick={start}>
      <span className="timer-icon">⏱</span>
      <span className="timer-idle-label">{formatTime(totalSeconds)}</span>
    </button>
  );

  return (
    <div className={`step-timer active ${running ? 'ticking' : 'paused'}`} onClick={e => e.stopPropagation()}>
      <div className="timer-ring-wrap">
        <svg className="timer-ring" viewBox="0 0 36 36">
          <circle className="timer-ring-track" cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"/>
          <circle className="timer-ring-fill"  cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
            strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset="25"/>
        </svg>
        <span className="timer-display">{formatTime(remaining)}</span>
      </div>
      <div className="timer-controls">
        {running
          ? <button className="timer-ctrl-btn pause" onClick={pause}>⏸</button>
          : <button className="timer-ctrl-btn play"  onClick={start}>▶</button>}
        <button className="timer-ctrl-btn reset" onClick={reset}>↺</button>
      </div>
    </div>
  );
}

// ── StepWithTimer — wraps a recipe step text with optional timer ─
export function StepWithTimer({ text }) {
  const sec = parseStepTime(text);
  return (
    <li>
      <span className="step-text">{text}</span>
      {sec && <StepTimer key={text} totalSeconds={sec} />}
    </li>
  );
}
