// src/components/jiff/JiffHeader.jsx
// Sticky app header: logo, desktop nav, notifications bell, user menu

import JiffLogo from '../JiffLogo';

export default function JiffHeader({
  view, user, profile, isPremium, trialActive, trialDaysLeft,
  showNotifications, setShowNotifications, notifications, unreadCount,
  showUserMenu, setShowUserMenu,
  markAllRead, signOut, navigate, t,
}) {
  const menuItems = [
    { label: '👤 My Profile',   action: () => navigate('/profile') },
    { label: '📜 History',      action: () => navigate('/history') },
    { label: '📊 Insights',     action: () => navigate('/insights') },
  ];

  return (
    <header className="header">
      <JiffLogo size="md" spinning={view === 'loading'} onClick={() => navigate('/')} />

      <div className="header-right">
        <button
          className="hdr-btn desktop-only"
          onClick={() => navigate('/discover')}
          style={{ fontFamily: "'DM Sans',sans-serif" }}
        >
          {'🌟 Discover'}
        </button>
        <button
          className="hdr-btn desktop-only"
          onClick={() => { if (!user) { alert('Sign in to view your favourites.'); return; } navigate('/favs'); }}
          style={{ fontFamily: "'DM Sans',sans-serif" }}
        >
          {'❤️ Favourites'}
        </button>

        {trialActive && <div className="trial-badge">{'⏳ Trial: '}{trialDaysLeft}{'d left'}</div>}
        {user && !isPremium && (
          <button className="hdr-btn premium" onClick={() => navigate('/pricing')}>
            {'⚡ '}{t('go_premium')}
          </button>
        )}

        <button
          className="hdr-btn"
          onClick={() => navigate('/profile', { state: { tab: 'settings' } })}
          title="Settings"
          style={{ padding: '6px 10px', fontSize: 16, lineHeight: 1 }}
        >
          {'⚙️'}
        </button>

        {/* Notification bell */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              className="notif-btn"
              onClick={() => { setShowNotifications(p => !p); if (showNotifications) markAllRead(); }}
            >
              {'🔔'}
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
            {showNotifications && (
              <>
                <div
                  onClick={() => { setShowNotifications(false); markAllRead(); }}
                  style={{ position: 'fixed', inset: 0, zIndex: 199 }}
                />
                <div className="notif-panel">
                  <div className="notif-header">
                    <span style={{ fontFamily: "'Fraunces',serif", fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                      {'Notifications'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--jiff)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 500 }}
                        >
                          {'Mark all read'}
                        </button>
                      )}
                      <button
                        onClick={() => { setShowNotifications(false); markAllRead(); }}
                        style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'rgba(28,10,0,0.35)', padding: '0 2px', lineHeight: 1 }}
                      >
                        {'✕'}
                      </button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div className="notif-empty">
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{'🔔'}</div>
                        {'No notifications yet'}
                      </div>
                    ) : notifications.map(n => (
                      <div key={n.id} className={'notif-item ' + (n.read ? '' : 'unread')}>
                        <span style={{ fontSize: 20, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>{n.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                            <span style={{ fontSize: 12, fontWeight: n.read ? 400 : 600, color: 'var(--ink)' }}>{n.title}</span>
                            {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jiff)', flexShrink: 0 }} />}
                          </div>
                          <p style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 300, lineHeight: 1.5, margin: 0 }}>{n.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* User avatar + dropdown */}
        {user && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 20, border: '1.5px solid rgba(28,10,0,0.18)', background: 'white', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: '#1C0A00', transition: 'all 0.15s' }}
            >
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#FF4500', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, lineHeight: 1 }}>
                {(profile?.name || 'U').charAt(0).toUpperCase()}
              </span>
              <span>{profile?.name?.split(' ')[0] || t('profile_nav')}</span>
              <span style={{ fontSize: 9, color: '#7C6A5E' }}>{'▼'}</span>
            </button>

            {showUserMenu && (
              <div onClick={() => setShowUserMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
            )}
            {showUserMenu && (
              <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: 'white', border: '1px solid rgba(28,10,0,0.12)', borderRadius: 12, boxShadow: '0 8px 24px rgba(28,10,0,0.12)', minWidth: 180, zIndex: 100, overflow: 'hidden', fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(28,10,0,0.07)', fontSize: 11, color: '#7C6A5E', fontWeight: 300 }}>
                  {user.email}
                </div>
                {menuItems.map(item => (
                  <button
                    key={item.label}
                    onClick={() => { item.action(); setShowUserMenu(false); }}
                    style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1C0A00', fontWeight: 400, fontFamily: "'DM Sans',sans-serif", borderBottom: '1px solid rgba(28,10,0,0.05)', transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,69,0,0.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => { signOut(); setShowUserMenu(false); navigate('/'); }}
                  style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#E53E3E', fontWeight: 500, fontFamily: "'DM Sans',sans-serif", transition: 'background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,62,62,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
                >
                  {'🚪 Sign out'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
