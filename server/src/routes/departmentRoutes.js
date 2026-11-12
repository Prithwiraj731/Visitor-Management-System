import { Router } from 'express';
import { getDepartments, createDepartment } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createDepartmentSchema } from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);
router.post('/', authorize('super_admin', 'admin'), validate(createDepartmentSchema), createDepartment);

export default router;
