/*
  # Fix Security and Performance Issues - Part 5: Security & Data RLS Policies

  ## RLS Performance Optimization
    Replace `auth.uid()` with `(select auth.uid())` in RLS policies.

  ## Tables in this migration
    - data_access_log, security_incidents, legal_taxonomy
    - document_exports, builder_sessions, generated_documents

  ## Important Notes
    - Backward compatible - no behavioral changes
    - Only performance improvements
*/

-- data_access_log table
DROP POLICY IF EXISTS "Admins can view all access logs" ON public.data_access_log;
DROP POLICY IF EXISTS "Users can view own access logs" ON public.data_access_log;

CREATE POLICY "Admins can view all access logs"
  ON public.data_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

CREATE POLICY "Users can view own access logs"
  ON public.data_access_log FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- security_incidents table
DROP POLICY IF EXISTS "Admins can manage security incidents" ON public.security_incidents;

CREATE POLICY "Admins can manage security incidents"
  ON public.security_incidents FOR ALL
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

-- legal_taxonomy table
DROP POLICY IF EXISTS "Admins can manage legal taxonomy" ON public.legal_taxonomy;

CREATE POLICY "Admins can manage legal taxonomy"
  ON public.legal_taxonomy FOR ALL
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

-- document_exports table
DROP POLICY IF EXISTS "Users can create export logs" ON public.document_exports;
DROP POLICY IF EXISTS "Users can read own export logs" ON public.document_exports;

CREATE POLICY "Users can create export logs"
  ON public.document_exports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own export logs"
  ON public.document_exports FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- builder_sessions table
DROP POLICY IF EXISTS "Users can create own builder sessions" ON public.builder_sessions;
DROP POLICY IF EXISTS "Users can read own builder sessions" ON public.builder_sessions;
DROP POLICY IF EXISTS "Users can update own builder sessions" ON public.builder_sessions;
DROP POLICY IF EXISTS "Users can delete own draft sessions" ON public.builder_sessions;

CREATE POLICY "Users can create own builder sessions"
  ON public.builder_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own builder sessions"
  ON public.builder_sessions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own builder sessions"
  ON public.builder_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own draft sessions"
  ON public.builder_sessions FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) AND status = 'draft');

-- generated_documents table
DROP POLICY IF EXISTS "Users can create generated documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Users can read own generated documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Users can update own generated documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Users can delete own draft documents" ON public.generated_documents;

CREATE POLICY "Users can create generated documents"
  ON public.generated_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own generated documents"
  ON public.generated_documents FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own generated documents"
  ON public.generated_documents FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own draft documents"
  ON public.generated_documents FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()) AND status = 'draft');