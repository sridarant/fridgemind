import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider }    from './contexts/AuthContext';
import { PremiumProvider } from './contexts/PremiumContext';
import { LocaleProvider }  from './contexts/LocaleContext';
import Landing  from './pages/Landing';
import Jiff     from './pages/Jiff';
import Planner  from './pages/Planner';
import Profile  from './pages/Profile';
import Pricing  from './pages/Pricing';

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <PremiumProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"        element={<Landing />} />
              <Route path="/app"     element={<Jiff />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/pricing" element={<Pricing />} />
            </Routes>
          </BrowserRouter>
        </PremiumProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
