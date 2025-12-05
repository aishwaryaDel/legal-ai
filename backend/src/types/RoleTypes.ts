import { Optional } from 'sequelize';

export interface PermissionsStructure {
  users?: string[];
  roles?: string[];
  documents?: string[];
  templates?: string[];
  clauses?: string[];
  workflows?: string[];
  analytics?: string[];
  system?: string[];
  audit?: string[];
}

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionsStructure;
  is_system_role: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions: PermissionsStructure;
  is_system_role?: boolean;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: PermissionsStructure;
}

export interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'created_at' | 'updated_at' | 'is_system_role'> {}

export interface UserRoleAttributes {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at?: Date;
  is_active: boolean;
  role?: RoleAttributes;
  user?: any;
  assigner?: any;
}

export interface AssignRoleDTO {
  user_id: string;
  role_id: string;
  assigned_by?: string;
}

export interface UpdateUserRoleDTO {
  is_active?: boolean;
}

export interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'id' | 'assigned_at' | 'is_active'> {}

export enum SystemRoles {
  PLATFORM_ADMIN = 'Platform Administrator',
  LEGAL_ADMIN = 'Legal Admin',
  DEPARTMENT_ADMIN = 'Department Admin',
  DEPARTMENT_USER = 'Department User',
}

export enum Permissions {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  PUBLISH = 'publish',
  APPROVE = 'approve',
  EXECUTE = 'execute',
  EXPORT = 'export',
  CONFIGURE = 'configure',
  BACKUP = 'backup',
  RESTORE = 'restore',
  USE = 'use',
}

export enum Resources {
  USERS = 'users',
  ROLES = 'roles',
  DOCUMENTS = 'documents',
  TEMPLATES = 'templates',
  CLAUSES = 'clauses',
  WORKFLOWS = 'workflows',
  ANALYTICS = 'analytics',
  SYSTEM = 'system',
  AUDIT = 'audit',
}
