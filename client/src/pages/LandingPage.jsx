import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, BadgeCheck, Building2, CheckCircle2, Clock, DoorOpen, Github,
  LogIn, LogOut, Menu, Nfc, ScanLine, ShieldCheck, Siren, UserCheck, Users, X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { KioskModal } from '../components/visitors/KioskModal';
import { dashboardService } from '../services/api';

const BRAND = 'VMS Enterprise';
const REPO_URL = 'https://github.com/Prithwiraj731/Visitor-Management-System';

/* ───────────────────────── static content ───────────────────────── */

const ROLES = [
  {
    id: 'visitor', icon: DoorOpen, label: 'Visitor self-pass', path: null,
    headline: 'Walk in. Get badged. No account needed.',
    blurb: 'Guests check themselves in at the kiosk, notify their host and receive a verified badge in seconds.',
    points: ['No login or app download required', 'Host is notified the moment you arrive', 'Encrypted badge ready to scan at the gate'],
    cta: 'Start check-in',
  },
  {
    id: 'guard', icon: ShieldCheck, label: 'Guard gate desk', path: '/gate',
    headline: 'One screen for everyone at the door.',
    blurb: 'Scan badges, admit or hold arrivals, and see who is expected next without leaving the desk.',
    points: ['Scan or search to verify in one step', 'Hold, deny or escort with a reason on record', 'Shift handover shows who is still on site'],
    cta: 'Open gate desk',
  },
  {
    id: 'host', icon: UserCheck, label: 'Employee host', path: '/dashboard',
    headline: 'Invite guests before they arrive.',
    blurb: 'Pre-register visitors, approve walk-ins and get told when your guest is at reception.',
    points: ['Pre-register a guest in under a minute', 'Approve or decline walk-ins from your phone', 'Check guests out when the meeting ends'],
    cta: 'Open host console',
  },
  {
    id: 'admin', icon: Building2, label: 'Super admin', path: '/dashboard',
    headline: 'Policy, sites and audit in one place.',
    blurb: 'Configure access rules per site, manage staff roles and export a complete visit history.',
    points: ['Per-site rules, blocklists and badge types', 'Role-based access for every staff member', 'Exportable audit trail for every entry and exit'],
    cta: 'Open admin console',
  },
];

const PERSONAS = {
  guest: {
    label: 'Guest', accent: '#38BDF8', name: 'Maya Chen', tag: 'Guest',
    host: 'Dr. Alan Grant', access: 'Lobby · Engineering & R&D', valid: 'Valid today until 17:30',
  },
  contractor: {
    label: 'Contractor', accent: '#F59E0B', name: 'Rahul Verma', tag: 'Contractor',
    host: 'Marcus Vance', access: 'Security Operations · Sub 01', valid: 'Valid today until 18:00',
  },
  vip: {
    label: 'VIP', accent: '#10B981', name: 'Elena Rossi', tag: 'VIP guest',
    host: 'Executive Suite', access: 'Executive Boardroom · Floor 12', valid: 'Valid today until 21:00',
  },
};

const FALLBACK_STATS = { currentlyInside: 2, totalToday: 8, avgDurationMinutes: 38 };

const FALLBACK_VISITS = [
  { id: 'v1', name: 'Alex Mercer', host: 'Dr. Alan Grant', area: 'Engineering & R&D', time: '09:12', status: 'inside' },
  { id: 'v2', name: 'Sarah Connor', host: 'Marcus Vance', area: 'Security Ops', time: '09:04', status: 'inside' },
  { id: 'v3', name: 'Elena Rossi', host: 'Executive Suite', area: 'Boardroom', time: '08:57', status: 'inside' },
  { id: 'v4', name: 'David Sterling', host: 'Claire Dearing', area: 'Reception', time: '08:41', status: 'pending' },
  { id: 'v5', name: 'Hannah Becker', host: 'Admin Team', area: 'Level 2', time: '08:30', status: 'left' },
];

