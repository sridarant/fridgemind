// src/components/common/PWAInstallPrompt.jsx
// Shows a mobile install prompt for PWA / Add to Home Screen
// Appears once per session on mobile devices that support PWA install

import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [prompt,  setPrompt]  = useState(null);  // beforeinstallprompt event
  const [visible, setVisible] = useState(false);
  const [isDismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // Don't show if dismissed this session
    if (sessionStorage.getItem('jiff-pwa-dismissed')) return;

    // iOS Safari — uses its own mechanism (no beforeinstallprompt)
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    if (isIOS && isSafari) {
      // Show iOS-specific prompt after 3s delay
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android Chrome — listen for beforeinstallprompt
    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setVisible(false);
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('jiff-pwa-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const C = { jiff:'#FF4500', ink:'#1C0A00', cream:'#FFFAF5', muted:'#7C6A5E' };

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,  // above bottom nav
      left: 16,
      right: 16,
      zIndex: 9999,
      background: 'white',
      borderRadius: 16,
      padding: '16px 18px',
      boxShadow: '0 8px 32px rgba(28,10,0,0.18)',
      border: '1px solid rgba(255,69,0,0.2)',
      fontFamily: "'DM Sans', sans-serif",
      animation: 'slideUp 0.3s ease',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: C.jiff, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
        }}>
          ⚡
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 2 }}>
            Add Jiff to your home screen
          </div>
          <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.5 }}>
            {isIOS
              ? "Tap the share button ↑ then "Add to Home Screen" for quick access"
              : "Install the app for a faster, app-like experience"}
          </div>
        </div>
        <button onClick={handleDismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.muted, fontSize: 18, lineHeight: 1, padding: '0 4px',
            flexShrink: 0,
          }}>
          ×
        </button>
      </div>
      {!isIOS && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={handleDismiss}
            style={{
              flex: 1, padding: '9px', border: '1px solid rgba(28,10,0,0.12)',
              borderRadius: 10, background: 'none', fontSize: 12,
              color: C.muted, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
            }}>
            Not now
          </button>
          <button onClick={handleInstall}
            style={{
              flex: 2, padding: '9px', border: 'none',
              borderRadius: 10, background: C.jiff, fontSize: 12,
              color: 'white', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600,
            }}>
            Install app
          </button>
        </div>
      )}
    </div>
  );
}
