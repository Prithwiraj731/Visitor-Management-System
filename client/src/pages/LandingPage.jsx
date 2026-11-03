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
  Lock,
  Cpu,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Laptop,
  Printer,
  Radio,
  Terminal,
  Layers,
  MapPin,
  Sparkles,
  Zap,
  Check,
  RefreshCw,
  Eye
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('guard');
  const [currentTime, setCurrentTime] = useState('');
  const [scanSimulated, setScanSimulated] = useState(false);
  const [activeBadgePersona, setActiveBadgePersona] = useState('guest');
  const [stats, setStats] = useState({
    currentlyInside: 2,
    totalToday: 5,
    avgDurationMinutes: 42
  });
  const [recentVisits, setRecentVisits] = useState([]);

  // Live real-time clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' UTC'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real telemetry from backend
  useEffect(() => {
    dashboardService
      .getStats()
      .then((res) => {
        if (res.data?.data) {
          setStats(res.data.data);
          if (res.data.data.recentVisits) {
            setRecentVisits(res.data.data.recentVisits.slice(0, 4));
          }
        }
      })
      .catch(() => {
        // Fallback demo data if backend is offline
        setRecentVisits([
          {
            id: 'demo-1',
            visitor: { fullName: 'Alex Mercer', company: 'GenTek Dynamics' },
            host: { fullName: 'Dr. Alan Grant' },
            department: { name: 'Engineering & R&D' },
            badgeNumber: 'VMS-1001',
            status: 'checked_in'
          },
          {
            id: 'demo-2',
            visitor: { fullName: 'Sarah Connor', company: 'Cyberdyne Systems' },
            host: { fullName: 'Marcus Vance' },
            department: { name: 'Security Operations' },
            badgeNumber: 'VMS-1002',
            status: 'checked_in'
          },
          {
            id: 'demo-3',
            visitor: { fullName: 'Elena Rostova', company: 'Global Energy Corp' },
            host: { fullName: 'Claire Dearing' },
            department: { name: 'Executive Suite' },
            badgeNumber: 'VMS-1003',
            status: 'completed'
          }
        ]);
      });
  }, []);

  const handleLaunchRole = (targetPath, roleHint) => {
    if (user) {
      navigate(targetPath);
    } else {
      navigate('/login', { state: { roleHint } });
    }
  };

  const handleSimulateScan = () => {
    setScanSimulated(true);
    setTimeout(() => {
      setScanSimulated(false);
    }, 2400);
  };

  // Role gateway configs
  const roleConfigs = {
    visitor: {
      tag: 'ROLE // 01',
      badge: 'PUBLIC KIOSK',
      title: 'Visitor & Guest Self-Service',
      subtitle: 'Touchless guest check-in terminal with instant cryptographic QR pass generation.',
      features: [
        'Zero-touch smartphone check-in or physical touchscreen kiosk',
        'Automatic host employee lookup & department routing',
        'Instant ISO-standard encrypted QR badge in under 10 seconds',
        'Automated NDA acknowledgment & visitor sign-in log'
      ],
      ctaText: 'Open Guest Kiosk Pass',
      action: () => setIsKioskOpen(true),
      themeColor: '#F59E0B',
      badgeColor: 'border-amber-500/30 text-amber-400 bg-amber-500/10'
    },
    guard: {
      tag: 'ROLE // 02',
      badge: 'FRONT GATE DESK',
      title: 'Security Guard & Reception Console',
      subtitle: 'High-velocity operational terminal for perimeter verification and rapid check-in.',
      features: [
        '1-click rapid check-in and departure logging with QR scanner',
        'Thermal badge printer integration with verified barcodes',
        'Live headcount monitor with expected arrival roster',
        'Instant blacklist alerts & unauthorized entry denial'
      ],
      ctaText: 'Launch Gate Terminal',
      action: () => handleLaunchRole('/gate', 'guard'),
      themeColor: '#10B981',
      badgeColor: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
    },
    host: {
      tag: 'ROLE // 03',
      badge: 'EMPLOYEE PORTAL',
      title: 'Employee Host Workspace',
      subtitle: 'Pre-schedule client meetings and receive instant arrival alerts at your desk.',
      features: [
        'Pre-register expected guests and issue fast-pass QR invitations',
        'Instant push notification the moment your guest arrives at the gate',
        '1-click visit approval/rejection with custom security notes',
        'Meeting schedule sync & visitor history log'
      ],
      ctaText: 'Launch Host Hub',
      action: () => handleLaunchRole('/dashboard', 'host'),
      themeColor: '#38BDF8',
      badgeColor: 'border-sky-500/30 text-sky-400 bg-sky-500/10'
    },
    admin: {
      tag: 'ROLE // 04',
      badge: 'EXECUTIVE & AUDIT',
      title: 'Administration & Incident Command',
      subtitle: 'Full facility governance, life-safety evacuation roster, and compliance analytics.',
      features: [
        'Instant 1-click OSHA/ISO emergency evacuation headcount roster',
        'Direct click-to-call emergency links for all occupants on-site',
        'Staff role provisioning, department controls & audit trails',
        'Automated CSV telemetry reports for facility compliance'
      ],
      ctaText: 'Enter Admin Suite',
      action: () => handleLaunchRole('/dashboard', 'super_admin'),
      themeColor: '#E2E8F0',
      badgeColor: 'border-slate-400/30 text-slate-300 bg-slate-400/10'
    }
  };

  // Badge persona options
  const badgePersonas = {
    guest: {
      name: 'Alex Mercer',
      org: 'GenTek Dynamics Inc.',
      host: 'Dr. Alan Grant',
      dept: 'Engineering & R&D (Floor 4)',
      type: 'OFFICIAL GUEST',
      serial: 'VMS-20261103-1001',
      validUntil: '18:00 TODAY',
      clearance: 'LEVEL 2 // ESCORT REQUIRED',
      accent: 'amber'
    },
    contractor: {
      name: 'Elena Rostova',
      org: 'Apex Facility Solutions',
      host: 'Marcus Vance',
      dept: 'Security & Operations (Sub 01)',
      type: 'CONTRACTOR',
      serial: 'VMS-20261103-1002',
      validUntil: '21:00 TODAY',
      clearance: 'LEVEL 3 // CRITICAL INFRA',
      accent: 'emerald'
    },
    vip: {
      name: 'Claire Dearing',
      org: 'Masrani Global Corp',
      host: 'Super Admin',
      dept: 'Executive Boardroom (Floor 12)',
      type: 'VIP EXECUTIVE',
      serial: 'VMS-20261103-1003',
      validUntil: '23:59 TODAY',
      clearance: 'LEVEL 5 // ALL-ACCESS',
      accent: 'sky'
    }
  };

  const currentBadge = badgePersonas[activeBadgePersona];
  const activeRole = roleConfigs[selectedRoleTab];

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-black relative">
      {/* 1. Precision Technical Grid Blueprint Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* 2. Top Telemetry Status Ribbon */}
      <div className="border-b border-white/[0.06] bg-[#0A0D13] text-[11px] font-mono text-slate-400 py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PERIMETER PERMITTED // CHECKPOINT 01 ONLINE
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:inline text-slate-400">
              FACILITY: <span className="text-slate-200 font-bold">ALPHA COMPLEX</span>
            </span>
            <span className="hidden lg:inline text-slate-700">|</span>
            <span className="hidden lg:inline text-slate-400">
              DATABASE: <span className="text-amber-400 font-bold">SUPABASE POSTGRESQL</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-300 font-mono tracking-wider font-bold">
              {currentTime || '05:42:00 UTC'}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">
              INSIDE: <span className="text-white font-bold">{stats.currentlyInside} GUESTS</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Precision Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#08090C]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
          {/* Architectural Brand Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-md bg-amber-500 text-black flex items-center justify-center font-black tracking-tighter text-sm shadow-md transition-transform group-hover:scale-105">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black tracking-tight text-white text-base">
                  VMS<span className="text-amber-500">//</span>CORE
                </span>
                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
                  v4.2-SE
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                Perimeter Access Architecture
              </span>
            </div>
          </Link>

          {/* Precision Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-slate-400">
            <a href="#matrix" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">01</span> Role Gateway
            </a>
            <a href="#topology" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">02</span> System Topology
            </a>
            <a href="#telemetry" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">03</span> Live Telemetry
            </a>
            <a href="#architecture" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">04</span> Security Hardening
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsKioskOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono font-bold bg-amber-500 text-black hover:bg-amber-400 transition-all duration-150 shadow-sm active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>GUEST FAST-PASS</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono font-bold bg-white text-slate-900 hover:bg-slate-200 transition-all"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>WORKSPACE</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-xs font-mono text-slate-400 hover:text-rose-400 px-2"
                >
                  EXIT
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/[0.1] transition-all"
              >
                <span>STAFF AUTH</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 4. HERO SECTION: Asymmetric Industrial Split */}
      <section className="pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Wing (7 Cols): Architectural Statement & Role Switcher */}
          <div className="lg:col-span-7">
            {/* Classification Badge */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-sm bg-slate-900 border border-white/[0.08] text-[11px] font-mono text-slate-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-bold text-amber-400">SECURITY CLASSIFICATION // CLASS-A</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">PHYSICAL ACCESS ORCHESTRATION</span>
            </div>

            {/* Iron Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] uppercase">
              Physical Perimeter Access.<br />
              <span className="text-amber-500">Verified in 4 Seconds.</span>
            </h1>

            {/* Engineering Subtitle */}
            <p className="mt-6 text-base text-slate-400 leading-relaxed max-w-xl">
              An architectural visitor management platform engineered for corporate and defense facilities. Replaces manual paper logbooks with tamper-evident cryptographic QR badges, automated host dispatch, and live OSHA life-safety evacuation accountability.
            </p>

            {/* Interactive Tactile Role Switcher Deck */}
            <div className="mt-8 pt-6 border-t border-white/[0.08]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  SELECT PERIMETER ROLE GATEWAY:
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  CLICK TO PREVIEW WORKSPACE
                </span>
              </div>

              {/* 4 Role Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'visitor', num: '01', label: 'Guest Kiosk' },
                  { id: 'guard', num: '02', label: 'Guard Terminal' },
                  { id: 'host', num: '03', label: 'Host Workspace' },
                  { id: 'admin', num: '04', label: 'Admin & OSHA' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRoleTab(item.id)}
                    className={`px-3 py-2.5 rounded-md text-xs font-mono font-bold transition-all text-left flex flex-col justify-between border ${
                      selectedRoleTab === item.id
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white border-white/[0.08] hover:border-white/[0.2]'
                    }`}
                  >
                    <span className="text-[10px] opacity-70">{item.num} //</span>
                    <span className="mt-0.5">{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Active Role Quick Launcher Bar */}
              <div className="mt-4 p-4 rounded-lg bg-[#0F131C] border border-white/[0.1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${activeRole.badgeColor}`}>
                      {activeRole.tag} // {activeRole.badge}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {activeRole.title}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-md line-clamp-1">
                    {activeRole.subtitle}
                  </p>
                </div>

                <button
                  onClick={activeRole.action}
                  className="px-5 py-2.5 rounded-md text-xs font-mono font-bold bg-white hover:bg-slate-200 text-slate-950 flex items-center gap-2 shrink-0 transition-transform active:scale-[0.97] shadow"
                >
                  <span>{activeRole.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Specs Ticker */}
              <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.05] text-center sm:text-left">
                <div>
                  <div className="text-lg font-mono font-black text-white">0% PAPER</div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Tamper-Proof Audit</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-black text-amber-400">&lt; 4.2 SEC</div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Check-In Velocity</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-black text-emerald-400">100% OSHA</div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Life-Safety Roster</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Wing (5 Cols): Physical 3D Digital Smart Badge Simulator */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Persona Switcher Buttons above the badge */}
            <div className="w-full max-w-sm mb-3 flex items-center justify-between bg-slate-900/90 p-1 rounded-md border border-white/[0.08] text-[10px] font-mono">
              <span className="text-slate-400 px-2 font-bold uppercase">BADGE SIM:</span>
              <div className="flex gap-1">
                {Object.keys(badgePersonas).map((key) => (
                  <button
                    key={key}
                    onClick={() => setActiveBadgePersona(key)}
                    className={`px-2.5 py-1 rounded transition-colors uppercase font-bold ${
                      activeBadgePersona === key
                        ? 'bg-amber-500 text-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Card Container with Lanyard Cutout */}
            <div className="w-full max-w-sm bg-[#0E121A] border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl relative transition-all duration-300">
              {/* Lanyard Top Fixture */}
              <div className="w-full bg-[#080B10] py-3.5 border-b border-white/[0.08] flex justify-center items-center gap-2 relative">
                {/* Metallic Clip Simulation */}
                <div className="w-16 h-2 rounded-full bg-[#1F2736] border border-slate-600/60 shadow-inner" />
                <div className="absolute right-4 top-3 flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>13.56MHz NFC</span>
                </div>
              </div>

              {/* Holographic Security Foil Strip */}
              <div className="w-full h-2 hologram-strip" />

              {/* Badge Header Bar */}
              <div className="p-4 bg-[#141A24] border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                      FACILITY ACCESS CREDENTIAL
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    SN: <span className="text-white font-bold">{currentBadge.serial}</span>
                  </span>
                </div>
                <span className="text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>

              {/* Badge Body */}
              <div className="p-5 flex flex-col items-center text-center">
                {/* QR Code Container with Animated Laser Scanner */}
                <div className="p-3 bg-white rounded-xl shadow-inner mb-4 relative overflow-hidden group">
                  {/* The Live Laser Line Sweep */}
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_8px_#ef4444] animate-laser z-10 pointer-events-none" />

                  {/* QR Image */}
                  <div className="w-32 h-32 bg-slate-950 rounded flex items-center justify-center relative">
                    <QrCode className="w-28 h-28 text-amber-400" />

                    {/* Simulation Scan Overlay */}
                    {scanSimulated && (
                      <div className="absolute inset-0 bg-emerald-950/90 rounded flex flex-col items-center justify-center p-2 text-center text-emerald-400 animate-fadeIn">
                        <CheckCircle2 className="w-10 h-10 mb-1" />
                        <span className="text-[10px] font-mono font-black uppercase tracking-wider">
                          ACCESS GRANTED
                        </span>
                        <span className="text-[8px] font-mono text-slate-300">
                          PERIMETER CLEARED
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[8px] font-mono text-black font-black uppercase">
                    <span>SHA-256</span>
                    <span className="text-emerald-700">VERIFIED</span>
                  </div>
                </div>

                {/* Identity Metadata */}
                <h3 className="text-xl font-black text-white tracking-tight">
                  {currentBadge.name}
                </h3>
                <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                  {currentBadge.org}
                </p>

                {/* Classification pill */}
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-300 border border-white/[0.08]">
                  <span>{currentBadge.type}</span>
                </div>

                {/* Parameter Details Matrix */}
                <div className="w-full mt-4 pt-3 border-t border-white/[0.08] text-left text-xs font-mono space-y-1.5">
                  <div className="flex justify-between items-center py-0.5 border-b border-white/[0.05]">
                    <span className="text-slate-400 text-[11px]">ASSIGNED HOST:</span>
                    <span className="text-white font-bold">{currentBadge.host}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-white/[0.05]">
                    <span className="text-slate-400 text-[11px]">WING/DEPT:</span>
                    <span className="text-slate-200">{currentBadge.dept}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-white/[0.05]">
                    <span className="text-slate-400 text-[11px]">CLEARANCE:</span>
                    <span className="text-amber-400 font-bold text-[10px]">
                      {currentBadge.clearance}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 text-[11px]">EXPIRATION:</span>
                    <span className="text-emerald-400 font-bold">{currentBadge.validUntil}</span>
                  </div>
                </div>

                {/* Interactive Badge Controls */}
                <div className="w-full mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSimulateScan}
                    className="py-2 px-3 rounded-md text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>TEST SCAN</span>
                  </button>

                  <button
                    onClick={() => setIsKioskOpen(true)}
                    className="py-2 px-3 rounded-md text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white border border-white/[0.1] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>ISSUE PASS</span>
                  </button>
                </div>
              </div>

              {/* Bottom Security Instructions */}
              <div className="bg-[#080B10] py-2 px-4 border-t border-white/[0.08] text-[9px] font-mono text-slate-400 text-center uppercase tracking-widest">
                Surrender to gate guard upon facility exit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SYSTEM MODULE 01: Interactive Role Gateway Console */}
      <section id="matrix" className="py-20 bg-[#0A0D13] border-y border-white/[0.06] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest block mb-1">
                SYSTEM MODULE 01 // RBAC ISOLATION
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                Role-Based Operational Terminals
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-2 md:mt-0 max-w-md">
              Every persona operates within an isolated, certified authorization perimeter with 1-click test access.
            </p>
          </div>

          {/* Master-Detail Terminal View */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: 4 Selectable Roles */}
            <div className="lg:col-span-5 space-y-3">
              {Object.entries(roleConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRoleTab(key)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedRoleTab === key
                      ? 'bg-[#121722] border-amber-500/80 shadow-lg'
                      : 'bg-[#0E121A] border-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${config.badgeColor}`}>
                      {config.tag} // {config.badge}
                    </span>
                    {selectedRoleTab === key && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{config.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{config.subtitle}</p>
                </button>
              ))}
            </div>

            {/* Right Column: Terminal Specification Preview & Direct Trigger */}
            <div className="lg:col-span-7 bg-[#0E121A] border border-white/[0.08] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Console Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] font-mono text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <span className="text-white font-bold">TERMINAL SESSION // {activeRole.badge}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">STATUS: ONLINE</span>
                </div>

                {/* Role Details */}
                <div className="mt-6">
                  <h3 className="text-2xl font-black text-white tracking-tight">{activeRole.title}</h3>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{activeRole.subtitle}</p>

                  <div className="mt-6 space-y-2.5">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
                      VERIFIED CAPABILITIES & ACCESS SCOPE:
                    </span>
                    {activeRole.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Launch & Test Credentials Footer */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] font-mono text-slate-400">
                  {selectedRoleTab === 'visitor' ? (
                    <span className="text-amber-400 font-semibold">PUBLIC ACCESS • NO STAFF LOGIN REQUIRED</span>
                  ) : (
                    <span>TEST CREDENTIALS PRE-CONFIGURED ON LOGIN PAGE</span>
                  )}
                </div>

                <button
                  onClick={activeRole.action}
                  className="w-full sm:w-auto px-6 py-3 rounded-md text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <span>{activeRole.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. SYSTEM MODULE 02: Access Lifecycle Blueprint (Step Pipeline) */}
      <section id="topology" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20">
            SYSTEM MODULE 02 // ACCESS TOPOLOGY
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase mt-3">
            Zero-Friction 4-Stage Lifecycle
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-2">
            Every access request follows an auditable, deterministic state machine from pre-arrival to exit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08] relative">
            <div className="text-2xl font-mono font-black text-amber-500/40 mb-3">01 //</div>
            <h4 className="text-base font-bold text-white mb-2">Pre-Registration or Kiosk</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visitor inputs company, contact details, and selects employee host via contactless phone scan or touch kiosk.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08] relative">
            <div className="text-2xl font-mono font-black text-amber-500/40 mb-3">02 //</div>
            <h4 className="text-base font-bold text-white mb-2">Automated Host Dispatch</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              System notifies host employee via instant websocket/push alert. Host approves clearance with custom instructions.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08] relative">
            <div className="text-2xl font-mono font-black text-amber-500/40 mb-3">03 //</div>
            <h4 className="text-base font-bold text-white mb-2">Gate QR Verification</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Security guard scans visitor QR code at front gate desk, prints thermal badge, and logs entry timestamp in 1-click.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08] relative">
            <div className="text-2xl font-mono font-black text-amber-500/40 mb-3">04 //</div>
            <h4 className="text-base font-bold text-white mb-2">Life-Safety Roster</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guest is tracked on the real-time building occupancy headcount for emergency OSHA evacuation until checkout.
            </p>
          </div>
        </div>
      </section>

      {/* 7. SYSTEM MODULE 03: Live Facility Telemetry Stream */}
      <section id="telemetry" className="py-20 bg-[#0A0D13] border-y border-white/[0.06] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                SYSTEM MODULE 03 // LIVE OCCUPANCY STREAM
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                Facility Access Telemetry
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2 md:mt-0">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{stats.currentlyInside} GUESTS INSIDE</span>
              </span>
              <span>•</span>
              <span>{stats.totalToday} CHECK-INS TODAY</span>
              <span>•</span>
              <span>AVG STAY: {stats.avgDurationMinutes}m</span>
            </div>
          </div>

          {/* Telemetry Table */}
          <div className="bg-[#0E121A] rounded-xl border border-white/[0.08] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141A24] text-slate-400 uppercase tracking-wider border-b border-white/[0.08]">
                  <tr>
                    <th className="px-5 py-3">Visitor Name</th>
                    <th className="px-5 py-3">Organization</th>
                    <th className="px-5 py-3">Assigned Host</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Badge Serial</th>
                    <th className="px-5 py-3">Checkpoint Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-300">
                  {recentVisits.length > 0 ? (
                    recentVisits.map((v) => (
                      <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white">{v.visitor?.fullName}</td>
                        <td className="px-5 py-3.5 text-slate-400">{v.visitor?.company || 'Personal Guest'}</td>
                        <td className="px-5 py-3.5 text-slate-200">{v.host?.fullName}</td>
                        <td className="px-5 py-3.5 text-slate-400">{v.department?.name || 'General Facility'}</td>
                        <td className="px-5 py-3.5 text-amber-400 font-bold">{v.badgeNumber || 'PENDING'}</td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              v.status === 'checked_in'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-white/[0.08]'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {v.status === 'checked_in' ? 'Inside Building' : v.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500">
                        Telemetry stream active. Live entries appear automatically.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SYSTEM MODULE 04: Engineering & Security Standards */}
      <section id="architecture" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-800 px-3 py-1 rounded border border-white/[0.08]">
            SOFTWARE ENGINEERING STANDARDS
          </span>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase mt-3">
            Defensive Security Architecture
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-2">
            Engineered with strict client-server separation, relational foreign keys, and zero security compromises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08]">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold mb-4 border border-amber-500/20">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-mono">OWASP Top 10 Hardened</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Full defense suite including Helmet HTTP security headers, CORS strictness, bcrypt 10-round salted password hashing, and parameterized SQL queries to eliminate SQL injections.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08]">
            <div className="w-9 h-9 rounded-md bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold mb-4 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-mono">Life-Safety Evacuation Engine</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              1-click emergency evacuation roster delivering instant headcount of every human located inside premises with building wing locations and click-to-call emergency coordinator links.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-[#0E121A] border border-white/[0.08]">
            <div className="w-9 h-9 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-4 border border-emerald-500/20">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-white uppercase font-mono">Dual-Dialect SQL Architecture</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Sequelize ORM configured for zero-friction local SQLite development and cloud production PostgreSQL (Supabase / Render) with relational integrity and automated seeders.
            </p>
          </div>
        </div>
      </section>

      {/* 9. Minimalist Precision Footer */}
      <footer className="bg-[#06080B] border-t border-white/[0.06] py-12 text-slate-400 text-xs font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500 text-black flex items-center justify-center font-black">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wider">VISITOR MANAGEMENT SYSTEM (VMS)</span>
              <p className="text-[10px] text-slate-400">FINAL YEAR SOFTWARE ENGINEERING CAPSTONE PROJECT</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a
              href="https://github.com/Prithwiraj731/Visitor-Management-System"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <span>GITHUB REPO</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => setIsKioskOpen(true)} className="hover:text-amber-400 transition-colors">
              GUEST PASS
            </button>
            <Link to="/login" className="hover:text-amber-400 transition-colors">
              STAFF PORTAL
            </Link>
            <Link to="/supabase-test" className="hover:text-amber-400 transition-colors">
              SUPABASE TEST
            </Link>
          </div>

          <p className="text-slate-400 text-[10px]">
            PRECISION TITANIUM & SIGNAL AMBER PALETTE • 2026
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
