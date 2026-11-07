import { Router } from 'express';
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
  deleteVisit
} from '../controllers/visitController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

// Public Kiosk Self-Registration & Pass Status Lookup
router.post('/kiosk', createVisit);
router.get('/pass/:id', getVisitPass);

router.use(authenticate);

router.post('/', createVisit);
router.get('/', getVisits);
router.get('/today', getTodayVisits);
router.get('/emergency', authorize('super_admin', 'admin', 'guard'), getEmergencyManifest);

router.patch('/:id/check-in', authorize('super_admin', 'admin', 'guard'), checkInVisit);
router.patch('/:id/check-out', authorize('super_admin', 'admin', 'guard'), checkOutVisit);
router.patch('/:id/approve', approveVisit);
router.patch('/:id/reject', rejectVisit);
router.delete('/:id', authorize('super_admin', 'admin'), deleteVisit);

export default router;

