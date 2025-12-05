/*
  # Fix Security and Performance Issues - Part 4: Admin RLS Policies

  ## RLS Performance Optimization
    Replace `auth.uid()` with `(select auth.uid())` in RLS policies.

  ## Tables in this migration
    - audit_log, access_requests, legal_sources, legal_updates
    - ai_model_versions, workflow_rules, compliance_checks
    - workflow_tasks, user_preferences, precedent_cases

  ## Important Notes
    - Backward compatible - no behavioral changes
    - Only performance improvements
*/

-- audit_log table
DROP POLICY IF EXISTS "Only admins can read audit logs" ON public.audit_log;

CREATE POLICY "Only admins can read audit logs"
  ON public.audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- access_requests table
DROP POLICY IF EXISTS "Admins can read access requests" ON public.access_requests;

CREATE POLICY "Admins can read access requests"
  ON public.access_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- legal_sources table
DROP POLICY IF EXISTS "Admins can manage legal sources" ON public.legal_sources;

CREATE POLICY "Admins can manage legal sources"
  ON public.legal_sources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- legal_updates table
DROP POLICY IF EXISTS "Admins can manage updates" ON public.legal_updates;

CREATE POLICY "Admins can manage updates"
  ON public.legal_updates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- ai_model_versions table
DROP POLICY IF EXISTS "Admins can manage model versions" ON public.ai_model_versions;

CREATE POLICY "Admins can manage model versions"
  ON public.ai_model_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- workflow_rules table
DROP POLICY IF EXISTS "Admins can manage workflow rules" ON public.workflow_rules;

CREATE POLICY "Admins can manage workflow rules"
  ON public.workflow_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- compliance_checks table
DROP POLICY IF EXISTS "Users can view checks for their contracts" ON public.compliance_checks;

CREATE POLICY "Users can view checks for their contracts"
  ON public.compliance_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = compliance_checks.contract_id
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

-- workflow_tasks table
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.workflow_tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.workflow_tasks;

CREATE POLICY "Users can view assigned tasks"
  ON public.workflow_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = (select auth.uid()));

CREATE POLICY "Users can update assigned tasks"
  ON public.workflow_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = (select auth.uid()))
  WITH CHECK (assigned_to = (select auth.uid()));

-- user_preferences table
DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_preferences;

CREATE POLICY "Users can manage own preferences"
  ON public.user_preferences FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- precedent_cases table
DROP POLICY IF EXISTS "Users can view precedent cases" ON public.precedent_cases;

CREATE POLICY "Users can view precedent cases"
  ON public.precedent_cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = (select auth.uid())
    )
  );