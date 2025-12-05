import { Role } from '../models/Role';
import { UserRole } from '../models/UserRole';
import { User } from '../models/User';
import { CreateRoleDTO, UpdateRoleDTO, AssignRoleDTO, UpdateUserRoleDTO } from '../types/RoleTypes';

export class RoleRepository {
  async findAll() {
    return Role.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findById(id: string) {
    return Role.findByPk(id);
  }

  async findByName(name: string) {
    return Role.findOne({ where: { name } });
  }

  async create(roleData: CreateRoleDTO) {
    return Role.create(roleData as any);
  }

  async update(id: string, updates: UpdateRoleDTO) {
    const [affectedCount] = await Role.update(
      { ...updates, updated_at: new Date() },
      { where: { id } }
    );
    return affectedCount;
  }

  async delete(id: string) {
    return Role.destroy({ where: { id } });
  }

  async getUsersByRoleId(roleId: string) {
    return UserRole.findAll({
      where: { role_id: roleId, is_active: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  async assignRoleToUser(assignmentData: AssignRoleDTO) {
    const existingAssignment = await UserRole.findOne({
      where: {
        user_id: assignmentData.user_id,
        role_id: assignmentData.role_id,
      },
    });

    if (existingAssignment) {
      await UserRole.update(
        { is_active: true },
        {
          where: {
            user_id: assignmentData.user_id,
            role_id: assignmentData.role_id,
          },
        }
      );
      return UserRole.findOne({
        where: {
          user_id: assignmentData.user_id,
          role_id: assignmentData.role_id,
        },
      });
    }

    return UserRole.create(assignmentData as any);
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    return UserRole.destroy({
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }

  async getUserRoles(userId: string) {
    return UserRole.findAll({
      where: { user_id: userId, is_active: true },
      include: [
        {
          model: Role,
          as: 'role',
        },
      ],
    });
  }

  async updateUserRole(userId: string, roleId: string, updates: UpdateUserRoleDTO) {
    return UserRole.update(updates, {
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }

  async findUserRoleMapping(userId: string, roleId: string) {
    return UserRole.findOne({
      where: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }

  async isSystemRole(roleId: string) {
    const role = await Role.findByPk(roleId);
    return role?.is_system_role || false;
  }

  async hasActiveAssignments(roleId: string) {
    const count = await UserRole.count({
      where: { role_id: roleId, is_active: true },
    });
    return count > 0;
  }
}

export const roleRepository = new RoleRepository();
