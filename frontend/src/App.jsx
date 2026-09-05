import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UserDashboard from './pages/UserDashboard';
import BankingDashboard from './pages/BankingDashboard';
import NotFoundPage from './pages/NotFound';

// No width clamp here. Each dashboard owns its own container:
// UserDashboard has a fixed 256px sidebar and pages that size to max-w-[88rem];
// BankingDashboard uses the credit desk's own .wrap. Putting a max-w-5xl here
// squeezed both of them into a 1024px column while the fixed sidebar kept
// eating 256px on top of it.
export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-surface">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/admin-dashboard" element={<BankingDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
