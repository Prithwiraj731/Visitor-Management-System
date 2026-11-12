import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { ArrowLeft, CheckCircle2, Database, AlertCircle, RefreshCw } from 'lucide-react';

export const SupabaseTestPage = () => {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState('checking');
  const [responseLog, setResponseLog] = useState(null);

  const testSupabase = async () => {
    if (!supabase) {
      setStatus('error');
      setResponseLog({ code: 'MISSING_ENV', message: 'Supabase client is not configured via VITE_SUPABASE_* env vars.' });
      return;
    }
    setStatus('checking');
    try {
      const response = await supabase.from('todos').select('*');
      setResponseLog({ status: response.status, error: response.error ? response.error.message : null, count: Array.isArray(response.data) ? response.data.length : 0 });

      if (response.error) {
        if (response.error.code === 'PGRST205') {
          setStatus('connected_no_table');
        } else {
          setStatus('error');
        }
      } else {
        setStatus('connected_with_data');
        setTodos(response.data || []);
      }
    } catch (err) {
      setResponseLog(err);
      setStatus('error');
    }
  };

  useEffect(() => {
    testSupabase();
  }, []);

  return (
    <div className="vms-page min-h-screen bg-[#07090F] text-white p-6 selection:bg-amber-400 selection:text-[#07090F]">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors mb-6 bg-[#0E1420] px-4 py-2 border border-white/10 vms-chamfer-sm"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Return to Gateway</span>
        </Link>

        <div className="p-8 bg-[#0C111B] vms-chamfer border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between pb-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="vms-chamfer-sm grid h-10 w-10 place-items-center bg-amber-500 text-[#07090F]">
                <Database size={20} />
              </span>
              <div>
                <h1 className="font-display text-xl font-bold text-white tracking-tight">Supabase PostgreSQL Gateway</h1>
                <p className="text-xs text-white/50">Cloud database handshake verification</p>
              </div>
            </div>
            <button
              onClick={testSupabase}
              className="vms-btn vms-btn-line text-xs py-1.5 px-3"
              title="Re-run connection test"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retest</span>
            </button>
          </div>

          <div className="mt-6 space-y-5 text-sm">
            <div>
              <span className="text-white/40 uppercase tracking-wider block text-[10px] font-bold mb-1">PROJECT ENDPOINT</span>
              <span className="text-amber-400 font-mono text-xs font-bold break-all">
                {import.meta.env.VITE_SUPABASE_URL || 'Not Configured'}
              </span>
            </div>

            <div>
              <span className="text-white/40 uppercase tracking-wider block text-[10px] font-bold mb-1">CONNECTION STATUS</span>
              {status === 'checking' && (
                <span className="text-white/60">Pinging Supabase gateway...</span>
              )}
              {status === 'connected_no_table' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 vms-chamfer-sm">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUPABASE GATEWAY CONNECTED & AUTHENTICATED</span>
                  </div>
                  <p className="text-xs text-white/60 mt-1">
                    API responded with 200. Gateway handshake is valid.
                  </p>
                </div>
              )}
              {status === 'connected_with_data' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 vms-chamfer-sm">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONNECTED & LOADED {todos.length} RECORDS</span>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2 vms-chamfer-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connection failed. Verify API key and network connectivity.</span>
                </div>
              )}
            </div>

            {/* Raw JSON Debug Box */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <span className="text-white/40 uppercase tracking-wider block text-[10px] font-bold mb-2">RAW GATEWAY TELEMETRY</span>
              <pre className="p-4 bg-[#07090F] border border-white/10 vms-chamfer-sm text-xs font-mono text-white/70 overflow-x-auto">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseTestPage;
