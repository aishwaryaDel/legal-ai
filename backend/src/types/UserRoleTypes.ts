export interface UserRoleAttributes {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRoleCreationAttributes {
  user_id: string;
  role_id: string;
  assigned_by?: string;
  expires_at?: Date;
  is_active?: boolean;
}

export interface CreateUserRoleDTO {
  user_id: string;
  role_id: string;
  assigned_by?: string;
  expires_at?: Date;
}

export interface UpdateUserRoleDTO {
  expires_at?: Date;
  is_active?: boolean;
}

export interface UserWithRoles {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
  roles: Array<{
    id: string;
    name: string;
    description?: string;
    permissions: any;
    assigned_at: Date;
    expires_at?: Date;
    is_active: boolean;
  }>;
}
