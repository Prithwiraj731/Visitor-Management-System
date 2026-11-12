import { SystemSetting } from '../models/index.js';
import { logAudit } from '../utils/auditLogger.js';

const LOCKDOWN_KEY = 'facility_lockdown';
const DEFAULT_LOCKDOWN = {
  isLockdown: false,
  reason: 'SECURITY BREACH / PERIMETER DIRECTIVE',
  updatedAt: null
};

export const readLockdownState = async () => {
  const setting = await SystemSetting.findByPk(LOCKDOWN_KEY);
  if (!setting || typeof setting.value !== 'object') {
    return { ...DEFAULT_LOCKDOWN };
  }
  return {
    isLockdown: Boolean(setting.value.isLockdown),
    reason: setting.value.reason || DEFAULT_LOCKDOWN.reason,
    updatedAt: setting.value.updatedAt || setting.updatedAt
  };
};

export const getLockdownStatus = async (req, res, next) => {
  try {
    const state = await readLockdownState();
    return res.status(200).json({
      success: true,
      data: state
    });
  } catch (error) {
    next(error);
  }
};

export const setLockdownStatus = async (req, res, next) => {
  try {
    const { isLockdown, reason } = req.body;
    const value = {
      isLockdown: Boolean(isLockdown),
      reason: isLockdown
        ? (reason || 'DEFCON 1: ACTIVE PHYSICAL PERIMETER LOCKDOWN')
        : 'All Clear - Normal Operations Restored',
      updatedBy: req.user.fullName,
      updatedById: req.user.id,
      updatedAt: new Date().toISOString()
    };

    await SystemSetting.upsert({
      key: LOCKDOWN_KEY,
      value
    });

    await logAudit({
      req,
      action: isLockdown ? 'LOCKDOWN_ENGAGED' : 'LOCKDOWN_DISENGAGED',
      entityType: 'SystemSetting',
      entityId: LOCKDOWN_KEY,
      details: { isLockdown: value.isLockdown, reason: value.reason }
    });

    return res.status(200).json({
      success: true,
      message: isLockdown ? 'DEFCON 1 Lockdown engaged' : 'Lockdown disengaged',
      data: {
        isLockdown: value.isLockdown,
        reason: value.reason,
        updatedAt: value.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
