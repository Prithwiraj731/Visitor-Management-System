import React from 'react';

export const Badge = ({ status, children, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'checked_in':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'checked_out':
        return 'bg-white/10 text-white/60 border border-white/15';
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'approved':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
      case 'rejected':
      case 'cancelled':
        return 'bg-rose-500/15 text-rose-400 border border-rose-500/30';
      case 'super_admin':
        return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
      case 'admin':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      case 'guard':
        return 'bg-teal-500/15 text-teal-300 border border-teal-500/30';
      case 'host':
        return 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
      default:
        return 'bg-white/10 text-white/70 border border-white/15';
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase vms-chamfer-sm ${getStyles()} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {getLabel()}
    </span>
  );
};

export default Badge;
