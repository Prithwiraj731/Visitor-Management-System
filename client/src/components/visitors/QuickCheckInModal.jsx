import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { userService, visitService } from '../../services/api';
import { User, Phone, Mail, Building, FileText, CheckCircle2 } from 'lucide-react';

export const QuickCheckInModal = ({ isOpen, onClose, onSuccess }) => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: '',
    hostId: '',
    purpose: 'Business Meeting',
    idProofType: 'Driving License',
    idProofNumber: '',
    notes: '',
    autoCheckIn: true
  });

  useEffect(() => {
    if (isOpen) {
      loadHosts();
      setError('');
    }
  }, [isOpen]);

  const loadHosts = async () => {
    try {
      const { data } = await userService.getHosts();
      if (data?.data) {
        setHosts(data.data);
        if (data.data.length > 0 && !formData.hostId) {
          setFormData(prev => ({ ...prev, hostId: data.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load hosts', err);
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
      const { data } = await visitService.createVisit(formData);
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
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Visitor Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Alex Mercer"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="tel"
                required
                placeholder="+1-555-0123"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="email"
                placeholder="alex.m@company.com"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Company / Organization</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. GenTek Dynamics"
                className="w-full pl-9 pr-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>
          </div>

          {/* Host Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Host Employee to Visit <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 text-sm text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors cursor-pointer"
              value={formData.hostId}
              onChange={(e) => setFormData({ ...formData, hostId: e.target.value })}
            >
              <option value="" disabled className="text-slate-500 bg-white">Select Employee</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id} className="text-slate-900 bg-white font-medium py-1">
                  {h.fullName} {h.department ? `(${h.department.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Purpose of Visit */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Purpose of Visit <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 text-sm text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors cursor-pointer"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            >
              <option value="Business Meeting" className="text-slate-900 bg-white font-medium py-1">Business Meeting</option>
              <option value="Interview / Recruitment" className="text-slate-900 bg-white font-medium py-1">Interview / Recruitment</option>
              <option value="Vendor / Supplier Delivery" className="text-slate-900 bg-white font-medium py-1">Vendor / Supplier Delivery</option>
              <option value="Client Consultation" className="text-slate-900 bg-white font-medium py-1">Client Consultation</option>
              <option value="Contractor & Maintenance" className="text-slate-900 bg-white font-medium py-1">Contractor & Maintenance</option>
              <option value="Official Audit" className="text-slate-900 bg-white font-medium py-1">Official Audit</option>
              <option value="Personal Visit" className="text-slate-900 bg-white font-medium py-1">Personal Visit</option>
            </select>
          </div>

          {/* ID Proof Type */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">ID Proof Type</label>
            <select
              className="w-full px-3 py-2 text-sm text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors cursor-pointer"
              value={formData.idProofType}
              onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
            >
              <option value="Driving License" className="text-slate-900 bg-white font-medium py-1">Driving License</option>
              <option value="National ID" className="text-slate-900 bg-white font-medium py-1">National ID</option>
              <option value="Passport" className="text-slate-900 bg-white font-medium py-1">Passport</option>
              <option value="Corporate Badge" className="text-slate-900 bg-white font-medium py-1">Corporate Badge</option>
            </select>
          </div>

          {/* ID Proof Number */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">ID Proof Number</label>
            <input
              type="text"
              placeholder="e.g. DL-88912-US"
              className="w-full px-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
              value={formData.idProofNumber}
              onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes / Belongings</label>
          <textarea
            rows="2"
            placeholder="e.g. Carrying laptop, vehicle plate # XYZ-9012"
            className="w-full px-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* Check-In Mode Toggle */}
        <div className="flex items-center gap-2 p-3 bg-brand-50/60 border border-brand-100 rounded-xl">
          <input
            type="checkbox"
            id="autoCheckIn"
            checked={formData.autoCheckIn}
            onChange={(e) => setFormData({ ...formData, autoCheckIn: e.target.checked })}
            className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
          />
          <label htmlFor="autoCheckIn" className="text-xs font-medium text-slate-700 cursor-pointer">
            Immediate Gate Check-In (marks status as <span className="font-semibold text-emerald-700">Inside Building</span> and prints badge)
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={CheckCircle2}>
            Register & Generate Badge
          </Button>
        </div>
      </form>
    </Modal>
  );
};

