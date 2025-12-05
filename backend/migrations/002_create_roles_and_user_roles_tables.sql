/*
  # Create roles and user_roles tables for RBAC

  1. New Tables
    - `roles`
      - `id` (uuid, primary key) - Unique identifier for each role
      - `name` (text, unique, not null) - Role name (e.g., 'Legal Admin', 'Department Admin')
      - `description` (text) - Description of the role and its purpose
      - `permissions` (jsonb, not null) - JSON object containing permissions for the role
      - `is_active` (boolean, default true) - Whether the role is active
      - `created_at` (timestamptz) - Timestamp when role was created
      - `updated_at` (timestamptz) - Timestamp when role was last updated

    - `user_roles`
      - `id` (uuid, primary key) - Unique identifier for the mapping
      - `user_id` (uuid, foreign key to users, not null) - Reference to user
      - `role_id` (uuid, foreign key to roles, not null) - Reference to role
      - `assigned_by` (uuid, foreign key to users) - User who assigned this role
      - `assigned_at` (timestamptz) - Timestamp when role was assigned
      - `expires_at` (timestamptz, nullable) - Optional expiration date for temporary role assignments
      - `is_active` (boolean, default true) - Whether the role assignment is active
      - `created_at` (timestamptz) - Timestamp when mapping was created
      - `updated_at` (timestamptz) - Timestamp when mapping was last updated

  2. Security
    - Enable RLS on both `roles` and `user_roles` tables
    - Add policies for authenticated users to read roles
    - Add policies for Platform Administrators to manage roles
    - Add policies for appropriate users to manage user-role mappings

  3. Indexes
    - Create index on user_roles(user_id) for fast user lookup
    - Create index on user_roles(role_id) for fast role lookup
    - Create unique index on user_roles(user_id, role_id) to prevent duplicate assignments

  4. Initial Data
    - Insert the 4 default roles:
      * Platform Administrator - Full system access
      * Legal Admin - Legal team management and oversight
      * Department Admin - Department-level administration
      * Department User - Basic user access

  5. Important Notes
    - Users can have multiple roles through the user_roles junction table
    - Permissions are stored as JSONB for flexibility
    - Role assignments can be temporary with expiration dates
    - Soft delete supported through is_active flag
    - Audit trail maintained with assigned_by field
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles_unique ON user_roles(user_id, role_id) WHERE is_active = true;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Platform administrators can create roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Platform Administrator'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Platform administrators can update roles"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Platform Administrator'
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Platform Administrator'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Platform administrators can delete roles"
  ON roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'Platform Administrator'
      AND ur.is_active = true
    )
  );

CREATE POLICY "Users can read their own role assignments"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_active = true);

CREATE POLICY "Admins can read all role assignments"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Platform Administrator', 'Legal Admin', 'Department Admin')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can create role assignments"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Platform Administrator', 'Legal Admin', 'Department Admin')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can update role assignments"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Platform Administrator', 'Legal Admin', 'Department Admin')
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Platform Administrator', 'Legal Admin', 'Department Admin')
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can delete role assignments"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('Platform Administrator', 'Legal Admin', 'Department Admin')
      AND ur.is_active = true
    )
  );

INSERT INTO roles (name, description, permissions) VALUES
  ('Platform Administrator', 'Full system access with ability to manage all users, roles, and system configurations',
   '{"users": {"create": true, "read": true, "update": true, "delete": true}, "roles": {"create": true, "read": true, "update": true, "delete": true}, "documents": {"create": true, "read": true, "update": true, "delete": true}, "analytics": {"view": true}, "settings": {"manage": true}}'::jsonb),

  ('Legal Admin', 'Legal team management and oversight with access to all legal documents and workflows',
   '{"users": {"create": true, "read": true, "update": true, "delete": false}, "roles": {"create": false, "read": true, "update": false, "delete": false}, "documents": {"create": true, "read": true, "update": true, "delete": true}, "analytics": {"view": true}, "settings": {"manage": false}}'::jsonb),

  ('Department Admin', 'Department-level administration with ability to manage department users and documents',
   '{"users": {"create": true, "read": true, "update": true, "delete": false}, "roles": {"create": false, "read": true, "update": false, "delete": false}, "documents": {"create": true, "read": true, "update": true, "delete": false}, "analytics": {"view": true}, "settings": {"manage": false}}'::jsonb),

  ('Department User', 'Basic user access with ability to create and manage own documents',
   '{"users": {"create": false, "read": false, "update": false, "delete": false}, "roles": {"create": false, "read": false, "update": false, "delete": false}, "documents": {"create": true, "read": true, "update": true, "delete": false}, "analytics": {"view": false}, "settings": {"manage": false}}'::jsonb)
ON CONFLICT (name) DO NOTHING;
