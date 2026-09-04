import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import UserDashboard from './pages/UserDashboard';
import BankingDashboard from './pages/BankingDashboard';
import NotFoundPage from './pages/NotFound';

export default function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-50">
                <main className="mx-auto max-w-5xl px-6 py-10">
                    <Routes>
                        <Route path="/user" element={<UserDashboard />} />
                        <Route path="/admin-dashboard" element={<BankingDashboard />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}