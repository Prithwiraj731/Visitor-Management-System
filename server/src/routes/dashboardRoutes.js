import { Router } from 'express';
import { getDashboardStats, getTrends } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/trends', getTrends);

export default router;

