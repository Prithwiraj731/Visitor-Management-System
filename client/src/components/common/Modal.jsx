import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Dialog with Chamfered Architectural Corners */}
      <div
        className={`relative w-full ${maxWidth} bg-[#0C111B] text-white vms-chamfer-lg shadow-2xl border border-white/20 overflow-hidden transform transition-all z-10 max-h-[92vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10 bg-[#07090F] shrink-0">
          <div className="pr-2 min-w-0">
            <h3 className="font-display text-base sm:text-xl font-bold text-white tracking-tight truncate">{title}</h3>
            {subtitle && <p className="text-[11px] sm:text-xs text-white/60 mt-0.5 line-clamp-1 sm:line-clamp-none">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 hover:bg-white/[.08] transition-colors vms-chamfer-sm shrink-0 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto overscroll-contain flex-1">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
