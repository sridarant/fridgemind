import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const LOCAL_FAV_KEY  = 'jiff-favourites';
const LOCAL_DISMISS  = 'jiff-auth-dismissed';

function mealKey(m) { return `${m.name}-${m.emoji}`.toLowerCase().replace(/\s+/g, '-'); }

function loadLocalFavs() {
  try { const r = localStorage.getItem(LOCAL_FAV_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveLocalFavs(favs) {
  try { localStorage.setItem(LOCAL_FAV_KEY, JSON.stringify(favs)); } catch {}
}

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile,     setProfile]     = useState(null);   // taste profile
  const [pantry,      setPantry]      = useState([]);     // saved ingredients
  const [favourites,  setFavourites]  = useState([]);     // cloud or local
  const [syncMsg,     setSyncMsg]     = useState('');

  // ── Auth state ────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); setFavourites(loadLocalFavs()); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserData(session.user);
      else setFavourites(loadLocalFavs());
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserData(u);
      else { setFavourites(loadLocalFavs()); setProfile(null); setPantry([]); }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load all user data from Supabase ─────────────
  const loadUserData = useCallback(async (u) => {
    if (!supabase || !u) return;
    const uid = u.id;

    // Load in parallel
    const [profRes, pantryRes, favRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('pantry').select('ingredients').eq('user_id', uid).single(),
      supabase.from('favourites').select('meal, saved_at').eq('user_id', uid).order('saved_at', { ascending: false }),
    ]);

    // Profile
    if (profRes.data) {
      setProfile(profRes.data);
    } else {
      // First-time user — create profile row
      const newProf = {
        id: uid,
        email: u.email,
        name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Chef',
        avatar_url: u.user_metadata?.avatar_url || null,
        spice_level: 'medium',
        allergies: [],
        preferred_cuisines: [],
        skill_level: 'intermediate',
      };
      await supabase.from('profiles').insert(newProf);
      setProfile(newProf);
    }

    // Pantry
    setPantry(pantryRes.data?.ingredients || []);

    // Favourites — merge with any local ones
    const cloudFavs = (favRes.data || []).map(r => r.meal);
    const localFavs = loadLocalFavs();
    const merged = [...cloudFavs];
    // Add local favs not already in cloud
    for (const lf of localFavs) {
      if (!merged.some(cf => mealKey(cf) === mealKey(lf))) {
        merged.push(lf);
        // Persist to cloud silently
        supabase.from('favourites').insert({ user_id: uid, meal: lf, saved_at: new Date().toISOString() });
      }
    }
    // Clear local after merge
    saveLocalFavs([]);
    setFavourites(merged);
  }, []);

  // ── Auth actions ──────────────────────────────────
  const signInWithGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/app' },
    });
  };

  const signInWithEmail = async (email) => {
    if (!supabase) return { error: 'Supabase not configured' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/app' },
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setFavourites([]);
    setProfile(null);
    setPantry([]);
  };

  // ── Profile ───────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    const merged = { ...profile, ...updates };
    setProfile(merged);
    if (supabase && user) {
      await supabase.from('profiles').upsert({ id: user.id, ...merged, updated_at: new Date().toISOString() });
    }
  }, [profile, user]);

  // ── Pantry ────────────────────────────────────────
  const savePantry = useCallback(async (ingredients) => {
    setPantry(ingredients);
    if (supabase && user) {
      await supabase.from('pantry').upsert({
        user_id: user.id,
        ingredients,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    }
  }, [user]);

  // ── Favourites ────────────────────────────────────
  const toggleFavourite = useCallback(async (meal) => {
    const key = mealKey(meal);
    const exists = favourites.some(f => mealKey(f) === key);

    if (exists) {
      const next = favourites.filter(f => mealKey(f) !== key);
      setFavourites(next);
      if (supabase && user) {
        // Find by meal name in cloud
        await supabase.from('favourites')
          .delete()
          .eq('user_id', user.id)
          .eq('meal->>name', meal.name);
      } else {
        saveLocalFavs(next);
      }
    } else {
      const entry = { ...meal, savedAt: Date.now() };
      const next = [entry, ...favourites];
      setFavourites(next);
      if (supabase && user) {
        await supabase.from('favourites').insert({
          user_id: user.id,
          meal: entry,
          saved_at: new Date().toISOString(),
        });
      } else {
        saveLocalFavs(next);
      }
    }
  }, [favourites, user]);

  const isFav = useCallback((meal) =>
    favourites.some(f => mealKey(f) === mealKey(meal)),
  [favourites]);

  const isAuthDismissed = () => !!localStorage.getItem(LOCAL_DISMISS);
  const dismissAuth = () => localStorage.setItem(LOCAL_DISMISS, '1');

  const value = {
    user, authLoading, profile, pantry, favourites, syncMsg,
    signInWithGoogle, signInWithEmail, signOut,
    updateProfile, savePantry,
    toggleFavourite, isFav,
    isAuthDismissed, dismissAuth,
    supabaseEnabled: !!supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
