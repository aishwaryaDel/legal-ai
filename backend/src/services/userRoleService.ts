import { UserRole } from '../models/UserRole';
import { CreateUserRoleDTO, UpdateUserRoleDTO, UserWithRoles } from '../types/UserRoleTypes';
import { userRoleRepository } from '../repository/userRoleRepository';
import { userRepository } from '../repository/userRepository';
import { roleRepository } from '../repository/roleRepository';

export class UserRoleService {
  async getAllUserRoles(): Promise<UserRole[]> {
    try {
      const userRoles = await userRoleRepository.findAll();
      return userRoles;
    } catch (error) {
      throw error;
    }
  }

  async getUserRoleById(id: string): Promise<UserRole | null> {
    try {
      const userRole = await userRoleRepository.findById(id);
      return userRole;
    } catch (error) {
      throw error;
    }
  }

  async getRolesByUserId(userId: string): Promise<UserRole[]> {
    try {
      const userRoles = await userRoleRepository.findByUserId(userId);
      return userRoles;
    } catch (error) {
      throw error;
    }
  }

  async getUsersByRoleId(roleId: string): Promise<UserRole[]> {
    try {
      const userRoles = await userRoleRepository.findByRoleId(roleId);
      return userRoles;
    } catch (error) {
      throw error;
    }
  }

  async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        return null;
      }

      const userRoles = await userRoleRepository.findByUserId(userId);

      const roles = userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.permissions,
        assigned_at: ur.assigned_at,
        expires_at: ur.expires_at,
        is_active: ur.is_active,
      }));

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        updated_at: user.updated_at,
        roles,
      };
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

      const existingUserRole = await userRoleRepository.findByUserIdAndRoleId(
        userRoleData.user_id,
        userRoleData.role_id
      );

      if (existingUserRole) {
        throw new Error('User already has this role assigned');
      }

      const userRole = await userRoleRepository.create(userRoleData);
      return userRole;
    } catch (error) {
      throw error;
    }
  }

  async updateUserRole(id: string, updates: UpdateUserRoleDTO): Promise<UserRole | null> {
    try {
      await userRoleRepository.update(id, updates);
      const updatedUserRole = await userRoleRepository.findById(id);
      return updatedUserRole;
    } catch (error) {
      throw error;
    }
  }

  async removeRoleFromUser(id: string): Promise<boolean> {
    try {
      const deleted = await userRoleRepository.delete(id);
      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }

  async removeRoleFromUserByIds(userId: string, roleId: string): Promise<boolean> {
    try {
      const deleted = await userRoleRepository.deleteByUserIdAndRoleId(userId, roleId);
      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }

  async hardDeleteUserRole(id: string): Promise<boolean> {
    try {
      const deleted = await userRoleRepository.hardDelete(id);
      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }
}

export const userRoleService = new UserRoleService();
