/*
  # Fix Security and Performance Issues - Part 3: Review & Testing RLS Policies

  ## RLS Performance Optimization
    Replace `auth.uid()` with `(select auth.uid())` in RLS policies.

  ## Tables in this migration
    - review_sessions, review_issues, playbook_tests
    - model_preferences, ai_feedback, ai_responses_log

  ## Important Notes
    - Backward compatible - no behavioral changes
    - Only performance improvements
*/

-- review_sessions table
DROP POLICY IF EXISTS "Users can create review sessions" ON public.review_sessions;
DROP POLICY IF EXISTS "Users can read own review sessions" ON public.review_sessions;
DROP POLICY IF EXISTS "Users can update own review sessions" ON public.review_sessions;

CREATE POLICY "Users can create review sessions"
  ON public.review_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own review sessions"
  ON public.review_sessions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own review sessions"
  ON public.review_sessions FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- review_issues table
DROP POLICY IF EXISTS "Users can read issues in own sessions" ON public.review_issues;

CREATE POLICY "Users can read issues in own sessions"
  ON public.review_issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.review_sessions rs
      WHERE rs.id = review_issues.session_id
      AND rs.user_id = (select auth.uid())
    )
  );

-- playbook_tests table
DROP POLICY IF EXISTS "Users can create playbook tests" ON public.playbook_tests;
DROP POLICY IF EXISTS "Users can read own playbook tests" ON public.playbook_tests;

CREATE POLICY "Users can create playbook tests"
  ON public.playbook_tests FOR INSERT
  TO authenticated
  WITH CHECK (executed_by = (select auth.uid()));

CREATE POLICY "Users can read own playbook tests"
  ON public.playbook_tests FOR SELECT
  TO authenticated
  USING (executed_by = (select auth.uid()));

-- model_preferences table
DROP POLICY IF EXISTS "Users can create own model preferences" ON public.model_preferences;
DROP POLICY IF EXISTS "Users can read own model preferences" ON public.model_preferences;
DROP POLICY IF EXISTS "Users can update own model preferences" ON public.model_preferences;
DROP POLICY IF EXISTS "Users can delete own model preferences" ON public.model_preferences;

CREATE POLICY "Users can create own model preferences"
  ON public.model_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can read own model preferences"
  ON public.model_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own model preferences"
  ON public.model_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own model preferences"
  ON public.model_preferences FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ai_feedback table
DROP POLICY IF EXISTS "Users can create own feedback" ON public.ai_feedback;
DROP POLICY IF EXISTS "Users can view own feedback" ON public.ai_feedback;
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.ai_feedback;

CREATE POLICY "Users can create own feedback"
  ON public.ai_feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can view own feedback"
  ON public.ai_feedback FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can view all feedback"
  ON public.ai_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = (select auth.uid()) AND r.name = 'admin'
    )
  );

-- ai_responses_log table
DROP POLICY IF EXISTS "Users can view own response logs" ON public.ai_responses_log;

CREATE POLICY "Users can view own response logs"
  ON public.ai_responses_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.copilot_conversations cc
      WHERE cc.id = ai_responses_log.conversation_id
      AND cc.user_id = (select auth.uid())
    )
  );