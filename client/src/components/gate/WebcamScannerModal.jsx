import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Camera, ShieldCheck, AlertCircle, RefreshCw, Volume2, VolumeX, CheckCircle2, User, Building, LogIn, LogOut, X, FlipHorizontal } from 'lucide-react';
import { playAccessGranted, playAccessDenied, playScannerBeep } from '../../utils/soundEffects';
import { visitService } from '../../services/api';

export const WebcamScannerModal = ({ isOpen, onClose, onVisitorAdmitted }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'warning' | 'error', message, visit }
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize Camera
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      setScanResult(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    setScanResult(null);

    // Clean up any lingering stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam video capture is not supported in this browser environment.');
      }

      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        startScanningLoop();
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      // Fallback try without facingMode constraints in case mobile camera throws overconstrained error
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
          startScanningLoop();
          return;
        }
      } catch (fallbackErr) {
        setCameraError(err.message || 'Camera access was blocked. Check browser permissions or use manual badge entry.');
        setCameraActive(false);
      }
    }
  };

  const toggleCameraFacing = async () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (cameraActive) {
      stopCamera();
      await startCamera(nextMode);
    }
  };

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // High-performance Frame Analysis Loop with BarcodeDetector + jsQR downscaling
  const startScanningLoop = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }

    // Check if native BarcodeDetector is available in modern mobile browsers
    let nativeDetector = null;
    if ('BarcodeDetector' in window) {
      try {
        nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        nativeDetector = null;
      }
    }

    let lastScanTime = 0;
    let isDetecting = false;

    const scan = async (timestamp) => {
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !isDetecting) {
        // Run optical analysis every 75ms (~13-14 FPS) to prevent mobile thermal throttle while remaining instantaneous
        if (timestamp - lastScanTime > 75) {
          lastScanTime = timestamp;
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (vw > 0 && vh > 0) {
            // Option A: Hardware-accelerated BarcodeDetector (Android Chrome & iOS 17+)
            if (nativeDetector) {
              isDetecting = true;
              try {
                const barcodes = await nativeDetector.detect(video);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  handleDetectedQr(barcodes[0].rawValue);
                  isDetecting = false;
                  return; // Halt loop on match
                }
              } catch {
                // fall through to jsQR
              }
              isDetecting = false;
            }

            // Option B: Universal jsQR with adaptive downscaled canvas & attemptBoth inversion
            const canvas = canvasRef.current || document.createElement('canvas');
            canvasRef.current = canvas;

            // Target max dimension 640px for 5ms decode latency on mobile
            const maxDimension = 640;
            const scale = Math.min(1, maxDimension / Math.max(vw, vh));
            const targetW = Math.max(1, Math.floor(vw * scale));
            const targetH = Math.max(1, Math.floor(vh * scale));

            if (canvas.width !== targetW || canvas.height !== targetH) {
              canvas.width = targetW;
              canvas.height = targetH;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(video, 0, 0, targetW, targetH);

            const imageData = ctx.getImageData(0, 0, targetW, targetH);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'attemptBoth'
            });

            if (qrCode && qrCode.data) {
              handleDetectedQr(qrCode.data);
              return; // Halt loop on match
            }
          }
        }
      }

      scanLoopRef.current = requestAnimationFrame(scan);
    };

    scanLoopRef.current = requestAnimationFrame(scan);
  };

  const parseBadgePayload = (rawData) => {
    if (!rawData) return '';
    try {
      const parsed = JSON.parse(rawData);
      if (typeof parsed === 'object' && parsed !== null) {
        const extracted = parsed.vmsBadge || parsed.badgeNumber || parsed.badge || parsed.id;
        if (extracted) return String(extracted).trim();
      }
    } catch {
      // not JSON string
    }

    // Extract VMS badge format like VMS-20261108-1234 from text or URLs
    const vmsMatch = String(rawData).match(/VMS-\d{8}-\d+/i);
    if (vmsMatch) {
      return vmsMatch[0].toUpperCase();
    }

    return String(rawData).trim();
  };

  const handleDetectedQr = async (rawData) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (soundEnabled) playScannerBeep();

    const badgeSerial = parseBadgePayload(rawData);

    try {
      // Triple-fallback lookup:
      // 1. Direct pass endpoint by badgeNumber
      let visit = null;
      try {
        const passRes = await visitService.getPass(badgeSerial);
        if (passRes.data?.data) {
          visit = passRes.data.data;
        }
      } catch {
        // Fallback to query
      }

      // 2. Query visits by badgeNumber
      if (!visit) {
        try {
          const res = await visitService.getVisits({ badgeNumber: badgeSerial, limit: 1 });
          visit = res.data?.data?.[0];
        } catch {
          // Fallback to search
        }
      }

      // 3. Query visits by general search
      if (!visit) {
        const res = await visitService.getVisits({ search: badgeSerial, limit: 1 });
        visit = res.data?.data?.[0];
      }

      if (!visit) {
        if (soundEnabled) playAccessDenied();
        setScanResult({
          type: 'error',
          message: `UNAUTHORIZED TOKEN: No active credential matching "${badgeSerial}" found in perimeter records.`,
          visit: null
        });
        setTimeout(() => resumeScanning(), 3000);
        return;
      }

      if (visit.status === 'checked_in') {
        if (soundEnabled) playAccessGranted();
        setScanResult({
          type: 'warning',
          message: `ALREADY ON SITE: ${visit.visitor?.fullName} was checked in at ${new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          visit
        });
        return;
      }

      if (visit.status === 'checked_out') {
        if (soundEnabled) playAccessDenied();
        setScanResult({
          type: 'error',
          message: `EXPIRED CREDENTIAL: This badge was already checked out at ${new Date(visit.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          visit
        });
        setTimeout(() => resumeScanning(), 3500);
        return;
      }

      // If pending or approved -> Check in directly!
      await visitService.checkIn(visit.id);
      if (soundEnabled) playAccessGranted();

      const updatedRes = await visitService.getPass(visit.id);
      const updatedVisit = updatedRes.data?.data || { ...visit, status: 'checked_in', checkInTime: new Date() };

      setScanResult({
        type: 'success',
        message: `PERIMETER CLEARANCE VERIFIED: ${updatedVisit.visitor?.fullName} admitted to ${updatedVisit.department?.name || 'facility'}.`,
        visit: updatedVisit
      });

      if (onVisitorAdmitted) onVisitorAdmitted(updatedVisit);
    } catch (err) {
      if (soundEnabled) playAccessDenied();
      setScanResult({
        type: 'error',
        message: err.response?.data?.message || 'Verification failure at gate terminal.',
        visit: null
      });
      setTimeout(() => resumeScanning(), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedQr(manualCode.trim());
    setManualCode('');
  };

  const resumeScanning = () => {
    setScanResult(null);
    setIsProcessing(false);
    if (cameraActive) {
      startScanningLoop();
    }
  };

  const handleQuickCheckOut = async (visitId) => {
    setIsProcessing(true);
    try {
      await visitService.checkOut(visitId);
      if (soundEnabled) playAccessGranted();
      setScanResult({
        type: 'success',
        message: 'VISIT CONCLUDED: Visitor successfully checked out of premises.',
        visit: null
      });
      if (onVisitorAdmitted) onVisitorAdmitted();
      setTimeout(() => resumeScanning(), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perimeter Optical Badge Scanner"
      subtitle="Hardware-emulated camera optical decoder with automated gate clearance"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4">
        {/* Camera Viewport with Tactical HUD - Spacious mobile height & adaptive ratio */}
        <div className="relative w-full h-[380px] xs:h-[420px] sm:h-[460px] md:h-[420px] bg-[#07090F] border-2 border-white/20 vms-chamfer overflow-hidden flex items-center justify-center">
          {/* Real Video Stream */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Offscreen Canvas for jsQR Frame Sampling */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Tactical Target Overlay (when camera is streaming) */}
          {cameraActive && !scanResult && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
              {/* Targeting Reticle Frame (scaled to mobile) */}
              <div className="relative w-52 h-52 sm:w-64 sm:h-64 border border-cyan-400/40 rounded-xl overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                {/* 4 Corner Brackets */}
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                
                {/* Sweeping Laser Line strictly inside reticle */}
                <div className="absolute inset-x-2 h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-[bounce_2.5s_infinite]" />

                {/* Center crosshair */}
                <div className="w-4 h-4 border border-cyan-400/30 rounded-full animate-ping" />
              </div>

              {/* Status Header Overlay */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-cyan-500/30 px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-mono text-cyan-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>OPTICAL_DECODER: SCANNING</span>
              </div>

              {/* Camera Switch / Flip Button for Mobile */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="pointer-events-auto absolute top-3 right-3 bg-black/75 backdrop-blur-md hover:bg-black/95 border border-white/20 hover:border-cyan-400 px-2.5 py-1 rounded text-[11px] font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Switch Camera (Front / Rear)"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                <span>{facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}</span>
              </button>
            </div>
          )}

          {/* Camera Error / Standby State */}
          {(!cameraActive && !isProcessing && !scanResult) && (
            <div className="p-8 text-center flex flex-col items-center max-w-md">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <h4 className="font-display font-bold text-base text-white">Camera Standby / Authorization</h4>
              <p className="text-xs text-white/60 mt-1 leading-relaxed">
                {cameraError || 'Ensure camera permissions are allowed in your mobile browser, or verify passes manually below.'}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="vms-btn vms-btn-amber text-xs py-2 px-4 font-bold flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start Camera</span>
                </button>
                <button
                  onClick={toggleCameraFacing}
                  className="vms-btn vms-btn-line text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Lens</span>
                </button>
              </div>
            </div>
          )}

          {/* Holographic Verification Result Overlay */}
          {scanResult && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center animate-fadeIn z-20">
              {scanResult.type === 'success' && (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}

              {scanResult.type === 'warning' && (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 text-amber-400 flex items-center justify-center mb-3">
                  <AlertCircle className="w-8 h-8" />
                </div>
              )}

              {scanResult.type === 'error' && (
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-400 text-rose-400 flex items-center justify-center mb-3">
                  <X className="w-8 h-8" />
                </div>
              )}

              <h3 className={`font-display text-lg font-extrabold uppercase tracking-wide ${
                scanResult.type === 'success' ? 'text-emerald-400' : scanResult.type === 'warning' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {scanResult.type === 'success' ? 'Clearance Verified' : scanResult.type === 'warning' ? 'Visitor Inside' : 'Clearance Rejected'}
              </h3>

              <p className="text-xs text-white/80 max-w-sm mt-1.5 font-medium leading-relaxed">
                {scanResult.message}
              </p>

              {/* Dossier Card if Visit Found */}
              {scanResult.visit && (
                <div className="mt-4 p-4 bg-[#0C111B] border border-white/20 vms-chamfer-sm text-left w-full max-w-md text-xs space-y-1.5">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <span className="font-bold text-white text-sm">{scanResult.visit.visitor?.fullName}</span>
                    <span className="font-mono text-amber-400 font-bold">{scanResult.visit.badgeNumber}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Company:</span>
                    <span className="font-semibold text-white">{scanResult.visit.visitor?.company || 'Personal'}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Visiting Staff:</span>
                    <span className="font-semibold text-white">{scanResult.visit.host?.fullName || 'Desk'}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Destination Area:</span>
                    <span className="font-semibold text-white">{scanResult.visit.department?.name || 'Main Area'}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-5">
                {scanResult.type === 'warning' && scanResult.visit && (
                  <button
                    onClick={() => handleQuickCheckOut(scanResult.visit.id)}
                    className="vms-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-4 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Check Out Visitor</span>
                  </button>
                )}

                <button
                  onClick={resumeScanning}
                  className="vms-btn vms-btn-line text-xs py-2 px-4"
                >
                  Scan Next Badge
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Manual Barcode / Serial Terminal Input */}
        <div className="p-4 bg-[#0C111B] border border-white/10 vms-chamfer-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wide">
              Manual Serial / Pass Code Entry
            </span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 cursor-pointer"
              title="Toggle Audio Feedback"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
              <span>{soundEnabled ? 'Audio On' : 'Muted'}</span>
            </button>
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. VMS-20261103-1001"
              className="flex-1 px-3.5 py-2 text-xs bg-[#07090F] border border-white/15 text-white placeholder-white/30 vms-chamfer-sm focus:border-amber-400 focus:outline-none font-mono"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isProcessing || !manualCode.trim()}
              loading={isProcessing}
              className="text-xs py-2 px-4"
            >
              Verify Pass
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default WebcamScannerModal;
