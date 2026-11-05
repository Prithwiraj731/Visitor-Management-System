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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Dialog with Chamfered Architectural Corners */}
      <div
        className={`relative w-full ${maxWidth} bg-[#0C111B] text-white vms-chamfer-lg shadow-2xl border border-white/20 overflow-hidden transform transition-all z-10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#07090F]">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">{title}</h3>
            {subtitle && <p className="text-xs text-white/60 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-1.5 hover:bg-white/[.08] transition-colors vms-chamfer-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
