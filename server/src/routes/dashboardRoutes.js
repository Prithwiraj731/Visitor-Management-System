import { Router } from 'express';
import { getDashboardStats, getTrends } from '../controllers/dashboardController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

// Publicly available live stats for landing page & headcount dashboard
router.get('/stats', optionalAuthenticate, getDashboardStats);

// Trends require authenticated staff access
router.get('/trends', authenticate, getTrends);

export default router;
