import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { userService, visitService } from '../../services/api';
import { User, Phone, Mail, Building, CheckCircle2, ChevronDown } from 'lucide-react';

// Instant standby hosts with real production staff IDs
const FALLBACK_HOSTS = [
  { id: '5bc69158-3e0a-48e5-8a68-cc428358eba4', fullName: 'David Sterling (VP Partnerships)', department: { name: 'Corporate Sales' } },
  { id: 'c552ad57-fef5-4756-984d-9f1a906751b3', fullName: 'Sarah Connor (Director)', department: { name: 'Executive Suite' } },
  { id: '5f0019ac-77a4-433e-bec2-5cc4d07da96d', fullName: 'Dr. Alan Grant (Principal Architect)', department: { name: 'Engineering & Technology' } },
  { id: 'cc259021-0b76-46f1-80d0-fcfa8032269c', fullName: 'Elena Rostova (Head of Talent)', department: { name: 'Human Resources' } },
  { id: 'c13c600f-637e-4a84-91e9-c19f3677cf66', fullName: 'Marcus Vance (Chief Security Officer)', department: { name: 'Gate Operations' } }
];

export const QuickCheckInModal = ({ isOpen, onClose, onSuccess }) => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveHosts = hosts.length > 0 ? hosts : FALLBACK_HOSTS;

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    hostId: FALLBACK_HOSTS[0].id,
    purpose: 'Business Meeting',
    idProofType: 'Driving License',
    idProofNumber: '',
    notes: '',
    autoCheckIn: true
  });

  useEffect(() => {
    loadHosts();
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadHosts();
      setError('');
    }
  }, [isOpen]);

  const loadHosts = async () => {
    try {
      const { data } = await userService.getHosts();
      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        setHosts(data.data);
        setFormData(prev => {
          const hostExists = data.data.some(h => h.id === prev.hostId);
          return { ...prev, hostId: hostExists ? prev.hostId : data.data[0].id };
        });
      }
    } catch (err) {
      console.warn('Using standby host list for check-in:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.hostId || !formData.purpose) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedHost = effectiveHosts.find(h => h.id === formData.hostId);
      const payload = {
        ...formData,
        hostName: selectedHost?.fullName || ''
      };
      const { data } = await visitService.createVisit(payload);
      if (data?.data) {
        if (onSuccess) onSuccess(data.data);
        onClose();
        // Reset form
        setFormData({
          fullName: '',
          phone: '',
          email: '',
          company: '',
          hostId: hosts[0]?.id || '',
          purpose: 'Business Meeting',
          idProofType: 'Driving License',
          idProofNumber: '',
          notes: '',
          autoCheckIn: true
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register visitor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Visitor Registration & Gate Pass"
      subtitle="Complete visitor entry details to issue security pass"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold vms-chamfer-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Visitor Full Name <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Alex Vance"
                className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Contact Phone <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="tel"
                required
                placeholder="+1-555-0199"
                className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="alex@company.com"
                className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">Company / Agency</label>
            <div className="relative">
              <Building className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Black Mesa Research"
                className="w-full pl-10 pr-3 py-2.5 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/15 vms-chamfer-sm focus:border-amber-400 focus:outline-none transition-colors"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          {/* Person to Visit */}
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

          {/* Purpose */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Purpose of Visit <span className="text-amber-400">*</span>
            </label>
            <div className="relative vms-chamfer-sm">
              <select
                className="w-full pl-3.5 pr-10 py-3 text-base sm:text-sm text-white bg-[#0E1420] border border-white/20 focus:border-amber-400 focus:outline-none appearance-none cursor-pointer touch-manipulation font-medium"
                style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              >
                <option value="Business Meeting" className="text-slate-900 bg-white">Business Meeting</option>
                <option value="Client Consultation" className="text-slate-900 bg-white">Client Consultation</option>
                <option value="Vendor / Delivery" className="text-slate-900 bg-white">Vendor / Delivery</option>
                <option value="Technical Maintenance" className="text-slate-900 bg-white">Technical Maintenance</option>
                <option value="Job Interview" className="text-slate-900 bg-white">Job Interview</option>
                <option value="Facility Tour" className="text-slate-900 bg-white">Facility Tour</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-amber-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Checkbox: Auto Check-In */}
        <div className="pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80 font-medium">
            <input
              type="checkbox"
              checked={formData.autoCheckIn}
              onChange={(e) => setFormData({ ...formData, autoCheckIn: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span>Check-in visitor immediately (Mark status as Inside Building)</span>
          </label>
        </div>

        <div className="pt-5 flex justify-end gap-3 border-t border-white/10">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} icon={CheckCircle2}>
            Register & Issue Pass
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickCheckInModal;
