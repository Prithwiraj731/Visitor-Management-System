import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { departmentService, userService } from '../services/api';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Users, User, MapPin } from 'lucide-react';

export const DepartmentsPage = () => {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', floor: '', building: 'Main Tower', headId: '' });

  const loadData = async () => {
    try {
      const [deptRes, hostRes] = await Promise.all([
        departmentService.getDepartments(),
        userService.getHosts()
      ]);
      setDepartments(deptRes.data?.data || []);
      setHosts(hostRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await departmentService.createDepartment(formData);
      setIsModalOpen(false);
      setFormData({ name: '', floor: '', building: 'Main Tower', headId: '' });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  return (
    <PageWrapper
      title="Facility Departments"
      subtitle="Organizational business units, floor zones, and live headcount per wing"
      action={
        hasRole('super_admin', 'admin') && (
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Add Department
          </Button>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200">
                  {dept.activeVisitorsCount || 0} active guests
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {dept.building} — {dept.floor || 'Ground'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Head: {dept.head?.fullName || 'Not Assigned'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {dept.members?.length || 0} Staff Members
              </span>
              <span className="text-brand-600 font-semibold">Active Wing</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Facility Department"
        subtitle="Add a new business unit or building wing"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Department Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Legal & Compliance"
              className="w-full px-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Building</label>
              <input
                type="text"
                placeholder="e.g. Main Tower"
                className="w-full px-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Floor</label>
              <input
                type="text"
                placeholder="e.g. 5th Floor"
                className="w-full px-3 py-2 text-sm text-slate-900 font-medium placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Department Head</label>
            <select
              className="w-full px-3 py-2 text-sm text-slate-900 font-semibold bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none cursor-pointer"
              value={formData.headId}
              onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
            >
              <option value="" className="text-slate-900 bg-white">Select Employee</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id} className="text-slate-900 bg-white">
                  {h.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Department</Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};
