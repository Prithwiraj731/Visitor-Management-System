import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Building, Shield, Clock, User, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import { visitService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const BadgeModal = ({ isOpen, visit, onClose }) => {
  const [currentVisit, setCurrentVisit] = useState(visit);
  const [admitting, setAdmitting] = useState(false);
  const { user } = useAuth();

  // Keep currentVisit in sync when parent passes a new visit
  useEffect(() => {
    setCurrentVisit(visit);
  }, [visit]);

  // Real-time polling: If visitor has a pending pass, check status every 3s
  // When Guard or Admin admits them, the pass live-flips to 'checked_in' without refreshing!
  useEffect(() => {
    if (!isOpen || !currentVisit?.id || currentVisit.status !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const res = await visitService.getPass(currentVisit.id);
        if (res.data?.data) {
          setCurrentVisit(res.data.data);
        }
      } catch (err) {
        // quiet fallback
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, currentVisit?.id, currentVisit?.status]);

  if (!currentVisit) return null;

  const handlePrint = () => {
    const isPendingStatus = currentVisit.status === 'pending';
    const isCheckedInStatus = currentVisit.status === 'checked_in';

    const statusBannerHtml = isCheckedInStatus
      ? `<div style="background:#D1FAE5; color:#065F46; border-bottom:1px solid #A7F3D0; padding:10px 14px; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:1px; text-align:center;">
          &#10003; ACCESS GRANTED &bull; CHECKED IN
        </div>`
      : isPendingStatus
      ? `<div style="background:#FEF3C7; color:#92400E; border-bottom:1px solid #FDE68A; padding:10px 14px; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:1px; text-align:center;">
          &#9679; AWAITING GUARD CLEARANCE
        </div>`
      : `<div style="background:#F1F5F9; color:#475569; border-bottom:1px solid #E2E8F0; padding:10px 14px; font-weight:800; font-size:12px; text-transform:uppercase; letter-spacing:1px; text-align:center;">
          VISIT CONCLUDED &bull; CHECKED OUT
        </div>`;

    const qrImageHtml = currentVisit.qrCode
      ? `<img src="${currentVisit.qrCode}" style="width:180px; height:180px; display:block; margin:0 auto;" alt="Security Pass QR" />`
      : `<div style="width:180px; height:180px; display:flex; align-items:center; justify-content:center; background:#F8FAFC; color:#94A3B8; font-size:12px; margin:0 auto;">QR Unavailable</div>`;

    const checkInTimeLabel = currentVisit.checkInTime
      ? new Date(currentVisit.checkInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
      : 'Pending Gate Entry';

    const printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Visitor Pass - ${visitor.fullName || 'Guest'}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: #ffffff;
              color: #0F172A;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              padding: 20px 0;
            }
            .pass-card {
              width: 100%;
              max-width: 420px;
              border: 2px solid #0F172A;
              border-radius: 18px;
              overflow: hidden;
              background: #ffffff;
              box-shadow: none;
            }
            .pass-header {
              background: #0C111B !important;
              color: #ffffff !important;
              padding: 16px 20px;
              text-align: center;
              border-bottom: 3px solid #F59E0B;
            }
            .pass-header h1 {
              font-size: 15px;
              font-weight: 800;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .pass-header p {
              font-size: 9px;
              letter-spacing: 1px;
              text-transform: uppercase;
              color: rgba(255,255,255,0.7);
            }
            .pass-body {
              padding: 24px 22px;
              text-align: center;
            }
            .qr-box {
              display: inline-block;
              padding: 12px;
              background: #ffffff;
              border: 2px solid #E2E8F0;
              border-radius: 14px;
              margin-bottom: 12px;
            }
            .serial-badge {
              display: inline-block;
              padding: 5px 14px;
              background: #F1F5F9;
              border: 1px solid #CBD5E1;
              border-radius: 6px;
              font-family: monospace;
              font-size: 12px;
              font-weight: 800;
              color: #D97706;
              margin-bottom: 16px;
              letter-spacing: 1px;
            }
            .visitor-name {
              font-size: 24px;
              font-weight: 900;
              color: #0F172A;
              line-height: 1.15;
            }
            .visitor-company {
              font-size: 13px;
              font-weight: 600;
              color: #64748B;
              margin-top: 4px;
              margin-bottom: 20px;
            }
            .details-table {
              width: 100%;
              border-top: 1px solid #E2E8F0;
              padding-top: 14px;
              margin-bottom: 16px;
              font-size: 12px;
              text-align: left;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 7px 0;
              border-bottom: 1px solid #F8FAFC;
            }
            .detail-label {
              color: #64748B;
              font-weight: 500;
            }
            .detail-value {
              font-weight: 700;
              color: #0F172A;
              text-align: right;
            }
            .pass-footer {
              border-top: 1px solid #E2E8F0;
              padding-top: 12px;
              font-size: 9px;
              color: #94A3B8;
              line-height: 1.4;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="pass-card">
            <div class="pass-header">
              <h1>Security Visitor Pass</h1>
              <p>VMS Enterprise Perimeter Clearance</p>
            </div>
            ${statusBannerHtml}
            <div class="pass-body">
              <div class="qr-box">
                ${qrImageHtml}
              </div>
              <div>
                <span class="serial-badge">SERIAL: ${currentVisit.badgeNumber || 'PASS-PENDING'}</span>
              </div>
              <div class="visitor-name">${visitor.fullName || 'Authorized Guest'}</div>
              <div class="visitor-company">${visitor.company || 'Private Visitor'}</div>
              <div class="details-table">
                <div class="detail-row">
                  <span class="detail-label">Visiting:</span>
                  <span class="detail-value">${host.fullName || 'Reception Desk'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Department:</span>
                  <span class="detail-value">${department.name || 'General Access'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Issued / Check-In:</span>
                  <span class="detail-value">${checkInTimeLabel}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Purpose:</span>
                  <span class="detail-value">${currentVisit.purpose || 'Official Business'}</span>
                </div>
              </div>
              <div class="pass-footer">
                This pass must be visibly worn at all times while on site and surrendered to gate security upon exit.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    let iframe = document.getElementById('vms-print-frame');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'vms-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  const handleAdmit = async () => {
    if (!currentVisit?.id) return;
    setAdmitting(true);
    try {
      const res = await visitService.checkIn(currentVisit.id);
      if (res.data?.data) {
        setCurrentVisit(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setAdmitting(false);
    }
  };

  const visitor = currentVisit.visitor || {};
  const host = currentVisit.host || {};
  const department = currentVisit.department || {};
  const isPending = currentVisit.status === 'pending';
  const isCheckedIn = currentVisit.status === 'checked_in';
  const isCheckedOut = currentVisit.status === 'checked_out';
  const canAdmit = (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'guard') && isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visitor Security Pass"
      subtitle="Digital perimeter credential & live access pass"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col items-center">
        {/* Printable Badge Container */}
        <div
          id="printable-badge"
          className="w-full bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-xl my-2"
        >
          {/* Badge Header */}
          <div className="bg-[#0C111B] border-b-2 border-amber-500 text-white p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="font-extrabold tracking-wider text-sm uppercase font-mono">SECURITY VISITOR PASS</span>
            </div>
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono">VMS ENTERPRISE PERIMETER CLEARANCE</p>
          </div>

          {/* Live Status Banner */}
          {isPending && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 text-amber-800">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-bold text-xs uppercase tracking-wider">Awaiting Guard Clearance</span>
            </div>
          )}

          {isCheckedIn && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider">Access Granted · Checked In</span>
            </div>
          )}

          {isCheckedOut && (
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-center gap-2 text-slate-600">
              <Clock className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-bold text-xs uppercase tracking-wider">Visit Concluded · Checked Out</span>
            </div>
          )}

          {/* Badge Body */}
          <div className="p-5 flex flex-col items-center text-center">
            {/* QR Code Container */}
            <div className="p-3 border-2 border-slate-200 rounded-2xl bg-white shadow-inner mb-3">
              {currentVisit.qrCode ? (
                <img src={currentVisit.qrCode} alt="Security Pass QR" className="w-44 h-44 object-contain" />
              ) : (
                <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  QR Token Pending
                </div>
              )}
            </div>

            {/* Badge Serial */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 tracking-wider mb-2">
              <span>PASS SERIAL:</span>
              <span className="text-amber-600">{currentVisit.badgeNumber || 'PASS-PENDING'}</span>
            </div>

            {/* Live Instruction Banner for Visitor */}
            {isPending && (
              <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-left my-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900">Show this QR code at Gate Desk</p>
                    <p className="text-[11px] text-amber-800/80 leading-relaxed mt-0.5">
                      Present this pass to the security guard or gate desk to be admitted. This pass will instantly turn green once approved.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isCheckedIn && (
              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-left my-2">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Cleared for Building Entry</p>
                    <p className="text-[11px] text-emerald-800/80 leading-relaxed mt-0.5">
                      Admitted at {currentVisit.checkInTime ? new Date(currentVisit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}. Proceed to {department.name || 'Reception'} on {department.floor || 'Floor 1'}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Visitor Name & Company */}
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight mt-1">
              {visitor.fullName || 'Authorized Guest'}
            </h2>
            <p className="text-sm font-semibold text-slate-600 mt-0.5">
              {visitor.company || 'Private Visitor'}
            </p>

            {/* Visit Details Table */}
            <div className="w-full mt-4 pt-4 border-t border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Visiting:
                </span>
                <span className="font-semibold text-slate-900">{host.fullName || 'Reception Desk'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" /> Department:
                </span>
                <span className="font-semibold text-slate-900">{department.name || 'General Access'}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Check-In Time:
                </span>
                <span className="font-semibold text-slate-900">
                  {currentVisit.checkInTime ? new Date(currentVisit.checkInTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending Security Gate'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-medium text-slate-900 text-right truncate max-w-[190px]">
                  {currentVisit.purpose}
                </span>
              </div>
            </div>

            {/* Badge Footer Disclaimer */}
            <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500 text-center leading-normal">
              This pass must be visibly worn at all times while on site and surrendered to gate security upon exit.
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 w-full mt-4">
          <Button variant="secondary" onClick={onClose}>
            Close Pass
          </Button>

          <div className="flex items-center gap-2">
            {canAdmit && (
              <Button
                variant="primary"
                icon={LogIn}
                onClick={handleAdmit}
                loading={admitting}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#07090F] font-bold"
              >
                Approve & Admit
              </Button>
            )}

            <Button variant="outline" icon={Printer} onClick={handlePrint}>
              Print Pass
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default BadgeModal;

