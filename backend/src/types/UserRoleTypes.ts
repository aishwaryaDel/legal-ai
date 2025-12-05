export interface CreateUserRoleDTO {
  user_id: string;
  role_id: string;
  assigned_by?: string;
  expires_at?: Date;
  is_active?: boolean;
}

export interface UpdateUserRoleDTO {
  expires_at?: Date;
  is_active?: boolean;
}

export interface UserRoleAttributes {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at?: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

import { Optional } from 'sequelize';
export interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'created_at' | 'updated_at' | 'assigned_by' | 'assigned_at' | 'expires_at' | 'is_active'> {}

export interface UserWithRoles {
  user_id: string;
  role_id: string;
  role_name: string;
  role_description?: string;
  permissions: any;
  assigned_at?: Date;
  expires_at?: Date;
}
