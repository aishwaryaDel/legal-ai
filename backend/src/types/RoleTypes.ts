export interface RolePermissions {
  users?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  roles?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  documents?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  analytics?: {
    read?: boolean;
  };
  workflows?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
  system?: {
    configure?: boolean;
  };
  [key: string]: any;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions?: RolePermissions;
  is_active?: boolean;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
  is_active?: boolean;
}

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  permissions: RolePermissions;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

import { Optional } from 'sequelize';
export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'created_at' | 'updated_at' | 'description' | 'is_active'> {}
