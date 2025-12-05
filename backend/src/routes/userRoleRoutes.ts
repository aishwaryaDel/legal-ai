import express from 'express';
import { userRoleController } from '../controllers/userRoleController';
import { checkRole, checkPermission } from '../middlewares/rbacMiddleware';
import { ROLE_NAMES } from '../constants/messages';

const router = express.Router();

router.get(
  '/',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.getAllUserRoles.bind(userRoleController)
);

router.get(
  '/:id',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.getUserRoleById.bind(userRoleController)
);

router.get(
  '/user/:userId',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.getRolesByUserId.bind(userRoleController)
);

router.get(
  '/user/:userId/with-roles',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.getUserWithRoles.bind(userRoleController)
);

router.get(
  '/role/:roleId',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.getUsersByRoleId.bind(userRoleController)
);

router.post(
  '/',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.assignRoleToUser.bind(userRoleController)
);

router.put(
  '/:id',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.updateUserRole.bind(userRoleController)
);

router.delete(
  '/:id',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.removeRoleFromUser.bind(userRoleController)
);

router.delete(
  '/user/:userId/role/:roleId',
  checkRole([ROLE_NAMES.PLATFORM_ADMIN, ROLE_NAMES.LEGAL_ADMIN, ROLE_NAMES.DEPARTMENT_ADMIN]),
  userRoleController.removeRoleFromUserByIds.bind(userRoleController)
);

export default router;
