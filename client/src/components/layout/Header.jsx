import React, { useState, useEffect } from 'react';
import { Menu, Bell, AlertTriangle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/api';
import { Link } from 'react-router-dom';

export const Header = ({ setMobileOpen }) => {
  const { user, hasRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await notificationService.getNotifications();
      if (data?.data) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // non-blocking
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-[68px] bg-[#07090F] border-b border-white/10 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 text-white">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-white/70 hover:text-white p-2 hover:bg-white/[.06] vms-chamfer-sm"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2.5 text-xs text-white/60">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {time.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
            <span className="font-mono font-bold text-white tabular-nums">{time.toLocaleTimeString('en-GB')}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Emergency Evacuation Shortcut Button */}
        {(hasRole('super_admin', 'admin', 'guard')) && (
          <Link
            to="/emergency"
            className="vms-btn vms-btn-amber text-xs py-1.5 px-3 font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#07090F]" />
            <span className="hidden sm:inline">Evacuation Roster</span>
          </Link>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-white/70 hover:text-white hover:bg-white/[.06] vms-chamfer-sm transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-[#07090F] text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0C111B] border border-white/15 vms-chamfer shadow-2xl py-2 z-50 text-white">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-[#07090F]">
                <span className="font-display text-sm font-bold text-white">Security Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/[.06]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-white/40">No alerts at this time</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-white/[.04] transition-colors ${!n.isRead ? 'bg-amber-500/10' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-white">{n.title}</p>
                        <span className="text-[10px] text-white/50 shrink-0 tabular-nums">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Small User Info */}
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <div className="w-8 h-8 bg-amber-500 text-[#07090F] font-display font-bold flex items-center justify-center text-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <span className="block text-xs font-bold text-white leading-tight">{user?.fullName}</span>
            <span className="block text-[10px] text-amber-400 font-semibold capitalize">{user?.role?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
