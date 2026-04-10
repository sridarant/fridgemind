// src/components/common/BottomNav.jsx
// Fixed bottom navigation bar — mobile first.
// 4 tabs: Home · Discover · Favourites · Profile
// Desktop: hidden (top nav used instead via CSS)

import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { id:'home',      path:'/app',      emoji:'🏠', label:'Home'      },
  { id:'discover',  path:'/discover', emoji:'🌟', label:'Discover'  },
  { id:'favs',      path:'/favs',     emoji:'❤️', label:'Favourites'},
  { id:'profile',   path:'/profile',  emoji:'👤', label:'Profile'   },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeId = pathname === '/app'      ? 'home'
                 : pathname === '/discover' ? 'discover'
                 : pathname === '/favs'     ? 'favs'
                 : pathname.startsWith('/profile') ? 'profile'
                 : null;

  return (
    <nav style={{
      position:   'fixed', bottom:0, left:0, right:0,
      height:     'calc(60px + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      background: 'white',
      borderTop:  '1px solid rgba(28,10,0,0.08)',
      display:    'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      zIndex:     8000,
      fontFamily: "'DM Sans', sans-serif",
    }} className="bottom-nav">
      {TABS.map(tab => {
        const active = activeId === tab.id;
        return (
          <button key={tab.id}
            onClick={() => navigate(tab.path)}
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            2,
              border:         'none',
              background:     'none',
              cursor:         'pointer',
              padding:        '6px 0',
              color:          active ? '#FF4500' : '#7C6A5E',
              fontFamily:     "'DM Sans', sans-serif",
              transition:     'color 0.15s',
            }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
            <span style={{
              fontSize:   10,
              fontWeight: active ? 600 : 400,
              letterSpacing: '0.2px',
            }}>{tab.label}</span>
            {active && (
              <span style={{
                width: 4, height: 4,
                borderRadius: '50%',
                background: '#FF4500',
                marginTop: 1,
              }}/>
            )}
          </button>
        );
      })}
    </nav>
  );
}
