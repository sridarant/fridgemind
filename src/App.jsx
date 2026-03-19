import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Jiff from './pages/Jiff';
import Planner from './pages/Planner';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<Jiff />} />
        <Route path="/planner" element={<Planner />} />
      </Routes>
    </BrowserRouter>
  );
}
