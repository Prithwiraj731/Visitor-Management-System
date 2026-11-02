import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Building, Shield, Calendar, Clock, User } from 'lucide-react';

export const BadgeModal = ({ isOpen, visit, onClose }) => {
  if (!visit) return null;

  const handlePrint = () => {
    window.print();
  };

  const visitor = visit.visitor || {};
  const host = visit.host || {};
  const department = visit.department || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visitor Security Pass"
      subtitle="Authorized visitor credential and gate access pass"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center">
        {/* Printable Badge Container */}
        <div
          id="printable-badge"
          className="w-full bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-md my-2"
        >
          {/* Badge Header */}
          <div className="bg-gradient-to-r from-brand-700 to-indigo-800 text-white p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-brand-300" />
              <span className="font-extrabold tracking-wider text-sm uppercase">SECURITY VISITOR PASS</span>
            </div>
            <p className="text-[11px] text-brand-200 uppercase tracking-widest font-medium">Headquarters Facility Access</p>
          </div>

          {/* Badge Body */}
          <div className="p-5 flex flex-col items-center text-center">
            {/* QR Code */}
            <div className="p-2 border border-slate-200 rounded-xl bg-white shadow-inner mb-4">
              {visit.qrCode ? (
                <img src={visit.qrCode} alt="Security QR" className="w-40 h-40 object-contain" />
              ) : (
                <div className="w-40 h-40 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  QR Not Available
                </div>
              )}
            </div>

            {/* Badge Serial */}
            <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800 tracking-wider mb-3">
              {visit.badgeNumber || 'PASS-PENDING'}
            </div>

            {/* Visitor Name & Details */}
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {visitor.fullName || 'Authorized Guest'}
            </h2>
            <p className="text-sm font-semibold text-brand-600 mt-0.5">
              {visitor.company || 'Private Visitor'}
            </p>

            {/* Visit Details Table */}
            <div className="w-full mt-4 pt-4 border-t border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Host:
                </span>
                <span className="font-semibold text-slate-800">{host.fullName || 'Reception Desk'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Department:
                </span>
                <span className="font-semibold text-slate-800">{department.name || 'General Access'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Issued At:
                </span>
                <span className="font-medium text-slate-700">
                  {visit.checkInTime ? new Date(visit.checkInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending Check-In'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-medium text-slate-800 text-right truncate max-w-[180px]">
                  {visit.purpose}
                </span>
              </div>
            </div>

            {/* Badge Footer Disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center leading-normal">
              This pass must be visibly worn at all times and surrendered to security upon exit.
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 w-full mt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint}>
            Print Badge
          </Button>
        </div>
      </div>
    </Modal>
  );
};

