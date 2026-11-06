import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, BadgeCheck, Building2, Check, CheckCircle2, DoorOpen, Github,
  LogIn, LogOut, Menu, Nfc, ScanLine, ShieldCheck, Siren, UserCheck, X,
} from 'lucide-react';

// Match project imports
import { useAuth } from '../context/AuthContext';
import { KioskModal } from '../components/visitors/KioskModal';
import { dashboardService } from '../services/api';

const BRAND = 'VMS Enterprise';
const REPO_URL = 'https://github.com/Prithwiraj731/Visitor-Management-System';
const INK = '#07090F';

/* ───────────── content ───────────── */

const ROLES = [
  {
    id: 'visitor', icon: DoorOpen, label: 'Visitor self-pass', path: null, plane: '#38BDF8', ink: INK,
    headline: 'Walk in. Get badged. No account needed.',
    blurb: 'Guests check themselves in at the kiosk and receive an authorized digital badge in seconds.',
    points: ['No login or app download required', 'Badge generated instantly with secure QR token', 'Ready to scan at the gate turnstile'],
    cta: 'Start check-in',
  },
  {
    id: 'guard', icon: ShieldCheck, label: 'Guard gate desk', path: '/gate', plane: '#F59E0B', ink: INK,
    headline: 'One screen for everyone at the door.',
    blurb: 'Scan badges, admit or hold arrivals, and see who is expected next without leaving the desk.',
    points: ['Scan QR or search by phone/name in one step', 'Hold, deny, or check out arrivals on record', 'Real-time shift log of who is currently on site'],
    cta: 'Open gate desk',
  },
  {
    id: 'admin', icon: Building2, label: 'Super admin console', path: '/dashboard', plane: '#10B981', ink: INK,
    headline: 'Policy, sites, and audit in one place.',
    blurb: 'Manage staff & guards, view enterprise analytics, and export a complete visit history.',
    points: ['Manage guards, departments, and security staff', 'Role-based access control with tamper-evident audit logs', 'Instant 1-click building evacuation manifest'],
    cta: 'Open admin console',
  },
];

const PERSONAS = {
  guest: { label: 'Guest', accent: '#38BDF8', name: 'Maya Chen', tag: 'Guest', host: 'Contact: D. Okafor', access: 'Lobby · Level 3', valid: 'Valid today until 17:30' },
  contractor: { label: 'Contractor', accent: '#F59E0B', name: 'Rahul Verma', tag: 'Contractor', host: 'Contact: Facilities', access: 'Loading dock · Plant room', valid: 'Valid today until 18:00' },
  vip: { label: 'VIP', accent: '#10B981', name: 'Elena Rossi', tag: 'VIP guest', host: 'Contact: Executive Suite', access: 'Public floors · Boardroom', valid: 'Valid today until 16:00' },
};

const FALLBACK_STATS = { currentlyInside: 2, totalToday: 8, avgDurationMinutes: 38 };

const FALLBACK_VISITS = [
  { id: 'v1', name: 'Maya Chen', host: 'D. Okafor', area: 'Lobby · Level 3', time: '09:12', status: 'inside' },
  { id: 'v2', name: 'Rahul Verma', host: 'Facilities', area: 'Loading dock', time: '09:04', status: 'inside' },
  { id: 'v3', name: 'Elena Rossi', host: 'Executive office', area: 'Boardroom', time: '08:57', status: 'inside' },
  { id: 'v4', name: 'Tomás Alvarez', host: 'P. Nair', area: 'Reception', time: '08:41', status: 'pending' },
  { id: 'v5', name: 'Hannah Becker', host: 'S. Iyer', area: 'Level 2', time: '08:30', status: 'left' },
];

const STATUS = {
  inside: { label: 'On site', color: '#10B981', text: 'text-emerald-300' },
  pending: { label: 'Awaiting badge', color: '#F59E0B', text: 'text-amber-300' },
  left: { label: 'Checked out', color: '#5B6475', text: 'text-white/55' },
};

