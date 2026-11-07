import React from 'react';
import { useLockdown } from '../../context/LockdownContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, Volume2, VolumeX, ShieldCheck, FileText } from 'lucide-react';

export const LockdownBanner = () => {
  const { isLockdown, lockdownReason, isMuted, toggleMute, disengageLockdown } = useLockdown();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!isLockdown) return null;

  const canDisengage = user && (user.role === 'admin' || user.role === 'super_admin' || user.role === 'guard');

  return (
    <div className="sticky top-0 z-[100] bg-rose-950 border-b-2 border-rose-500 text-white shadow-2xl animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Warning Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-rose-600 text-white flex items-center justify-center rounded font-extrabold animate-bounce shrink-0">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold tracking-widest text-rose-300 uppercase font-mono mr-2">
              [ DEFCON 1 : PERIMETER LOCKDOWN ENGAGED ]
            </span>
            <span className="text-white/80 hidden sm:inline">
              {lockdownReason}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mute Siren Button */}
          <button
            onClick={toggleMute}
            className="px-2.5 py-1 bg-black/40 hover:bg-black/60 border border-white/20 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors"
            title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />}
            <span>{isMuted ? 'Muted' : 'Sound Active'}</span>
          </button>

          {/* Emergency Roster Shortcut */}
          <button
            onClick={() => navigate('/emergency')}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Evacuation</span> Roster
          </button>

          {/* Disengage Button (Authorized Guard/Admin) */}
          {canDisengage && (
            <button
              onClick={() => {
                if (window.confirm('Confirm DISENGAGE of DEFCON 1 Lockdown? Turnstiles will return to normal operation.')) {
                  disengageLockdown();
                }
              }}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded text-[11px] font-extrabold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ALL CLEAR / DISENGAGE</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockdownBanner;
