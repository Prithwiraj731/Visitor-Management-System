import { Router } from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post('/', authorize('super_admin', 'admin'), createDepartment);

export default router;

