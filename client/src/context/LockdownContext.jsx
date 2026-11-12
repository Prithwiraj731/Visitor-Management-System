import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { startEmergencySiren, stopEmergencySiren, playAccessGranted } from '../utils/soundEffects';
import { systemService } from '../services/api';

const LockdownContext = createContext(null);

export const LockdownProvider = ({ children }) => {
  const [isLockdown, setIsLockdown] = useState(false);
  const [lockdownReason, setLockdownReason] = useState('SECURITY BREACH / PERIMETER DIRECTIVE');
  const [isMuted, setIsMuted] = useState(false);

  const syncLockdown = useCallback(async () => {
    try {
      const { data } = await systemService.getLockdown();
      if (data?.data) {
        setIsLockdown(Boolean(data.data.isLockdown));
        if (data.data.reason) {
          setLockdownReason(data.data.reason);
        }
      }
    } catch {
      // keep current state on transient network errors
    }
  }, []);

  useEffect(() => {
    syncLockdown();
    const timer = setInterval(syncLockdown, 15000);
    return () => clearInterval(timer);
  }, [syncLockdown]);

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

  const initiateLockdown = async (reason = 'DEFCON 1: ACTIVE PHYSICAL PERIMETER LOCKDOWN') => {
    try {
      const { data } = await systemService.setLockdown({ isLockdown: true, reason });
      if (data?.data) {
        setIsLockdown(Boolean(data.data.isLockdown));
        setLockdownReason(data.data.reason || reason);
      } else {
        setIsLockdown(true);
        setLockdownReason(reason);
      }
      if (!isMuted) {
        startEmergencySiren();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to engage server-wide lockdown. Ensure you are signed in with guard/admin permissions.');
    }
  };

  const disengageLockdown = async () => {
    try {
      const { data } = await systemService.setLockdown({ isLockdown: false });
      setIsLockdown(Boolean(data?.data?.isLockdown ?? false));
      stopEmergencySiren();
      playAccessGranted();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to disengage server-wide lockdown.');
    }
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
