import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { visitService } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { BadgeModal } from '../components/visitors/BadgeModal';
import {
  ShieldCheck,
  Search,
  LogIn,
  LogOut,
  Printer,
  UserCheck,
  Building,
  CheckCircle2,
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setStatusFilter(statusFilter === 'inside' ? 'all' : 'inside')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'inside'
              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/20 shadow-md'
              : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currently Inside</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-2">
            {todayData.activeInside}
          </div>
          <p className="text-xs text-slate-500 mt-1">Visitors with active passes</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'expected' ? 'all' : 'expected')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'expected'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-md'
              : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expected / Pending</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {todayData.pendingApproval}
          </div>
          <p className="text-xs text-slate-500 mt-1">Scheduled or awaiting host</p>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            statusFilter === 'completed'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-md'
              : 'bg-white border-slate-100 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Today</span>
            <CheckCircle2 className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-800 mt-2">
            {todayData.completedToday}
          </div>
          <p className="text-xs text-slate-500 mt-1">Departed premises</p>
        </button>
      </div>

      {/* Controls Bar: Search & Status Filter Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search visitor name, phone, company, badge..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Today' },
            { id: 'inside', label: 'Inside Premises' },
            { id: 'expected', label: 'Expected' },
            { id: 'completed', label: 'Departed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Gate Operations Roster */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Visitor Details</th>
                <th className="px-5 py-3">Host & Dept</th>
                <th className="px-5 py-3">Time & Purpose</th>
                <th className="px-5 py-3">Pass Serial</th>
                <th className="px-5 py-3">Gate Status</th>
                <th className="px-5 py-3 text-right">Gate Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVisits.length > 0 ? (
                filteredVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{v.visitor?.fullName}</div>
                      <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                        <span className="font-medium">{v.visitor?.company || 'Personal'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone className="w-3 h-3" /> {v.visitor?.phone}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{v.host?.fullName}</div>
                      <div className="text-[11px] text-brand-600 font-medium">
                        {v.department?.name || 'General Access'} ({v.department?.floor || 'Main'})
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-800 font-medium truncate max-w-xs">{v.purpose}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {v.checkInTime ? `Checked in: ${new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not checked in yet'}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 rounded-md text-slate-700">
                        {v.badgeNumber || 'PENDING'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <Badge status={v.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Print Badge Button */}
                        <button
                          onClick={() => setSelectedBadge(v)}
                          title="View / Print Badge Pass"
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-slate-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Check-In Action */}
                        {(v.status === 'pending' || v.status === 'approved') && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={LogIn}
                            loading={processingId === v.id}
                            onClick={() => handleCheckIn(v.id)}
                          >
                            Check In
                          </Button>
                        )}

                        {/* Check-Out Action */}
                        {v.status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            icon={LogOut}
                            loading={processingId === v.id}
                            onClick={() => handleCheckOut(v.id)}
                            className="hover:border-rose-400 hover:text-rose-600"
                          >
                            Check Out
                          </Button>
                        )}

                        {v.status === 'checked_out' && (
                          <span className="text-xs text-slate-400 font-medium italic">Checked Out</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 text-xs">
                    No visitor records match the current criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visitor Badge Modal */}
      <BadgeModal
        isOpen={!!selectedBadge}
        visit={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </PageWrapper>
  );
};

