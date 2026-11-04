import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { reportService, departmentService } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Download, Calendar, Filter, FileSpreadsheet } from 'lucide-react';

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

  const handleExportCsv = () => {
    const url = reportService.downloadCsvUrl({
      fromDate: fromDate ? `${fromDate}T00:00:00.000Z` : undefined,
      toDate: toDate ? `${toDate}T23:59:59.999Z` : undefined,
      departmentId: departmentId || undefined,
      status: status || undefined
    });
    window.open(url, '_blank');
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
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">From Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 text-xs text-slate-900 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">To Date</label>
            <input
              type="date"
              className="w-full px-3 py-2 text-xs text-slate-900 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Department</label>
            <select
              className="w-full px-3 py-2 text-xs text-slate-900 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none cursor-pointer"
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
            <label className="block text-xs font-bold text-slate-800 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 text-xs text-slate-900 font-medium bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="" className="text-slate-900 bg-white">All Statuses</option>
              <option value="checked_in" className="text-slate-900 bg-white">Inside Building</option>
              <option value="checked_out" className="text-slate-900 bg-white">Checked Out</option>
              <option value="pending" className="text-slate-900 bg-white">Pending</option>
              <option value="approved" className="text-slate-900 bg-white">Approved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Records Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>Found {reportData.length} audit records</span>
          <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Ready for Export
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Badge Serial</th>
                <th className="px-5 py-3.5">Visitor</th>
                <th className="px-5 py-3.5">Company</th>
                <th className="px-5 py-3.5">Host Employee</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Purpose</th>
                <th className="px-5 py-3.5">Check In</th>
                <th className="px-5 py-3.5">Check Out</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono font-semibold text-slate-700">{v.badgeNumber || 'N/A'}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{v.visitor?.fullName}</td>
                  <td className="px-5 py-3.5 text-slate-600">{v.visitor?.company || 'Personal'}</td>
                  <td className="px-5 py-3.5 text-slate-800 font-medium">{v.host?.fullName}</td>
                  <td className="px-5 py-3.5 text-slate-600">{v.department?.name || 'General Access'}</td>
                  <td className="px-5 py-3.5 text-slate-600 truncate max-w-xs">{v.purpose}</td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono">
                    {v.checkInTime ? new Date(v.checkInTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono">
                    {v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge status={v.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
};
