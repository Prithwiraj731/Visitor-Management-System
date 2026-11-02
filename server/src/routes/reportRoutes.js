import { Router } from 'express';
import { getReportSummary, exportCsv } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);
router.use(authorize('super_admin', 'admin', 'guard'));

router.get('/summary', getReportSummary);
router.get('/export/csv', exportCsv);

export default router;

