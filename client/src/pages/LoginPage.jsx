import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 mx-auto mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Visitor Management System</h1>
          <p className="text-sm text-slate-400 mt-1">Enterprise Facility Access & Security Intelligence</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-1">Sign In to Portal</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your credentials to access security gates and logs</p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@vms.local"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full py-2.5 mt-2" icon={ArrowRight}>
              Authenticate & Enter
            </Button>
          </form>

          {/* Quick Demo Credential Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Quick Role Test Credentials
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@vms.local', 'Password123!')}
                className="px-2 py-2 text-center rounded-xl border border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-slate-800">Super Admin</span>
                <span className="block text-[10px] text-slate-400">Director</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('guard@vms.local', 'Password123!')}
                className="px-2 py-2 text-center rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-slate-800">Security</span>
                <span className="block text-[10px] text-slate-400">Chief Guard</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('host.eng@vms.local', 'Password123!')}
                className="px-2 py-2 text-center rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-slate-800">Host</span>
                <span className="block text-[10px] text-slate-400">Architect</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          Visitor Management System © 2026. Certified Software Engineering Project.
        </div>
      </div>
    </div>
  );
};

