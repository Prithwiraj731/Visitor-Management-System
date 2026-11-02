import React from 'react';

export const Badge = ({ status, children, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'checked_in':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10';
      case 'checked_out':
        return 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/10';
      case 'approved':
        return 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/10';
      case 'rejected':
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10';
      case 'super_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'guard':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'host':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getLabel = () => {
    if (children) return children;
    switch (status) {
      case 'checked_in':
        return 'Inside Building';
      case 'checked_out':
        return 'Checked Out';
      case 'pending':
        return 'Pending Approval';
      case 'approved':
        return 'Approved (Expected)';
      case 'rejected':
        return 'Rejected';
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'guard':
        return 'Security Guard';
      case 'host':
        return 'Employee / Host';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ring-1 ring-inset ${getStyles()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {getLabel()}
    </span>
  );
};

