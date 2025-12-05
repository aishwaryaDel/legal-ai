import { UserRole } from '../models/UserRole';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { CreateUserRoleDTO, UpdateUserRoleDTO } from '../types/UserRoleTypes';
import { Op } from 'sequelize';

export class UserRoleRepository {
  async findAll(): Promise<UserRole[]> {
    return await UserRole.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: Role, as: 'role', attributes: ['id', 'name', 'description', 'permissions'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string): Promise<UserRole | null> {
    return await UserRole.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
        { model: Role, as: 'role', attributes: ['id', 'name', 'description', 'permissions'] },
      ],
    });
  }

  async findByUserId(userId: string): Promise<UserRole[]> {
    return await UserRole.findAll({
      where: {
        user_id: userId,
        is_active: true,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } },
        ],
      },
      include: [
        { model: Role, as: 'role', attributes: ['id', 'name', 'description', 'permissions'] },
      ],
    });
  }

  async findByRoleId(roleId: string): Promise<UserRole[]> {
    return await UserRole.findAll({
      where: {
        role_id: roleId,
        is_active: true,
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email', 'name'] },
      ],
    });
  }

  async findByUserIdAndRoleId(userId: string, roleId: string): Promise<UserRole | null> {
    return await UserRole.findOne({
      where: {
        user_id: userId,
        role_id: roleId,
        is_active: true,
      },
    });
  }

  async create(userRoleData: CreateUserRoleDTO): Promise<UserRole> {
    return await UserRole.create(userRoleData);
  }

  async update(id: string, updates: UpdateUserRoleDTO): Promise<[number, UserRole[]]> {
    const result = await UserRole.update(
      { ...updates, updated_at: new Date() },
      {
        where: { id },
        returning: true,
      }
    );
    return result;
  }

  async delete(id: string): Promise<number> {
    return await UserRole.update(
      { is_active: false, updated_at: new Date() },
      { where: { id } }
    );
  }

  async hardDelete(id: string): Promise<number> {
    return await UserRole.destroy({ where: { id } });
  }

  async deleteByUserIdAndRoleId(userId: string, roleId: string): Promise<number> {
    return await UserRole.update(
      { is_active: false, updated_at: new Date() },
      {
        where: {
          user_id: userId,
          role_id: roleId,
        },
      }
    );
  }
}

export const userRoleRepository = new UserRoleRepository();