const cx = (...a) => a.filter(Boolean).join(' ');
const initials = (n = '') => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const normalizeVisit = (v, i) => {
  const raw = String(v.status ?? 'inside').toLowerCase();
  const when = v.checkInTime ?? v.check_in_time ?? v.checkIn;
  return {
    id: v.id ?? v._id ?? `visit-${i}`,
    name: v.visitor?.fullName ?? v.visitorName ?? v.visitor_name ?? v.name ?? 'Visitor',
    host: v.host?.fullName ?? v.hostName ?? v.host_name ?? v.host ?? '—',
    area: v.department?.name ?? v.area ?? v.location ?? v.purpose ?? 'Reception',
    time: v.time ?? (when ? new Date(when).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—'),
    status: raw.includes('out') || v.status === 'completed' ? 'left' : raw.includes('pend') ? 'pending' : 'inside',
  };
};

/* ───────────── page ───────────── */

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

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await dashboardService.getStats();
        if (!alive || !res) return;
        const data = res.data?.data || res.data;
        if (!data) return;
        setStats((p) => ({
          currentlyInside: data.currentlyInside ?? data.currently_inside ?? p.currentlyInside,
          totalToday: data.totalToday ?? data.total_today ?? p.totalToday,
          avgDurationMinutes: data.avgDurationMinutes ?? data.avg_duration_minutes ?? p.avgDurationMinutes,
        }));
        const list = data.recentVisits ?? data.recent_visits ?? data.recentActivity;
        if (Array.isArray(list) && list.length) setRecentVisits(list.slice(0, 8).map(normalizeVisit));
      } catch { /* keep demo data */ }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => () => clearTimeout(scanTimer.current), []);

  const handleLaunchRole = (targetPath, roleHint) => {
    if (user) navigate(targetPath);
    else navigate('/login', { state: { roleHint } });
  };

  const launchRole = (r) => {
    if (r.id === 'visitor') setIsKioskOpen(true); // public fast-path
    else handleLaunchRole(r.path, r.id);
  };

  const runScan = useCallback(() => {
    if (scanSimulated) return;
    setScanSimulated(true);
    clearTimeout(scanTimer.current);
    scanTimer.current = setTimeout(() => setScanSimulated(false), 3200);
  }, [scanSimulated]);

  const persona = PERSONAS[activeBadgePersona];
  const clock = currentTime.toLocaleTimeString('en-GB', { hour12: false });
  const dateLabel = currentTime.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  const qrCells = useMemo(() => {
    let s = [...activeBadgePersona].reduce((a, c) => a + c.charCodeAt(0), 0) * 7919;
    const out = [];
    for (let r = 0; r < 11; r++) for (let c = 0; c < 11; c++) {
      const finder = (c < 3 && r < 3) || (c > 7 && r < 3) || (c < 3 && r > 7);
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      if (!finder && (s >> 16) & 1) out.push([c, r]);
    }
    return out;
  }, [activeBadgePersona]);

  const SEG = 32;
  const filled = Math.min(SEG, Math.max(stats.currentlyInside > 0 ? 1 : 0, Math.round((stats.currentlyInside / Math.max(stats.totalToday, 1)) * SEG)));
  const NAV = [['Gateway', '#gateway'], ['Live feed', '#live'], ['Safety', '#safety']];

  return (
    <div className="vms-page min-h-screen overflow-x-clip bg-[#07090F] text-white antialiased selection:bg-amber-400 selection:text-[#07090F]">
      {/* ───── header ───── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07090F]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-6">
          <a href="#top" className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
            <span className="vms-chamfer-sm grid h-9 w-9 place-items-center bg-amber-500 text-[#07090F]"><ShieldCheck size={19} strokeWidth={2.4} /></span>
            <span className="font-display text-[15px]">{BRAND}</span>
          </a>
          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {NAV.map(([l, h]) => <a key={h} href={h} className="text-[15px] text-white/70 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">{l}</a>)}
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm tabular-nums text-white/60 lg:block">{dateLabel} · {clock}</span>
            {user ? (
              <>
                <button onClick={() => navigate('/dashboard')} className="vms-btn vms-btn-amber hidden sm:inline-flex">Open console</button>
                <button onClick={logout} aria-label="Sign out" className="vms-btn vms-btn-line px-3"><LogOut size={16} /></button>
              </>
            ) : (
              <button onClick={() => navigate('/login')} className="vms-btn vms-btn-line"><LogIn size={16} /> Sign in</button>
            )}
            <button className="vms-btn vms-btn-line px-3 md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={menuOpen}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0C111B] px-5 py-2 md:hidden">
            {NAV.map(([l, h]) => <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block py-3.5 text-white/85">{l}</a>)}
          </div>
        )}
      </header>

      <main id="top">
        {/* ───── hero: two flat planes ───── */}
        <section className="grid lg:min-h-[46rem] lg:grid-cols-[1.2fr_1fr]">
          <div className="vms-gutter-l flex flex-col justify-center px-5 py-20 sm:px-6 lg:py-28 lg:pr-16">
            <p className="flex items-center gap-3 text-[15px] text-white/75">
              <span className="vms-pulse relative h-2.5 w-2.5 bg-emerald-400" />
              <span className="tabular-nums">{stats.currentlyInside} people on site now</span>
            </p>
            <h1 className="font-display mt-8 text-[2.5rem] leading-[1.02] sm:text-5xl lg:text-[3.7rem]">
              Every visitor, badged and accounted for.
            </h1>
            <p className="mt-8 max-w-[33rem] text-lg leading-relaxed text-white/70">
              Guests check in at the kiosk, guards verify credentials at the gate, and administrators see exactly who is in the building — today, and in an emergency.
            </p>
            <div className="mt-11 flex flex-wrap gap-3">
              <button onClick={() => setIsKioskOpen(true)} className="vms-btn vms-btn-amber px-7 py-4 text-base">Check in as a visitor <ArrowUpRight size={18} /></button>
              <button onClick={() => handleLaunchRole('/dashboard', 'admin')} className="vms-btn vms-btn-line px-7 py-4 text-base">Staff & Admin sign-in</button>
            </div>
          </div>

          {/* badge plane — changes colour with the badge type */}
          <div className="vms-plane relative flex flex-col items-center overflow-hidden px-5 pb-14 sm:px-6" style={{ background: persona.accent }}>
            <div className="vms-swing flex flex-col items-center">
              <div className="h-28 w-[26px]" style={{ background: INK }} aria-hidden />
              <div className="-mt-px h-5 w-11 bg-white" style={{ boxShadow: `inset 0 -6px 0 ${INK}22` }} aria-hidden />

              <article className="vms-chamfer-lg relative w-[300px] overflow-hidden p-6 sm:w-[320px]" style={{ background: INK }} aria-label={`Smart badge preview for ${persona.name}`}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-white/85"><ShieldCheck size={16} style={{ color: persona.accent }} />{BRAND}</span>
                  <span className="px-3 py-1 text-xs font-bold" style={{ background: persona.accent, color: INK }}>{persona.tag}</span>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <div className="font-display grid h-[76px] w-[76px] shrink-0 place-items-center text-2xl" style={{ background: persona.accent, color: INK }}>{initials(persona.name)}</div>
                  <div className="min-w-0">
                    <p className="font-display text-[1.35rem] leading-tight">{persona.name}</p>
                    <p className="mt-1 text-sm text-white/65">{persona.host}</p>
                  </div>
                </div>

                <div className="mt-7 flex items-end justify-between gap-4 border-t border-white/15 pt-5">
                  <div className="space-y-1.5 text-sm">
                    <p className="text-white/55">Access</p>
                    <p className="font-semibold">{persona.access}</p>
                    <p className="text-white/60">{persona.valid}</p>
                  </div>
                  <svg viewBox="0 0 11 11" className="h-[76px] w-[76px] shrink-0 bg-white p-1.5" shapeRendering="crispEdges" aria-hidden>
                    {qrCells.map(([c, r]) => <rect key={`${c}-${r}`} x={c} y={r} width="1" height="1" fill={INK} />)}
                    {[[0, 0], [8, 0], [0, 8]].map(([x, y]) => (
                      <g key={`${x}${y}`}><rect x={x} y={y} width="3" height="3" fill={INK} /><rect x={x + 0.7} y={y + 0.7} width="1.6" height="1.6" fill="#fff" /><rect x={x + 1} y={y + 1} width="1" height="1" fill={INK} /></g>
                    ))}
                  </svg>
                </div>

                <div className="mt-6 flex items-center justify-between text-sm text-white/70">
                  <span className="flex items-center gap-2"><Nfc size={16} /> Tap or scan at any gate</span>
                  <span>Ready</span>
                </div>

                {scanSimulated && (
                  <>
                    <div className="vms-scan absolute inset-x-0 h-[3px]" style={{ background: persona.accent }} aria-hidden />
                    <div className="vms-toast absolute inset-x-0 bottom-0 flex items-center gap-3 bg-white px-6 py-4" style={{ color: INK }} role="status">
                      <BadgeCheck size={22} />
                      <p className="text-sm leading-tight"><span className="font-bold">Verified · Door 2 unlocked</span><br />{persona.name} · {clock}</p>
                    </div>
                  </>
                )}
              </article>
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <div className="vms-chamfer-sm inline-flex p-1.5" style={{ background: INK }} role="radiogroup" aria-label="Badge type">
                {Object.entries(PERSONAS).map(([id, p]) => (
                  <button key={id} role="radio" aria-checked={activeBadgePersona === id} onClick={() => setActiveBadgePersona(id)}
                    className={cx('px-4 py-2.5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white',
                      activeBadgePersona === id ? 'text-[#07090F]' : 'text-white/70 hover:text-white')}
                    style={activeBadgePersona === id ? { background: persona.accent } : undefined}>{p.label}</button>
                ))}
              </div>
              <button onClick={runScan} disabled={scanSimulated} className="vms-btn px-5 py-3 text-sm disabled:opacity-60" style={{ background: INK, color: '#fff' }}>
                <ScanLine size={16} /> {scanSimulated ? 'Verifying…' : 'Scan this badge'}
              </button>
            </div>
          </div>
        </section>

        {/* ───── role gateway: four planes, the active one opens ───── */}
        <section id="gateway" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-6 lg:py-32">
          <h2 className="font-display max-w-3xl text-3xl leading-[1.05] sm:text-5xl">Start from where you stand.</h2>
          <p className="mt-5 max-w-xl text-lg text-white/65">Each role gets its own workspace. Pick yours and go straight in.</p>

          <div role="tablist" aria-label="Choose a role" className="mt-12 flex flex-col gap-2 lg:h-[31rem] lg:flex-row">
            {ROLES.map((r) => {
              const on = r.id === selectedRoleTab; const Icon = r.icon;
              return (
                <div key={r.id}
                  className={cx('vms-chamfer relative flex min-w-0 flex-col overflow-hidden transition-[flex-grow,background-color] duration-500',
                    on ? 'lg:flex-[3.4]' : 'bg-[#0E1420] hover:bg-[#161E30] lg:flex-[.6]')}
                  style={on ? { background: r.plane, color: r.ink } : undefined}>
                  <button role="tab" id={`tab-${r.id}`} aria-selected={on} aria-controls={`panel-${r.id}`} onClick={() => setSelectedRoleTab(r.id)}
                    className={cx('flex items-center gap-4 p-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white lg:p-6',
                      !on && 'lg:h-full lg:flex-col lg:items-start lg:justify-between')}>
                    <span className="grid h-11 w-11 shrink-0 place-items-center" style={on ? { background: r.ink, color: r.plane } : { background: r.plane, color: r.ink }}><Icon size={21} /></span>
                    <span className={cx('font-display text-base', on ? 'text-[#07090F]' : 'text-white lg:[writing-mode:vertical-rl] lg:rotate-180')}>{r.label}</span>
                  </button>

                  {on && (
                    <div id={`panel-${r.id}`} role="tabpanel" aria-labelledby={`tab-${r.id}`} className="vms-panel-in flex flex-1 flex-col px-5 pb-7 lg:px-8 lg:pb-8">
                      <h3 className="font-display max-w-lg text-[1.75rem] leading-[1.08] lg:text-4xl">{r.headline}</h3>
                      <p className="mt-4 max-w-md text-[17px] leading-relaxed" style={{ opacity: 0.82 }}>{r.blurb}</p>
                      <ul className="mt-6 space-y-3">
                        {r.points.map((p) => (
                          <li key={p} className="flex items-start gap-3 font-medium">
                            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center" style={{ background: r.ink, color: r.plane }}><Check size={13} strokeWidth={3.2} /></span>{p}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex flex-wrap items-center gap-4 pt-8">
                        <button onClick={() => launchRole(r)} className="vms-btn px-6 py-3.5 text-[15px]" style={{ background: r.ink, color: '#fff' }}>{r.cta} <ArrowUpRight size={17} /></button>
                        {r.id !== 'visitor' && !user && <span className="text-sm font-medium" style={{ opacity: 0.75 }}>You’ll sign in first.</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ───── live telemetry ───── */}
        <section id="live" className="scroll-mt-20 border-y border-white/10 bg-[#0C111B]">
          <div className="mx-auto max-w-6xl px-5 py-24 sm:px-6 lg:py-28">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-display max-w-md text-3xl leading-[1.05] sm:text-5xl">Who is here, right now.</h2>
                <p className="mt-5 max-w-md text-lg text-white/65">Every check-in and check-out lands here the moment it happens.</p>
              </div>
              <div className="flex items-end gap-6">
                <p className="font-display text-[5.5rem] leading-[.85] tabular-nums text-sky-400 sm:text-[7rem]">{stats.currentlyInside}</p>
                <p className="pb-1 text-[15px] leading-snug text-white/70">on site now<br />{stats.totalToday} visits today<br />{stats.avgDurationMinutes} min average</p>
              </div>
            </div>

            <div className="mt-12 flex gap-[3px]" role="img" aria-label={`${stats.currentlyInside} of ${stats.totalToday} visits today are still on site`}>
              {Array.from({ length: SEG }, (_, i) => <span key={i} className="h-4 flex-1" style={{ background: i < filled ? '#38BDF8' : '#1B2434' }} />)}
            </div>

            <div className="mt-12">
              <div className="hidden grid-cols-[2.4fr_2fr_1.8fr_1.3fr_.7fr] gap-4 border-b border-white/15 px-3 pb-3 text-sm text-white/55 md:grid">
                <span>Visitor</span><span>Staff Contact</span><span>Area</span><span>Status</span><span className="text-right">Time</span>
              </div>
              <ul>
                {recentVisits.map((v, i) => {
                  const st = STATUS[v.status] ?? STATUS.inside;
                  return (
                    <li key={v.id} className="vms-row relative grid grid-cols-[1fr_auto] items-center gap-4 border-b border-white/[.08] px-3 py-4 transition-colors hover:bg-[#121A29] md:grid-cols-[2.4fr_2fr_1.8fr_1.3fr_.7fr]">
                      {i === 0 && <span className="absolute inset-y-0 left-0 w-[3px] bg-sky-400" aria-hidden />}
                      <div className="flex min-w-0 items-center gap-4">
                        <span className="font-display grid h-10 w-10 shrink-0 place-items-center bg-[#1B2434] text-xs">{initials(v.name)}</span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{v.name}</p>
                          <p className="truncate text-sm text-white/55 md:hidden">{v.host} · {v.area}</p>
                        </div>
                      </div>
                      <p className="hidden truncate text-white/75 md:block">{v.host}</p>
                      <p className="hidden truncate text-white/75 md:block">{v.area}</p>
                      <div className="text-right md:text-left">
                        <p className={cx('inline-flex items-center gap-2 text-sm font-semibold', st.text)}><span className="h-2 w-2" style={{ background: st.color }} />{st.label}</p>
                        <p className="text-sm tabular-nums text-white/50 md:hidden">{v.time}</p>
                      </div>
                      <p className="hidden text-right tabular-nums text-white/65 md:block">{v.time}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* ───── life safety: solid amber plane ───── */}
        <section id="safety" className="scroll-mt-20 bg-amber-500 text-[#07090F]">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-24 sm:px-6 lg:grid-cols-[1.35fr_.65fr] lg:py-32">
            <div>
              <Siren size={34} strokeWidth={2.2} />
              <h2 className="font-display mt-7 max-w-2xl text-3xl leading-[1.04] sm:text-5xl">If the building has to empty, you’ll know who is still inside.</h2>
              <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed">
                One tap starts a live roll call of every visitor on site. Wardens mark people safe as they reach the assembly point, supporting the headcount step of your emergency action plan (OSHA 29 CFR 1910.38).
              </p>
              <button onClick={() => handleLaunchRole('/gate', 'guard')} className="vms-btn mt-9 px-7 py-4 text-base" style={{ background: INK, color: '#fff' }}>Open the roll call <ArrowUpRight size={18} /></button>
            </div>
            <div className="vms-chamfer-lg p-8 text-center sm:p-10" style={{ background: INK }}>
              <p className="font-display text-[6.5rem] leading-[.9] tabular-nums text-amber-400">{stats.currentlyInside}</p>
              <p className="mt-5 text-lg text-white">visitors would be on the roll call today</p>
              <p className="mt-4 text-sm text-white/60">Updated at every check-in and check-out</p>
            </div>
          </div>
        </section>
      </main>

      {/* ───── footer ───── */}
      <footer className="bg-[#07090F]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="vms-chamfer-sm grid h-9 w-9 place-items-center bg-amber-500 text-[#07090F]"><ShieldCheck size={19} strokeWidth={2.4} /></span>
              <span className="font-display text-[15px]">{BRAND}</span>
            </div>
            <p className="mt-4 text-sm text-white/55">© {currentTime.getFullYear()} {BRAND}. Visitor management for secure workplaces.</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[15px] text-white/70" aria-label="Footer">
            <a href="#gateway" className="hover:text-white">Choose a role</a>
            <a href="#live" className="hover:text-white">Live feed</a>
            <a href="#safety" className="hover:text-white">Safety</a>
            <button onClick={() => navigate('/login')} className="hover:text-white">Test the demo</button>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="vms-btn vms-btn-line"><Github size={16} /> View on GitHub</a>
          </nav>
        </div>
      </footer>

      <KioskModal isOpen={isKioskOpen} onClose={() => setIsKioskOpen(false)} />
    </div>
  );
}

export default LandingPage;
