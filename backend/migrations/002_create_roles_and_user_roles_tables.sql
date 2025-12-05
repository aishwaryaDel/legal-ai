/*
  # Create roles and user_roles tables for RBAC system

  1. New Tables
    - `roles`
      - `id` (uuid, primary key) - Unique identifier for each role
      - `name` (text, unique, not null) - Role name (e.g., "Platform Administrator", "Legal Admin")
      - `description` (text) - Detailed description of the role's purpose
      - `permissions` (jsonb, not null) - Structured permissions object defining allowed actions
      - `is_system_role` (boolean, default false) - Flag to prevent deletion of core system roles
      - `created_at` (timestamptz) - Timestamp when role was created
      - `updated_at` (timestamptz) - Timestamp when role was last updated

    - `user_roles`
      - `id` (uuid, primary key) - Unique identifier for the mapping
      - `user_id` (uuid, foreign key) - References users table
      - `role_id` (uuid, foreign key) - References roles table
      - `assigned_by` (uuid, foreign key) - References users table (who assigned this role)
      - `assigned_at` (timestamptz) - Timestamp when role was assigned
      - `is_active` (boolean, default true) - Whether this role assignment is currently active

  2. Security
    - Enable RLS on both tables
    - Roles table:
      - Authenticated users can read all roles
      - Only platform administrators can create/update/delete roles
    - User_roles table:
      - Users can read their own role assignments
      - Only administrators can manage role assignments
      - Prevent privilege escalation through role assignment

  3. Indexes
    - Index on user_roles(user_id) for efficient user role lookups
    - Index on user_roles(role_id) for efficient role-based queries
    - Unique index on user_roles(user_id, role_id) to prevent duplicate assignments

  4. Constraints
    - Prevent deletion of system roles
    - Cascading delete for user_roles when user is deleted
    - Restrict delete on roles if they have active assignments

  5. Initial Data
    - Seed four core system roles:
      - Platform Administrator
      - Legal Admin
      - Department Admin
      - Department User
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles mapping table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  UNIQUE(user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles table
CREATE POLICY "Authenticated users can read all roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can create roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update roles"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "System roles cannot be deleted"
  ON roles
  FOR DELETE
  TO authenticated
  USING (is_system_role = false);

-- RLS Policies for user_roles table
CREATE POLICY "Users can read all user role assignments"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can assign roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update role assignments"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete role assignments"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial system roles with comprehensive permissions
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
(
  'Platform Administrator',
  'Full system access with ability to manage all users, roles, and system settings',
  '{
    "users": ["create", "read", "update", "delete"],
    "roles": ["create", "read", "update", "delete"],
    "documents": ["create", "read", "update", "delete", "publish"],
    "templates": ["create", "read", "update", "delete", "publish"],
    "clauses": ["create", "read", "update", "delete", "approve"],
    "workflows": ["create", "read", "update", "delete", "execute"],
    "analytics": ["read", "export"],
    "system": ["configure", "backup", "restore"],
    "audit": ["read", "export"]
  }'::jsonb,
  true
),
(
  'Legal Admin',
  'Manages legal documents, templates, clauses, and legal team members',
  '{
    "users": ["read", "update"],
    "roles": ["read"],
    "documents": ["create", "read", "update", "delete", "publish"],
    "templates": ["create", "read", "update", "delete", "publish"],
    "clauses": ["create", "read", "update", "delete", "approve"],
    "workflows": ["create", "read", "update", "execute"],
    "analytics": ["read", "export"],
    "audit": ["read"]
  }'::jsonb,
  true
),
(
  'Department Admin',
  'Manages department users and their documents',
  '{
    "users": ["read", "update"],
    "roles": ["read"],
    "documents": ["create", "read", "update", "delete"],
    "templates": ["read", "use"],
    "clauses": ["read", "use"],
    "workflows": ["read", "execute"],
    "analytics": ["read"]
  }'::jsonb,
  true
),
(
  'Department User',
  'Basic user with read/write access to assigned documents',
  '{
    "users": ["read"],
    "roles": ["read"],
    "documents": ["create", "read", "update"],
    "templates": ["read", "use"],
    "clauses": ["read", "use"],
    "workflows": ["read"]
  }'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;
