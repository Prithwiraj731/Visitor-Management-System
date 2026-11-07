import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { visitService } from '../services/api';
import { useLockdown } from '../context/LockdownContext';
import { Button } from '../components/common/Button';
import {
  Printer,
  Phone,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Siren,
  Volume2,
  VolumeX
} from 'lucide-react';

export const EvacuationPage = () => {
  const [manifest, setManifest] = useState([]);
  const [totalInside, setTotalInside] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date());
  const { isLockdown, lockdownReason, initiateLockdown, disengageLockdown, isMuted, toggleMute } = useLockdown();

  const loadManifest = async () => {
    try {
      const { data } = await visitService.getEmergencyManifest();
      if (data) {
        setManifest(data.data || []);
        setTotalInside(data.totalInside || 0);
        setTimestamp(new Date(data.timestamp || new Date()));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManifest();
    const interval = setInterval(loadManifest, 8000);
    return () => clearInterval(interval);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <PageWrapper
      title="Emergency Evacuation Manifest"
      subtitle="Life safety emergency headcount roster of all non-employees currently inside premises (OSHA 29 CFR 1910.38)"
      action={
        <div className="flex flex-wrap items-center gap-2.5">
          {isLockdown ? (
            <button
              onClick={() => {
                if (window.confirm('Disengage DEFCON 1 Site Lockdown and restore normal access?')) {
                  disengageLockdown();
                }
              }}
              className="vms-btn bg-emerald-500 hover:bg-emerald-400 text-[#07090F] font-bold text-xs py-2 px-3 shadow-lg"
            >
              DISENGAGE LOCKDOWN
            </button>
          ) : (
            <button
              onClick={() => {
                const reason = window.prompt('Enter reason for facility emergency lockdown:', 'Emergency Evacuation Protocol Activated');
                if (reason) {
                  initiateLockdown(reason);
                }
              }}
              className="vms-btn bg-red-600 hover:bg-red-500 text-white font-bold text-xs py-2 px-3 shadow-lg flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>TRIGGER DEFCON 1</span>
            </button>
          )}

          <button
            onClick={toggleMute}
            className="p-2 bg-white/10 hover:bg-white/20 text-white vms-chamfer-sm"
            title={isMuted ? 'Unmute Emergency Siren' : 'Mute Emergency Siren'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <Button variant="secondary" icon={Clock} onClick={loadManifest}>
            Refresh Live
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint} className="bg-amber-500 hover:bg-amber-400 text-[#07090F] font-bold">
            Print Crisis Roster
          </Button>
        </div>
      }
    >
      {/* High-Impact Solid Alert Plane */}
      <div className={`p-8 vms-chamfer-lg shadow-2xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors ${
        isLockdown 
          ? 'bg-red-600 text-white ring-4 ring-red-500/50' 
          : 'bg-amber-500 text-[#07090F]'
      }`}>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-[#07090F] text-amber-400 flex items-center justify-center shrink-0 vms-chamfer-sm">
            <Siren className={`w-9 h-9 ${isLockdown ? 'text-red-500 animate-bounce' : 'text-amber-400 animate-pulse'}`} />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-[#07090F] text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2 vms-chamfer-sm">
              {isLockdown ? 'DEFCON 1 ACTIVE · SITE EVACUATION ORDER' : 'OSHA Emergency Action Headcount'}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {totalInside} {totalInside === 1 ? 'PERSON' : 'PERSONS'} CURRENTLY ON PREMISES
            </h2>
            <p className={`text-sm font-semibold mt-1 ${isLockdown ? 'text-white/90' : 'text-[#07090F]/80'}`}>
              {isLockdown ? `Directive: ${lockdownReason}` : `Live verified checkpoint roster as of ${timestamp.toLocaleTimeString('en-GB')}`}
            </p>
          </div>
        </div>

        <div className="bg-[#07090F] text-amber-400 p-6 text-center sm:text-right vms-chamfer-sm shrink-0 min-w-[160px]">
          <span className={`font-display block text-5xl font-extrabold tabular-nums leading-none ${isLockdown ? 'text-red-500' : 'text-amber-400'}`}>
            {totalInside}
          </span>
          <span className="text-[11px] text-white/70 uppercase font-bold tracking-wider mt-1 block">
            {isLockdown ? 'CRISIS HEADCOUNT' : 'Accountability Roster'}
          </span>
        </div>
      </div>

      {/* Manifest Table */}
      <div id="printable-badge" className="bg-[#0C111B] vms-chamfer border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-[#0E1420] flex items-center justify-between text-xs">
          <span className="font-display text-sm font-bold text-white">Active Visitor Passes On Site</span>
          <span className="text-amber-400 font-semibold">Provide directly to Incident Commander / Fire Marshall</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090F] text-white/50 uppercase tracking-wider font-bold border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Visitor Name</th>
                <th className="px-5 py-3.5">Phone (Direct Line)</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Staff Contact</th>
                <th className="px-5 py-3.5">Wing / Location</th>
                <th className="px-5 py-3.5">Entry Time</th>
                <th className="px-5 py-3.5">Badge Serial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {manifest.length > 0 ? (
                manifest.map((v) => (
                  <tr key={v.id} className="hover:bg-[#121A29] transition-colors">
                    <td className="px-5 py-4 font-bold text-white text-sm">
                      {v.visitor?.fullName}
                    </td>

                    <td className="px-5 py-4">
                      {v.visitor?.phone ? (
                        <a
                          href={`tel:${v.visitor.phone}`}
                          className="inline-flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {v.visitor.phone}
                        </a>
                      ) : (
                        <span className="text-white/40">None</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-white/70 font-medium">
                      {v.visitor?.company || 'Personal'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-white/90">{v.host?.fullName}</div>
                      {v.host?.phone && (
                        <a
                          href={`tel:${v.host.phone}`}
                          className="text-[11px] text-white/50 hover:text-amber-400 flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" /> {v.host.phone}
                        </a>
                      )}
                    </td>

                    <td className="px-5 py-4 font-medium text-white/80">
                      <div className="font-semibold">{v.department?.name || 'General Area'}</div>
                      <div className="text-[11px] text-white/40">
                        {v.department?.building} — {v.department?.floor || 'Main'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-white/60 font-mono">
                      {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-amber-400">
                      {v.badgeNumber}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-14 text-white/50 text-sm">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    All visitors have departed. Facility is currently clear of external guests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};

export default EvacuationPage;
