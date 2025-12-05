import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../repository/sequelize';
import { UserRoleAttributes, UserRoleCreationAttributes } from '../types/UserRoleTypes';
import { User } from './User';
import { Role } from './Role';

export class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public id!: string;
  public user_id!: string;
  public role_id!: string;
  public assigned_by!: string;
  public assigned_at!: Date;
  public expires_at!: Date;
  public is_active!: boolean;
  public created_at!: Date;
  public updated_at!: Date;
}

UserRole.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    assigned_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_roles',
    timestamps: false,
  }
);

UserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserRole.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
UserRole.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' });
