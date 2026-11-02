import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { dashboardService } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import {
  Users,
  ShieldCheck,
  Clock,
  UserCheck,
  Building,
  TrendingUp,
  ArrowUpRight,
  UserPlus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Currently Inside */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Inside</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : stats?.currentlyInside ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">Persons on premises</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Badge verified at security</span>
          </div>
        </div>

        {/* Total Registered Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Today</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : stats?.totalToday ?? 0}
            </span>
            <span className="text-xs text-brand-600 font-medium">Check-ins</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
            <span>Facility entry events</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Passes</span>
            <UserCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : stats?.pendingApprovals ?? 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">Awaiting host</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pre-registration requests</span>
          </div>
        </div>

        {/* Average Visit Duration */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg. Stay Duration</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {loading ? '...' : stats?.avgDurationMinutes ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">Minutes</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>Facility dwell time</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Weekly Visitor Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">7-Day Visitor Traffic Trend</h3>
              <p className="text-xs text-slate-400">Daily incoming guest volume across all facilities</p>
            </div>
            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-lg">
              Live Aggregate
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.trends || []}>
                <defs>
                  <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Area type="monotone" dataKey="visits" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#visitorGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Organizations & Companies */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Top Visiting Companies</h3>
          <p className="text-xs text-slate-400 mb-4">Frequent corporate partner volume</p>

          <div className="flex-1 space-y-3">
            {trends?.topCompanies && trends.topCompanies.length > 0 ? (
              trends.topCompanies.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-slate-400">Verified entity</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold font-mono">
                    {c.count} visits
                  </span>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-48 text-xs text-slate-400">
                No company data recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Visits Live Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Facility Activity</h3>
            <p className="text-xs text-slate-400">Latest visitors recorded at checkpoints</p>
          </div>
          <span className="text-xs text-slate-500 font-medium">Auto-refreshed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Visitor</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Host Employee</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Badge Serial</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentVisits && stats.recentVisits.length > 0 ? (
                stats.recentVisits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{v.visitor?.fullName}</div>
                      <div className="text-[10px] text-slate-400">{v.visitor?.phone}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{v.visitor?.company || 'Personal'}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{v.host?.fullName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{v.department?.name || 'General'}</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">{v.badgeNumber || 'N/A'}</td>
                    <td className="px-5 py-3.5">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedBadge(v)}
                        className="text-brand-600 hover:text-brand-700 font-semibold hover:underline"
                      >
                        View Pass
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400 text-xs">
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

