import { UserRole } from '../models/UserRole';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { CreateUserRoleDTO, UpdateUserRoleDTO, UserRoleCreationAttributes } from '../types/UserRoleTypes';
import { Op } from 'sequelize';

export class UserRoleRepository {
  async findById(id: string) {
    return UserRole.findByPk(id, {
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'assigner', attributes: ['id', 'email', 'name'] }
      ]
    });
  }

  async findByUserId(userId: string, includeInactive: boolean = false) {
    const where: any = { user_id: userId };
    if (!includeInactive) {
      where.is_active = true;
      where[Op.or] = [
        { expires_at: null },
        { expires_at: { [Op.gt]: new Date() } }
      ];
    }

    return UserRole.findAll({
      where,
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'assigner', attributes: ['id', 'email', 'name'] }
      ]
    });
  }

  async findByRoleId(roleId: string, includeInactive: boolean = false) {
    const where: any = { role_id: roleId };
    if (!includeInactive) {
      where.is_active = true;
    }

    return UserRole.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'assigner', attributes: ['id', 'email', 'name'] }
      ]
    });
  }

  async findByUserAndRole(userId: string, roleId: string) {
    return UserRole.findOne({
      where: { user_id: userId, role_id: roleId },
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] }
      ]
    });
  }

  async findAll() {
    return UserRole.findAll({
      include: [
        { model: Role, as: 'role' },
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: User, as: 'assigner', attributes: ['id', 'email', 'name'] }
      ]
    });
  }

  async create(userRoleData: CreateUserRoleDTO) {
    return UserRole.create(userRoleData as UserRoleCreationAttributes);
  }

  async update(id: string, updates: UpdateUserRoleDTO) {
    const [affectedCount] = await UserRole.update(
      { ...updates, updated_at: new Date() },
      { where: { id } }
    );
    return affectedCount;
  }

  async delete(id: string) {
    return UserRole.destroy({ where: { id } });
  }

  async deleteByUserAndRole(userId: string, roleId: string) {
    return UserRole.destroy({
      where: { user_id: userId, role_id: roleId }
    });
  }

  async softDelete(id: string) {
    return UserRole.update(
      { is_active: false, updated_at: new Date() },
      { where: { id } }
    );
  }
}

export const userRoleRepository = new UserRoleRepository();
