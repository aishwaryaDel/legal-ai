/*
  # Update users table - Remove role column

  1. Changes
    - Remove the `role` column from the `users` table since we're now using the user_roles mapping table

  2. Important Notes
    - This migration removes the role column as roles are now managed through the user_roles table
    - Existing role data should be migrated to user_roles table before running this migration
    - This is a schema change to support proper RBAC with many-to-many relationships
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users DROP COLUMN role;
  END IF;
END $$;
