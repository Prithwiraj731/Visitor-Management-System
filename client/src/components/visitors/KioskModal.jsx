import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { visitService, userService } from '../../services/api';
import { QrCode, User, Phone, Mail, Building, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { BadgeModal } from './BadgeModal';

export const KioskModal = ({ isOpen, onClose }) => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [issuedVisit, setIssuedVisit] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    hostId: '',
    purpose: 'Business Meeting',
    idProofType: 'National ID / Driving License',
    idProofNumber: '',
    notes: 'Self-registered at guest kiosk'
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      loadHosts();
    }
  }, [isOpen]);

  const loadHosts = async () => {
    try {
      const { data } = await userService.getHosts();
      if (data?.data) {
        setHosts(data.data);
        if (data.data.length > 0 && !formData.hostId) {
          setFormData((prev) => ({ ...prev, hostId: data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load host directory', err);
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
      const { data } = await visitService.createKioskVisit(formData);
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
        title="Visitor Fast-Pass Kiosk"
        subtitle="Self-service contactless entry registration & digital pass generator"
        maxWidth="max-w-xl"
      >
        <div className="mb-4 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-black flex items-center justify-center shrink-0 font-bold">
            <QrCode className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-300 leading-snug font-mono">
            Direct contactless gate check-in. Fill details below to generate your cryptographic pass and notify your host.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Your Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mobile Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="+1-555-0192"
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Email (Optional)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="jordan@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Company / Organization</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="e.g. Apex Technologies"
                  className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Visiting Employee (Host) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                className="w-full px-3 py-2 text-sm text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
                value={formData.hostId}
                onChange={(e) => setFormData({ ...formData, hostId: e.target.value })}
              >
                <option value="" disabled className="text-slate-500 bg-white">Select Staff Member</option>
                {hosts.map((h) => (
                  <option key={h.id} value={h.id} className="text-slate-900 bg-white font-medium py-1">
                    {h.fullName} {h.department ? `(${h.department.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Purpose of Visit</label>
              <select
                className="w-full px-3 py-2 text-sm text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-colors cursor-pointer"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              >
                <option value="Business Meeting" className="text-slate-900 bg-white font-medium py-1">Business Meeting</option>
                <option value="Interview / Recruitment" className="text-slate-900 bg-white font-medium py-1">Interview / Candidate</option>
                <option value="Vendor / Delivery" className="text-slate-900 bg-white font-medium py-1">Vendor / Delivery</option>
                <option value="Client Consultation" className="text-slate-900 bg-white font-medium py-1">Client Consultation</option>
                <option value="Maintenance / Audit" className="text-slate-900 bg-white font-medium py-1">Maintenance / Audit</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} icon={CheckCircle2}>
              Generate Gate Pass
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issued Badge Modal */}
      {issuedVisit && (
        <BadgeModal
          isOpen={!!issuedVisit}
          visit={issuedVisit}
          onClose={handleDone}
        />
      )}
    </>
  );
};

