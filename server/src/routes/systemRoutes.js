import { Router } from 'express';
import { getLockdownStatus, setLockdownStatus } from '../controllers/systemController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { lockdownSchema } from '../validators/schemas.js';

const router = Router();

router.get('/lockdown', getLockdownStatus);
router.post(
  '/lockdown',
  authenticate,
  authorize('super_admin', 'admin', 'guard'),
  validate(lockdownSchema),
  setLockdownStatus
);

export default router;
