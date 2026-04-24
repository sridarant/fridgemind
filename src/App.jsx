// src/App.jsx — Route shell with lazy-loaded pages
// Phase 2: All page routes are code-split for faster initial load.

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider }    from './contexts/AuthContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { LocaleProvider }  from './contexts/LocaleContext';
import CookieBanner      from './components/CookieBanner';
import FeedbackWidget    from './components/FeedbackWidget';
import BottomNav         from './components/common/BottomNav';
import ErrorBoundary     from './components/ErrorBoundary';
import PWAInstallPrompt  from './components/common/PWAInstallPrompt';

// ── Lazy-loaded pages ─────────────────────────────────────────────
// Critical path: Landing + Jiff load eagerly; everything else is lazy.
import Landing  from './pages/Landing';
import Jiff     from './pages/Jiff';

const Discover    = lazy(() => import('./pages/Discover'));
const Favs        = lazy(() => import('./pages/Favs'));
const Onboarding  = lazy(() => import('./pages/Onboarding'));
const Planner     = lazy(() => import('./pages/Planner'));
const Profile     = lazy(() => import('./pages/Profile'));
const Pricing     = lazy(() => import('./pages/Pricing'));
const History     = lazy(() => import('./pages/History'));
const Plans       = lazy(() => import('./pages/Plans'));
const Privacy     = lazy(() => import('./pages/Privacy'));
const Stats       = lazy(() => import('./pages/Stats'));
const ApiDocs     = lazy(() => import('./pages/ApiDocs'));
const Admin       = lazy(() => import('./pages/Admin'));
const Insights    = lazy(() => import('./pages/Insights'));
const LittleChefs = lazy(() => import('./pages/LittleChefs'));
const KidsLunchbox= lazy(() => import('./pages/KidsLunchbox'));
const KidsDishes  = lazy(() => import('./pages/KidsDishes'));
const SacredKitchen = lazy(() => import('./pages/SacredKitchen'));

// ── Loading fallback ──────────────────────────────────────────────
const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
    minHeight:'100vh', background:'#FFFAF5', fontFamily:"'DM Sans',sans-serif",
    fontSize:13, color:'#7C6A5E' }}>
    {'Loading...'}
  </div>
);

// ── Bottom nav visibility ─────────────────────────────────────────
function AppShell() {
  const loc = useLocation();
  const showNav = ['/app','/discover','/favs','/profile','/history'].some(p => loc.pathname.startsWith(p));

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/"                    element={<Landing />} />
          <Route path="/app"                 element={<Jiff />} />
          <Route path="/discover"            element={<Discover />} />
          <Route path="/favs"                element={<Favs />} />
          <Route path="/onboarding"          element={<Onboarding />} />
          <Route path="/planner"             element={<Planner />} />
          <Route path="/profile"             element={<Profile />} />
          <Route path="/pricing"             element={<Pricing />} />
          <Route path="/history"             element={<History />} />
          <Route path="/plans"               element={<Plans />} />
          <Route path="/privacy"             element={<Privacy />} />
          <Route path="/stats"               element={<Stats />} />
          <Route path="/api-docs"            element={<ApiDocs />} />
          <Route path="/admin"               element={<Admin />} />
          <Route path="/insights"            element={<Insights />} />
          <Route path="/little-chefs"        element={<LittleChefs />} />
          <Route path="/little-chefs/lunchbox" element={<KidsLunchbox />} />
          <Route path="/little-chefs/dishes"   element={<KidsDishes />} />
          <Route path="/sacred"              element={<SacredKitchen />} />
        </Routes>
      </Suspense>
      {showNav && <BottomNav />}
      <CookieBanner />
      <FeedbackWidget />
      <PWAInstallPrompt />
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PremiumProvider>
          <LocaleProvider>
            <AppShell />
          </LocaleProvider>
        </PremiumProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
