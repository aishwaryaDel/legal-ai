import { Router } from 'express';
import { roleController } from '../controllers/roleController';
import { mockAuthMiddleware, requirePlatformAdmin, requireAuth } from '../middlewares/rbacMiddleware';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         permissions:
 *           type: object
 *         is_system_role:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *     CreateRoleDTO:
 *       type: object
 *       required:
 *         - name
 *         - permissions
 *       properties:
 *         name:
 *           type: string
 *           example: Custom Role
 *         description:
 *           type: string
 *           example: A custom role with specific permissions
 *         permissions:
 *           type: object
 *           example:
 *             documents: ["read", "create"]
 *             users: ["read"]
 *         is_system_role:
 *           type: boolean
 *           example: false
 *     UpdateRoleDTO:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         permissions:
 *           type: object
 *     AssignRoleDTO:
 *       type: object
 *       required:
 *         - role_id
 *       properties:
 *         role_id:
 *           type: string
 *           format: uuid
 *
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *                 count:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleDTO'
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *
 * @openapi
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role found
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleDTO'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     summary: Delete role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       400:
 *         description: Cannot delete system role or role with active assignments
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *
 * @openapi
 * /api/users/{userId}/roles:
 *   get:
 *     summary: Get all roles assigned to a user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of user roles
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Assign a role to a user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignRoleDTO'
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *
 * @openapi
 * /api/users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Remove a role from a user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       404:
 *         description: Role assignment not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *
 * @openapi
 * /api/roles/{roleId}/users:
 *   get:
 *     summary: Get all users with a specific role
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of users with the role
 *       401:
 *         description: Unauthorized
 *
 * @openapi
 * /api/users/{userId}/permissions:
 *   get:
 *     summary: Get all permissions for a user
 *     tags: [User Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User permissions
 *       401:
 *         description: Unauthorized
 */

router.get('/', mockAuthMiddleware, requireAuth, (req, res) => roleController.getAllRoles(req, res));

router.get('/:id', mockAuthMiddleware, requireAuth, (req, res) => roleController.getRoleById(req, res));

router.post('/', mockAuthMiddleware, requirePlatformAdmin, (req, res) => roleController.createRole(req, res));

router.put('/:id', mockAuthMiddleware, requirePlatformAdmin, (req, res) => roleController.updateRole(req, res));

router.delete('/:id', mockAuthMiddleware, requirePlatformAdmin, (req, res) => roleController.deleteRole(req, res));

router.get('/:roleId/users', mockAuthMiddleware, requireAuth, (req, res) => roleController.getUsersByRole(req, res));

export default router;
