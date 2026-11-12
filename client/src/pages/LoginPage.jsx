import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, Terminal, Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const executeLogin = async (targetEmail, targetPassword) => {
    setError('');
    setLoading(true);

    try {
      const user = await login(targetEmail, targetPassword);
      if (user?.role === 'guard') {
        navigate('/gate');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify email and access passcode.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  return (
    <div className="vms-page min-h-screen bg-[#07090F] text-white flex flex-col items-center justify-center p-4 relative antialiased selection:bg-amber-400 selection:text-[#07090F]">
      {/* Return to Landing Page */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors bg-[#0E1420] px-4 py-2 border border-white/10 vms-chamfer-sm"
      >
        <ArrowLeft className="w-4 h-4 text-amber-400" />
        <span>Return to Gateway</span>
      </Link>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <span className="vms-chamfer-sm grid h-12 w-12 place-items-center bg-amber-500 text-[#07090F] mx-auto mb-3 shadow-lg">
            <ShieldCheck size={26} strokeWidth={2.4} />
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            VMS Enterprise
          </h1>
          <p className="text-xs text-white/60 mt-1 uppercase tracking-wider font-semibold">
            Perimeter Authorization Terminal
          </p>
        </div>

        {/* Tactical Login Card with Chamfer */}
        <div className="bg-[#0C111B] border border-white/15 vms-chamfer-lg shadow-2xl p-7">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span className="font-mono">SECURE_CREDENTIAL_AUTHENTICATOR</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 vms-chamfer-sm">
              ONLINE
            </span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium rounded flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wide">
                Staff Corporate Identifier (Email)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="staff@company.com"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors vms-chamfer-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white/80 mb-2 uppercase tracking-wide">
                Access Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter passcode"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#07090F] border border-white/15 text-white placeholder-white/30 focus:border-amber-400 focus:outline-none transition-colors vms-chamfer-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-white/40 hover:text-white transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vms-btn vms-btn-amber w-full py-3 mt-3 text-sm justify-center font-bold"
            >
              <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Enter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-xs text-white/40 font-medium">
          Certified ISO/IEC 27001 Access Architecture · 2026
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
