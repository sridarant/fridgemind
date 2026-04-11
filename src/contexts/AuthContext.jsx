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

    // Profile — merge DB data with localStorage cache (covers fields not in DB schema)
    let profileCache = {};
    try { profileCache = JSON.parse(localStorage.getItem('jiff-profile-cache') || '{}'); } catch {}
    if (profRes.data) {
      setProfile({ ...profileCache, ...profRes.data }); // DB always wins
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
      // Only upsert columns that exist in the profiles schema
      // Only upsert columns confirmed to exist in the profiles schema
      // (matches the INSERT on signup + any confirmed additions)
      // Confirmed Supabase profiles schema columns.
      // Run this SQL in Supabase dashboard if cooking_for/family_size/has_kids/kids_ages are missing:
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cooking_for text DEFAULT 'just_me';
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS family_size int DEFAULT 2;
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_kids boolean DEFAULT false;
      // ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kids_ages text[] DEFAULT '{}';
      const SCHEMA_COLS = [
        'id','email','name','avatar_url','updated_at',
        'food_type','spice_level','allergies','preferred_cuisines','skill_level',
        'family_members','active_goal','calorie_target',
        'streak','onboarding_done','country',
        'cooking_for','family_size','has_kids','kids_ages',
      ];
      const safe = Object.fromEntries(
        Object.entries({ id: user.id, ...merged, updated_at: new Date().toISOString() })
          .filter(([k]) => SCHEMA_COLS.includes(k))
      );
      await supabase.from('profiles').upsert(safe);
      // Cache full profile in localStorage for instant load + fields not in DB schema
      try { localStorage.setItem('jiff-profile-cache', JSON.stringify(merged)); } catch {}
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
