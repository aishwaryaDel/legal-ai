/*
  # Remove role column from users table

  1. Changes
    - Drop the `role` column from the `users` table
    - The role field is no longer needed as user roles are now managed through the `user_roles` junction table

  2. Important Notes
    - This migration removes the direct role assignment from users table
    - All role management should now be done through the user_roles table
    - Ensure all users have been migrated to the new role system before running this migration
    - This change enables users to have multiple roles instead of a single role
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
