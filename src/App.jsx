import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import FridgeMind from './pages/FridgeMind';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<FridgeMind />} />
      </Routes>
    </BrowserRouter>
  );
}
