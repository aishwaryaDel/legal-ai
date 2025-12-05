/*
  # Fix Security and Performance Issues - Part 2: Core RLS Policies

  ## RLS Performance Optimization
    Replace `auth.uid()` with `(select auth.uid())` in RLS policies.
    This prevents re-evaluation for each row, dramatically improving query performance.

  ## Tables in this migration
    - users, user_roles, intake_requests, contracts, contract_versions
    - discovery_projects, discovery_docs, copilot_conversations, copilot_messages
    - research_queries, tasks

  ## Important Notes
    - Backward compatible - no behavioral changes
    - Only performance improvements
    - Maintains exact same security semantics
*/

-- users table
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- user_roles table
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- intake_requests table
DROP POLICY IF EXISTS "Users can create intake requests" ON public.intake_requests;
DROP POLICY IF EXISTS "Users can read own intake requests" ON public.intake_requests;

CREATE POLICY "Users can create intake requests"
  ON public.intake_requests FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can read own intake requests"
  ON public.intake_requests FOR SELECT
  TO authenticated
  USING (created_by = (select auth.uid()) OR assigned_to = (select auth.uid()));

-- contracts table
DROP POLICY IF EXISTS "Users can read contracts in their scope" ON public.contracts;

CREATE POLICY "Users can read contracts in their scope"
  ON public.contracts FOR SELECT
  TO authenticated
  USING (
    owner_id = (select auth.uid()) OR 
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name IN ('admin', 'legal_ops')
    )
  );

-- contract_versions table
DROP POLICY IF EXISTS "Users can read versions of accessible contracts" ON public.contract_versions;

CREATE POLICY "Users can read versions of accessible contracts"
  ON public.contract_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = contract_versions.contract_id
      AND (
        c.owner_id = (select auth.uid()) OR
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          JOIN public.roles r ON ur.role_id = r.id
          WHERE ur.user_id = (select auth.uid()) AND r.name IN ('admin', 'legal_ops')
        )
      )
    )
  );

-- discovery_projects table
DROP POLICY IF EXISTS "Users can create discovery projects" ON public.discovery_projects;
DROP POLICY IF EXISTS "Users can read own discovery projects" ON public.discovery_projects;
DROP POLICY IF EXISTS "Users can update own discovery projects" ON public.discovery_projects;

CREATE POLICY "Users can create discovery projects"
  ON public.discovery_projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

CREATE POLICY "Users can read own discovery projects"
  ON public.discovery_projects FOR SELECT
  TO authenticated
  USING (created_by = (select auth.uid()));

CREATE POLICY "Users can update own discovery projects"
  ON public.discovery_projects FOR UPDATE
  TO authenticated
  USING (created_by = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()));

-- discovery_docs table
DROP POLICY IF EXISTS "Users can read docs in own projects" ON public.discovery_docs;

CREATE POLICY "Users can read docs in own projects"
  ON public.discovery_docs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.discovery_projects dp
      WHERE dp.id = discovery_docs.project_id
      AND dp.created_by = (select auth.uid())
    )
  );

-- copilot_conversations table
DROP POLICY IF EXISTS "Users can create conversations" ON public.copilot_conversations;
DROP POLICY IF EXISTS "Users can read own conversations" ON public.copilot_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.copilot_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.copilot_conversations;

CREATE POLICY "Users can create conversations"
  ON public.copilot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own conversations"
  ON public.copilot_conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own conversations"
  ON public.copilot_conversations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own conversations"
  ON public.copilot_conversations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- copilot_messages table
DROP POLICY IF EXISTS "Users can read messages in own conversations" ON public.copilot_messages;

CREATE POLICY "Users can read messages in own conversations"
  ON public.copilot_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.copilot_conversations cc
      WHERE cc.id = copilot_messages.conversation_id
      AND cc.user_id = (select auth.uid())
    )
  );

-- research_queries table
DROP POLICY IF EXISTS "Users can create research queries" ON public.research_queries;
DROP POLICY IF EXISTS "Users can read own research queries" ON public.research_queries;

CREATE POLICY "Users can create research queries"
  ON public.research_queries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own research queries"
  ON public.research_queries FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- tasks table
DROP POLICY IF EXISTS "Users can read assigned or created tasks" ON public.tasks;

CREATE POLICY "Users can read assigned or created tasks"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (assignee_id = (select auth.uid()) OR created_by = (select auth.uid()));