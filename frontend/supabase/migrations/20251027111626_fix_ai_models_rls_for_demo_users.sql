/*
  # Fix AI Models RLS for Demo Users

  ## Overview
  Updates the RLS policy on ai_models table to allow both authenticated 
  and anonymous users to read active models. This enables demo users to 
  access and select AI models including GPT-5 Turbo.

  ## Changes
  1. Drop existing restrictive policy
  2. Create new policy allowing all users to read active models

  ## Security
  - Read-only access for all users
  - Only active models are visible
  - Write access still restricted to admin users
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can read active models" ON ai_models;

-- Create new policy allowing both authenticated and anonymous users to read
CREATE POLICY "All users can read active models"
  ON ai_models FOR SELECT
  TO authenticated, anon
  USING (is_active = true);
