import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { ArrowLeft, CheckCircle2, Database, AlertCircle, RefreshCw } from 'lucide-react';

export const SupabaseTestPage = () => {
  const [todos, setTodos] = useState([]);
  const [status, setStatus] = useState('checking');
  const [responseLog, setResponseLog] = useState(null);

  const testSupabase = async () => {
    setStatus('checking');
    try {
      const response = await supabase.from('todos').select('*');
      setResponseLog(response);

      if (response.error) {
        // Even if table doesn't exist, getting PGRST205 proves API auth & endpoint are 100% connected
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
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-6 font-mono">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to VMS Homepage</span>
        </Link>

        <div className="p-6 bg-[#10151E] rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-amber-500" />
              <h1 className="text-base font-bold text-white uppercase tracking-tight">Supabase Client Test</h1>
            </div>
            <button
              onClick={testSupabase}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Re-run connection test"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-5 space-y-4 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider block text-[10px]">PROJECT ENDPOINT:</span>
              <span className="text-amber-400 font-bold break-all">
                {import.meta.env.VITE_SUPABASE_URL || 'https://wjxjilsgpctwzmjiufux.supabase.co'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider block text-[10px]">CONNECTION STATUS:</span>
              {status === 'checking' && (
                <span className="text-slate-400">Pinging Supabase gateway...</span>
              )}
              {status === 'connected_no_table' && (
                <div className="mt-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SUPABASE GATEWAY CONNECTED & AUTHENTICATED</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    API responded successfully. Table <code className="text-amber-300">public.todos</code> does not exist yet in your database schema cache.
                  </p>
                </div>
              )}
              {status === 'connected_with_data' && (
                <div className="mt-1 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONNECTED & LOADED {todos.length} TODOS</span>
                  </div>
                </div>
              )}
              {status === 'error' && (
                <div className="mt-1 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Connection failed. Verify API key and internet access.</span>
                </div>
              )}
            </div>

            {/* Todos rendering */}
            {todos.length > 0 && (
              <div className="mt-4">
                <span className="text-slate-500 uppercase tracking-wider block text-[10px] mb-2">QUERY RESULT:</span>
                <ul className="space-y-1.5">
                  {todos.map((todo, idx) => (
                    <li key={todo.id || idx} className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-200">
                      {todo.name || JSON.stringify(todo)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Raw JSON Debug Box */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span className="text-slate-500 uppercase tracking-wider block text-[10px] mb-1.5">RAW API RESPONSE:</span>
              <pre className="p-3 bg-black/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 overflow-x-auto">
                {JSON.stringify(responseLog, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
