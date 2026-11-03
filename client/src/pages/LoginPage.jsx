import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building, Shield, Lock, Mail, ArrowRight, ArrowLeft, Terminal, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill role if clicked from Landing Page gateway
  useEffect(() => {
    const roleHint = location.state?.roleHint;
    if (roleHint === 'guard') {
      setEmail('guard@vms.local');
      setPassword('Password123!');
    } else if (roleHint === 'host') {
      setEmail('host.eng@vms.local');
      setPassword('Password123!');
    } else if (roleHint === 'super_admin' || roleHint === 'admin') {
      setEmail('admin@vms.local');
      setPassword('Password123!');
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user?.role === 'guard') {
        navigate('/gate');
      } else {
        navigate('/dashboard');
      }
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
    <div className="min-h-screen bg-[#08090C] text-slate-100 flex flex-col items-center justify-center p-4 relative antialiased selection:bg-amber-500 selection:text-black">
      {/* Precision Blueprint Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />

      {/* Return to Landing Page */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors bg-[#0E121A] px-3.5 py-2 rounded-md border border-white/[0.08]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>BACK TO GATEWAY</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-amber-500 text-black flex items-center justify-center mx-auto mb-3 shadow-md font-black">
            <Building className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono font-black text-xl text-white tracking-tight">
              VMS<span className="text-amber-500">//</span>AUTHENTICATION
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
            Enterprise Perimeter Access Gateway
          </p>
        </div>

        {/* Tactical Login Card */}
        <div className="bg-[#0E121A] rounded-xl border border-white/[0.1] shadow-2xl p-7">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span>STAFF_VERIFICATION_DAEMON</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              PORT 5000 ONLINE
            </span>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono rounded-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                Corporate Staff Identifier (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@vms.local"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#08090C] border border-white/[0.1] rounded-md text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 mb-1.5 uppercase">
                Access Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#08090C] border border-white/[0.1] rounded-md text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-md text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 transition-all shadow active:scale-95 disabled:opacity-50"
            >
              <span>{loading ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* 1-Click Evaluation Credentials */}
          <div className="mt-6 pt-5 border-t border-white/[0.08]">
            <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              1-Click Evaluation Roles (Auto-Fill)
            </p>
            <div className="grid grid-cols-3 gap-2 font-mono">
              <button
                type="button"
                onClick={() => fillCredentials('admin@vms.local', 'Password123!')}
                className="p-2 text-left rounded-md bg-[#121722] border border-white/[0.08] hover:border-amber-500/80 transition-all text-xs"
              >
                <span className="block font-bold text-white text-[11px]">Admin</span>
                <span className="block text-[9px] text-amber-400">Executive</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('guard@vms.local', 'Password123!')}
                className="p-2 text-left rounded-md bg-[#121722] border border-white/[0.08] hover:border-emerald-500/80 transition-all text-xs"
              >
                <span className="block font-bold text-white text-[11px]">Guard</span>
                <span className="block text-[9px] text-emerald-400">Gate Desk</span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('host.eng@vms.local', 'Password123!')}
                className="p-2 text-left rounded-md bg-[#121722] border border-white/[0.08] hover:border-sky-500/80 transition-all text-xs"
              >
                <span className="block font-bold text-white text-[11px]">Host</span>
                <span className="block text-[9px] text-sky-400">Employee</span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-[10px] font-mono text-slate-400 uppercase">
          Certified ISO/IEC 27001 Access Architecture • 2026
        </div>
      </div>
    </div>
  );
};
