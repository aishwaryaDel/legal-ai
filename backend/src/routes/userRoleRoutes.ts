import { Router } from 'express';
import { userRoleController } from '../controllers/userRoleController';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateUserRoleDTO:
 *       type: object
 *       required:
 *         - user_id
 *         - role_id
 *       properties:
 *         user_id:
 *           type: string
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174000
 *         role_id:
 *           type: string
 *           format: uuid
 *           example: 123e4567-e89b-12d3-a456-426614174001
 *         assigned_by:
 *           type: string
 *           format: uuid
 *         expires_at:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 *           default: true
 *     UpdateUserRoleDTO:
 *       type: object
 *       properties:
 *         expires_at:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 *     UserRole:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         user_id:
 *           type: string
 *           format: uuid
 *         role_id:
 *           type: string
 *           format: uuid
 *         assigned_by:
 *           type: string
 *           format: uuid
 *         assigned_at:
 *           type: string
 *           format: date-time
 *         expires_at:
 *           type: string
 *           format: date-time
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * @openapi
 * /api/user-roles:
 *   get:
 *     summary: Get all user-role mappings
 *     description: Retrieve all user-role mappings
 *     tags:
 *       - User Roles
 *     responses:
 *       200:
 *         description: List of user-role mappings
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
 *                     $ref: '#/components/schemas/UserRole'
 *                 count:
 *                   type: integer
 *   post:
 *     summary: Assign a role to a user
 *     description: Create a new user-role mapping
 *     tags:
 *       - User Roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRoleDTO'
 *     responses:
 *       201:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserRole'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 * @openapi
 * /api/user-roles/{id}:
 *   get:
 *     summary: Get user-role mapping by ID
 *     description: Retrieve a specific user-role mapping by its ID
 *     tags:
 *       - User Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User-role mapping found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserRole'
 *       404:
 *         description: User-role mapping not found
 *   put:
 *     summary: Update user-role mapping by ID
 *     description: Update a specific user-role mapping
 *     tags:
 *       - User Roles
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
 *             $ref: '#/components/schemas/UpdateUserRoleDTO'
 *     responses:
 *       200:
 *         description: User-role mapping updated successfully
 *       404:
 *         description: User-role mapping not found
 *   delete:
 *     summary: Delete user-role mapping by ID
 *     description: Delete a specific user-role mapping (soft delete by default)
 *     tags:
 *       - User Roles
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Perform soft delete (deactivate) instead of hard delete
 *     responses:
 *       200:
 *         description: User-role mapping deleted successfully
 *       404:
 *         description: User-role mapping not found
 * @openapi
 * /api/user-roles/user/{userId}:
 *   get:
 *     summary: Get all roles for a user
 *     description: Retrieve all role mappings for a specific user
 *     tags:
 *       - User Roles
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Include inactive mappings
 *     responses:
 *       200:
 *         description: List of user's roles
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
 *                     $ref: '#/components/schemas/UserRole'
 *                 count:
 *                   type: integer
 * @openapi
 * /api/user-roles/role/{roleId}:
 *   get:
 *     summary: Get all users with a specific role
 *     description: Retrieve all user mappings for a specific role
 *     tags:
 *       - User Roles
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Include inactive mappings
 *     responses:
 *       200:
 *         description: List of users with the role
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
 *                     $ref: '#/components/schemas/UserRole'
 *                 count:
 *                   type: integer
 * @openapi
 * /api/user-roles/user/{userId}/role/{roleId}:
 *   delete:
 *     summary: Remove a role from a user
 *     description: Remove a specific role from a user
 *     tags:
 *       - User Roles
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
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Perform soft delete (deactivate) instead of hard delete
 *     responses:
 *       200:
 *         description: Role removed from user successfully
 *       404:
 *         description: User-role mapping not found
 */

router.get('/', (req, res) => userRoleController.getAllUserRoles(req, res));
router.get('/user/:userId', (req, res) => userRoleController.getRolesByUserId(req, res));
router.get('/role/:roleId', (req, res) => userRoleController.getUsersByRoleId(req, res));
router.get('/:id', (req, res) => userRoleController.getUserRoleById(req, res));
router.post('/', (req, res) => userRoleController.assignRoleToUser(req, res));
router.put('/:id', (req, res) => userRoleController.updateUserRole(req, res));
router.delete('/:id', (req, res) => userRoleController.deleteUserRole(req, res));
router.delete('/user/:userId/role/:roleId', (req, res) => userRoleController.removeRoleFromUser(req, res));

export default router;
