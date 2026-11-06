import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Building2,
  FileBarChart2,
  AlertTriangle,
  UserCheck,
  LogOut,
  UserPlus,
  Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export const Sidebar = ({ mobileOpen, setMobileOpen, onOpenNewVisit }) => {
  const { user, logout, hasRole } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Gate Operations', href: '/gate', icon: ShieldCheck, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Visitors Log', href: '/visitors', icon: Users, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Departments', href: '/departments', icon: Building2, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Staff & Roles', href: '/staff', icon: UserCheck, roles: ['super_admin', 'admin'] },
    { name: 'Analytics & Reports', href: '/reports', icon: FileBarChart2, roles: ['super_admin', 'admin', 'guard'] },
    { name: 'Emergency Manifest', href: '/emergency', icon: AlertTriangle, roles: ['super_admin', 'admin', 'guard'], danger: true },
    { name: 'Public Homepage', href: '/', icon: Globe, roles: ['super_admin', 'admin', 'guard'] },
  ];

  const filteredNav = navigation.filter(item => hasRole(...item.roles));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#07090F] border-r border-white/10 text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <Link to="/" className="h-[68px] flex items-center justify-between px-5 border-b border-white/10 bg-[#07090F] hover:bg-white/[.03] transition-colors">
          <div className="flex items-center gap-3">
            <span className="vms-chamfer-sm grid h-9 w-9 place-items-center bg-amber-500 text-[#07090F]">
              <ShieldCheck size={19} strokeWidth={2.4} />
            </span>
            <div>
              <span className="font-display text-[15px] block leading-tight text-white">VMS Enterprise</span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">Access Control</span>
            </div>
          </div>
        </Link>

        {/* Quick Check-In CTA Button */}
        {(hasRole('super_admin', 'admin', 'guard')) && (
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={() => {
                if (onOpenNewVisit) onOpenNewVisit();
                setMobileOpen(false);
              }}
              className="vms-btn vms-btn-amber w-full justify-center text-sm py-2.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Visitor Check-In</span>
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider px-3 mb-2">
            Command Center
          </div>
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-[#07090F] vms-chamfer-sm font-bold shadow'
                    : item.danger
                    ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
                    : 'text-white/70 hover:bg-white/[.06] hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Current User Card & Logout */}
        <div className="p-3 border-t border-white/10 bg-[#0C111B]">
          <div className="flex items-center gap-3 p-2 bg-[#121A29] vms-chamfer-sm">
            <div className="w-8 h-8 bg-amber-500 text-[#07090F] flex items-center justify-center font-display font-bold text-sm shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.fullName}</p>
              <span className="text-[10px] text-amber-400 uppercase font-semibold block truncate">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="text-white/50 hover:text-rose-400 p-1.5 hover:bg-white/[.06] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
