import { Role } from '../models/Role';
import { CreateRoleDTO, UpdateRoleDTO, RoleCreationAttributes } from '../types/RoleTypes';

export class RoleRepository {
  async findById(id: string) {
    return Role.findByPk(id);
  }

  async findByName(name: string) {
    return Role.findOne({ where: { name } });
  }

  async findAll(includeInactive: boolean = false) {
    if (includeInactive) {
      return Role.findAll();
    }
    return Role.findAll({ where: { is_active: true } });
  }

  async create(roleData: CreateRoleDTO) {
    return Role.create(roleData as RoleCreationAttributes);
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

  async softDelete(id: string) {
    return Role.update(
      { is_active: false, updated_at: new Date() },
      { where: { id } }
    );
  }
}

export const roleRepository = new RoleRepository();
