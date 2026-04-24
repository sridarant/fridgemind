// src/components/common/BottomNav.jsx
// Fixed bottom navigation bar — mobile first.
// 4 tabs: Home · Discover · Favourites · Profile
// Plan tab removed — planning entry lives inside JourneyTiles.

import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { id:'home',    path:'/app',     emoji:'🏠', label:'Home'  },
  { id:'saved',   path:'/favs',    emoji:'🔖', label:'Saved' },
  { id:'history', path:'/history', emoji:'🕐', label:'History' },
  { id:'profile', path:'/profile', emoji:'👤', label:'Me'    },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeId = pathname === '/app'                     ? 'home'
                 : pathname === '/favs'                    ? 'saved'
                 : pathname === '/history'                 ? 'history'
                 : pathname.startsWith('/profile')         ? 'profile'
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
            <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: '0.2px' }}>
              {tab.label}
            </span>
            {active && (
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FF4500', marginTop: 1 }} />
            )}
          </button>
        );
      })}
    </nav>
  );
}
