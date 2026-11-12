import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { reportService, departmentService } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Download } from 'lucide-react';

export const ReportsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    departmentService.getDepartments().then((res) => {
      setDepartments(res.data?.data || []);
    });
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const { data } = await reportService.getSummary({
        fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        toDate: toDate ? `${toDate}T23:59:59.999Z` : undefined,
        departmentId: departmentId || undefined,
        status: status || undefined
      });
      setReportData(data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [fromDate, toDate, departmentId, status]);

  const handleExportCsv = async () => {
    try {
      const response = await reportService.downloadCsv({
        fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
        toDate: toDate ? `${toDate}T23:59:59.999Z` : undefined,
        departmentId: departmentId || undefined,
        status: status || undefined
      });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `vms_visitor_report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to export CSV report.');
    }
  };

  return (
    <PageWrapper
      title="Compliance & Audit Reports"
      subtitle="Export formal visitor access logs for compliance, security audits, and facility review"
      action={
        <Button variant="primary" icon={Download} onClick={handleExportCsv}>
          Export Full Report (CSV)
        </Button>
      }
    >
      {/* Filters Card */}
      <div className="bg-[#0C111B] p-6 vms-chamfer border border-white/10 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">From Date</label>
            <input
              type="date"
              className="w-full px-3.5 py-2 text-xs text-white bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">To Date</label>
            <input
              type="date"
              className="w-full px-3.5 py-2 text-xs text-white bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Department</label>
            <select
              className="w-full px-3.5 py-2 text-xs text-white bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none cursor-pointer"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="" className="text-slate-900 bg-white">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="text-slate-900 bg-white">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Filter Status</label>
            <select
              className="w-full px-3.5 py-2 text-xs text-white bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none cursor-pointer"
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
      </div>

      {/* Report Summary Data Table */}
      <div className="bg-[#0C111B] vms-chamfer border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 bg-[#0E1420] flex items-center justify-between text-xs">
          <span className="font-display text-sm font-bold text-white">Aggregated Audit Trail</span>
          <span className="text-white/60">
            Total Matching Records: <strong className="text-amber-400">{reportData.length}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090F] text-white/50 uppercase tracking-wider font-bold border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Staff Contact</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Arrival Timestamp</th>
                <th className="px-5 py-3.5">Exit Timestamp</th>
                <th className="px-5 py-3.5">Pass Serial</th>
                <th className="px-5 py-3.5">Final Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-white/40">
                    Compiling compliance audit...
                  </td>
                </tr>
              ) : reportData.length > 0 ? (
                reportData.map((v) => (
                  <tr key={v.id} className="hover:bg-[#121A29] transition-colors">
                    <td className="px-5 py-4 font-bold text-white text-sm">
                      {v.visitor?.fullName}
                    </td>
                    <td className="px-5 py-4 text-white/70 font-medium">
                      {v.visitor?.company || 'Personal'}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white/90">
                      {v.host?.fullName}
                    </td>
                    <td className="px-5 py-4 text-white/60">
                      {v.department?.name || 'General Area'}
                    </td>
                    <td className="px-5 py-4 text-white/60 font-mono">
                      {v.checkInTime ? new Date(v.checkInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4 text-white/60 font-mono">
                      {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-amber-400">
                      {v.badgeNumber || 'N/A'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge status={v.status} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-white/40 text-xs">
                    No visitor records found matching selected audit range
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

export default ReportsPage;
