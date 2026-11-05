import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { visitService, reportService } from '../services/api';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { BadgeModal } from '../components/visitors/BadgeModal';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Phone
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
      <div className="bg-[#0C111B] p-4 vms-chamfer border border-white/10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search visitor name, phone, company..."
            className="w-full pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            className="px-4 py-2 text-xs font-bold bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none text-white cursor-pointer"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="" className="text-slate-900 bg-white">All Statuses</option>
            <option value="checked_in" className="text-slate-900 bg-white">Inside Building</option>
            <option value="checked_out" className="text-slate-900 bg-white">Checked Out</option>
            <option value="pending" className="text-slate-900 bg-white">Pending Approval</option>
            <option value="approved" className="text-slate-900 bg-white">Approved</option>
            <option value="rejected" className="text-slate-900 bg-white">Rejected</option>
          </select>
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-[#0C111B] vms-chamfer border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090F] text-white/50 uppercase tracking-wider font-bold border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Host Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Check-In</th>
                <th className="px-5 py-3.5">Check-Out</th>
                <th className="px-5 py-3.5">Badge Serial</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Pass</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-white/40">
                    Loading visitor records...
                  </td>
                </tr>
              ) : visits.length > 0 ? (
                visits.map((v) => (
                  <tr key={v.id} className="hover:bg-[#121A29] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-white text-sm">{v.visitor?.fullName}</div>
                      <div className="flex items-center gap-1 text-[11px] text-white/40 mt-0.5">
                        <Phone className="w-3 h-3 text-amber-400" /> {v.visitor?.phone}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-white/70 font-medium">{v.visitor?.company || 'Personal'}</td>
                    <td className="px-5 py-4 font-semibold text-white/90">{v.host?.fullName}</td>
                    <td className="px-5 py-4 text-white/60">{v.department?.name || 'General'}</td>
                    <td className="px-5 py-4 text-white/60 font-mono">
                      {v.checkInTime ? new Date(v.checkInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-white/60 font-mono">
                      {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-amber-400">
                      {v.badgeNumber || 'PENDING'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={v.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedBadge(v)}
                        className="text-amber-400 hover:text-amber-300 font-bold hover:underline"
                      >
                        Badge
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-white/40 text-xs">
                    No visitor logs found matching criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-white/10 bg-[#0E1420] flex items-center justify-between text-xs text-white/60">
          <span>
            Showing <strong className="text-white">{visits.length}</strong> of{' '}
            <strong className="text-white">{meta.total}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadVisits(meta.page - 1)}
              disabled={meta.page <= 1 || loading}
              className="p-1.5 vms-chamfer-sm bg-[#121A29] hover:bg-[#1B2434] text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white px-2">
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              onClick={() => loadVisits(meta.page + 1)}
              disabled={meta.page >= meta.totalPages || loading}
              className="p-1.5 vms-chamfer-sm bg-[#121A29] hover:bg-[#1B2434] text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
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

export default VisitorsPage;
