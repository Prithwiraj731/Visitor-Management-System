import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KioskModal } from '../components/visitors/KioskModal';
import { dashboardService, visitService } from '../services/api';
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
  FileSpreadsheet,
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
  Phone
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('guard');
  const [stats, setStats] = useState({
    currentlyInside: 2,
    totalToday: 5,
    avgDurationMinutes: 45
  });
  const [recentVisits, setRecentVisits] = useState([]);

  useEffect(() => {
    dashboardService.getStats().then((res) => {
      if (res.data?.data) {
        setStats(res.data.data);
        if (res.data.data.recentVisits) {
          setRecentVisits(res.data.data.recentVisits.slice(0, 4));
        }
      }
    }).catch(() => {
      // fallback
    });
  }, []);

  const handleLaunchRole = (targetPath, roleHint) => {
    if (user) {
      navigate(targetPath);
    } else {
      navigate('/login', { state: { roleHint } });
    }
  };

  const roleConfigs = {
    visitor: {
      tag: 'ROLE_01 // PUBLIC KIOSK',
      title: 'Visitor & Guest Self-Service',
      subtitle: 'Contactless self-registration terminal for walk-ins and pre-cleared guests.',
      features: [
        'Zero-touch smartphone check-in or touchscreen kiosk',
        'Automatic host employee lookup & department routing',
        'Instant cryptographic QR badge generated in under 10 seconds',
        'No staff assistance or physical logbook required'
      ],
      ctaText: 'Open Visitor Kiosk Pass',
      action: () => setIsKioskOpen(true),
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
      terminalPreview: {
        command: 'KIOSK_REGISTRATION_DAEMON --mode=public',
        status: 'READY FOR GUEST INPUT',
        detail: 'Generates ISO-compliant digital badge pass with host arrival push notification.'
      }
    },
    guard: {
      tag: 'ROLE_02 // PERIMETER SECURITY',
      title: 'Front Gate & Checkpoint Desk',
      subtitle: 'High-velocity operational terminal for security guards and receptionists.',
      features: [
        '1-click rapid check-in and departure logging',
        'Thermal badge printer integration with verified QR codes',
        'Real-time headcount monitor with expected arrival roster',
        'Instant identity verification & security notes'
      ],
      ctaText: 'Launch Gate Operations Console',
      action: () => handleLaunchRole('/gate', 'guard'),
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
      terminalPreview: {
        command: 'GATE_TERMINAL_SESSION --guard="Marcus Vance"',
        status: 'LANE 01 ACTIVE // 2 GUESTS INSIDE',
        detail: 'Direct control of checkpoint arrivals, pass printing, and perimeter logs.'
      }
    },
    host: {
      tag: 'ROLE_03 // EMPLOYEE HOST',
      title: 'Host Employee Workspace',
      subtitle: 'Employee dashboard for pre-scheduling clients and approving visitor arrivals.',
      features: [
        'Pre-register expected clients and generate advance invite links',
        'Instant push arrival notification when your guest reaches the gate',
        '1-tap visit approval or rejection with custom instructions',
        'Personal visitor history and NDA verification logs'
      ],
      ctaText: 'Launch Host Hub (Dr. Alan Grant)',
      action: () => handleLaunchRole('/dashboard', 'host'),
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
      terminalPreview: {
        command: 'HOST_DISPATCH_CLIENT --user="Dr. Alan Grant"',
        status: '1 VISIT PENDING APPROVAL',
        detail: 'Review incoming meeting candidates and trigger automated front desk clearance.'
      }
    },
    admin: {
      tag: 'ROLE_04 // EXECUTIVE & AUDIT',
      title: 'Administration & Incident Control',
      subtitle: 'Enterprise governance, facility compliance, and emergency life-safety telemetry.',
      features: [
        'Instant 1-click OSHA/ISO emergency evacuation headcount roster',
        'Direct click-to-call links for all visitors & hosts during crisis',
        'Department headcount monitoring & staff role management',
        'One-click CSV compliance and audit telemetry exports'
      ],
      ctaText: 'Enter Executive Command Suite',
      action: () => handleLaunchRole('/dashboard', 'super_admin'),
      badgeColor: 'border-slate-400/40 text-slate-300 bg-slate-400/10',
      terminalPreview: {
        command: 'SUPER_ADMIN_SYSCONTROL --scope=global',
        status: 'SECURITY AUDIT READY // 100% COMPLIANT',
        detail: 'Full organizational control, staff provisioning, and emergency crisis tools.'
      }
    }
  };

  const activeConfig = roleConfigs[selectedRoleTab];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-black relative">
      {/* Precision Hairline Architectural Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

      {/* Top Precision Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0B0E14]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3.5 flex items-center justify-between">
          {/* Brand Wordmark & Location */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-black flex items-center justify-center font-black tracking-tighter text-sm shadow-md">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold tracking-tight text-white text-base">
                  VMS<span className="text-amber-500">//</span>CORE
                </span>
                <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded">
                  OS-4.2
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">
                Perimeter Access Architecture
              </span>
            </div>
          </Link>

          {/* Navigation Anchors */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono uppercase tracking-wider text-slate-400">
            <a href="#matrix" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">01</span> Role Matrix
            </a>
            <a href="#live-roster" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">02</span> Live Telemetry
            </a>
            <a href="#engineering" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <span className="text-amber-500 text-[10px]">03</span> SE Architecture
            </a>
          </nav>

          {/* Right Action Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsKioskOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/30 transition-all duration-150"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>GUEST FAST-PASS</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-900 hover:bg-white transition-all shadow-sm"
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
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all"
              >
                <span>STAFF AUTH</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Architectural Hero: Asymmetric Split */}
      <section className="pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: High-Impact Typography & Narrative */}
          <div className="lg:col-span-7">
            {/* Minimalist Beacon */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-300">FACILITY GATEWAY ACTIVE</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-400">100% ACCOUNTABILITY</span>
            </div>

            {/* Iron 2-Line Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] uppercase font-sans">
              Who enters.<br />
              Who authorizes.<br />
              <span className="text-amber-500">In 4 seconds.</span>
            </h1>

            {/* Concrete Copy */}
            <p className="mt-6 text-base text-slate-400 leading-relaxed max-w-xl">
              An architectural visitor access control platform engineered for high-security commercial facilities. Eliminates paper logs with cryptographic QR passes, instant host arrival dispatch, and life-safety evacuation telemetry.
            </p>

            {/* Interactive Tactile Role Switcher Dock */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3 font-semibold">
                SELECT PERIMETER ROLE GATEWAY:
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'visitor', label: '01 / Guest Kiosk' },
                  { id: 'guard', label: '02 / Guard Terminal' },
                  { id: 'host', label: '03 / Host Hub' },
                  { id: 'admin', label: '04 / Admin Suite' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedRoleTab(item.id)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-mono font-bold transition-all text-left flex flex-col justify-between border ${
                      selectedRoleTab === item.id
                        ? 'bg-amber-500 text-black border-amber-400 shadow-md scale-[1.02]'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Active Role Quick Launcher Bar */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-amber-400 font-semibold uppercase">
                    {activeConfig.tag}
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {activeConfig.title}
                  </div>
                </div>

                <button
                  onClick={activeConfig.action}
                  className="px-5 py-2.5 rounded-lg text-xs font-mono font-bold bg-white hover:bg-slate-100 text-slate-950 flex items-center gap-2 shrink-0 transition-transform active:scale-[0.98] shadow"
                >
                  <span>{activeConfig.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Physical Digital Smart Badge (Interactive High-Craft Card) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm bg-[#111620] border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl relative">
              {/* Lanyard Cutout Slot */}
              <div className="w-full bg-[#0E121A] py-3 border-b border-slate-800 flex justify-center">
                <div className="w-16 h-2 rounded-full bg-[#1F2736] border border-slate-700/60" />
              </div>

              {/* Badge Security Header */}
              <div className="p-5 border-b border-slate-800 bg-[#141B26]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                      PERIMETER CLEARANCE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                    ACTIVE PASS
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-400">
                  SERIAL: <span className="text-white font-bold">VMS-20261103-1001</span>
                </div>
              </div>

              {/* Badge Body */}
              <div className="p-6 flex flex-col items-center text-center">
                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-xl shadow-inner mb-4 relative group">
                  <div className="w-36 h-36 bg-slate-900 rounded flex items-center justify-center">
                    <QrCode className="w-28 h-28 text-amber-400" />
                  </div>
                  <span className="absolute bottom-1 right-2 text-[8px] font-mono text-black font-bold uppercase">
                    ENCRYPTED
                  </span>
                </div>

                {/* Visitor Information */}
                <h3 className="text-xl font-bold text-white tracking-tight">Alex Mercer</h3>
                <p className="text-xs font-mono text-amber-400 font-semibold mt-0.5">GenTek Dynamics Inc.</p>

                {/* Clearance Matrix */}
                <div className="w-full mt-5 pt-4 border-t border-slate-800/80 text-left text-xs font-mono space-y-2">
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-800/50">
                    <span className="text-slate-400">HOST:</span>
                    <span className="text-slate-200 font-bold">Dr. Alan Grant</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-slate-800/50">
                    <span className="text-slate-400">WING/FLOOR:</span>
                    <span className="text-slate-200 font-bold">Engineering • 4F</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400">ENTRY TIME:</span>
                    <span className="text-emerald-400 font-bold">TODAY, 08:30 AM</span>
                  </div>
                </div>

                {/* Badge Action Buttons */}
                <div className="w-full mt-6 flex gap-2">
                  <button
                    onClick={() => setIsKioskOpen(true)}
                    className="flex-1 py-2 px-3 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black transition-colors"
                  >
                    GENERATE YOURS
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="py-2 px-3 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors"
                    title="Print Test Pass"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bottom Security Strip */}
              <div className="bg-[#0E121A] py-2 px-4 border-t border-slate-800 text-[9px] font-mono text-slate-400 text-center uppercase tracking-widest">
                Surrender to gate security upon building departure
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Role Matrix Console (Deep Architectural Explorer) */}
      <section id="matrix" className="py-20 bg-[#0E131C] border-y border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest block mb-1">
                SYSTEM MODULE 01 // OPERATIONAL WORKSPACES
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                The Role Gateway Console
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-2 md:mt-0 max-w-md">
              Every persona operates within an isolated, certified RBAC authorization perimeter.
            </p>
          </div>

          {/* Master-Detail Interactive Terminal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column: 4 Selectable Role Tiles */}
            <div className="lg:col-span-5 space-y-3">
              {Object.entries(roleConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRoleTab(key)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedRoleTab === key
                      ? 'bg-[#151C28] border-amber-500/70 shadow-lg'
                      : 'bg-[#10151E] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${config.badgeColor}`}>
                      {config.tag}
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
            <div className="lg:col-span-7 bg-[#10151E] border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {/* Console Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 font-mono text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-500" />
                    <span>{activeConfig.terminalPreview.command}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">{activeConfig.terminalPreview.status}</span>
                </div>

                {/* Role Details */}
                <div className="mt-6">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{activeConfig.title}</h3>
                  <p className="text-sm text-slate-300 mt-1 leading-relaxed">{activeConfig.subtitle}</p>

                  <div className="mt-6 space-y-2.5">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
                      VERIFIED OPERATIONAL RESPONSIBILITIES:
                    </span>
                    {activeConfig.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Launch & Test Credentials Footer */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-[11px] font-mono text-slate-400">
                  {selectedRoleTab === 'visitor' ? (
                    <span>PUBLIC ACCESS • NO STAFF CREDENTIALS REQUIRED</span>
                  ) : (
                    <span>AUTHENTICATION: 1-CLICK DEMO SESSION AVAILABLE</span>
                  )}
                </div>

                <button
                  onClick={activeConfig.action}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
                >
                  <span>{activeConfig.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Live Facility Telemetry & Current Roster (Actual Backend Data Stream) */}
      <section id="live-roster" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1">
              SYSTEM MODULE 02 // REAL-TIME ACCESS LOG
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">
              Current Facility Telemetry
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2 md:mt-0">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{stats.currentlyInside} GUESTS INSIDE</span>
            </span>
            <span>•</span>
            <span>{stats.totalToday} CHECK-INS TODAY</span>
          </div>
        </div>

        {/* Live Roster Table */}
        <div className="bg-[#10151E] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#141B26] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3">Visitor Name</th>
                  <th className="px-5 py-3">Company</th>
                  <th className="px-5 py-3">Host Contact</th>
                  <th className="px-5 py-3">Assigned Department</th>
                  <th className="px-5 py-3">Badge Serial</th>
                  <th className="px-5 py-3">Checkpoint Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {recentVisits.length > 0 ? (
                  recentVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-white">{v.visitor?.fullName}</td>
                      <td className="px-5 py-3.5 text-slate-400">{v.visitor?.company || 'Personal Guest'}</td>
                      <td className="px-5 py-3.5 text-slate-200">{v.host?.fullName}</td>
                      <td className="px-5 py-3.5 text-slate-400">{v.department?.name || 'General Access'}</td>
                      <td className="px-5 py-3.5 text-amber-400 font-bold">{v.badgeNumber || 'PENDING'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.status === 'checked_in'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {v.status === 'checked_in' ? 'Inside Building' : v.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-500">
                      Telemetry sync active. Live entries will appear here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Engineering Architecture & Incident Control Section */}
      <section id="engineering" className="py-20 bg-[#0E131C] border-t border-slate-800/80 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-800/80 px-3 py-1 rounded border border-slate-700">
              SOFTWARE ENGINEERING CERTIFICATION
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mt-3">
              Built to Stringent SE & Security Specs
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-2">
              Layered client-server architecture with relational database constraints and zero security compromises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="p-6 rounded-xl bg-[#10151E] border border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold mb-4">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">OWASP Top 10 Hardened</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Full protection suite including Helmet HTTP security headers, CORS strictness, bcrypt 10-round salted password hashing, and parameterized SQL queries to prevent SQL injections.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-6 rounded-xl bg-[#10151E] border border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold mb-4">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">Life-Safety Evacuation Engine</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                1-click emergency evacuation roster delivering instant headcount of every human located inside premises with building wing locations and click-to-call links for emergency commanders.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-6 rounded-xl bg-[#10151E] border border-slate-800">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-4">
                <Cpu className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase font-mono">Dual-Dialect SQL Architecture</h4>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sequelize ORM configured for zero-friction local SQLite development and cloud production PostgreSQL (Supabase / Render) with foreign key integrity and automated seeders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Minimalist Precision Footer */}
      <footer className="bg-[#080B10] border-t border-slate-900 py-12 text-slate-400 text-xs font-mono relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500 text-black flex items-center justify-center font-black">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wider">VISITOR MANAGEMENT SYSTEM (VMS)</span>
              <p className="text-[10px] text-slate-500">FINAL YEAR SOFTWARE ENGINEERING PROJECT SUBMISSION</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a
              href="https://github.com/Prithwiraj731/Visitor-Management-System"
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 flex items-center gap-1 transition-colors"
            >
              <span>GITHUB REPOSITORY</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button onClick={() => setIsKioskOpen(true)} className="hover:text-amber-400 transition-colors">
              GUEST PASS
            </button>
            <Link to="/login" className="hover:text-amber-400 transition-colors">
              STAFF PORTAL
            </Link>
          </div>

          <p className="text-slate-600 text-[10px]">
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
