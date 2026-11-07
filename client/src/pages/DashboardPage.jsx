import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { dashboardService, visitService } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  Users,
  ShieldCheck,
  Clock,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  Trash2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { BadgeModal } from '../components/visitors/BadgeModal';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const loadData = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTrends()
      ]);
      setStats(statsRes.data?.data || null);
      setTrends(trendsRes.data?.data || null);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async (id) => {
    try {
      await visitService.checkIn(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleDeleteVisit = async (id, visitorName) => {
    const confirmed = window.confirm(
      `Permanently delete the checked-out record for "${visitorName || 'Visitor'}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await visitService.deleteVisit(id);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete record');
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <PageWrapper
      title="Security & Operations Dashboard"
      subtitle="Real-time facility access statistics, active headcount, and visitor flow trends"
    >
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Currently Inside */}
        <div className="bg-[#0E1420] p-6 vms-chamfer border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Inside</span>
            <span className="vms-pulse relative h-2.5 w-2.5 bg-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight">
              {loading ? '...' : stats?.currentlyInside ?? 0}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">on site</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Badge verified at checkpoint</span>
          </div>
        </div>

        {/* Total Registered Today */}
        <div className="bg-[#0E1420] p-6 vms-chamfer border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Total Today</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight">
              {loading ? '...' : stats?.totalToday ?? 0}
            </span>
            <span className="text-xs text-sky-400 font-semibold">check-ins</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Daily entry throughput</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-[#0E1420] p-6 vms-chamfer border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pending Passes</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight">
              {loading ? '...' : stats?.pendingApprovals ?? 0}
            </span>
            <span className="text-xs text-amber-400 font-semibold">expected</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Expected arrival queue</span>
          </div>
        </div>

        {/* Average Visit Duration */}
        <div className="bg-[#0E1420] p-6 vms-chamfer border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Avg. Stay Duration</span>
            <Clock className="w-4 h-4 text-white/60" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight">
              {loading ? '...' : stats?.avgDurationMinutes ?? 0}
            </span>
            <span className="text-xs text-white/60 font-semibold">min</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
            <ArrowUpRight className="w-3.5 h-3.5 text-white/60" />
            <span>Facility dwell time</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Weekly Visitor Trend Chart */}
        <div className="lg:col-span-2 bg-[#0C111B] p-6 vms-chamfer border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display text-base font-bold text-white">7-Day Visitor Traffic Trend</h3>
              <p className="text-xs text-white/50">Daily incoming guest volume across all facilities</p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-bold vms-chamfer-sm border border-amber-500/30">
              Live Aggregate
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.trends || []}>
                <defs>
                  <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#07090F',
                    borderRadius: '0px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="visits" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#visitorGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Organizations & Companies */}
        <div className="bg-[#0C111B] p-6 vms-chamfer border border-white/10 flex flex-col">
          <h3 className="font-display text-base font-bold text-white mb-1">Top Visiting Companies</h3>
          <p className="text-xs text-white/50 mb-5">Frequent corporate partner volume</p>

          <div className="flex-1 space-y-2.5">
            {trends?.topCompanies && trends.topCompanies.length > 0 ? (
              trends.topCompanies.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#121A29] vms-chamfer-sm hover:bg-[#1B2434] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500 text-[#07090F] flex items-center justify-center font-display font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{c.name}</p>
                      <p className="text-[10px] text-white/40">Verified entity</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white/10 text-amber-400 text-xs font-bold tabular-nums">
                    {c.count} visits
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-48 text-xs text-white/40">
                No company data recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visits Live Table */}
      <div className="bg-[#0C111B] vms-chamfer border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-[#0E1420] flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-bold text-white">Recent Facility Activity</h3>
            <p className="text-xs text-white/50">Latest visitors recorded at checkpoints</p>
          </div>
          <span className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Auto-refreshed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090F] text-white/50 uppercase tracking-wider font-bold border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Staff Contact</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Badge Serial</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {stats?.recentVisits && stats.recentVisits.length > 0 ? (
                stats.recentVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-[#121A29] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{v.visitor?.fullName}</div>
                      <div className="text-[10px] text-white/40">{v.visitor?.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-white/70">{v.visitor?.company || 'Personal'}</td>
                    <td className="px-5 py-4 font-semibold text-white/90">{v.host?.fullName}</td>
                    <td className="px-5 py-4 text-white/60">{v.department?.name || 'General'}</td>
                    <td className="px-5 py-4 font-mono text-amber-400 font-semibold">{v.badgeNumber || 'N/A'}</td>
                    <td className="px-5 py-4">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {v.status === 'pending' && (
                          <button
                            onClick={() => handleAdmit(v.id)}
                            className="vms-btn bg-emerald-500 hover:bg-emerald-400 text-[#07090F] font-bold text-xs py-1 px-2.5"
                          >
                            Admit
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBadge(v)}
                          className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                        >
                          View Pass
                        </button>
                        {v.status === 'checked_out' && (
                          <button
                            onClick={() => handleDeleteVisit(v.id, v.visitor?.fullName)}
                            title="Delete checked-out visitor record"
                            className="p-1.5 text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 vms-chamfer-sm transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-white/40 text-xs">
                    No visitor logs recorded today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Badge Modal */}
      <BadgeModal
        isOpen={!!selectedBadge}
        visit={selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />
    </PageWrapper>
  );
};

export default DashboardPage;
