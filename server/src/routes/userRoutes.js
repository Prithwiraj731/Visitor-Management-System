import { Router } from 'express';
import { getUsers, getHosts, createUser, updateUser } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate);

router.get('/hosts', getHosts);
router.get('/', authorize('super_admin', 'admin'), getUsers);
router.post('/', authorize('super_admin', 'admin'), createUser);
router.patch('/:id', authorize('super_admin', 'admin'), updateUser);

export default router;

