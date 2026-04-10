// src/components/common/GoalSheet.jsx — Goal selector bottom sheet
// Opens from "I have a goal" tile. One tap fires generation.
// Respects user's cuisine pool. Mobile-first design.

import { useNavigate } from 'react-router-dom';
import { GOAL_CONTEXTS } from '../../lib/cuisine.js';

const C = {
  jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5',
  muted:'#7C6A5E', border:'rgba(28,10,0,0.08)',
};

export default function GoalSheet({ onSelect, onClose }) {
  const navigate = useNavigate();
  const goals    = Object.entries(GOAL_CONTEXTS);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:9000,
        background:'rgba(28,10,0,0.4)',
        backdropFilter:'blur(2px)',
      }}/>

      {/* Sheet */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, willChange:'transform',
        zIndex:9001, background:'white',
        borderRadius:'20px 20px 0 0',
        padding:'20px 20px 40px',
        fontFamily:"'DM Sans', sans-serif",
        animation:'slideUp 0.22s ease',
        maxHeight:'85vh', overflowY:'auto',
      }}>
        {/* Handle + Close */}
        <div style={{ display:'flex', alignItems:'center', marginBottom:20 }}>
          <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
            <div style={{ width:40, height:4, background:'rgba(28,10,0,0.12)', borderRadius:2 }}/>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'1px solid rgba(28,10,0,0.1)', borderRadius:'50%',
              width:28, height:28, cursor:'pointer', color:'rgba(28,10,0,0.4)', fontSize:14,
              display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1, flexShrink:0 }}>
            ✕
          </button>
        </div>

        <div style={{
          fontFamily:"'Fraunces',serif", fontSize:20,
          fontWeight:700, color:C.ink, marginBottom:4,
        }}>
          What's your goal?
        </div>
        <div style={{ fontSize:13, color:C.muted, fontWeight:300, marginBottom:20 }}>
          Jiff will tailor recipes to match
        </div>

        {/* 2-col goal grid — mobile friendly */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(2, 1fr)',
          gap:12, marginBottom:20,
        }}>
          {goals.map(([id, goal]) => (
            <button key={id}
              onClick={() => { onSelect?.({ id, ...goal }); }}
              style={{
                display:'flex', flexDirection:'column',
                alignItems:'flex-start', gap:8,
                padding:'16px 14px',
                border:'1.5px solid ' + (C.border),
                borderRadius:16, background:'white',
                cursor:'pointer', textAlign:'left',
                fontFamily:"'DM Sans',sans-serif",
                minHeight:90,
                transition:'all 0.14s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.jiff;
                e.currentTarget.style.background = 'rgba(255,69,0,0.04)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = 'white';
              }}
            >
              <span style={{ fontSize:28, lineHeight:1 }}>{goal.emoji}</span>
              <span style={{
                fontSize:13, fontWeight:600,
                color:C.ink, lineHeight:1.3,
              }}>{goal.label}</span>
            </button>
          ))}
        </div>

        {/* Link to full plans page */}
        <button
          onClick={() => { onClose?.(); navigate('/plans'); }}
          style={{
            width:'100%', padding:'12px',
            background:'rgba(28,10,0,0.03)',
            border:'1px solid ' + (C.border),
            borderRadius:12, fontSize:13,
            color:C.muted, cursor:'pointer',
            fontFamily:"'DM Sans',sans-serif",
          }}
        >
          Or see all goal plans →
        </button>
      </div>
    </>
  );
}
