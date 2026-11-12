import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validateUuidParam } from '../middleware/validate.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', validateUuidParam('id'), markAsRead);

export default router;
