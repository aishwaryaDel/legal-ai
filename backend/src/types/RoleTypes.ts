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
    view?: boolean;
  };
  settings?: {
    manage?: boolean;
  };
  [key: string]: any;
}

export interface RoleAttributes {
  id: string;
  name: string;
  description?: string;
  permissions: RolePermissions;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoleCreationAttributes {
  name: string;
  description?: string;
  permissions: RolePermissions;
  is_active?: boolean;
}

export interface CreateRoleDTO {
  name: string;
  description?: string;
  permissions: RolePermissions;
}

export interface UpdateRoleDTO {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
  is_active?: boolean;
}
