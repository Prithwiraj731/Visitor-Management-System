import { Router } from 'express';
import { getUsers, getHosts, createUser, updateUser } from '../controllers/userController.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate, validateUuidParam } from '../middleware/validate.js';
import { createUserSchema, updateUserSchema } from '../validators/schemas.js';

const router = Router();

// Public host directory for visitor self-registration kiosk (strictly scoped attributes)
router.get('/hosts', optionalAuthenticate, getHosts);

router.use(authenticate);

router.get('/', authorize('super_admin', 'admin'), getUsers);
router.post('/', authorize('super_admin', 'admin'), validate(createUserSchema), createUser);
router.patch('/:id', validateUuidParam('id'), authorize('super_admin', 'admin'), validate(updateUserSchema), updateUser);

export default router;
