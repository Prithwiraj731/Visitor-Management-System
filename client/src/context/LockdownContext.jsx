import React, { createContext, useContext, useState, useEffect } from 'react';
import { startEmergencySiren, stopEmergencySiren, playAccessGranted } from '../utils/soundEffects';

const LockdownContext = createContext(null);

export const LockdownProvider = ({ children }) => {
  const [isLockdown, setIsLockdown] = useState(() => {
    return localStorage.getItem('vms_lockdown') === 'true';
  });
  const [lockdownReason, setLockdownReason] = useState(() => {
    return localStorage.getItem('vms_lockdown_reason') || 'SECURITY BREACH / PERIMETER DIRECTIVE';
  });
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (isLockdown && !isMuted) {
      startEmergencySiren();
    } else {
      stopEmergencySiren();
    }
    return () => {
      stopEmergencySiren();
    };
  }, [isLockdown, isMuted]);

  const initiateLockdown = (reason = 'DEFCON 1: ACTIVE PHYSICAL PERIMETER LOCKDOWN') => {
    setIsLockdown(true);
    setLockdownReason(reason);
    localStorage.setItem('vms_lockdown', 'true');
    localStorage.setItem('vms_lockdown_reason', reason);
    if (!isMuted) {
      startEmergencySiren();
    }
  };

  const disengageLockdown = () => {
    setIsLockdown(false);
    localStorage.removeItem('vms_lockdown');
    localStorage.removeItem('vms_lockdown_reason');
    stopEmergencySiren();
    playAccessGranted();
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  return (
    <LockdownContext.Provider
      value={{
        isLockdown,
        lockdownReason,
        isMuted,
        initiateLockdown,
        disengageLockdown,
        toggleMute
      }}
    >
      {children}
    </LockdownContext.Provider>
  );
};

export const useLockdown = () => {
  const context = useContext(LockdownContext);
  if (!context) {
    throw new Error('useLockdown must be used within a LockdownProvider');
  }
  return context;
};

export default LockdownContext;

