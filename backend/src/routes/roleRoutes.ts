import { Router } from 'express';
import { roleController } from '../controllers/roleController';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     RolePermissions:
 *       type: object
 *       properties:
 *         users:
 *           type: object
 *           properties:
 *             create:
 *               type: boolean
 *             read:
 *               type: boolean
 *             update:
 *               type: boolean
 *             delete:
 *               type: boolean
 *         roles:
 *           type: object
 *           properties:
 *             create:
 *               type: boolean
 *             read:
 *               type: boolean
 *             update:
 *               type: boolean
 *             delete:
 *               type: boolean
 *         documents:
 *           type: object
 *           properties:
 *             create:
 *               type: boolean
 *             read:
 *               type: boolean
 *             update:
 *               type: boolean
 *             delete:
 *               type: boolean
 *         analytics:
 *           type: object
 *           properties:
 *             read:
 *               type: boolean
 *         workflows:
 *           type: object
 *           properties:
 *             create:
 *               type: boolean
 *             read:
 *               type: boolean
 *             update:
 *               type: boolean
 *             delete:
 *               type: boolean
 *         system:
 *           type: object
 *           properties:
 *             configure:
 *               type: boolean
 *     CreateRoleDTO:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Legal Admin
 *         description:
 *           type: string
 *           example: Legal team administrator with access to all legal documents
 *         permissions:
 *           $ref: '#/components/schemas/RolePermissions'
 *         is_active:
 *           type: boolean
 *           default: true
 *     UpdateRoleDTO:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         permissions:
 *           $ref: '#/components/schemas/RolePermissions'
 *         is_active:
 *           type: boolean
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
 *           $ref: '#/components/schemas/RolePermissions'
 *         is_active:
 *           type: boolean
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * @openapi
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all roles. Optionally include inactive roles.
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: boolean
 *         description: Include inactive roles in the response
 *     responses:
 *       200:
 *         description: List of roles
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
 *                   type: integer
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with specified permissions
 *     tags:
 *       - Roles
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleDTO'
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 * @openapi
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a specific role by its ID
 *     tags:
 *       - Roles
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 *   put:
 *     summary: Update role by ID
 *     description: Update a specific role's details
 *     tags:
 *       - Roles
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
 *   delete:
 *     summary: Delete role by ID
 *     description: Delete a specific role (soft delete by default)
 *     tags:
 *       - Roles
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
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 * @openapi
 * /api/roles/name/{name}:
 *   get:
 *     summary: Get role by name
 *     description: Retrieve a specific role by its name
 *     tags:
 *       - Roles
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: Legal Admin
 *     responses:
 *       200:
 *         description: Role found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Role not found
 */

router.get('/', (req, res) => roleController.getAllRoles(req, res));
router.get('/name/:name', (req, res) => roleController.getRoleByName(req, res));
router.get('/:id', (req, res) => roleController.getRoleById(req, res));
router.post('/', (req, res) => roleController.createRole(req, res));
router.put('/:id', (req, res) => roleController.updateRole(req, res));
router.delete('/:id', (req, res) => roleController.deleteRole(req, res));

export default router;
