import { Request, Response } from 'express';
import { userRoleService } from '../services/userRoleService';
import { CreateUserRoleDTO, UpdateUserRoleDTO } from '../types/UserRoleTypes';
import { USER_ROLE_MESSAGES } from '../constants/messages';

export class UserRoleController {
  async getAllUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const userRoles = await userRoleService.getAllUserRoles();
      res.status(200).json({
        success: true,
        data: userRoles,
        count: userRoles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.FETCH_ALL_ERROR,
      });
    }
  }

  async getUserRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      const userRole = await userRoleService.getUserRoleById(id);

      if (!userRole) {
        res.status(404).json({
          success: false,
          error: USER_ROLE_MESSAGES.NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: userRole,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.FETCH_ERROR,
      });
    }
  }

  async getRolesByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.USER_ID_REQUIRED,
        });
        return;
      }

      const userRoles = await userRoleService.getRolesByUserId(userId);

      res.status(200).json({
        success: true,
        data: userRoles,
        count: userRoles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.FETCH_ERROR,
      });
    }
  }

  async getUsersByRoleId(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.ROLE_ID_REQUIRED,
        });
        return;
      }

      const userRoles = await userRoleService.getUsersByRoleId(roleId);

      res.status(200).json({
        success: true,
        data: userRoles,
        count: userRoles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.FETCH_ERROR,
      });
    }
  }

  async getUserWithRoles(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.USER_ID_REQUIRED,
        });
        return;
      }

      const userWithRoles = await userRoleService.getUserWithRoles(userId);

      if (!userWithRoles) {
        res.status(404).json({
          success: false,
          error: USER_ROLE_MESSAGES.USER_NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: userWithRoles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.FETCH_ERROR,
      });
    }
  }

  async assignRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const userRoleData: CreateUserRoleDTO = req.body;

      if (!userRoleData.user_id || !userRoleData.role_id) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.INVALID_DATA,
        });
        return;
      }

      const newUserRole = await userRoleService.assignRoleToUser(userRoleData);

      res.status(201).json({
        success: true,
        data: newUserRole,
        message: USER_ROLE_MESSAGES.ASSIGNED_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.ASSIGN_ERROR,
      });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: UpdateUserRoleDTO = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      if (Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.NO_UPDATE_DATA,
        });
        return;
      }

      const updatedUserRole = await userRoleService.updateUserRole(id, updates);

      if (!updatedUserRole) {
        res.status(404).json({
          success: false,
          error: USER_ROLE_MESSAGES.NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: updatedUserRole,
        message: USER_ROLE_MESSAGES.UPDATED_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.UPDATE_ERROR,
      });
    }
  }

  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.ID_REQUIRED,
        });
        return;
      }

      const userRole = await userRoleService.getUserRoleById(id);
      if (!userRole) {
        res.status(404).json({
          success: false,
          error: USER_ROLE_MESSAGES.NOT_FOUND,
        });
        return;
      }

      await userRoleService.removeRoleFromUser(id);

      res.status(200).json({
        success: true,
        message: USER_ROLE_MESSAGES.REMOVED_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.REMOVE_ERROR,
      });
    }
  }

  async removeRoleFromUserByIds(req: Request, res: Response): Promise<void> {
    try {
      const { userId, roleId } = req.params;

      if (!userId || !roleId) {
        res.status(400).json({
          success: false,
          error: USER_ROLE_MESSAGES.INVALID_DATA,
        });
        return;
      }

      const deleted = await userRoleService.removeRoleFromUserByIds(userId, roleId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: USER_ROLE_MESSAGES.NOT_FOUND,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: USER_ROLE_MESSAGES.REMOVED_SUCCESS,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : USER_ROLE_MESSAGES.REMOVE_ERROR,
      });
    }
  }
}

export const userRoleController = new UserRoleController();
