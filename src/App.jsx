// src/App.jsx — Route shell with bottom navigation
// v22: Added /discover, /favs, /onboarding routes + BottomNav

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AuthProvider }    from './contexts/AuthContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { LocaleProvider }  from './contexts/LocaleContext';
import CookieBanner    from './components/CookieBanner';
import FeedbackWidget  from './components/FeedbackWidget';
import BottomNav       from './components/common/BottomNav';
import ErrorBoundary   from './components/ErrorBoundary';

import Landing       from './pages/Landing';
import Jiff          from './pages/Jiff';
import Discover      from './pages/Discover';
import Favs          from './pages/Favs';
import Onboarding    from './pages/Onboarding';
import Planner       from './pages/Planner';
import Profile       from './pages/Profile';
import Pricing       from './pages/Pricing';
import History       from './pages/History';
import Plans         from './pages/Plans';
import Privacy       from './pages/Privacy';
import Stats         from './pages/Stats';
import ApiDocs       from './pages/ApiDocs';
import Admin         from './pages/Admin';
import Insights      from './pages/Insights';
import LittleChefs   from './pages/LittleChefs';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import KidsLunchbox  from './pages/KidsLunchbox';
import KidsDishes    from './pages/KidsDishes';
import SacredKitchen from './pages/SacredKitchen';

// Pages that show the bottom nav
const NAV_PATHS = ['/app', '/discover', '/favs', '/profile'];

function AppShell() {
  const { pathname } = useLocation();
  const showNav = NAV_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'));

  return (
    <>
      <Routes>
        <Route path="/"            element={<Landing />}       />
        <Route path="/app"         element={<Jiff />}          />
        <Route path="/discover"    element={<Discover />}      />
        <Route path="/onboarding"  element={<Onboarding />}    />
        <Route path="/planner"     element={<Planner />}       />
        <Route path="/profile"     element={<Profile />}       />
        <Route path="/pricing"     element={<Pricing />}       />
        <Route path="/history"     element={<History />}       />
        <Route path="/plans"       element={<Plans />}         />
        <Route path="/privacy"     element={<Privacy />}       />
        <Route path="/stats"       element={<Stats />}         />
        <Route path="/api-docs"    element={<ApiDocs />}       />
        <Route path="/admin"       element={<Admin />}         />
        <Route path="/insights"    element={<Insights />}      />
        <Route path="/little-chefs"          element={<LittleChefs />}   />
        <Route path="/little-chefs/lunchbox"  element={<KidsLunchbox />}  />
        <Route path="/little-chefs/dishes"    element={<KidsDishes />}    />
        <Route path="/sacred"      element={<SacredKitchen />} />
        {/* /favs — renders Jiff with favourites panel open */}
        <Route path="/favs"        element={<Favs />} />
      </Routes>

      {showNav && <BottomNav />}
      <CookieBanner />
      <FeedbackWidget />
      <SpeedInsights />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <AuthProvider>
          <PremiumProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </PremiumProvider>
        </AuthProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}
