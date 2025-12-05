import express from 'express';
import { roleController } from '../controllers/roleController';
import { checkRole, checkPermission } from '../middlewares/rbacMiddleware';
import { ROLE_NAMES } from '../constants/messages';

const router = express.Router();

router.get('/', roleController.getAllRoles.bind(roleController));

router.get('/:id', roleController.getRoleById.bind(roleController));

router.get('/name/:name', roleController.getRoleByName.bind(roleController));

router.post(
  '/',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN]),
  roleController.createRole.bind(roleController)
);

router.put(
  '/:id',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN]),
  roleController.updateRole.bind(roleController)
);

router.delete(
  '/:id',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN]),
  roleController.deleteRole.bind(roleController)
);

export default router;
