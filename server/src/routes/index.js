import { Router } from 'express';
import authRoutes from './authRoutes.js';
import visitRoutes from './visitRoutes.js';
import userRoutes from './userRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import systemRoutes from './systemRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/visits', visitRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/system', systemRoutes);

export default router;

