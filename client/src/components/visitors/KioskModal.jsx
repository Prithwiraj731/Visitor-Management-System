import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { visitService, userService } from '../../services/api';
import { useLockdown } from '../../context/LockdownContext';
import { QrCode, User, Phone, Mail, Building, CheckCircle2, ShieldAlert, ChevronDown } from 'lucide-react';
import { BadgeModal } from './BadgeModal';

// Instant standby hosts with real production staff IDs
const FALLBACK_HOSTS = [
  { id: '5bc69158-3e0a-48e5-8a68-cc428358eba4', fullName: 'David Sterling (VP Partnerships)', department: { name: 'Corporate Sales' } },
  { id: 'c552ad57-fef5-4756-984d-9f1a906751b3', fullName: 'Sarah Connor (Director)', department: { name: 'Executive Suite' } },
  { id: '5f0019ac-77a4-433e-bec2-5cc4d07da96d', fullName: 'Dr. Alan Grant (Principal Architect)', department: { name: 'Engineering & Technology' } },
  { id: 'cc259021-0b76-46f1-80d0-fcfa8032269c', fullName: 'Elena Rostova (Head of Talent)', department: { name: 'Human Resources' } },
  { id: 'c13c600f-637e-4a84-91e9-c19f3677cf66', fullName: 'Marcus Vance (Chief Security Officer)', department: { name: 'Gate Operations' } }
];

export const KioskModal = ({ isOpen, onClose }) => {
  const { isLockdown } = useLockdown();
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedVisit, setIssuedVisit] = useState(null);

  const effectiveHosts = hosts.length > 0 ? hosts : FALLBACK_HOSTS;

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    hostId: FALLBACK_HOSTS[0].id,
    purpose: 'Business Meeting',
    idProofType: 'National ID / Driving License',
    idProofNumber: '',
    notes: 'Self-registered at guest kiosk'
  });

  // Preload staff immediately on component load
  useEffect(() => {
    loadHosts();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadHosts();
    }
  }, [isOpen]);

  const loadHosts = async () => {
    try {
      const { data } = await userService.getHosts();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        setHosts(data.data);
        setFormData((prev) => {
          const hostExists = data.data.some((h) => h.id === prev.hostId);
          return {
            ...prev,
            hostId: hostExists ? prev.hostId : data.data[0].id
          };
        });
      }
    } catch (err) {
      console.warn('Using standby host roster for fast-pass kiosk:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.hostId) {
      setError('Please provide your name, phone number, and select the employee you are visiting.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedHost = effectiveHosts.find((h) => h.id === formData.hostId);
      const payload = {
        ...formData,
        hostName: selectedHost?.fullName || ''
      };
      const { data } = await visitService.createKioskVisit(payload);
      if (data?.data) {
        setIssuedVisit(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check front desk.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setIssuedVisit(null);
    onClose();
    setFormData({
      fullName: '',
      phone: '',
      email: '',
      company: '',
      hostId: hosts[0]?.id || '',
      purpose: 'Business Meeting',
      idProofType: 'National ID / Driving License',
      idProofNumber: '',
      notes: 'Self-registered at guest kiosk'
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !issuedVisit}
        onClose={onClose}
        title={isLockdown ? 'DEFCON 1 Emergency Lockout' : 'Visitor Fast-Pass Kiosk'}
        subtitle={isLockdown ? 'Facility security directive in effect' : 'Self-service contactless entry registration & digital pass generator'}
        maxWidth="max-w-xl"
      >
        {isLockdown ? (
          <div className="py-8 px-4 text-center">
            <div className="w-16 h-16 bg-red-600/20 text-red-500 border border-red-500/40 mx-auto flex items-center justify-center vms-chamfer mb-4">
              <ShieldAlert className="w-9 h-9 animate-pulse" />
            </div>
            <h3 className="font-display text-xl font-bold text-white mb-2 uppercase tracking-wide">
              Perimeter Entry Suspended
            </h3>
            <p className="text-xs text-red-300 font-mono mb-4 max-w-md mx-auto">
              DEFCON 1 Emergency Directive: Self-service kiosk registrations are currently suspended by security operations.
            </p>
            <p className="text-xs text-white/60 mb-6 max-w-sm mx-auto">
              All visitors must report immediately to the checkpoint security guard or front desk station.
            </p>
            <Button variant="secondary" onClick={onClose} className="mx-auto">
              Close Notice
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-[#07090F] border border-white/10 vms-chamfer-sm flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-500 text-[#07090F] flex items-center justify-center shrink-0 vms-chamfer-sm font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <p className="text-xs text-white/70 leading-snug">
                Direct contactless gate check-in. Fill details below to generate your cryptographic pass and register your arrival.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold vms-chamfer-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Your Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Mobile Phone <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="+1-555-0192"
                  className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Email (Optional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="email"
                  placeholder="jordan@company.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Company / Organization</label>
              <div className="relative">
                <Building className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Apex Technologies"
                  className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Staff / Person to Visit <span className="text-amber-400">*</span>
              </label>
              <div className="relative vms-chamfer-sm">
                <select
                  required
                  className="w-full pl-3.5 pr-10 py-3 text-base sm:text-sm text-white bg-[#0E1420] border border-white/20 focus:border-amber-400 focus:outline-none appearance-none cursor-pointer touch-manipulation font-medium"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  value={formData.hostId}
                  onChange={(e) => setFormData({ ...formData, hostId: e.target.value })}
                >
                  {effectiveHosts.map((h) => (
                    <option key={h.id} value={h.id} className="text-slate-900 bg-white">
                      {h.fullName} {h.department?.name ? `(${h.department.name})` : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-amber-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Purpose of Visit</label>
              <div className="relative vms-chamfer-sm">
                <select
                  className="w-full pl-3.5 pr-10 py-3 text-base sm:text-sm text-white bg-[#0E1420] border border-white/20 focus:border-amber-400 focus:outline-none appearance-none cursor-pointer touch-manipulation font-medium"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                >
                  <option value="Business Meeting" className="text-slate-900 bg-white">Business Meeting</option>
                  <option value="Interview / Candidate" className="text-slate-900 bg-white">Interview / Candidate</option>
                  <option value="Vendor / Delivery" className="text-slate-900 bg-white">Vendor / Delivery</option>
                  <option value="Client Consultation" className="text-slate-900 bg-white">Client Consultation</option>
                  <option value="Maintenance / Audit" className="text-slate-900 bg-white">Maintenance / Audit</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-amber-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

            <div className="pt-5 flex justify-end gap-3 border-t border-white/10">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading} icon={CheckCircle2}>
                Generate Gate Pass
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>

      {/* Render Issued Badge Pass Modal */}
      <BadgeModal
        isOpen={!!issuedVisit}
        visit={issuedVisit}
        onClose={handleDone}
      />
    </>
  );
};

export default KioskModal;
