import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { visitService, reportService } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { BadgeModal } from '../components/visitors/BadgeModal';
import {
  Search,
  Download,
  Filter,
  Printer,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building,
  User
} from 'lucide-react';

export const VisitorsPage = () => {
  const [visits, setVisits] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedBadge, setSelectedBadge] = useState(null);

  const loadVisits = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await visitService.getVisits({
        page,
        limit: 15,
        search: search || undefined,
        status: status || undefined
      });
      if (data?.data) {
        setVisits(data.data);
        if (data.meta) setMeta(data.meta);
      }
    } catch (err) {
      console.error('Failed to load visits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits(1);
  }, [status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadVisits(1);
  };

  const handleExportCsv = () => {
    const url = reportService.downloadCsvUrl({ status: status || undefined });
    window.open(url, '_blank');
  };

  return (
    <PageWrapper
      title="Visitor Logs & History"
      subtitle="Comprehensive historical registry of all facility arrivals, exits, and guest credentials"
      action={
        <Button variant="secondary" icon={Download} onClick={handleExportCsv}>
          Export CSV Log
        </Button>
      }
    >
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search visitor name, phone, company..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-slate-700"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="checked_in">Inside Building</option>
            <option value="checked_out">Checked Out</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Host Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Check In / Out</th>
                <th className="px-5 py-3.5">Badge Serial</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length > 0 ? (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{v.visitor?.fullName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{v.visitor?.phone}</div>
                    </td>

                    <td className="px-5 py-4 text-slate-700 font-medium">
                      {v.visitor?.company || 'Personal Guest'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-800">{v.host?.fullName}</div>
                      <div className="text-[11px] text-slate-400">{v.host?.email}</div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {v.department?.name || 'General Access'}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-slate-800 font-medium">
                        {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(v.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono font-semibold text-slate-600">
                      {v.badgeNumber || 'N/A'}
                    </td>

                    <td className="px-5 py-4">
                      <Badge status={v.status} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedBadge(v)}
                        title="Print / View Pass"
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-slate-200"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-slate-400 text-xs">
                    {loading ? 'Loading records...' : 'No visitor records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-800">{meta.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{meta.totalPages}</span> ({meta.total} records)
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={meta.page <= 1}
                onClick={() => loadVisits(meta.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronRight}
                disabled={meta.page >= meta.totalPages}
                onClick={() => loadVisits(meta.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
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

