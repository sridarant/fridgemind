// src/hooks/useNotifications.js
// Notification state: load broadcasts, mark read, unread count.

import { useState, useCallback, useEffect } from 'react';
import { fetchBroadcasts, markNotificationsRead } from '../services/userService';

const STORAGE_KEY = 'jiff-read-notifs';

export function useNotifications({ user, supabaseEnabled, streak }) {
  const [notifications,  setNotifications]  = useState([]);
  const [unreadCount,    setUnreadCount]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const readIds = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
      const all = [];

      // System: streak achievement
      const sd = JSON.parse(localStorage.getItem('jiff-streak') || '{}');
      if (sd.count >= 3) {
        all.push({
          id: 'streak-' + sd.count, type: 'achievement', icon: '🔥',
          title: `${sd.count}-day cooking streak!`,
          body: "Keep it up — you're building a great habit.",
          ts: Date.now() - 1000,
        });
      }

      // System: seasonal tip
      all.push({
        id: 'tip-season', type: 'tip', icon: '🌿',
        title: 'Seasonal produce available',
        body: 'Check seasonal suggestions for the freshest ingredients.',
        ts: Date.now() - 2000,
      });

      // Supabase broadcasts
      if (supabaseEnabled) {
        const broadcasts = await fetchBroadcasts();
        broadcasts.forEach(b => all.push({
          id: 'bc-' + b.id, type: 'broadcast', icon: '📢',
          title: 'From Jiff', body: b.message,
          ts: new Date(b.created_at).getTime(),
        }));
      }

      all.sort((a, b) => b.ts - a.ts);
      const marked = all.map(n => ({ ...n, read: readIds.has(n.id) }));
      if (!cancelled) {
        setNotifications(marked);
        setUnreadCount(marked.filter(n => !n.read).length);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user, supabaseEnabled, streak]);

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    const ids = notifications.map(n => n.id);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch {}
    if (user?.id) markNotificationsRead(user.id);
  }, [notifications, user]);

  return { notifications, unreadCount, markAllRead, setNotifications, setUnreadCount };
}
