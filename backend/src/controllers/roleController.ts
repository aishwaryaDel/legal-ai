import { Request, Response } from 'express';
import { roleService } from '../services/roleService';
import { CreateRoleDTO, UpdateRoleDTO, AssignRoleDTO } from '../types/RoleTypes';
import { ROLE_MESSAGES } from '../constants/messages';
import { AuthRequest } from '../middlewares/rbacMiddleware';

export class RoleController {
  async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      res.status(200).json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.FETCH_ALL_ERROR,
      });
    }
  }

  async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      const role = await roleService.getRoleById(id);

      if (!role) {
        res.status(404).json({
          success: false,
          error: ROLE_MESSAGES.NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: role,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.FETCH_ERROR,
      });
    }
  }

  async createRole(req: Request, res: Response): Promise<void> {
    try {
      const roleData: CreateRoleDTO = req.body;

      if (!roleData.name || !roleData.permissions) {
        res.status(400).json({
          success: false,
          error: 'Role name and permissions are required',
        });
        return;
      }

      const newRole = await roleService.createRole(roleData);

      res.status(201).json({
        success: true,
        data: newRole,
        message: ROLE_MESSAGES.CREATED_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.CREATE_ERROR,
      });
    }
  }

  async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateRoleDTO = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: ROLE_MESSAGES.NO_UPDATE_DATA,
        });
        return;
      }

      const updatedRole = await roleService.updateRole(id, updates);

      if (!updatedRole) {
        res.status(404).json({
          success: false,
          error: ROLE_MESSAGES.NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedRole,
        message: ROLE_MESSAGES.UPDATED_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.UPDATE_ERROR,
      });
    }
  }

  async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      await roleService.deleteRole(id);

      res.status(200).json({
        success: true,
        message: ROLE_MESSAGES.DELETED_SUCCESS,
      });
    } catch (error) {
      const statusCode = error instanceof Error &&
        (error.message.includes('system role') || error.message.includes('active user assignments'))
        ? 400
        : 500;

      res.status(statusCode).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.DELETE_ERROR,
      });
    }
  }

  async assignRoleToUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { role_id } = req.body;

      if (!userId || !role_id) {
        res.status(400).json({
          success: false,
          error: 'User ID and Role ID are required',
        });
        return;
      }

      const assignmentData: AssignRoleDTO = {
        user_id: userId,
        role_id,
        assigned_by: req.user?.id,
      };

      const assignment = await roleService.assignRoleToUser(assignmentData);

      res.status(201).json({
        success: true,
        data: assignment,
        message: ROLE_MESSAGES.ASSIGNMENT_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.ASSIGNMENT_ERROR,
      });
    }
  }

  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.params;

      if (!userId || !roleId) {
        res.status(400).json({
          success: false,
          error: 'User ID and Role ID are required',
        });
        return;
      }

      await roleService.removeRoleFromUser(userId, roleId);

      res.status(200).json({
        success: true,
        message: ROLE_MESSAGES.UNASSIGNMENT_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.UNASSIGNMENT_ERROR,
      });
    }
  }

  async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      const userRoles = await roleService.getUserRoles(userId);

      res.status(200).json({
        success: true,
        data: userRoles,
        count: userRoles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.USER_ROLES_FETCH_ERROR,
      });
    }
  }

  async getUsersByRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      const userRoles = await roleService.getUsersByRole(roleId);

      res.status(200).json({
        success: true,
        data: userRoles,
        count: userRoles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : ROLE_MESSAGES.ROLE_USERS_FETCH_ERROR,
      });
    }
  }

  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      const permissions = await roleService.getUserPermissions(userId);

      res.status(200).json({
        success: true,
        data: permissions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user permissions',
      });
    }
  }
}

export const roleController = new RoleController();
