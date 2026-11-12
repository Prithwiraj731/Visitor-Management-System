import { logAudit } from '../utils/auditLogger.js';

export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      await logAudit({
        req,
        action: 'ACCESS_DENIED',
        entityType: 'Route',
        entityId: req.originalUrl,
        details: { method: req.method, path: req.originalUrl }
      });
      return res.status(403).json({
        success: false,
        message: 'Forbidden: insufficient permissions for this action.'
      });
    }

    next();
  };
};
