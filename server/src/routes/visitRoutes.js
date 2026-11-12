import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createVisit,
  getVisits,
  getTodayVisits,
  checkInVisit,
  checkOutVisit,
  approveVisit,
  rejectVisit,
  getEmergencyManifest,
  getVisitPass,
  verifyVisitQr,
  deleteVisit
} from '../controllers/visitController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate, validateUuidParam } from '../middleware/validate.js';
import {
  createVisitSchema,
  visitQuerySchema,
  rejectVisitSchema,
  verifyQrSchema
} from '../validators/schemas.js';

const router = Router();

const kioskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many kiosk registration requests from this IP. Please try again shortly.'
  }
});

const passLookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed pass lookup attempts. Please verify your serial number and try again later.'
  }
});

// Public Kiosk Self-Registration & Pass Status Lookup
router.post('/kiosk', kioskLimiter, validate(createVisitSchema), createVisit);
router.get('/pass/:id', passLookupLimiter, optionalAuthenticate, getVisitPass);

router.use(authenticate);

router.post(
  '/',
  authorize('super_admin', 'admin', 'guard', 'host'),
  validate(createVisitSchema),
  createVisit
);
router.post(
  '/verify-qr',
  authorize('super_admin', 'admin', 'guard'),
  validate(verifyQrSchema),
  verifyVisitQr
);
router.get('/', validate(visitQuerySchema, 'query'), getVisits);
router.get('/today', authorize('super_admin', 'admin', 'guard', 'host'), getTodayVisits);
router.get('/emergency', authorize('super_admin', 'admin', 'guard'), getEmergencyManifest);

router.patch(
  '/:id/check-in',
  validateUuidParam('id'),
  authorize('super_admin', 'admin', 'guard'),
  checkInVisit
);
router.patch(
  '/:id/check-out',
  validateUuidParam('id'),
  authorize('super_admin', 'admin', 'guard'),
  checkOutVisit
);
router.patch(
  '/:id/approve',
  validateUuidParam('id'),
  authorize('super_admin', 'admin', 'host'),
  approveVisit
);
router.patch(
  '/:id/reject',
  validateUuidParam('id'),
  authorize('super_admin', 'admin', 'host'),
  validate(rejectVisitSchema),
  rejectVisit
);
router.delete(
  '/:id',
  validateUuidParam('id'),
  authorize('super_admin', 'admin'),
  deleteVisit
);

export default router;
