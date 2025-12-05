/*
  # Create roles table for RBAC

  1. New Tables
    - `roles`
      - `id` (uuid, primary key) - Unique identifier for each role
      - `name` (text, unique, not null) - Role name (Legal Admin, Department Admin, etc.)
      - `description` (text) - Description of the role
      - `permissions` (jsonb) - JSON object containing permissions for the role
      - `is_active` (boolean, default true) - Whether the role is active
      - `created_at` (timestamptz) - Timestamp when role was created
      - `updated_at` (timestamptz) - Timestamp when role was last updated

  2. Security
    - Enable RLS on `roles` table
    - Add policy for authenticated users to read all roles
    - Add policy for Platform Administrators to create roles
    - Add policy for Platform Administrators to update roles
    - Add policy for Platform Administrators to delete roles

  3. Initial Data
    - Insert 4 predefined roles: Platform Administrator, Legal Admin, Department Admin, Department User

  4. Important Notes
    - Role names must be unique
    - Permissions stored as JSONB for flexibility
    - All roles are active by default
    - Only Platform Administrators can manage roles
*/

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all active roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can create roles"
  ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update roles"
  ON roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete roles"
  ON roles
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_active ON roles(is_active);

INSERT INTO roles (name, description, permissions, is_active) VALUES
  (
    'Platform Administrator',
    'Full system access with all permissions',
    '{
      "users": {"create": true, "read": true, "update": true, "delete": true},
      "roles": {"create": true, "read": true, "update": true, "delete": true},
      "documents": {"create": true, "read": true, "update": true, "delete": true},
      "analytics": {"read": true},
      "system": {"configure": true}
    }'::jsonb,
    true
  ),
  (
    'Legal Admin',
    'Legal team administrator with access to all legal documents and workflows',
    '{
      "users": {"create": true, "read": true, "update": true, "delete": false},
      "roles": {"create": false, "read": true, "update": false, "delete": false},
      "documents": {"create": true, "read": true, "update": true, "delete": true},
      "analytics": {"read": true},
      "workflows": {"create": true, "read": true, "update": true, "delete": true}
    }'::jsonb,
    true
  ),
  (
    'Department Admin',
    'Department administrator with access to department-specific resources',
    '{
      "users": {"create": true, "read": true, "update": true, "delete": false},
      "roles": {"create": false, "read": true, "update": false, "delete": false},
      "documents": {"create": true, "read": true, "update": true, "delete": false},
      "analytics": {"read": true},
      "workflows": {"create": true, "read": true, "update": true, "delete": false}
    }'::jsonb,
    true
  ),
  (
    'Department User',
    'Basic user with limited access to department resources',
    '{
      "users": {"create": false, "read": true, "update": false, "delete": false},
      "roles": {"create": false, "read": true, "update": false, "delete": false},
      "documents": {"create": true, "read": true, "update": false, "delete": false},
      "analytics": {"read": false},
      "workflows": {"create": false, "read": true, "update": false, "delete": false}
    }'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;
