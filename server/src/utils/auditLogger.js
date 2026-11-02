import { AuditLog } from '../models/index.js';
import { logger } from './logger.js';

export const logAudit = async ({ req, action, entityType, entityId, details }) => {
  try {
    await AuditLog.create({
      userId: req?.user?.id || null,
      action,
      entityType,
      entityId: entityId ? String(entityId) : null,
      details: details || {},
      ipAddress: req?.ip || req?.connection?.remoteAddress || '127.0.0.1'
    });
  } catch (err) {
    logger.error('Failed to write audit log entry:', err);
  }
};

