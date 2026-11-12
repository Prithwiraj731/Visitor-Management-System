import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LockdownProvider } from './context/LockdownContext';
import { LockdownBanner } from './components/common/LockdownBanner';
import { SentinelCommandBar } from './components/common/SentinelCommandBar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GateViewPage } from './pages/GateViewPage';
import { VisitorsPage } from './pages/VisitorsPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { StaffPage } from './pages/StaffPage';
import { ReportsPage } from './pages/ReportsPage';
import { EvacuationPage } from './pages/EvacuationPage';
import { SupabaseTestPage } from './pages/SupabaseTestPage';
import { PassPage } from './pages/PassPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(...allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AuthenticatedShellTools = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <SentinelCommandBar />;
};

export function App() {
  return (
    <AuthProvider>
      <LockdownProvider>
        <BrowserRouter>
          {/* Global Emergency Lockdown Banner */}
          <LockdownBanner />

          {/* AI Security Copilot Command Palette (Ctrl+K, authenticated staff only) */}
          <AuthenticatedShellTools />

          <Routes>
            {/* Public Modern Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public Persistent Digital Pass Pages */}
            <Route path="/pass/:id" element={<PassPage />} />
            <Route path="/pass" element={<PassPage />} />

            {/* Authentication Gateway */}
            <Route path="/login" element={<LoginPage />} />

            {/* Supabase Integration Verification (Super Admin only) */}
            <Route
              path="/supabase-test"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SupabaseTestPage />
                </ProtectedRoute>
              }
            />

            {/* Operations Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Security Gate Terminal */}
            <Route
              path="/gate"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'guard']}>
                  <GateViewPage />
                </ProtectedRoute>
              }
            />

            {/* Visitor History & Logs */}
            <Route
              path="/visitors"
              element={
                <ProtectedRoute>
                  <VisitorsPage />
                </ProtectedRoute>
              }
            />

            {/* Departments Directory */}
            <Route
              path="/departments"
              element={
                <ProtectedRoute>
                  <DepartmentsPage />
                </ProtectedRoute>
              }
            />

            {/* Staff Roles & Permissions */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                  <StaffPage />
                </ProtectedRoute>
              }
            />

            {/* Analytics & Export Reports */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'guard']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Emergency Crisis Manifest */}
            <Route
              path="/emergency"
              element={
                <ProtectedRoute allowedRoles={['super_admin', 'admin', 'guard']}>
                  <EvacuationPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </LockdownProvider>
    </AuthProvider>
  );
}

export default App;
