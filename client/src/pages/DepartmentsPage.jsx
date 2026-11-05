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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-[#0C111B] p-6 vms-chamfer border border-white/10 flex flex-col justify-between hover:border-amber-400/50 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-amber-500 text-[#07090F] flex items-center justify-center vms-chamfer-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 font-bold text-xs vms-chamfer-sm border border-emerald-500/30">
                  {dept.activeVisitorsCount || 0} active guests
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-white tracking-tight">{dept.name}</h3>

              <div className="mt-4 space-y-2 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {dept.building} — {dept.floor || 'Ground'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-white/40" />
                  <span>Head: {dept.head?.fullName || 'Not Assigned'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-white/40" /> {dept.members?.length || 0} Staff Members
              </span>
              <span className="text-amber-400 font-bold">Active Wing</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Department"
        subtitle="Provision a designated security zone or corporate department"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Department Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Research & Robotics Lab"
              className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Building Complex
              </label>
              <input
                type="text"
                placeholder="Main Tower"
                className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Floor / Zone
              </label>
              <input
                type="text"
                placeholder="Floor 4 / Wing B"
                className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Department Head (Host)
            </label>
            <select
              className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white vms-chamfer-sm focus:border-amber-400 focus:outline-none cursor-pointer"
              value={formData.headId}
              onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
            >
              <option value="" className="text-slate-900 bg-white">Select Designated Department Lead</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id} className="text-slate-900 bg-white">
                  {h.fullName} ({h.email})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Department
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default DepartmentsPage;
