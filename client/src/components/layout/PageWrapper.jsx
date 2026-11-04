import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { QuickCheckInModal } from '../visitors/QuickCheckInModal';
import { BadgeModal } from '../visitors/BadgeModal';

export const PageWrapper = ({ children, title, subtitle, action }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [selectedBadgeVisit, setSelectedBadgeVisit] = useState(null);

  const handleVisitCreated = (newVisit) => {
    setSelectedBadgeVisit(newVisit);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenNewVisit={() => setIsCheckInOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Page Title & Action Bar */}
          {(title || action) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                {title && <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>}
                {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
              </div>
              {action && <div className="flex items-center gap-3">{action}</div>}
            </div>
          )}

          {/* Page Child Content */}
          {children}
        </main>
      </div>

      {/* Global Quick Check-In Modal */}
      <QuickCheckInModal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        onSuccess={handleVisitCreated}
      />

      {/* Global Visitor Badge Modal */}
      <BadgeModal
        isOpen={!!selectedBadgeVisit}
        visit={selectedBadgeVisit}
        onClose={() => setSelectedBadgeVisit(null)}
      />
    </div>
  );
};

