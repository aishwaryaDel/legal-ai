import { UserRole } from '../models/UserRole';
import { CreateUserRoleDTO, UpdateUserRoleDTO } from '../types/UserRoleTypes';
import { userRoleRepository } from '../repository/userRoleRepository';
import { roleRepository } from '../repository/roleRepository';
import { userRepository } from '../repository/userRepository';

export class UserRoleService {
  async getAllUserRoles(): Promise<UserRole[]> {
    try {
      const userRoles = await userRoleRepository.findAll();
      return userRoles as UserRole[];
    } catch (error) {
      throw error;
    }
  }

  async getUserRoleById(id: string): Promise<UserRole | null> {
    try {
      const userRole = await userRoleRepository.findById(id);
      if (!userRole) {
        return null;
      }
      return userRole as UserRole;
    } catch (error) {
      throw error;
    }
  }

  async getRolesByUserId(userId: string, includeInactive: boolean = false): Promise<UserRole[]> {
    try {
      const userRoles = await userRoleRepository.findByUserId(userId, includeInactive);
      return userRoles as UserRole[];
    } catch (error) {
      throw error;
    }
  }

  async getUsersByRoleId(roleId: string, includeInactive: boolean = false): Promise<UserRole[]> {
    try {
      const userRoles = await userRoleRepository.findByRoleId(roleId, includeInactive);
      return userRoles as UserRole[];
    } catch (error) {
      throw error;
    }
  }

  async assignRoleToUser(userRoleData: CreateUserRoleDTO): Promise<UserRole> {
    try {
      const user = await userRepository.findById(userRoleData.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      const role = await roleRepository.findById(userRoleData.role_id);
      if (!role) {
        throw new Error('Role not found');
      }

      const existingMapping = await userRoleRepository.findByUserAndRole(
        userRoleData.user_id,
        userRoleData.role_id
      );

      if (existingMapping) {
        if (existingMapping.is_active) {
          throw new Error('User already has this role assigned');
        } else {
          await userRoleRepository.update(existingMapping.id, {
            is_active: true,
            expires_at: userRoleData.expires_at
          });
          const updatedMapping = await userRoleRepository.findById(existingMapping.id);
          return updatedMapping as UserRole;
        }
      }

      const userRole = await userRoleRepository.create(userRoleData);
      return userRole as UserRole;
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(id: string, updates: UpdateUserRoleDTO): Promise<UserRole | null> {
    try {
      const affectedCount = await userRoleRepository.update(id, updates);
      if (affectedCount === 0) {
        return null;
      }

      const updatedUserRole = await userRoleRepository.findById(id);
      if (!updatedUserRole) {
        return null;
      }
      return updatedUserRole as UserRole;
    } catch (error) {
      throw error;
    }
  }

  async removeRoleFromUser(userId: string, roleId: string, soft: boolean = true): Promise<boolean> {
    try {
      const userRole = await userRoleRepository.findByUserAndRole(userId, roleId);
      if (!userRole) {
        return false;
      }

      let deleted: number | [number];
      if (soft) {
        deleted = await userRoleRepository.softDelete(userRole.id);
      } else {
        deleted = await userRoleRepository.deleteByUserAndRole(userId, roleId);
      }

      const affectedCount = Array.isArray(deleted) ? deleted[0] : deleted;
      return affectedCount > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteUserRole(id: string, soft: boolean = true): Promise<boolean> {
    try {
      let deleted: number | [number];
      if (soft) {
        deleted = await userRoleRepository.softDelete(id);
      } else {
        deleted = await userRoleRepository.delete(id);
      }

      const affectedCount = Array.isArray(deleted) ? deleted[0] : deleted;
      return affectedCount > 0;
    } catch (error) {
      throw error;
    }
  }
}

export const userRoleService = new UserRoleService();
