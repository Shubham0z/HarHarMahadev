// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import Layout from './components/Layout';
import ManagerLayout from './components/ManagerLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';
import RoutesPage from './pages/RoutePage';
import SuppliersPage from './pages/SuppliersPage';
import RiskPage from './pages/RiskPage';
import ScenariosPage from './pages/ScenariosPage';
import CostPage from './pages/CostPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import ManagerAuthPage from './pages/ManagerAuthPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import ManagerPerformancePage from './pages/ManagerPerformancePage';
import ManagerUsersPage from './pages/ManagerUsersPage';
import ManagerWarehousesPage from './pages/ManagerWarehousesPage';
import SupplierTrackPage from './pages/SupplierTrackPage'; // ✅ NEW
import { getSession, supabase, getUserPermissions } from './lib/supabase';


/* ══════════════════════════════════════
   PROTECTED ROUTE
══════════════════════════════════════ */
const ProtectedRoute: FC<PropsWithChildren<{ page?: string }>> = ({ children, page }) => {
  const [session,     setSession]     = useState<any>(undefined);
  const [permissions, setPermissions] = useState<Record<string, boolean> | null>(null);
  const [permLoaded,  setPermLoaded]  = useState(false);

  useEffect(() => {
    getSession().then(async s => {
      setSession(s);
      if (s?.user?.email) {
        const perms = await getUserPermissions(s.user.email);
        setPermissions(perms as Record<string, boolean> | null);
      }
      setPermLoaded(true);
    });

    if (!supabase) { setSession(null); setPermLoaded(true); return; }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user?.email) {
        const perms = await getUserPermissions(s.user.email);
        setPermissions(perms as Record<string, boolean> | null);
      }
      setPermLoaded(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined || !permLoaded) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'linear-gradient(135deg, #F97316, #EA580C)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
        animation: 'spin 1s linear infinite',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
      <p style={{ fontSize: 13, color: '#94A3B8', fontWeight: 500 }}>Loading...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return <Navigate to="/login" replace />;

  if (page && permissions && permissions[page] === false) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', gap: 16,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Access Restricted</p>
        <p style={{ fontSize: 13, color: '#94A3B8', maxWidth: 280, lineHeight: 1.6 }}>
          You don't have permission to view this page. Contact your manager to get access.
        </p>
      </div>
      <a href="/" style={{
        padding: '10px 24px', borderRadius: 12, fontSize: 13, fontWeight: 700,
        background: 'linear-gradient(135deg, #F97316, #EA580C)',
        color: '#fff', textDecoration: 'none',
        boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
      }}>Go to Home</a>
    </div>
  );

  return <>{children}</>;
};


/* ══════════════════════════════════════
   MANAGER ROUTE GUARD
══════════════════════════════════════ */
const ManagerRoute: FC<PropsWithChildren> = ({ children }) => {
  const auth = sessionStorage.getItem('manager_auth');
  if (auth !== 'true') return <Navigate to="/manager-auth" replace />;
  return <>{children}</>;
};


/* ══════════════════════════════════════
   CTRL+M LISTENER
══════════════════════════════════════ */
function CtrlMListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        navigate('/manager-auth');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  return null;
}


/* ══════════════════════════════════════
   APP
══════════════════════════════════════ */
export default function App() {
  return (
    <BrowserRouter>
      <CtrlMListener />
      <Routes>

        {/* ── Public ── */}
        <Route path="/login"        element={<LoginPage />} />
        <Route path="/manager-auth" element={<ManagerAuthPage />} />

        {/* ✅ Supplier tracking page — PUBLIC, no login needed */}
        {/* Supplier WhatsApp link se seedha yahan aayega */}
        <Route path="/supplier-track" element={<SupplierTrackPage />} />

        {/* ── Manager Routes ── */}
        <Route path="/manager-dashboard" element={
          <ManagerRoute><ManagerLayout><ManagerDashboardPage /></ManagerLayout></ManagerRoute>
        } />
        <Route path="/manager-performance" element={
          <ManagerRoute><ManagerLayout><ManagerPerformancePage /></ManagerLayout></ManagerRoute>
        } />
        <Route path="/manager-users" element={
          <ManagerRoute><ManagerLayout><ManagerUsersPage /></ManagerLayout></ManagerRoute>
        } />
        <Route path="/manager-warehouses" element={
          <ManagerRoute><ManagerLayout><ManagerWarehousesPage /></ManagerLayout></ManagerRoute>
        } />

        {/* ── Protected User Routes ── */}
        <Route path="/" element={
          <ProtectedRoute page="home"><Layout><HomePage /></Layout></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute page="dashboard"><Layout><DashboardPage /></Layout></ProtectedRoute>
        } />
        <Route path="/analyze" element={
          <ProtectedRoute page="analyze"><Layout><AnalyzePage /></Layout></ProtectedRoute>
        } />
        <Route path="/routes" element={
          <ProtectedRoute page="routes"><Layout><RoutesPage /></Layout></ProtectedRoute>
        } />
        <Route path="/suppliers" element={
          <ProtectedRoute page="suppliers"><Layout><SuppliersPage /></Layout></ProtectedRoute>
        } />
        <Route path="/risk" element={
          <ProtectedRoute page="risk"><Layout><RiskPage /></Layout></ProtectedRoute>
        } />
        <Route path="/scenarios" element={
          <ProtectedRoute page="scenarios"><Layout><ScenariosPage /></Layout></ProtectedRoute>
        } />
        <Route path="/cost" element={
          <ProtectedRoute page="cost"><Layout><CostPage /></Layout></ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute page="reports"><Layout><ReportsPage /></Layout></ProtectedRoute>
        } />

      </Routes>
    
    </BrowserRouter>
  );
}
