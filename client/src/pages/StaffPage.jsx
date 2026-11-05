import React, { useState, useEffect } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { userService, departmentService } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Plus } from 'lucide-react';

export const StaffPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'host',
    phone: '',
    departmentId: ''
  });

  const loadData = async () => {
    try {
      const [uRes, dRes] = await Promise.all([
        userService.getUsers(),
        departmentService.getDepartments()
      ]);
      setUsers(uRes.data?.data || []);
      setDepartments(dRes.data?.data || []);
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
    try {
      await userService.createUser(formData);
      setIsModalOpen(false);
      setFormData({ fullName: '', email: '', password: '', role: 'host', phone: '', departmentId: '' });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user');
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      await userService.updateUser(user.id, { isActive: !user.isActive });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  return (
    <PageWrapper
      title="Staff & Role Permissions"
      subtitle="Authorized security guards, hosts, and administrative accounts"
      action={
        <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Staff Member
        </Button>
      }
    >
      <div className="bg-[#0C111B] vms-chamfer border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#07090F] text-white/50 uppercase tracking-wider font-bold border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Staff Name</th>
                <th className="px-5 py-3.5">Email / Phone</th>
                <th className="px-5 py-3.5">Assigned Role</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[.06]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#121A29] transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-white text-sm">{u.fullName}</div>
                    <div className="text-[10px] text-white/40">Created {new Date(u.createdAt).toLocaleDateString()}</div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-white/80 font-medium">{u.email}</div>
                    <div className="text-[11px] text-white/40">{u.phone || 'No phone'}</div>
                  </td>

                  <td className="px-5 py-4">
                    <Badge status={u.role} />
                  </td>

                  <td className="px-5 py-4 text-white/70">
                    {u.department?.name || 'General Operations'}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold uppercase vms-chamfer-sm ${
                        u.isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleUserStatus(u)}
                      className={`text-xs font-bold px-3 py-1.5 vms-chamfer-sm transition-colors ${
                        u.isActive
                          ? 'bg-white/10 text-white/70 hover:bg-rose-500/20 hover:text-rose-400'
                          : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {u.isActive ? 'Deactivate' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Provision New Staff Member"
        subtitle="Create an internal authorized access identity"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Officer Nathan Drake"
              className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Corporate Email *
              </label>
              <input
                type="email"
                required
                placeholder="officer@vms.local"
                className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Temporary Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Assigned RBAC Role *
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white vms-chamfer-sm focus:border-amber-400 focus:outline-none cursor-pointer"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="guard" className="text-slate-900 bg-white">Security Guard (Gate View)</option>
                <option value="host" className="text-slate-900 bg-white">Host Employee (Approvals)</option>
                <option value="admin" className="text-slate-900 bg-white">Administrator</option>
                <option value="super_admin" className="text-slate-900 bg-white">Super Admin (All Privileges)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
                Department
              </label>
              <select
                className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white vms-chamfer-sm focus:border-amber-400 focus:outline-none cursor-pointer"
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="" className="text-slate-900 bg-white">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id} className="text-slate-900 bg-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-1.5">
              Contact Phone (Optional)
            </label>
            <input
              type="text"
              placeholder="+1-555-0199"
              className="w-full px-3.5 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Provision Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default StaffPage;
