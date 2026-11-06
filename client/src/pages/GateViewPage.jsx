import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { visitService } from '../services/api';
import { Badge } from '../components/common/Badge';
import { BadgeModal } from '../components/visitors/BadgeModal';
import {
  ShieldCheck,
  Search,
  LogIn,
  LogOut,
  Printer,
  Clock,
  Phone
} from 'lucide-react';

export const GateViewPage = () => {
  const [todayData, setTodayData] = useState({
    activeInside: 0,
    pendingApproval: 0,
    completedToday: 0,
    visits: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadTodayVisits = async () => {
    try {
      const { data } = await visitService.getTodayVisits();
      if (data?.data) {
        setTodayData(data.data);
      }
    } catch (err) {
      console.error('Failed to load gate data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayVisits();
    const interval = setInterval(loadTodayVisits, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (id) => {
    setProcessingId(id);
    try {
      await visitService.checkIn(id);
      await loadTodayVisits();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (id) => {
    setProcessingId(id);
    try {
      await visitService.checkOut(id);
      await loadTodayVisits();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVisits = (todayData.visits || []).filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.visitor?.fullName?.toLowerCase().includes(term) ||
      v.visitor?.phone?.includes(term) ||
      v.visitor?.company?.toLowerCase().includes(term) ||
      v.badgeNumber?.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'inside'
        ? v.status === 'checked_in'
        : statusFilter === 'expected'
        ? v.status === 'pending' || v.status === 'approved'
        : v.status === 'checked_out';

    return matchesSearch && matchesStatus;
  });

  return (
    <PageWrapper
      title="Security Gate Operations"
      subtitle="Front-desk gate pass management, real-time access control, and 1-click check-ins"
    >
      {/* Real-Time Gate Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setStatusFilter(statusFilter === 'inside' ? 'all' : 'inside')}
          className={`p-6 vms-chamfer border text-left transition-all ${
            statusFilter === 'inside'
              ? 'bg-[#10B981] text-[#07090F] border-emerald-400 font-bold shadow-lg'
              : 'bg-[#0E1420] text-white border-white/10 hover:border-emerald-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'inside' ? 'text-[#07090F]' : 'text-emerald-400'}`}>
              Currently Inside
            </span>
            <span className={`h-2.5 w-2.5 rounded-full ${statusFilter === 'inside' ? 'bg-[#07090F]' : 'bg-emerald-400 animate-pulse'}`} />
          </div>
          <div className={`font-display text-4xl sm:text-5xl font-extrabold mt-3 tabular-nums ${statusFilter === 'inside' ? 'text-[#07090F]' : 'text-white'}`}>
            {todayData.activeInside}
          </div>
          <p className={`text-xs mt-1 ${statusFilter === 'inside' ? 'text-[#07090F]/80' : 'text-white/50'}`}>
            Visitors with active passes
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'expected' ? 'all' : 'expected')}
          className={`p-6 vms-chamfer border text-left transition-all ${
            statusFilter === 'expected'
              ? 'bg-[#F59E0B] text-[#07090F] border-amber-400 font-bold shadow-lg'
              : 'bg-[#0E1420] text-white border-white/10 hover:border-amber-400/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'expected' ? 'text-[#07090F]' : 'text-amber-400'}`}>
              Expected / Pending
            </span>
            <Clock className={`w-4 h-4 ${statusFilter === 'expected' ? 'text-[#07090F]' : 'text-amber-400'}`} />
          </div>
          <div className={`font-display text-4xl sm:text-5xl font-extrabold mt-3 tabular-nums ${statusFilter === 'expected' ? 'text-[#07090F]' : 'text-white'}`}>
            {todayData.pendingApproval}
          </div>
          <p className={`text-xs mt-1 ${statusFilter === 'expected' ? 'text-[#07090F]/80' : 'text-white/50'}`}>
            Scheduled or expected arrival
          </p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-6 vms-chamfer border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-white text-[#07090F] border-white font-bold shadow-lg'
              : 'bg-[#0E1420] text-white border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold uppercase tracking-wider ${statusFilter === 'completed' ? 'text-[#07090F]' : 'text-white/60'}`}>
              Completed Today
            </span>
            <ShieldCheck className={`w-4 h-4 ${statusFilter === 'completed' ? 'text-[#07090F]' : 'text-white/60'}`} />
          </div>
          <div className={`font-display text-4xl sm:text-5xl font-extrabold mt-3 tabular-nums ${statusFilter === 'completed' ? 'text-[#07090F]' : 'text-white'}`}>
            {todayData.completedToday}
          </div>
          <p className={`text-xs mt-1 ${statusFilter === 'completed' ? 'text-[#07090F]/80' : 'text-white/50'}`}>
            Departed premises
          </p>
        </button>
      </div>

      {/* Controls Bar: Search & Status Filter Tabs */}
      <div className="bg-[#0C111B] p-4 vms-chamfer border border-white/10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search visitor name, phone, company, badge..."
            className="w-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Today' },
            { id: 'inside', label: 'Inside Premises' },
            { id: 'expected', label: 'Expected' },
            { id: 'completed', label: 'Departed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-colors vms-chamfer-sm ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-[#07090F]'
                  : 'bg-[#121A29] text-white/70 hover:bg-[#1B2434] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Gate Operations Roster */}
      <div className="bg-[#0C111B] vms-chamfer border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090F] text-white/50 uppercase tracking-wider font-bold border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Visitor Details</th>
                <th className="px-5 py-3.5">Staff Contact & Dept</th>
                <th className="px-5 py-3.5">Time & Purpose</th>
                <th className="px-5 py-3.5">Pass Serial</th>
                <th className="px-5 py-3.5">Gate Status</th>
                <th className="px-5 py-3.5 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-[#121A29] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{v.visitor?.fullName}</div>
                      <div className="flex items-center gap-2 text-white/50 mt-0.5">
                        <span className="font-medium">{v.visitor?.company || 'Personal'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px] text-white/40">
                          <Phone className="w-3 h-3" /> {v.visitor?.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white/90">{v.host?.fullName}</div>
                      <div className="text-[11px] text-white/50">{v.department?.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white/80 font-medium">{v.purpose}</div>
                      <div className="text-[11px] text-white/40 mt-0.5">
                        {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Expected'}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-amber-400">
                      {v.badgeNumber || 'PENDING'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {v.status !== 'checked_in' && v.status !== 'checked_out' && (
                          <button
                            onClick={() => handleCheckIn(v.id)}
                            disabled={processingId === v.id}
                            className="vms-btn bg-emerald-500 hover:bg-emerald-400 text-[#07090F] font-bold text-xs py-1.5 px-3"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Admit</span>
                          </button>
                        )}

                        {v.status === 'checked_in' && (
                          <button
                            onClick={() => handleCheckOut(v.id)}
                            disabled={processingId === v.id}
                            className="vms-btn bg-[#1A2233] hover:bg-[#26304A] text-white border border-white/10 text-xs py-1.5 px-3"
                          >
                            <LogOut className="w-3.5 h-3.5 text-amber-400" />
                            <span>Check-Out</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedBadge(v)}
                          title="Print / View Thermal Gate Pass"
                          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 vms-chamfer-sm transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-white/40 text-xs">
                    No visitor records match the current gate criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Badge Pass Modal */}
      <BadgeModal
        isOpen={!!selectedBadge}
        visit={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </PageWrapper>
  );
};

export default GateViewPage;
