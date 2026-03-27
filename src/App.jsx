import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }    from './contexts/AuthContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { LocaleProvider }  from './contexts/LocaleContext';
import CookieBanner  from './components/CookieBanner';
import FeedbackWidget from './components/FeedbackWidget';
import Landing   from './pages/Landing';
import Jiff      from './pages/Jiff';
import Planner   from './pages/Planner';
import Profile   from './pages/Profile';
import Pricing   from './pages/Pricing';
import History   from './pages/History';
import Plans     from './pages/Plans';
import Privacy   from './pages/Privacy';
import Stats     from './pages/Stats';
import ApiDocs      from './pages/ApiDocs';
import Admin        from './pages/Admin';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <PremiumProvider>
          <BrowserRouter>
            <ErrorBoundary>
            <Routes>
              <Route path="/"         element={<Landing />}  />
              <Route path="/app"      element={<Jiff />}     />
              <Route path="/planner"  element={<Planner />}  />
              <Route path="/profile"  element={<Profile />}  />
              <Route path="/pricing"  element={<Pricing />}  />
              <Route path="/history"  element={<History />}  />
              <Route path="/plans"    element={<Plans />}    />
              <Route path="/privacy"  element={<Privacy />}  />
              <Route path="/stats"    element={<Stats />}    />
              <Route path="/api-docs" element={<ApiDocs />}  />
              <Route path="/admin"    element={<Admin />}     />
            </Routes>
            </ErrorBoundary>
            <CookieBanner />
            <FeedbackWidget />
          </BrowserRouter>
        </PremiumProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
