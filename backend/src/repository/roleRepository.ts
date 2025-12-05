import { Role } from '../models/Role';
import { CreateRoleDTO, UpdateRoleDTO } from '../types/RoleTypes';

export class RoleRepository {
  async findAll(): Promise<Role[]> {
    return await Role.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']],
    });
  }

  async findById(id: string): Promise<Role | null> {
    return await Role.findByPk(id);
  }

  async findByName(name: string): Promise<Role | null> {
    return await Role.findOne({
      where: { name, is_active: true },
    });
  }

  async create(roleData: CreateRoleDTO): Promise<Role> {
    return await Role.create(roleData);
  }

  async update(id: string, updates: UpdateRoleDTO): Promise<[number, Role[]]> {
    const result = await Role.update(
      { ...updates, updated_at: new Date() },
      {
        where: { id },
        returning: true,
      }
    );
    return result;
  }

  async delete(id: string): Promise<number> {
    return await Role.update(
      { is_active: false, updated_at: new Date() },
      { where: { id } }
    );
  }

  async hardDelete(id: string): Promise<number> {
    return await Role.destroy({ where: { id } });
  }
}

export const roleRepository = new RoleRepository();
