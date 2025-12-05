import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { mockAuthMiddleware, requireAuth, requireDepartmentAdmin } from '../middlewares/rbacMiddleware';

const router = Router();

router.get('/:userId/roles', mockAuthMiddleware, requireAuth, (req, res) =>
  roleController.getUserRoles(req, res)
);

router.post('/:userId/roles', mockAuthMiddleware, requireDepartmentAdmin, (req, res) =>
  roleController.assignRoleToUser(req, res)
);

router.delete('/:userId/roles/:roleId', mockAuthMiddleware, requireDepartmentAdmin, (req, res) =>
  roleController.removeRoleFromUser(req, res)
);

router.get('/:userId/permissions', mockAuthMiddleware, requireAuth, (req, res) =>
  roleController.getUserPermissions(req, res)
);

export default router;
