// src/pages/ApiDocs.jsx — Jiff Public API documentation
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const C = { jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', warm:'#FFF0E5', muted:'#7C6A5E', border:'rgba(28,10,0,0.10)', shadow:'0 4px 24px rgba(28,10,0,0.07)', green:'#1D9E75' };

const Code = ({ children }) => (
  <pre style={{ background:'#1C0A00', color:'#FFFAF5', borderRadius:10, padding:'14px 16px', fontSize:12, overflowX:'auto', fontFamily:'Courier New, monospace', lineHeight:1.6, margin:'10px 0' }}>
    <code>{children}</code>
  </pre>
);

const Badge = ({ color, children }) => (
  <span style={{ fontSize:10, fontWeight:500, padding:'2px 8px', borderRadius:20, background:color+'22', color, marginLeft:8 }}>{children}</span>
);

const TIERS = [
  { name:'Free',    price:'₹0 / $0',   limit:'10 calls/day',   color:'#1D9E75', features:['3 meals per call','English only','Basic cuisines'] },
  { name:'Starter', price:'₹499 / $9', limit:'500 calls/day',  color:'#3949AB', features:['5 meals per call','All 10 languages','All cuisines','Priority support'] },
  { name:'Pro',     price:'₹2499/$49', limit:'5,000 calls/day', color:C.jiff,   features:['5 meals per call','All languages','Weekly planner API','Dedicated support','SLA 99.9%'] },
];

export default function ApiDocs() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const copy = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight:'100vh', background:C.cream, fontFamily:"'DM Sans', sans-serif", color:C.ink }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>

      <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid '+C.border, background:'rgba(255,250,245,0.95)', backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={() => navigate('/')}>
          <span style={{ fontSize:22 }}>⚡</span>
          <span style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink }}><span style={{ color:C.jiff }}>J</span>iff API</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate('/')} style={{ fontSize:13, color:C.muted, background:'none', border:'1.5px solid rgba(28,10,0,0.18)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>← Home</button>
        </div>
      </header>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'40px 24px 80px' }}>
        <div style={{ marginBottom:40 }}>
          <p style={{ fontSize:11, letterSpacing:'2px', textTransform:'uppercase', color:C.jiff, fontWeight:500, marginBottom:8 }}>Developer API</p>
          <h1 style={{ fontFamily:"'Fraunces', serif", fontSize:'clamp(28px,5vw,44px)', fontWeight:900, color:C.ink, letterSpacing:'-1px', marginBottom:10 }}>Jiff API v1</h1>
          <p style={{ fontSize:15, color:C.muted, fontWeight:300, lineHeight:1.7 }}>Embed AI-powered meal suggestions into your app. Pass ingredients, get structured recipes back. Simple REST API.</p>
        </div>

        {/* Quick start */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'24px', marginBottom:24, boxShadow:C.shadow }}>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:12 }}>Quick start</h2>
          <p style={{ fontSize:13, color:C.muted, marginBottom:12 }}>1. Get a free API key by emailing <a href="mailto:api@getjiff.in" style={{ color:C.jiff }}>api@getjiff.in</a></p>
          <p style={{ fontSize:13, color:C.muted, marginBottom:8 }}>2. Make your first call:</p>
          <Code>{`curl -X POST https://jiff-ecru.vercel.app/api/v1/suggest \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "ingredients": ["eggs", "onions", "rice"],
    "time": "30 min",
    "cuisine": "any",
    "servings": 2
  }'`}</Code>
        </div>

        {/* Endpoint */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'24px', marginBottom:24, boxShadow:C.shadow }}>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:16 }}>POST /api/v1/suggest</h2>

          <h3 style={{ fontSize:14, fontWeight:500, color:C.ink, marginBottom:10 }}>Request body</h3>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:20 }}>
            <thead><tr style={{ background:C.ink }}>
              {['Parameter','Type','Required','Description'].map(h => <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'white', fontSize:12, fontWeight:500 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[
                ['ingredients','string[]','Yes','List of ingredients you have'],
                ['time','string','No','15 min | 30 min | 1 hour | no time limit'],
                ['diet','string','No','none | vegetarian | vegan | gluten-free | dairy-free'],
                ['cuisine','string','No','any | South Indian | Punjabi | Italian | Japanese | ...'],
                ['mealType','string','No','any | breakfast | lunch | dinner | snack'],
                ['servings','number','No','1–12, default 2'],
                ['count','number','No','1–5, default 3 (max depends on tier)'],
                ['language','string','No','en | hi | ta | te | kn | bn | mr | es | fr | de'],
                ['units','string','No','metric | imperial'],
              ].map(([p,t,r,d], i) => (
                <tr key={p} style={{ background: i%2===0 ? 'white' : C.cream }}>
                  <td style={{ padding:'8px 12px', fontFamily:'Courier New', fontSize:12, color:C.jiff }}>{p}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, color:C.muted }}>{t}</td>
                  <td style={{ padding:'8px 12px', fontSize:12 }}>{r === 'Yes' ? <span style={{ color:C.green, fontWeight:500 }}>Yes</span> : <span style={{ color:C.muted }}>No</span>}</td>
                  <td style={{ padding:'8px 12px', fontSize:12, color:C.ink }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize:14, fontWeight:500, color:C.ink, marginBottom:10 }}>Response</h3>
          <Code>{`{
  "meals": [
    {
      "name": "Egg Fried Rice",
      "emoji": "🍳",
      "time": "20 min",
      "servings": "2",
      "difficulty": "Easy",
      "description": "Quick and satisfying one-pan meal.",
      "ingredients": ["2 eggs", "200g rice", "1 onion", "soy sauce*"],
      "steps": ["Cook rice...", "Scramble eggs...", "Combine..."],
      "calories": "380",
      "protein": "14g",
      "carbs": "58g",
      "fat": "8g"
    }
  ],
  "meta": {
    "count": 3,
    "language": "en",
    "units": "metric",
    "generated": "2026-03-26T10:00:00Z",
    "tier": "free",
    "remaining": 7
  }
}`}</Code>
        </div>

        {/* Pricing */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'24px', marginBottom:24, boxShadow:C.shadow }}>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:20 }}>API pricing</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
            {TIERS.map(tier => (
              <div key={tier.name} style={{ border:'\1 ' + tier.color + '44', borderRadius:14, padding:'18px 16px' }}>
                <div style={{ fontFamily:"'Fraunces', serif", fontSize:18, fontWeight:900, color:tier.color, marginBottom:4 }}>{tier.name}</div>
                <div style={{ fontSize:15, fontWeight:500, color:C.ink, marginBottom:2 }}>{tier.price}</div>
                <div style={{ fontSize:12, color:C.muted, marginBottom:12 }}>{tier.limit}</div>
                {tier.features.map(f => (
                  <div key={f} style={{ fontSize:12, color:C.ink, marginBottom:5, display:'flex', gap:6, alignItems:'flex-start' }}>
                    <span style={{ color:tier.color, flexShrink:0 }}>✓</span>{f}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize:13, color:C.muted, marginTop:16, fontWeight:300 }}>Email <a href="mailto:api@getjiff.in" style={{ color:C.jiff }}>api@getjiff.in</a> to get your API key. Paid tiers coming soon with self-serve dashboard.</p>
        </div>

        {/* Error codes */}
        <div style={{ background:'white', border:'1px solid '+C.border, borderRadius:18, padding:'24px', boxShadow:C.shadow }}>
          <h2 style={{ fontFamily:"'Fraunces', serif", fontSize:22, fontWeight:900, color:C.ink, marginBottom:16 }}>Error codes</h2>
          {[
            ['401','Invalid or missing X-API-Key header'],
            ['400','Missing required ingredients field'],
            ['429','Rate limit exceeded — upgrade your plan'],
            ['500','Server error — retry after 30 seconds'],
          ].map(([code, msg]) => (
            <div key={code} style={{ display:'flex', gap:14, padding:'10px 0', borderBottom:'1px solid '+C.border }}>
              <span style={{ fontFamily:'Courier New', fontSize:13, color:code==='401'||code==='429'?'#E53E3E':code==='400'?C.jiff:C.muted, fontWeight:500, minWidth:35 }}>{code}</span>
              <span style={{ fontSize:13, color:C.ink }}>{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
