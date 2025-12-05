import { Role } from '../models/Role';
import { UserRole } from '../models/UserRole';
import { roleRepository } from '../repository/roleRepository';
import { userRepository } from '../repository/userRepository';
import { CreateRoleDTO, UpdateRoleDTO, AssignRoleDTO, PermissionsStructure, Resources, Permissions } from '../types/RoleTypes';

export class RoleService {
  async getAllRoles(): Promise<Role[]> {
    try {
      const roles = await roleRepository.findAll();
      return roles as Role[];
    } catch (error) {
      throw error;
    }
  }

  async getRoleById(id: string): Promise<Role | null> {
    try {
      const role = await roleRepository.findById(id);
      if (!role) {
        return null;
      }
      return role as Role;
    } catch (error) {
      throw error;
    }
  }

  async getRoleByName(name: string): Promise<Role | null> {
    try {
      const role = await roleRepository.findByName(name);
      if (!role) {
        return null;
      }
      return role as Role;
    } catch (error) {
      throw error;
    }
  }

  async createRole(roleData: CreateRoleDTO): Promise<Role> {
    try {
      const existingRole = await roleRepository.findByName(roleData.name);
      if (existingRole) {
        throw new Error(`Role with name "${roleData.name}" already exists`);
      }

      this.validatePermissions(roleData.permissions);

      const role = await roleRepository.create(roleData);
      return role as Role;
    } catch (error) {
      throw error;
    }
  }

  async updateRole(id: string, updates: UpdateRoleDTO): Promise<Role | null> {
    try {
      const role = await roleRepository.findById(id);
      if (!role) {
        return null;
      }

      if (role.is_system_role && updates.name) {
        throw new Error('Cannot modify the name of a system role');
      }

      if (updates.name && updates.name !== role.name) {
        const existingRole = await roleRepository.findByName(updates.name);
        if (existingRole) {
          throw new Error(`Role with name "${updates.name}" already exists`);
        }
      }

      if (updates.permissions) {
        this.validatePermissions(updates.permissions);
      }

      const affectedCount = await roleRepository.update(id, updates);
      if (affectedCount === 0) {
        return null;
      }

      const updatedRole = await roleRepository.findById(id);
      return updatedRole as Role;
    } catch (error) {
      throw error;
    }
  }

  async deleteRole(id: string): Promise<boolean> {
    try {
      const role = await roleRepository.findById(id);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.is_system_role) {
        throw new Error('Cannot delete a system role');
      }

      const hasAssignments = await roleRepository.hasActiveAssignments(id);
      if (hasAssignments) {
        throw new Error('Cannot delete role with active user assignments. Please remove all user assignments first.');
      }

      const deleted = await roleRepository.delete(id);
      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }

  async assignRoleToUser(assignmentData: AssignRoleDTO): Promise<UserRole> {
    try {
      const user = await userRepository.findById(assignmentData.user_id);
      if (!user) {
        throw new Error('User not found');
      }

      const role = await roleRepository.findById(assignmentData.role_id);
      if (!role) {
        throw new Error('Role not found');
      }

      if (assignmentData.assigned_by) {
        const assigner = await userRepository.findById(assignmentData.assigned_by);
        if (!assigner) {
          throw new Error('Assigner user not found');
        }
      }

      const userRole = await roleRepository.assignRoleToUser(assignmentData);
      return userRole as UserRole;
    } catch (error) {
      throw error;
    }
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    try {
      const userRole = await roleRepository.findUserRoleMapping(userId, roleId);
      if (!userRole) {
        throw new Error('User role assignment not found');
      }

      const deleted = await roleRepository.removeRoleFromUser(userId, roleId);
      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const userRoles = await roleRepository.getUserRoles(userId);
      return userRoles as UserRole[];
    } catch (error) {
      throw error;
    }
  }

  async getUsersByRole(roleId: string): Promise<UserRole[]> {
    try {
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      const userRoles = await roleRepository.getUsersByRoleId(roleId);
      return userRoles as UserRole[];
    } catch (error) {
      throw error;
    }
  }

  async checkUserPermission(
    userId: string,
    resource: string,
    permission: string
  ): Promise<boolean> {
    try {
      const userRoles = await roleRepository.getUserRoles(userId);

      for (const userRole of userRoles) {
        const role = userRole.role as any;
        if (role && role.permissions && role.permissions[resource]) {
          if (role.permissions[resource].includes(permission)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      throw error;
    }
  }

  async getUserPermissions(userId: string): Promise<PermissionsStructure> {
    try {
      const userRoles = await roleRepository.getUserRoles(userId);
      const permissions: PermissionsStructure = {};

      for (const userRole of userRoles) {
        const role = userRole.role as any;
        if (role && role.permissions) {
          for (const [resource, perms] of Object.entries(role.permissions)) {
            if (!permissions[resource as keyof PermissionsStructure]) {
              permissions[resource as keyof PermissionsStructure] = [];
            }
            const existingPerms = permissions[resource as keyof PermissionsStructure] || [];
            permissions[resource as keyof PermissionsStructure] = [
              ...new Set([...existingPerms, ...(perms as string[])])
            ];
          }
        }
      }

      return permissions;
    } catch (error) {
      throw error;
    }
  }

  private validatePermissions(permissions: PermissionsStructure): void {
    const validResources = Object.values(Resources);
    const validPermissions = Object.values(Permissions);

    for (const [resource, perms] of Object.entries(permissions)) {
      if (!validResources.includes(resource as Resources)) {
        throw new Error(`Invalid resource: ${resource}`);
      }

      if (!Array.isArray(perms)) {
        throw new Error(`Permissions for ${resource} must be an array`);
      }

      for (const perm of perms) {
        if (!validPermissions.includes(perm as Permissions)) {
          throw new Error(`Invalid permission: ${perm} for resource ${resource}`);
        }
      }
    }
  }
}

export const roleService = new RoleService();