const STATUS_STYLE = {
  inside: { label: 'On site', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  pending: { label: 'Awaiting host', dot: 'bg-amber-400', text: 'text-amber-300' },
  left: { label: 'Checked out', dot: 'bg-white/30', text: 'text-white/50' },
};

const cx = (...a) => a.filter(Boolean).join(' ');

const normalizeVisit = (v, i) => ({
  id: v.id ?? v._id ?? `visit-${i}`,
  name: v.visitor?.fullName ?? v.visitorName ?? v.visitor_name ?? v.name ?? 'Visitor',
  host: v.host?.fullName ?? v.hostName ?? v.host_name ?? v.host ?? '—',
  area: v.department?.name ?? v.area ?? v.location ?? v.purpose ?? 'Reception',
  time: v.time ?? (v.checkInTime || v.check_in_time || v.checkIn
    ? new Date(v.checkInTime ?? v.check_in_time ?? v.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '—'),
  status: String(v.status ?? 'inside').toLowerCase().replace(/[^a-z]/g, '').includes('out') || v.status === 'completed' ? 'left'
    : String(v.status ?? '').toLowerCase().includes('pend') ? 'pending' : 'inside',
});

const initials = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

/* ───────────────────────── page ───────────────────────── */

export function LandingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [selectedRoleTab, setSelectedRoleTab] = useState('guard'); // 'guard' | 'visitor' | 'host' | 'admin'
  const [currentTime, setCurrentTime] = useState(new Date());
  const [scanSimulated, setScanSimulated] = useState(false);
  const [activeBadgePersona, setActiveBadgePersona] = useState('guest'); // 'guest' | 'contractor' | 'vip'
  const [stats, setStats] = useState(FALLBACK_STATS);
  const [recentVisits, setRecentVisits] = useState(FALLBACK_VISITS);
  const [menuOpen, setMenuOpen] = useState(false);

  const scanTimer = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* telemetry with fallback demo data */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await dashboardService.getStats();
        if (!alive || !res) return;
        const data = res.data?.data || res.data;
        if (!data) return;
        setStats((prev) => ({
          currentlyInside: data.currentlyInside ?? data.currently_inside ?? prev.currentlyInside,
          totalToday: data.totalToday ?? data.total_today ?? prev.totalToday,
          avgDurationMinutes: data.avgDurationMinutes ?? data.avg_duration_minutes ?? prev.avgDurationMinutes,
        }));
        const list = data.recentVisits ?? data.recent_visits ?? data.recentActivity;
        if (Array.isArray(list) && list.length) setRecentVisits(list.slice(0, 8).map(normalizeVisit));
      } catch {
        /* keep fallback demo data */
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => clearTimeout(scanTimer.current), []);

  /* routing: authenticated → straight to console, otherwise /login with role hint */
  const handleLaunchRole = (targetPath, roleHint) => {
    if (user) navigate(targetPath);
    else navigate('/login', { state: { roleHint } });
  };

  const launchRole = (role) => {
    if (role.id === 'visitor') setIsKioskOpen(true); // public fast-path, no login
    else handleLaunchRole(role.path, role.id);
  };

  const runScan = useCallback(() => {
    if (scanSimulated) return;
    setScanSimulated(true);
    clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => setScanSimulated(false), 3200);
  }, [scanSimulated]);

  const persona = PERSONAS[activeBadgePersona];
  const role = ROLES.find((r) => r.id === selectedRoleTab) ?? ROLES[0];
  const RoleIcon = role.icon;

  const clock = currentTime.toLocaleTimeString('en-GB', { hour12: false });
  const dateLabel = currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const qrCells = useMemo(() => {
    let s = [...activeBadgePersona].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919;
    const out = [];
    for (let r = 0; r < 11; r++) for (let c = 0; c < 11; c++) {
      const inFinder = (c < 3 && r < 3) || (c > 7 && r < 3) || (c < 3 && r > 7);
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      if (!inFinder && (s >> 16) & 1) out.push([c, r]);
    }
    return out;
  }, [activeBadgePersona]);

  const onTilt = (e) => {
    const b = e.currentTarget.getBoundingClientRect();
    setTilt({ x: ((e.clientY - b.top) / b.height - 0.5) * -8, y: ((e.clientX - b.left) / b.width - 0.5) * 10 });
  };

  const insidePct = Math.min(1, stats.currentlyInside / Math.max(stats.totalToday, 1));
  const ringC = 2 * Math.PI * 54;

  const NAV = [['Gateway', '#gateway'], ['Live feed', '#live'], ['Safety', '#safety']];

  return (
    <div className="vms-page relative min-h-screen overflow-x-clip bg-[#070A11] font-body text-white antialiased selection:bg-amber-400/30">
      <div className="vms-mesh pointer-events-none absolute inset-x-0 top-0 h-[900px]" aria-hidden />
      <div className="vms-grain pointer-events-none absolute inset-0" aria-hidden />

      {/* ───── header ───── */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="vms-glass mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 sm:px-5">
          <a href="#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-b from-amber-300 to-amber-500 text-[#1a1203] shadow-[0_0_24px_-4px_rgba(245,158,11,.7)]">
              <ShieldCheck size={18} strokeWidth={2.4} />
            </span>
            <span className="font-display text-[17px] font-semibold tracking-tight">{BRAND}</span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map(([l, h]) => (
              <a key={h} href={h} className="rounded-lg px-3.5 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">{l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden tabular-nums text-sm text-white/60 lg:block">{dateLabel} · {clock}</span>
            {user ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="vms-btn-primary hidden sm:inline-flex">Open console</button>
                <button onClick={logout} aria-label="Sign out" className="vms-btn-ghost px-3"><LogOut size={16} /></button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="vms-btn-ghost"><LogIn size={16} /> Sign in</button>
            )}
            <button className="vms-btn-ghost px-3 md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="vms-glass-strong mx-auto mt-2 max-w-6xl rounded-2xl p-2 md:hidden">
            {NAV.map(([l, h]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-white/80 hover:bg-white/5">{l}</a>
            ))}
          </div>
        )}
      </header>

      <main id="top" className="relative">
        {/* ───── hero ───── */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-28 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.08fr_.92fr] lg:gap-8 lg:pb-36 lg:pt-28">
          <div>
            <div className="vms-glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-3 pr-4 text-sm text-white/80">
              <span className="vms-pulse relative h-2 w-2 rounded-full bg-emerald-400" />
              <span className="tabular-nums">{stats.currentlyInside} people on site right now</span>
            </div>

            <h1 className="font-display mt-7 text-[2.9rem] font-semibold leading-[1] tracking-[-0.035em] sm:text-6xl lg:text-[5.4rem]">
              Every visitor, badged and accounted for.
            </h1>
            <p className="mt-7 max-w-[34rem] text-lg leading-relaxed text-white/70">
              Guests check in themselves, hosts get told instantly, and your guard desk sees exactly who is in the building — today, and in an emergency.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button onClick={() => setIsKioskOpen(true)} className="vms-btn-primary px-6 py-3.5 text-[15px]">
                Check in as a visitor <ArrowUpRight size={17} />
              </button>
              <button onClick={() => handleLaunchRole('/dashboard', 'host')} className="vms-btn-ghost px-6 py-3.5 text-[15px]">
                Staff sign-in
              </button>
            </div>

            <dl className="mt-14 flex max-w-md items-stretch divide-x divide-white/10 text-sm">
              {[
                [stats.currentlyInside, 'on site now'],
                [stats.totalToday, 'visits today'],
                [`${stats.avgDurationMinutes} min`, 'average visit'],
              ].map(([v, l], i) => (
                <div key={l} className={cx('flex-1', i === 0 ? 'pr-5' : 'px-5')}>
                  <dt className="font-display text-2xl font-semibold tabular-nums tracking-tight">{v}</dt>
                  <dd className="mt-1 text-white/55">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* badge stage */}
          <div className="relative mx-auto w-full max-w-[380px]">
            <div className="vms-halo pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ '--halo': persona.accent }} aria-hidden />

            <div className="relative flex flex-col items-center" onMouseMove={onTilt} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
              {/* lanyard */}
              <div className="h-24 w-4 bg-gradient-to-b from-white/5 via-white/25 to-white/40" style={{ clipPath: 'polygon(0 0,100% 0,85% 100%,15% 100%)' }} aria-hidden />
              <div className="-mt-1 h-3.5 w-9 rounded-b-md bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-lg" aria-hidden />

              <div className="vms-levitate w-full" style={{ perspective: 1000 }}>
                <article
                  className="vms-badge relative w-full overflow-hidden rounded-[28px] p-6 transition-transform duration-300 ease-out"
                  style={{ '--accent': persona.accent, transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
                  aria-label={`Smart badge preview for ${persona.name}`}
                >
                  <div className="vms-badge-sheen pointer-events-none absolute inset-0" aria-hidden />

                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-white/85">
                      <ShieldCheck size={16} style={{ color: persona.accent }} /> {BRAND}
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold text-[#0a0d14]" style={{ background: persona.accent }}>{persona.tag}</span>
                  </div>

                  <div className="relative mt-7 flex items-center gap-4">
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl font-display text-2xl font-semibold" style={{ background: `linear-gradient(145deg, ${persona.accent}33, ${persona.accent}0d)`, boxShadow: `inset 0 0 0 1px ${persona.accent}55` }}>
                      {initials(persona.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-display truncate text-2xl font-semibold tracking-tight">{persona.name}</p>
                      <p className="mt-0.5 text-sm text-white/65">{persona.host}</p>
                    </div>
                  </div>

                  <div className="relative mt-6 grid grid-cols-[1fr_auto] items-end gap-4 rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                    <div className="space-y-2 text-sm">
                      <p className="text-white/55">Access</p>
                      <p className="font-medium text-white/90">{persona.access}</p>
                      <p className="text-white/55">{persona.valid}</p>
                    </div>
                    <svg viewBox="0 0 11 11" className="h-20 w-20 rounded-lg bg-white p-1.5" shapeRendering="crispEdges" aria-hidden>
                      {qrCells.map(([c, r]) => <rect key={`${c}-${r}`} x={c} y={r} width="1" height="1" fill="#0a0d14" />)}
                      {[[0, 0], [8, 0], [0, 8]].map(([x, y]) => (
                        <g key={`${x}${y}`}>
                          <rect x={x} y={y} width="3" height="3" fill="#0a0d14" />
                          <rect x={x + 0.7} y={y + 0.7} width="1.6" height="1.6" fill="#fff" />
                          <rect x={x + 1} y={y + 1} width="1" height="1" fill="#0a0d14" />
                        </g>
                      ))}
                    </svg>
                  </div>

                  <div className="relative mt-5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-white/70"><Nfc size={16} /> Tap or scan at any gate</span>
                    <span className={cx('flex items-center gap-1.5 font-medium transition-colors', scanSimulated ? 'text-emerald-300' : 'text-white/50')}>
                      {scanSimulated ? <><CheckCircle2 size={15} /> Verified</> : 'Ready'}
                    </span>
                  </div>

                  {scanSimulated && <div className="vms-scanline pointer-events-none absolute inset-x-0 h-24" aria-hidden />}
                  {scanSimulated && (
                    <div className="vms-toast absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-2xl bg-emerald-400 px-4 py-3 text-[#04140d] shadow-2xl" role="status">
                      <BadgeCheck size={20} />
                      <div className="text-sm leading-tight">
                        <p className="font-semibold">Entry logged · Door 2 unlocked</p>
                        <p className="opacity-75">{persona.name} at {clock}</p>
                      </div>
                    </div>
                  )}
                </article>
              </div>
            </div>

            {/* controls */}
            <div className="mt-9 flex flex-col items-center gap-4">
              <div className="vms-glass inline-flex rounded-full p-1" role="radiogroup" aria-label="Badge type">
                {Object.entries(PERSONAS).map(([id, p]) => (
                  <button
                    key={id} role="radio" aria-checked={activeBadgePersona === id}
                    onClick={() => setActiveBadgePersona(id)}
                    className={cx('rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400',
                      activeBadgePersona === id ? 'bg-white text-[#0a0d14] shadow' : 'text-white/70 hover:text-white')}
                  >{p.label}</button>
                ))}
              </div>
              <button onClick={runScan} disabled={scanSimulated} className="vms-btn-ghost disabled:opacity-50">
                <ScanLine size={16} /> {scanSimulated ? 'Verifying…' : 'Scan this badge'}
              </button>
            </div>
          </div>
        </section>

        {/* ───── role gateway ───── */}
        <section id="gateway" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-28 sm:px-6 lg:pb-36">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">Start from where you stand.</h2>
            <p className="mt-4 text-lg text-white/65">Each role gets its own workspace. Pick yours and go straight in.</p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-[340px_1fr]">
            <div role="tablist" aria-label="Choose a role" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {ROLES.map((r) => {
                const Icon = r.icon; const on = r.id === selectedRoleTab;
                return (
                  <button
                    key={r.id} role="tab" aria-selected={on} onClick={() => setSelectedRoleTab(r.id)}
                    className={cx('group relative flex shrink-0 items-center gap-4 rounded-2xl px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 lg:shrink',
                      on ? 'vms-glass-strong text-white' : 'text-white/60 hover:bg-white/[.04] hover:text-white')}
                  >
                    {on && <span className="absolute left-0 top-1/2 hidden h-8 w-[3px] -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_14px_2px_rgba(245,158,11,.6)] lg:block" aria-hidden />}
                    <span className={cx('grid h-10 w-10 place-items-center rounded-xl transition', on ? 'bg-amber-400 text-[#1a1203]' : 'bg-white/[.06]')}><Icon size={19} /></span>
                    <span className="whitespace-nowrap font-medium lg:whitespace-normal">{r.label}</span>
                  </button>
                );
              })}
            </div>

            <div key={role.id} role="tabpanel" className="vms-glass-strong vms-panel-in relative overflow-hidden rounded-[28px] p-7 sm:p-10">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />
              <RoleIcon size={30} className="text-amber-400" />
              <h3 className="font-display mt-6 max-w-lg text-3xl font-semibold leading-[1.1] tracking-[-0.025em] sm:text-4xl">{role.headline}</h3>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">{role.blurb}</p>
              <ul className="mt-8 space-y-3.5">
                {role.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-white/85"><CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />{p}</li>
                ))}
              </ul>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <button onClick={() => launchRole(role)} className="vms-btn-primary px-6 py-3.5 text-[15px]">{role.cta} <ArrowUpRight size={17} /></button>
                {role.id !== 'visitor' && !user && <span className="text-sm text-white/55">You’ll sign in first.</span>}
              </div>
            </div>
          </div>
        </section>

        {/* ───── live telemetry ───── */}
        <section id="live" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-28 sm:px-6 lg:pb-36">
          <div className="vms-glass overflow-hidden rounded-[32px]">
            <div className="grid lg:grid-cols-[.78fr_1.4fr]">
              <div className="relative border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r">
                <h2 className="font-display text-3xl font-semibold tracking-[-0.025em]">Who is here, right now.</h2>
                <p className="mt-3 text-white/65">Every check-in and check-out lands here the moment it happens.</p>

                <div className="mt-10 flex items-center gap-7">
                  <div className="relative h-36 w-36 shrink-0">
                    <svg viewBox="0 0 120 120" className="-rotate-90" aria-hidden>
                      <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#10B981" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={ringC} strokeDashoffset={ringC * (1 - insidePct)} className="transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center text-center">
                      <div>
                        <p className="font-display text-4xl font-semibold tabular-nums leading-none">{stats.currentlyInside}</p>
                        <p className="mt-1 text-xs text-white/60">on site</p>
                      </div>
                    </div>
                  </div>
                  <dl className="space-y-4 text-sm">
                    <div><dt className="text-white/55">Visits today</dt><dd className="font-display text-2xl font-semibold tabular-nums">{stats.totalToday}</dd></div>
                    <div><dt className="text-white/55">Average visit</dt><dd className="font-display text-2xl font-semibold tabular-nums">{stats.avgDurationMinutes} min</dd></div>
                  </dl>
                </div>
              </div>

              <div className="p-3 sm:p-5">
                <div className="flex items-center justify-between px-3 pb-3 pt-2 text-sm text-white/60">
                  <span className="flex items-center gap-2"><span className="vms-pulse relative h-2 w-2 rounded-full bg-emerald-400" /> Live activity</span>
                  <span className="flex items-center gap-1.5 tabular-nums"><Clock size={14} /> {clock}</span>
                </div>
                <ul className="divide-y divide-white/[.07]">
                  {recentVisits.map((v) => {
                    const st = STATUS_STYLE[v.status] ?? STATUS_STYLE.inside;
                    return (
                      <li key={v.id} className="vms-row flex items-center gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-white/[.04]">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[.07] text-sm font-semibold">{initials(v.name)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{v.name}</p>
                          <p className="truncate text-sm text-white/55">Visiting {v.host} · {v.area}</p>
                        </div>
                        <div className="text-right">
                          <p className={cx('flex items-center justify-end gap-2 text-sm font-medium', st.text)}><span className={cx('h-1.5 w-1.5 rounded-full', st.dot)} />{st.label}</p>
                          <p className="text-sm tabular-nums text-white/50">{v.time}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ───── life safety ───── */}
        <section id="safety" className="mx-auto max-w-6xl scroll-mt-28 px-5 pb-28 sm:px-6 lg:pb-36">
          <div className="vms-alert relative overflow-hidden rounded-[32px] p-8 sm:p-12">
            <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_.7fr]">
              <div>
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-[#1a1203]"><Siren size={24} /></span>
                <h2 className="font-display mt-6 max-w-xl text-3xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl">If the building has to empty, you’ll know who is still inside.</h2>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
                  One tap starts a live roll call of every visitor on site. Wardens mark people safe as they reach the assembly point, supporting the headcount step of your emergency action plan (OSHA 29 CFR 1910.38).
                </p>
                <button onClick={() => handleLaunchRole('/gate', 'guard')} className="vms-btn-primary mt-8 px-6 py-3.5 text-[15px]">Open the roll call <ArrowUpRight size={17} /></button>
              </div>
              <div className="vms-glass-strong rounded-3xl p-7 text-center">
                <p className="font-display text-7xl font-semibold tabular-nums leading-none text-amber-300">{stats.currentlyInside}</p>
                <p className="mt-3 text-white/70">visitors would be on the roll call today</p>
                <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/55"><Users size={15} /> Updated every check-in and check-out</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───── footer ───── */}
      <footer className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-gradient-to-b from-amber-300 to-amber-500 text-[#1a1203]"><ShieldCheck size={18} strokeWidth={2.4} /></span>
              <span className="font-display text-lg font-semibold">{BRAND}</span>
            </div>
            <p className="mt-3 text-sm text-white/55">© {currentTime.getFullYear()} {BRAND}. Visitor management for secure workplaces.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/70" aria-label="Footer">
            <a href="#gateway" className="hover:text-white">Choose a role</a>
            <a href="#live" className="hover:text-white">Live feed</a>
            <a href="#safety" className="hover:text-white">Safety</a>
            <button onClick={() => navigate('/login')} className="hover:text-white">Test the demo</button>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white/[.07] px-4 py-2 text-white hover:bg-white/[.12]">
              <Github size={16} /> View on GitHub
            </a>
          </nav>
        </div>
      </footer>

      <KioskModal isOpen={isKioskOpen} onClose={() => setIsKioskOpen(false)} />
    </div>
  );
}

export default LandingPage;
