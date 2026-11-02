import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KioskModal } from '../components/visitors/KioskModal';
import { dashboardService } from '../services/api';
import {
  Shield,
  ShieldCheck,
  Building,
  UserCheck,
  Users,
  QrCode,
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Laptop
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [stats, setStats] = useState({
    currentlyInside: 2,
    totalToday: 5,
    avgDurationMinutes: 45
  });
  const [activeTab, setActiveTab] = useState('visitor');

  useEffect(() => {
    dashboardService.getStats().then((res) => {
      if (res.data?.data) {
        setStats(res.data.data);
      }
    }).catch(() => {
      // fallback
    });
  }, []);

  const handleRoleNavigation = (targetPath, roleHint) => {
    if (user) {
      navigate(targetPath);
    } else {
      // Navigate to login with role hint or open direct
      navigate('/login', { state: { roleHint } });
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 selection:bg-brand-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-5%] w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px]" />
      </div>

      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#090D16]/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight text-lg">VMS Enterprise</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  v4.0
                </span>
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                Visitor Access Control
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#portals" className="hover:text-white transition-colors">Role Gateways</a>
            <a href="#features" className="hover:text-white transition-colors">Core Capabilities</a>
            <a href="#security" className="hover:text-white transition-colors">Engineering & OWASP</a>
            <a href="#stats" className="hover:text-white transition-colors">Live Telemetry</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsKioskOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700/80 border border-slate-700/70 transition-all shadow-sm"
            >
              <QrCode className="w-4 h-4 text-brand-400" />
              <span>Visitor Self-Pass</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/gate"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20 transition-all"
                >
                  <Laptop className="w-4 h-4" />
                  <span>Launch Workspace</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20 transition-all"
              >
                <span>Staff Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Status Chip */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 shadow-inner mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-slate-300">
              Live Checkpoint Telemetry • Facility Alpha Online
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Total Perimeter Security.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-sky-300">
              Zero Friction for Guests.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            A next-generation enterprise access control platform. Contactless cryptographic QR passes, real-time host dispatch, instant evacuation accountability, and certified RBAC security.
          </p>

          {/* Primary Action Row */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsKioskOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-brand-600 via-indigo-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white shadow-xl shadow-brand-600/30 transition-all active:scale-[0.98]"
            >
              <QrCode className="w-5 h-5 text-brand-200" />
              <span>Visitor Self-Registration (Kiosk)</span>
            </button>

            <a
              href="#portals"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all"
            >
              <span>Explore Role Gateways</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Hero Interactive Telemetry Preview Console */}
        <div className="mt-14 max-w-4xl mx-auto rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/90 border border-slate-700/70 p-2 sm:p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="bg-[#0B101B] rounded-xl p-4 sm:p-6 border border-slate-800">
            {/* Console Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-mono text-slate-400 ml-2">GATEWAY_DAEMON // PORT 5000: LIVE</span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE ROSTER: {stats.currentlyInside} INSIDE
              </span>
            </div>

            {/* Console Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Live Badge Preview Card */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col items-center text-center">
                <span className="text-[10px] font-mono text-brand-400 uppercase tracking-widest mb-2 font-bold">
                  CRYPTOGRAPHIC PASS SIMULATOR
                </span>
                <div className="p-2.5 bg-white rounded-lg shadow-md my-1">
                  <div className="w-24 h-24 bg-slate-900 rounded flex flex-col items-center justify-center text-white">
                    <QrCode className="w-14 h-14 text-indigo-400" />
                    <span className="text-[8px] font-mono text-slate-400 mt-1">VERIFIED</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white mt-2">Alex Mercer</p>
                <p className="text-[11px] text-slate-400">GenTek Dynamics • Tech Tower 4F</p>
                <span className="mt-2 text-[10px] font-mono bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                  BADGE: VMS-20261103-1001
                </span>
              </div>

              {/* Real-Time Metrics */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                    SECURITY CHECKPOINT METRICS
                  </span>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Check-In Velocity</span>
                        <span className="text-emerald-400 font-mono font-bold">&lt; 14 sec</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-[92%] h-full bg-emerald-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Personnel Accountability</span>
                        <span className="text-brand-400 font-mono font-bold">100%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-full h-full bg-brand-500 rounded-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Host Arrival Dispatch</span>
                        <span className="text-indigo-400 font-mono font-bold">Instant SMS/Web</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="w-[96%] h-full bg-indigo-500 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Evacuation telemetry:</span>
                  <span className="text-emerald-400 font-semibold">Active & Armed</span>
                </div>
              </div>

              {/* Checkpoint Quick Action Box */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                    QUICK ROLE ENTRY
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Jump straight into designated security consoles with single-click authenticated role sessions.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleRoleNavigation('/gate', 'guard')}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-left flex items-center justify-between transition-colors"
                  >
                    <span>Gate Reception Desk</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleRoleNavigation('/', 'super_admin')}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 text-left flex items-center justify-between transition-colors"
                  >
                    <span>Operations Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Unified Role Gateways (Direct Role Navigation) */}
      <section id="portals" className="py-20 bg-slate-950/60 border-y border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-wider bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">
              ROLE-BASED SYSTEM MATRIX
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
              Unified Portals for Every Persona
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Select your persona to enter your designated workspace with certified RBAC permission barriers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Gateway 1: Visitor */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-brand-500/60 transition-all hover:-translate-y-1 group flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 mb-2">
                  PUBLIC KIOSK
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Visitor Self-Pass</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Touchless self-registration for walk-ins and pre-registered guests. Generates a digital QR badge and notifies your host immediately.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => setIsKioskOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all"
                >
                  <span>Register Guest Pass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gateway 2: Security Guard */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/60 transition-all hover:-translate-y-1 group flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-2">
                  SECURITY & DESK
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Gate Operations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fast 1-click arrival check-in and check-out, live headcount monitor, identity verification, and thermal badge pass printing.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleRoleNavigation('/gate', 'guard')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <span>Launch Gate Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gateway 3: Host Employee */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-indigo-500/60 transition-all hover:-translate-y-1 group flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-2">
                  STAFF & EMPLOYEES
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Host Workspace</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pre-register expected client visits, receive real-time front gate arrival alerts, and approve or reject meeting access requests.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleRoleNavigation('/', 'host')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all"
                >
                  <span>Access Host Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Gateway 4: Super Admin */}
            <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-800 hover:border-purple-500/60 transition-all hover:-translate-y-1 group flex flex-col justify-between shadow-xl">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Building className="w-6 h-6" />
                </div>
                <div className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 mb-2">
                  EXECUTIVE & COMPLIANCE
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Admin Command</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enterprise analytics, department headcount management, staff provisioning, emergency evacuation roster, and CSV audit logs.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                <button
                  onClick={() => handleRoleNavigation('/', 'super_admin')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all"
                >
                  <span>Enter Admin Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section: Engineering Architecture & Security Standards */}
      <section id="security" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            SOFTWARE ENGINEERING RIGOR
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            Built for Academic & Production Standards
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Engineered adhering to OWASP Top 10 guidelines, relational integrity, and strict layered client-server patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">OWASP Hardened Security</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipped with Helmet security headers, rate limiting (anti-brute-force), bcrypt 10-round salted password hashing, and parameterized SQL queries to eliminate SQL injection.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Life-Safety Evacuation Engine</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant 1-click crisis roster that lists every single external visitor currently inside premises with floor locations and direct click-to-call links for emergency commanders.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Dual SQL Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seamlessly configured for zero-setup local execution (SQLite dialect) and cloud PostgreSQL deployment (Supabase / Render) using Sequelize ORM migrations.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Section: Live Telemetry & Metrics Bar */}
      <section id="stats" className="py-12 bg-slate-950 border-t border-slate-800/80 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <span className="block text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {stats.currentlyInside}
              </span>
              <span className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mt-1 block">
                Active Guests Inside
              </span>
            </div>

            <div className="p-4">
              <span className="block text-3xl sm:text-4xl font-extrabold text-white font-mono">
                {stats.totalToday}
              </span>
              <span className="text-xs text-brand-400 uppercase tracking-wider font-semibold mt-1 block">
                Total Check-Ins Today
              </span>
            </div>

            <div className="p-4">
              <span className="block text-3xl sm:text-4xl font-extrabold text-white font-mono">
                &lt; 15s
              </span>
              <span className="text-xs text-indigo-400 uppercase tracking-wider font-semibold mt-1 block">
                Average Entry Time
              </span>
            </div>

            <div className="p-4">
              <span className="block text-3xl sm:text-4xl font-extrabold text-white font-mono">
                100%
              </span>
              <span className="text-xs text-sky-400 uppercase tracking-wider font-semibold mt-1 block">
                Audit Trail Compliance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-[#060910] border-t border-slate-900 py-12 text-slate-400 text-xs z-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white">Visitor Management System (VMS)</p>
              <p className="text-[11px] text-slate-500">Certified Software Engineering Final Year Project</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Prithwiraj731/Visitor-Management-System"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>GitHub Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setIsKioskOpen(true)}
              className="hover:text-brand-400 transition-colors"
            >
              Visitor Fast-Pass
            </button>
            <Link to="/login" className="hover:text-brand-400 transition-colors">
              Staff Portal
            </Link>
          </div>

          <p className="text-slate-500 text-[11px]">
            Designed with Titanium & Obsidian Precision Palette. © 2026.
          </p>
        </div>
      </footer>

      {/* Kiosk Modal */}
      <KioskModal
        isOpen={isKioskOpen}
        onClose={() => setIsKioskOpen(false)}
      />
    </div>
  );
};
