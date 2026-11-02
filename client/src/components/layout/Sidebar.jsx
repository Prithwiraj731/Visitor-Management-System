import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Building2,
  FileBarChart2,
  AlertTriangle,
  UserCheck,
  LogOut,
  Building,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const Sidebar = ({ mobileOpen, setMobileOpen, onOpenNewVisit }) => {
  const { user, logout, hasRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'guard', 'host'] },
    { name: 'Gate Operations', href: '/gate', icon: ShieldCheck, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Visitors Log', href: '/visitors', icon: Users, roles: ['super_admin', 'admin', 'guard', 'host'] },
    { name: 'Departments', href: '/departments', icon: Building2, roles: ['super_admin', 'admin', 'guard', 'host'] },
    { name: 'Staff & Roles', href: '/staff', icon: UserCheck, roles: ['super_admin', 'admin'] },
    { name: 'Analytics & Reports', href: '/reports', icon: FileBarChart2, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Emergency Manifest', href: '/emergency', icon: AlertTriangle, roles: ['super_admin', 'admin', 'guard'], danger: true },
  ];

  const filteredNav = navigation.filter(item => hasRole(...item.roles));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base block leading-tight">VMS Portal</span>
              <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wider block">Enterprise Security</span>
            </div>
          </div>
        </div>

        {/* Quick Check-In CTA Button */}
        {(hasRole('super_admin', 'admin', 'guard')) && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => {
                if (onOpenNewVisit) onOpenNewVisit();
                setMobileOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm shadow-md shadow-brand-600/20 transition-all active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Visitor Check-In</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Main Navigation
          </div>
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : item.danger
                    ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Current User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50">
            <div className="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center font-bold text-slate-200 uppercase text-sm shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
              <Badge status={user?.role} className="mt-0.5 text-[10px] px-1.5 py-0" />
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

