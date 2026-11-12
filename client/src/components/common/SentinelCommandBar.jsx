import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShieldAlert, ShieldCheck, Camera, Users, Building, AlertTriangle, 
  ArrowRight, CheckCircle2, LogIn, LogOut, Terminal, Sparkles, X, CornerDownLeft,
  Volume2, VolumeX, FileText, Activity
} from 'lucide-react';
import { useLockdown } from '../../context/LockdownContext';
import { useAuth } from '../../context/AuthContext';
import { visitService, userService } from '../../services/api';
import { playAccessGranted, playAccessDenied, playScannerBeep } from '../../utils/soundEffects';

export const SentinelCommandBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visits, setVisits] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLockdown, initiateLockdown, disengageLockdown, isMuted, toggleMute } = useLockdown();
  const inputRef = useRef(null);

  // Global Key Listener for Ctrl+K, Cmd+K, Escape (only when authenticated)
  useEffect(() => {
    if (!user) {
      setIsOpen(false);
      return;
    }

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-sentinel-command-bar', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-sentinel-command-bar', handleCustomOpen);
    };
  }, [isOpen, user]);

  // Load contextual data when palette opens
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActionFeedback(null);
      return;
    }

    // Auto-focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [visitsRes, staffRes] = await Promise.allSettled([
          visitService.getVisits({ limit: 80 }),
          userService.getUsers({ limit: 40 })
        ]);

        if (visitsRes.status === 'fulfilled' && visitsRes.value.data?.data) {
          setVisits(visitsRes.value.data.data);
        }
        if (staffRes.status === 'fulfilled' && staffRes.value.data?.data) {
          setStaff(staffRes.value.data.data);
        }
      } catch (err) {
        console.warn('Sentinel failed to load background telemetry:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, user]);

  // Calculated Stats
  const stats = useMemo(() => {
    const inside = visits.filter((v) => v.status === 'checked_in').length;
    const pending = visits.filter((v) => v.status === 'pending').length;
    const completed = visits.filter((v) => v.status === 'checked_out').length;
    return { inside, pending, completed, total: visits.length };
  }, [visits]);

  // Execute quick direct actions
  const handleAdmitVisitor = async (visitId, visitorName) => {
    try {
      playScannerBeep();
      const res = await visitService.checkIn(visitId);
      playAccessGranted();
      setActionFeedback({ type: 'success', text: `Admitted: ${visitorName}` });
      setVisits((prev) =>
        prev.map((v) => (v.id === visitId ? { ...v, status: 'checked_in', checkInTime: new Date() } : v))
      );
    } catch (err) {
      playAccessDenied();
      setActionFeedback({ type: 'error', text: err.response?.data?.message || 'Check-in failed' });
    }
  };

  const handleCheckoutVisitor = async (visitId, visitorName) => {
    try {
      playScannerBeep();
      await visitService.checkOut(visitId);
      playAccessDenied();
      setActionFeedback({ type: 'success', text: `Checked out: ${visitorName}` });
      setVisits((prev) =>
        prev.map((v) => (v.id === visitId ? { ...v, status: 'checked_out', checkOutTime: new Date() } : v))
      );
    } catch (err) {
      setActionFeedback({ type: 'error', text: err.response?.data?.message || 'Check-out failed' });
    }
  };

  // Build Results & Intent Suggestions
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const results = [];

    // System Commands / AI Quick Intents
    const commands = [
      {
        id: 'cmd-lockdown',
        category: 'SYSTEM SECURITY',
        title: isLockdown ? 'DISENGAGE DEFCON 1 SITE LOCKDOWN' : 'INITIATE DEFCON 1 SITE LOCKDOWN',
        subtitle: isLockdown 
          ? 'Security clear directive: Restore access gates and kiosk registration' 
          : 'Hazard protocol: Sound perimeter sirens and lock all visitor entry points',
        icon: ShieldAlert,
        color: isLockdown ? 'text-emerald-400' : 'text-red-500',
        action: () => {
          if (isLockdown) {
            disengageLockdown();
            setActionFeedback({ type: 'success', text: 'Perimeter lockdown disengaged. All Clear.' });
          } else {
            initiateLockdown('DEFCON 1 Emergency directive initiated via Sentinel AI Copilot.');
            setActionFeedback({ type: 'error', text: 'DEFCON 1 LOCKDOWN ACTIVE.' });
          }
        }
      },
      {
        id: 'cmd-scanner',
        category: 'PERIMETER GATE',
        title: 'Open Live Optical Webcam Scanner',
        subtitle: 'Engage video frame QR decoder for hands-free gate admission',
        icon: Camera,
        color: 'text-amber-400',
        action: () => {
          navigate('/gate');
          setIsOpen(false);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-webcam-scanner'));
          }, 200);
        }
      },
      {
        id: 'cmd-manifest',
        category: 'CRISIS RESPONSE',
        title: 'Evacuation Roster & Live Manifest',
        subtitle: `Roll call sheet of ${stats.inside} currently checked-in occupants`,
        icon: AlertTriangle,
        color: 'text-amber-400',
        action: () => {
          navigate('/emergency');
          setIsOpen(false);
        }
      },
      {
        id: 'cmd-gate',
        category: 'NAVIGATION',
        title: 'Security Gate Desk (/gate)',
        subtitle: 'Manage gate throughput, search passes, admit pending arrivals',
        icon: Terminal,
        color: 'text-blue-400',
        action: () => {
          navigate('/gate');
          setIsOpen(false);
        }
      },
      {
        id: 'cmd-dashboard',
        category: 'NAVIGATION',
        title: 'Executive Operations Dashboard (/dashboard)',
        subtitle: 'Peak throughput charts, daily statistics, and perimeter health',
        icon: Activity,
        color: 'text-purple-400',
        action: () => {
          navigate('/dashboard');
          setIsOpen(false);
        }
      },
      {
        id: 'cmd-reports',
        category: 'NAVIGATION',
        title: 'Compliance Reports & CSV Exports (/reports)',
        subtitle: 'Generate visitor logs, peak hour analytics, and audit records',
        icon: FileText,
        color: 'text-cyan-400',
        action: () => {
          navigate('/reports');
          setIsOpen(false);
        }
      },
      {
        id: 'cmd-mute',
        category: 'AUDIO CHIMES',
        title: isMuted ? 'Unmute Tactical Siren & Audio Chimes' : 'Mute Tactical Siren & Audio Chimes',
        subtitle: 'Toggle Web Audio API synthesizers',
        icon: isMuted ? VolumeX : Volume2,
        color: 'text-slate-400',
        action: () => {
          toggleMute();
          setActionFeedback({ type: 'success', text: isMuted ? 'Audio unmuted' : 'Audio muted' });
        }
      }
    ];

    if (!q) {
      // Default view: Command shortcuts + Active inside visitors
      results.push(...commands);

      const activeVisits = visits
        .filter((v) => v.status === 'checked_in')
        .slice(0, 5)
        .map((v) => ({
          id: `visit-${v.id}`,
          category: 'ACTIVE OCCUPANTS',
          title: v.visitor?.fullName || 'Guest Visitor',
          subtitle: `Badge: ${v.badgeNumber || 'PASS'} · Host: ${v.host?.fullName || 'Front Desk'} · ${v.department?.name || 'General'}`,
          status: v.status,
          visit: v,
          icon: ShieldCheck,
          color: 'text-emerald-400',
          action: () => handleCheckoutVisitor(v.id, v.visitor?.fullName || 'Visitor')
        }));
      results.push(...activeVisits);

      return results;
    }

    // Matching commands
    commands.forEach((cmd) => {
      if (
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
      ) {
        results.push(cmd);
      }
    });

    // Matching visits
    visits.forEach((v) => {
      const name = v.visitor?.fullName?.toLowerCase() || '';
      const phone = v.visitor?.phone?.toLowerCase() || '';
      const email = v.visitor?.email?.toLowerCase() || '';
      const company = v.visitor?.company?.toLowerCase() || '';
      const badge = v.badgeNumber?.toLowerCase() || '';
      const purpose = v.purpose?.toLowerCase() || '';
      const host = v.host?.fullName?.toLowerCase() || '';
      const dept = v.department?.name?.toLowerCase() || '';

      if (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        company.includes(q) ||
        badge.includes(q) ||
        purpose.includes(q) ||
        host.includes(q) ||
        dept.includes(q)
      ) {
        results.push({
          id: `visit-${v.id}`,
          category: v.status === 'pending' ? 'PENDING CLEARANCE' : v.status === 'checked_in' ? 'ACTIVE OCCUPANT' : 'COMPLETED VISIT',
          title: v.visitor?.fullName || 'Guest Visitor',
          subtitle: `Badge: ${v.badgeNumber || 'N/A'} · ${v.purpose || 'Visit'} · Host: ${v.host?.fullName || 'Reception'} · ${v.department?.name || 'General'}`,
          status: v.status,
          visit: v,
          icon: v.status === 'checked_in' ? ShieldCheck : v.status === 'pending' ? AlertTriangle : CheckCircle2,
          color: v.status === 'checked_in' ? 'text-emerald-400' : v.status === 'pending' ? 'text-amber-400' : 'text-slate-400',
          action: () => {
            if (v.status === 'pending') {
              handleAdmitVisitor(v.id, v.visitor?.fullName || 'Visitor');
            } else if (v.status === 'checked_in') {
              handleCheckoutVisitor(v.id, v.visitor?.fullName || 'Visitor');
            } else {
              navigate('/visitors');
              setIsOpen(false);
            }
          }
        });
      }
    });

    // Matching staff
    staff.forEach((s) => {
      const name = s.fullName?.toLowerCase() || '';
      const email = s.email?.toLowerCase() || '';
      const role = s.role?.toLowerCase() || '';
      const dept = s.department?.name?.toLowerCase() || '';

      if (name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q)) {
        results.push({
          id: `staff-${s.id}`,
          category: 'SECURITY & STAFF DIRECTORY',
          title: s.fullName,
          subtitle: `${s.role.toUpperCase()} · ${s.email} · ${s.department?.name || 'HQ Operations'}`,
          icon: Users,
          color: 'text-indigo-400',
          action: () => {
            navigate('/staff');
            setIsOpen(false);
          }
        });
      }
    });

    return results;
  }, [query, isLockdown, isMuted, visits, staff, stats]);

  // Arrow navigation & Enter execution
  const handleKeyDownInInput = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  if (!user || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#0C111B] border border-white/20 vms-chamfer shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Co-Pilot Tactical Header */}
        <div className="bg-[#07090F] px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-none animate-pulse" />
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-widest uppercase text-white/90">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>VMS SENTINEL // AI SECURITY COPILOT</span>
            </div>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] font-mono bg-white/10 text-white/60">
              BUILD 2.4
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
            <span className="hidden sm:inline">OCCUPANCY:</span>
            <span className="text-emerald-400 font-bold">{stats.inside} ON-SITE</span>
            <span className="text-white/20">|</span>
            <span className="text-amber-400 font-bold">{stats.pending} PENDING</span>
            <button
              onClick={() => setIsOpen(false)}
              className="ml-2 text-white/40 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div className="relative px-4 py-3 bg-[#0C111B] border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder="Type 'lockdown', 'gate', visitor name, phone, or badge serial..."
            className="w-full bg-transparent text-white font-sans text-sm sm:text-base placeholder-white/40 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-white/40 hover:text-white text-xs font-mono px-2 py-0.5 bg-white/5"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`px-4 py-2 font-mono text-xs flex items-center justify-between border-b ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                : 'bg-red-950/60 text-red-300 border-red-500/30'
            }`}
          >
            <span>{actionFeedback.text}</span>
            <button onClick={() => setActionFeedback(null)} className="text-white/60 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-white/40 font-mono text-xs">
              NO MATCHING SECURITY DIRECTIVES OR LOGS FOUND
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon || Terminal;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 vms-chamfer-sm cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-400/10 border border-amber-400/40 text-white'
                      : 'hover:bg-white/[.04] border border-transparent text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-white/5 ' + item.color
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                          {item.category}
                        </span>
                        {item.status && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.2 ${
                              item.status === 'checked_in'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : item.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="font-display font-bold text-sm text-white truncate">
                        {item.title}
                      </div>
                      <div className="font-sans text-xs text-white/50 truncate">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {item.visit?.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdmitVisitor(item.visit.id, item.visit.visitor?.fullName || 'Visitor');
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono font-bold bg-amber-400 text-[#07090F] hover:bg-amber-300 flex items-center gap-1"
                      >
                        <LogIn className="w-3 h-3" />
                        ADMIT
                      </button>
                    )}

                    {item.visit?.status === 'checked_in' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckoutVisitor(item.visit.id, item.visit.visitor?.fullName || 'Visitor');
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white/10 hover:bg-white/20 text-white flex items-center gap-1"
                      >
                        <LogOut className="w-3 h-3" />
                        CHECKOUT
                      </button>
                    )}

                    {isSelected && (
                      <CornerDownLeft className="w-4 h-4 text-amber-400 hidden sm:block shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="bg-[#07090F] px-4 py-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
          <div className="flex items-center gap-3">
            <span><strong className="text-white/80">↑↓</strong> Navigate</span>
            <span><strong className="text-white/80">↵</strong> Execute</span>
            <span><strong className="text-white/80">ESC</strong> Dismiss</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-amber-400/80">SENTINEL AI PROTOCOL</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SentinelCommandBar;

