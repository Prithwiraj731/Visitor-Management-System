import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building,
  Phone,
  Printer,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  QrCode
} from 'lucide-react';
import { visitService } from '../services/api';
import { playAccessGranted } from '../utils/soundEffects';

export const PassPage = () => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(routeId || '');
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousStatusRef = useRef(null);

  // Sync state if route param changes
  useEffect(() => {
    if (routeId) {
      setActiveId(routeId);
    } else {
      // Check if user has a previously stored pass in localStorage
      const cachedToken = localStorage.getItem('vms_last_pass_token');
      if (cachedToken) {
        setActiveId(cachedToken);
      } else {
        setLoading(false);
      }
    }
  }, [routeId]);

  // Fetch and poll pass data
  useEffect(() => {
    if (!activeId) return;

    let isMounted = true;
    const fetchPass = async (silent = false) => {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await visitService.getPass(activeId);
        if (!isMounted) return;

        if (res.data?.data) {
          const passData = res.data.data;
          
          // If status transitioned to checked_in during polling, trigger access chime!
          if (previousStatusRef.current === 'pending' && passData.status === 'checked_in') {
            try {
              playAccessGranted();
            } catch {}
          }
          previousStatusRef.current = passData.status;

          setVisit(passData);
          setError('');

          // Cache in localStorage for easy access
          try {
            localStorage.setItem('vms_last_pass_token', passData.badgeNumber || passData.id);
            localStorage.setItem('vms_last_pass_name', passData.visitor?.fullName || 'Visitor');
          } catch {}
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('Pass lookup error:', err);
        setError('Security pass not found. Please verify your badge number or mobile phone.');
        setVisit(null);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    fetchPass();

    // Auto-poll status every 4 seconds if pending so visitor sees real-time approval
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPass(true);
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeId]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const clean = searchQuery.trim();
    setActiveId(clean);
    navigate(`/pass/${encodeURIComponent(clean)}`);
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const title = `VMS Pass - ${visit?.visitor?.fullName || 'Guest'}`;
    const text = `Visitor Gate Pass for ${visit?.visitor?.fullName || 'Visitor'} (Badge ${visit?.badgeNumber || ''})`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch (err) {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isCheckedIn = visit?.status === 'checked_in';
  const isPending = visit?.status === 'pending';
  const isCheckedOut = visit?.status === 'checked_out';

  return (
    <div className="vms-page min-h-screen bg-[#07090F] text-white flex flex-col items-center justify-start p-3 sm:p-6 relative antialiased selection:bg-amber-400 selection:text-[#07090F]">
      {/* Top Header Navigation */}
      <header className="w-full max-w-lg flex items-center justify-between py-3 mb-3 border-b border-white/10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors bg-[#0E1420] px-3 py-1.5 border border-white/10 vms-chamfer-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
          <span>Gateway</span>
        </Link>

        <div className="flex items-center gap-2">
          {visit && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-white/60 bg-[#0E1420] px-2.5 py-1 border border-white/10 rounded">
              <span className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-spin' : isCheckedIn ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{isRefreshing ? 'SYNCING...' : isCheckedIn ? 'LIVE: ACTIVE' : 'LIVE: PENDING'}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg flex flex-col items-center">
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-white/80">Loading cryptographic security pass...</p>
            <p className="text-xs text-white/40 mt-1">Authenticating badge serial with perimeter database</p>
          </div>
        )}

        {/* Error / Not Found / Pass Recovery Search State */}
        {!loading && (error || !visit) && (
          <div className="w-full bg-[#0C111B] border border-white/15 vms-chamfer-lg p-6 sm:p-8 shadow-2xl text-center my-6">
            <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 rounded-full">
              <Search className="w-6 h-6" />
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">
              Digital Pass Recovery Terminal
            </h2>
            <p className="text-xs text-white/60 mb-6 max-w-sm mx-auto leading-relaxed">
              {error || 'Enter your registered phone number or Pass Serial (e.g. VMS-20261108-XXXX) to retrieve your digital entry pass.'}
            </p>

            <form onSubmit={handleManualSearch} className="space-y-3 max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456789 or VMS-20261108-1001"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 text-sm text-white placeholder-white/30 bg-[#07090F] border border-white/20 vms-chamfer-sm focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="vms-btn vms-btn-amber w-full py-3 text-sm font-bold justify-center"
              >
                <Search className="w-4 h-4" />
                <span>Retrieve Security Pass</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-white/50 mb-3">Need to register for a new pass?</p>
              <Link
                to="/"
                className="vms-btn vms-btn-line text-xs py-2 px-4"
              >
                Register at Guest Kiosk
              </Link>
            </div>
          </div>
        )}

        {/* Live Visitor Pass Card */}
        {!loading && visit && (
          <div className="w-full flex flex-col items-center">
            {/* Holographic Security Pass Card Container */}
            <div
              id="printable-badge"
              className="w-full bg-white text-slate-900 rounded-2xl shadow-2xl border-2 border-slate-900 overflow-hidden"
            >
              {/* Card Header (Corporate Dark Aesthetic) */}
              <div className="bg-[#0C111B] text-white p-4 sm:p-5 text-center border-b-4 border-amber-500 relative">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span className="font-display text-sm sm:text-base font-extrabold tracking-widest uppercase">
                    VMS Enterprise Access Pass
                  </span>
                </div>
                <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono">
                  Perimeter Clearance Credential
                </p>
              </div>

              {/* Dynamic Status Ribbon */}
              {isPending && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-center gap-2.5 text-amber-900 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm uppercase tracking-wider">
                    Awaiting Gate Clearance · Present to Guard
                  </span>
                </div>
              )}

              {isCheckedIn && (
                <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-3 flex items-center justify-center gap-2.5 text-emerald-900">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
                  <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-emerald-800">
                    Access Granted · Checked In On Premises
                  </span>
                </div>
              )}

              {isCheckedOut && (
                <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider">
                    Visit Concluded · Surrendered at Exit
                  </span>
                </div>
              )}

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex flex-col items-center text-center">
                {/* High Contrast Optical QR Token */}
                <div className="p-3 bg-white border-2 border-slate-300 rounded-2xl shadow-inner mb-3">
                  {visit.qrCode ? (
                    <img
                      src={visit.qrCode}
                      alt={`Pass QR Code for ${visit.visitor?.fullName || 'Visitor'}`}
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400 font-mono">
                      Generating QR...
                    </div>
                  )}
                </div>

                {/* Badge Serial Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-extrabold text-slate-900 tracking-wider mb-3">
                  <span className="text-slate-500 text-[11px]">SERIAL:</span>
                  <span className="text-amber-600">{visit.badgeNumber || 'PASS-PENDING'}</span>
                </div>

                {/* Visitor Name & Organization */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
                  {visit.visitor?.fullName || 'Authorized Guest'}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                  {visit.visitor?.company || 'Private Guest'}
                </p>

                {/* Status Guidance Card */}
                {isPending && (
                  <div className="w-full bg-amber-50 border border-amber-300/80 rounded-xl p-3.5 text-left my-4 shadow-sm">
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-amber-700" />
                      <span>Ready for Scanner Inspection</span>
                    </p>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed mt-1">
                      Hold this QR code up to the gate camera scanner or show it to security personnel. This pass will instantly glow green once scanned.
                    </p>
                  </div>
                )}

                {isCheckedIn && (
                  <div className="w-full bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-left my-4 shadow-sm">
                    <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Authorized Facility Visitor</span>
                    </p>
                    <p className="text-[11px] text-emerald-900/80 leading-relaxed mt-1">
                      Admitted at {visit.checkInTime ? new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}. Proceed to {visit.department?.name || 'Department Desk'} on {visit.department?.floor || 'Floor 1'}.
                    </p>
                  </div>
                )}

                {/* Details Table */}
                <div className="w-full border-t border-slate-200 mt-2 pt-3 text-left text-xs space-y-2.5">
                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Visiting Host:
                    </span>
                    <span className="font-bold text-slate-900">{visit.host?.fullName || 'Front Desk'}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" /> Department:
                    </span>
                    <span className="font-bold text-slate-900">{visit.department?.name || 'General Access'}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                    </span>
                    <span className="font-mono text-slate-800">{visit.visitor?.phone || '—'}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500">Purpose:</span>
                    <span className="font-medium text-slate-900 truncate max-w-[200px]">{visit.purpose || 'Business'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-400 text-center leading-relaxed">
                  Certified ISO/IEC 27001 Access Pass · Verified by Sentinel Security Core
                </div>
              </div>
            </div>

            {/* Mobile Action Controls Toolbar */}
            <div className="w-full mt-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="vms-btn vms-btn-amber text-xs py-3 font-bold justify-center cursor-pointer shadow-lg"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Pass Link Copied!' : 'Copy Pass URL'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="vms-btn vms-btn-line text-xs py-3 font-bold justify-center cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>Share Pass</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 px-4 bg-[#0E1420] hover:bg-[#151D2C] border border-white/15 vms-chamfer-sm text-xs font-semibold text-white/80 hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Save to Phone / Print PDF</span>
              </button>

              <div className="p-3 bg-[#0C111B] border border-white/10 vms-chamfer-sm text-center">
                <p className="text-[11px] text-white/50 leading-relaxed">
                  💡 <span className="text-white/80 font-medium">Never lose this pass:</span> This permanent page link is stored on this phone. You can bookmark this page or copy the link to WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 text-center text-xs text-white/30 font-medium">
        VMS Enterprise Access Terminal · Session Cryptographically Verified
      </footer>
    </div>
  );
};

export default PassPage;
