import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { visitService } from '../services/api';
import { Button } from '../components/common/Button';
import {
  AlertTriangle,
  Printer,
  Phone,
  Building,
  User,
  ShieldAlert,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const EvacuationPage = () => {
  const [manifest, setManifest] = useState([]);
  const [totalInside, setTotalInside] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState(new Date());

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
      subtitle="Life safety emergency headcount roster of all non-employees currently inside premises"
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Clock} onClick={loadManifest}>
            Refresh Live Headcount
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint} className="bg-rose-600 hover:bg-rose-700">
            Print Crisis Roster
          </Button>
        </div>
      }
    >
      {/* High-Alert Crimson Banner */}
      <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-6 rounded-2xl shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-8 h-8 text-white animate-bounce" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-1">
              Active Security Roster
            </span>
            <h2 className="text-2xl font-black tracking-tight">
              {totalInside} {totalInside === 1 ? 'PERSON' : 'PERSONS'} CURRENTLY ON PREMISES
            </h2>
            <p className="text-xs text-rose-100 mt-0.5">
              Verified checkpoint count as of {timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <span className="block text-3xl font-black font-mono">{totalInside}</span>
          <span className="text-xs text-rose-200 uppercase font-semibold">Accountability Roster</span>
        </div>
      </div>

      {/* Manifest Table */}
      <div id="printable-badge" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">All Active Visitor Passes</span>
          <span className="text-slate-500">Provide this list directly to Incident Commander / Fire Marshall</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Visitor Name</th>
                <th className="px-5 py-3">Phone (Click to Call)</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Host Employee & Contact</th>
                <th className="px-5 py-3">Location Wing / Floor</th>
                <th className="px-5 py-3">Entry Time</th>
                <th className="px-5 py-3">Badge Serial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {manifest.length > 0 ? (
                manifest.map((v) => (
                  <tr key={v.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                      {v.visitor?.fullName}
                    </td>

                    <td className="px-5 py-4">
                      {v.visitor?.phone ? (
                        <a
                          href={`tel:${v.visitor.phone}`}
                          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {v.visitor.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {v.visitor?.company || 'Personal'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800">{v.host?.fullName}</div>
                      {v.host?.phone && (
                        <a
                          href={`tel:${v.host.phone}`}
                          className="text-[11px] text-slate-500 hover:text-brand-600 flex items-center gap-1 mt-0.5"
                        >
                          <Phone className="w-3 h-3" /> {v.host.phone}
                        </a>
                      )}
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      <div className="font-semibold">{v.department?.name || 'General Area'}</div>
                      <div className="text-[11px] text-slate-400">
                        {v.department?.building} — {v.department?.floor || 'Main'}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 font-mono">
                      {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>

                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {v.badgeNumber}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
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

