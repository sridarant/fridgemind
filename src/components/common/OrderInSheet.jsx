// src/components/common/OrderInSheet.jsx
// Bottom sheet for "Order in instead" tile — India only.
// Shows Swiggy, Zomato, Blinkit with deep links.

export default function OrderInSheet({ city = '', onClose }) {
  const citySlug = encodeURIComponent(city.toLowerCase() || 'india');

  const SERVICES = [
    {
      name:    'Swiggy',
      emoji:   '🟠',
      color:   '#FC8019',
      bg:      'rgba(252,128,25,0.07)',
      border:  'rgba(252,128,25,0.2)',
      url:     `https://www.swiggy.com`,
      tagline: 'Food delivery',
    },
    {
      name:    'Zomato',
      emoji:   '🔴',
      color:   '#E23744',
      bg:      'rgba(226,55,68,0.07)',
      border:  'rgba(226,55,68,0.2)',
      url:     `https://www.zomato.com`,
      tagline: 'Food delivery',
    },
    {
      name:    'Blinkit',
      emoji:   '🟡',
      color:   '#1A8A3E',
      bg:      'rgba(26,138,62,0.07)',
      border:  'rgba(26,138,62,0.2)',
      url:     `https://blinkit.com`,
      tagline: 'Groceries in 10 min',
    },
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(28,10,0,0.4)',
        backdropFilter: 'blur(2px)',
      }}/>

      <div style={{
        position:     'fixed',
        bottom:       0, left: 0, right: 0,
        zIndex:       9001,
        background:   'white',
        borderRadius: '20px 20px 0 0',
        padding:      '24px 20px 40px',
        fontFamily:   "'DM Sans', sans-serif",
        animation:    'slideUp 0.2s ease',
      }}>
        <style>{'@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}'}</style>

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

        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:'#1C0A00', marginBottom:4 }}>
          Order in instead
        </div>
        <div style={{ fontSize:13, color:'#7C6A5E', fontWeight:300, marginBottom:20 }}>
          Not in the mood to cook? No judgement.
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {SERVICES.map(svc => (
            <a key={svc.name} href={svc.url} target="_blank" rel="noopener noreferrer"
              onClick={onClose}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            8,
                padding:        '18px 8px',
                border:         `2px solid ${svc.border}`,
                borderRadius:   16,
                background:     svc.bg,
                cursor:         'pointer',
                textDecoration: 'none',
                transition:     'all 0.15s',
              }}>
              <span style={{ fontSize:32 }}>{svc.emoji}</span>
              <span style={{ fontSize:14, fontWeight:600, color:'#1C0A00' }}>{svc.name}</span>
              <span style={{ fontSize:10, color:'#7C6A5E', textAlign:'center' }}>{svc.tagline}</span>
            </a>
          ))}
        </div>

        <button onClick={onClose} style={{
          width:'100%', marginTop:16, padding:'12px', border:'none',
          background:'rgba(28,10,0,0.04)', borderRadius:12, fontSize:13,
          color:'#7C6A5E', cursor:'pointer', fontFamily:"'DM Sans',sans-serif",
        }}>
          Actually, I'll cook
        </button>
      </div>
    </>
  );
}
