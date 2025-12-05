import { User } from '../models/User';
import { Role } from '../models/Role';
import { CreateUserDTO, UpdateUserDTO, UserCreationAttributes } from '../types/UserTypes';

export class UserRepository {
  async findById(id: string) {
    return User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: ['is_active', 'assigned_at'] },
        },
      ],
    });
  }
  async findByEmail(email: string) {
    return User.findOne({
      where: { email },
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: ['is_active', 'assigned_at'] },
        },
      ],
    });
  }
  async create(userData: CreateUserDTO) {
    return User.create(userData as UserCreationAttributes);
  }
  async update(id: string, updates: UpdateUserDTO) {
    return User.update(updates, { where: { id } });
  }
  async delete(id: string) {
    return User.destroy({ where: { id } });
  }
  async findAll() {
    return User.findAll({
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: ['is_active', 'assigned_at'] },
        },
      ],
    });
  }
}

export const userRepository = new UserRepository();
