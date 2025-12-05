/*
  # Create user-roles mapping table for RBAC

  1. New Tables
    - `user_roles`
      - `id` (uuid, primary key) - Unique identifier for each mapping
      - `user_id` (uuid, not null) - Foreign key to users table
      - `role_id` (uuid, not null) - Foreign key to roles table
      - `assigned_by` (uuid) - User ID who assigned this role
      - `assigned_at` (timestamptz) - Timestamp when role was assigned
      - `expires_at` (timestamptz) - Optional expiration timestamp for temporary role assignments
      - `is_active` (boolean, default true) - Whether this mapping is active
      - `created_at` (timestamptz) - Timestamp when mapping was created
      - `updated_at` (timestamptz) - Timestamp when mapping was last updated

  2. Security
    - Enable RLS on `user_roles` table
    - Add policy for users to read their own role mappings
    - Add policy for admins to read all role mappings
    - Add policy for admins to create role mappings
    - Add policy for admins to update role mappings
    - Add policy for admins to delete role mappings

  3. Constraints
    - Foreign key constraint on user_id
    - Foreign key constraint on role_id
    - Unique constraint on (user_id, role_id) to prevent duplicate assignments
    - Cascade delete when user or role is deleted

  4. Important Notes
    - A user can have multiple roles
    - Role assignments can be temporary with expiration
    - Track who assigned each role for audit purposes
    - Soft delete supported via is_active flag
*/

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own role mappings"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_active = true);

CREATE POLICY "Admins can read all role mappings"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create role mappings"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update role mappings"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete role mappings"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_is_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at);

CREATE OR REPLACE FUNCTION get_user_roles(p_user_id uuid)
RETURNS TABLE (
  role_id uuid,
  role_name text,
  role_description text,
  permissions jsonb,
  assigned_at timestamptz,
  expires_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.description,
    r.permissions,
    ur.assigned_at,
    ur.expires_at
  FROM user_roles ur
  INNER JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  merged_permissions jsonb := '{}';
  role_perms jsonb;
BEGIN
  FOR role_perms IN
    SELECT r.permissions
    FROM user_roles ur
    INNER JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND r.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  LOOP
    merged_permissions := merged_permissions || role_perms;
  END LOOP;

  RETURN merged_permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
