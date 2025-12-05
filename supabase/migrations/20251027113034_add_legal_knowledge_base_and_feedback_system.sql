/*
  # Multi-Jurisdictional Legal Knowledge Base and Adaptive Learning System

  ## 1. New Tables

  ### Legal Knowledge Base
  - `legal_sources` - Official legal sources (laws, regulations, case law)
    - `id` (uuid, primary key)
    - `jurisdiction` (text) - DACH, EU, US, etc.
    - `source_type` (text) - law, regulation, case_law, directive
    - `title` (text) - Official title
    - `reference_number` (text) - Official reference (e.g., BGB §123)
    - `content` (text) - Full text content
    - `summary` (text) - AI-generated summary
    - `valid_from` (date) - Effective date
    - `valid_until` (date, nullable) - Expiration date
    - `parent_version_id` (uuid, nullable) - Links to previous version
    - `source_url` (text) - Official source URL
    - `metadata` (jsonb) - Additional metadata
    - `embedding` (vector) - For semantic search (when pgvector is enabled)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  - `legal_updates` - Tracked changes to legal sources
    - `id` (uuid, primary key)
    - `source_id` (uuid) - References legal_sources
    - `change_type` (text) - new, amended, repealed
    - `change_summary` (text)
    - `detected_at` (timestamptz)
    - `validated_by` (uuid, nullable) - Admin who validated
    - `status` (text) - pending, validated, rejected
    - `notification_sent` (boolean)

  - `legal_taxonomy` - Hierarchical taxonomy of legal concepts
    - `id` (uuid, primary key)
    - `concept_name` (text) - Legal concept
    - `parent_id` (uuid, nullable) - Parent concept
    - `jurisdictions` (text[]) - Applicable jurisdictions
    - `translations` (jsonb) - Multi-language names
    - `related_sources` (uuid[]) - Related legal_sources

  ### Adaptive Learning System
  - `ai_feedback` - User feedback on AI responses
    - `id` (uuid, primary key)
    - `conversation_id` (uuid) - References copilot_conversations
    - `message_id` (uuid) - References copilot_messages
    - `user_id` (uuid) - User who provided feedback
    - `rating` (integer) - 1-5 stars or -1/1 for thumbs
    - `feedback_type` (text) - accuracy, relevance, completeness, clarity
    - `feedback_text` (text, nullable) - Detailed feedback
    - `context_metadata` (jsonb) - Jurisdiction, contract type, user role, etc.
    - `created_at` (timestamptz)

  - `ai_model_versions` - Track AI model versions and performance
    - `id` (uuid, primary key)
    - `model_id` (text) - References ai_models.model_id
    - `version` (text) - Version identifier
    - `deployment_date` (timestamptz)
    - `performance_metrics` (jsonb) - Accuracy, response time, etc.
    - `training_data_count` (integer)
    - `is_active` (boolean)
    - `notes` (text)

  - `ai_responses_log` - Detailed logging of AI responses for quality monitoring
    - `id` (uuid, primary key)
    - `conversation_id` (uuid)
    - `message_id` (uuid)
    - `model_version_id` (uuid) - References ai_model_versions
    - `prompt_tokens` (integer)
    - `completion_tokens` (integer)
    - `response_time_ms` (integer)
    - `confidence_score` (numeric, nullable)
    - `citations` (jsonb) - Source citations
    - `hallucination_flags` (jsonb) - Detected issues
    - `created_at` (timestamptz)

  ### Enhanced Workflow System
  - `workflow_rules` - Automated routing and escalation rules
    - `id` (uuid, primary key)
    - `name` (text)
    - `contract_types` (text[]) - Applicable contract types
    - `jurisdictions` (text[])
    - `conditions` (jsonb) - Rule conditions (risk score, clause types, etc.)
    - `actions` (jsonb) - Actions to take (route to, escalate, notify)
    - `priority` (integer)
    - `is_active` (boolean)
    - `created_by` (uuid)
    - `created_at` (timestamptz)

  - `compliance_checks` - Automated compliance validation
    - `id` (uuid, primary key)
    - `contract_id` (uuid) - References contracts
    - `check_type` (text) - playbook, legal_requirement, policy
    - `check_name` (text)
    - `status` (text) - passed, failed, warning, pending
    - `details` (jsonb) - Check results and violations
    - `severity` (text) - high, medium, low
    - `auto_resolved` (boolean)
    - `resolved_by` (uuid, nullable)
    - `checked_at` (timestamptz)

  - `workflow_tasks` - Enhanced task management
    - `id` (uuid, primary key)
    - `workflow_id` (uuid) - References workflows
    - `contract_id` (uuid) - References contracts
    - `assigned_to` (uuid)
    - `task_type` (text) - review, approve, negotiate, update
    - `title` (text)
    - `description` (text)
    - `due_date` (timestamptz)
    - `priority` (text) - urgent, high, normal, low
    - `status` (text) - pending, in_progress, completed, escalated
    - `dependencies` (uuid[]) - Other task IDs
    - `reminders_sent` (integer)
    - `completed_at` (timestamptz, nullable)
    - `created_at` (timestamptz)

  ### Context and Personalization
  - `user_preferences` - User-specific AI preferences
    - `id` (uuid, primary key)
    - `user_id` (uuid) - References auth.users
    - `default_jurisdiction` (text)
    - `default_language` (text)
    - `industries` (text[]) - User's industry focus
    - `contract_types` (text[]) - Frequently used contract types
    - `preferred_models` (jsonb) - Model preferences by task type
    - `ui_preferences` (jsonb) - Interface customizations
    - `updated_at` (timestamptz)

  - `clause_suggestions` - Context-aware clause suggestions
    - `id` (uuid, primary key)
    - `clause_text` (text)
    - `clause_type` (text)
    - `jurisdiction` (text)
    - `industry` (text)
    - `risk_level` (text)
    - `alternatives` (jsonb) - Alternative formulations
    - `negotiation_notes` (text)
    - `usage_count` (integer)
    - `success_rate` (numeric) - % of times accepted
    - `created_at` (timestamptz)

  - `precedent_cases` - Internal precedent tracking
    - `id` (uuid, primary key)
    - `contract_id` (uuid) - References contracts
    - `case_summary` (text)
    - `outcome` (text) - success, partial, failed
    - `lessons_learned` (text)
    - `relevant_clauses` (uuid[]) - References clauses
    - `tags` (text[])
    - `created_at` (timestamptz)

  ### Security and Audit
  - `data_access_log` - Comprehensive access logging
    - `id` (uuid, primary key)
    - `user_id` (uuid)
    - `resource_type` (text) - contract, clause, conversation, etc.
    - `resource_id` (uuid)
    - `action` (text) - view, edit, delete, export, share
    - `ip_address` (text)
    - `user_agent` (text)
    - `access_granted` (boolean)
    - `denial_reason` (text, nullable)
    - `timestamp` (timestamptz)

  - `security_incidents` - Security event tracking
    - `id` (uuid, primary key)
    - `incident_type` (text) - unauthorized_access, data_breach, suspicious_activity
    - `severity` (text) - critical, high, medium, low
    - `description` (text)
    - `affected_users` (uuid[])
    - `affected_resources` (jsonb)
    - `detected_at` (timestamptz)
    - `resolved_at` (timestamptz, nullable)
    - `resolution_notes` (text)
    - `status` (text) - detected, investigating, resolved

  ## 2. Indexes for Performance

  Create indexes on frequently queried columns for optimal performance.

  ## 3. Row Level Security (RLS)

  Enable RLS on all tables with appropriate policies.
  - Users can only access data relevant to their jurisdiction and role
  - Admin users have broader access for validation and monitoring
  - Audit logs are read-only for non-admin users

  ## 4. Important Notes

  - All timestamps use timestamptz for timezone awareness
  - JSONB used for flexible metadata and configuration
  - Foreign keys maintain referential integrity
  - Comprehensive audit trail for compliance
*/

-- ============================================================================
-- LEGAL KNOWLEDGE BASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS legal_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('law', 'regulation', 'case_law', 'directive', 'guideline', 'commentary')),
  title text NOT NULL,
  reference_number text NOT NULL,
  content text NOT NULL,
  summary text,
  valid_from date NOT NULL,
  valid_until date,
  parent_version_id uuid REFERENCES legal_sources(id),
  source_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_sources_jurisdiction ON legal_sources(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_legal_sources_type ON legal_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_legal_sources_reference ON legal_sources(reference_number);
CREATE INDEX IF NOT EXISTS idx_legal_sources_valid_dates ON legal_sources(valid_from, valid_until);

CREATE TABLE IF NOT EXISTS legal_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES legal_sources(id) ON DELETE CASCADE,
  change_type text NOT NULL CHECK (change_type IN ('new', 'amended', 'repealed', 'clarified')),
  change_summary text NOT NULL,
  detected_at timestamptz DEFAULT now(),
  validated_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'rejected', 'archived')),
  notification_sent boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_legal_updates_status ON legal_updates(status);
CREATE INDEX IF NOT EXISTS idx_legal_updates_detected_at ON legal_updates(detected_at DESC);

CREATE TABLE IF NOT EXISTS legal_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_name text NOT NULL,
  parent_id uuid REFERENCES legal_taxonomy(id),
  jurisdictions text[] NOT NULL DEFAULT '{}',
  translations jsonb DEFAULT '{}'::jsonb,
  related_sources uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_taxonomy_parent ON legal_taxonomy(parent_id);
CREATE INDEX IF NOT EXISTS idx_legal_taxonomy_jurisdictions ON legal_taxonomy USING GIN(jurisdictions);

-- ============================================================================
-- ADAPTIVE LEARNING SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES copilot_messages(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  rating integer CHECK (rating IN (-1, 1) OR (rating >= 1 AND rating <= 5)),
  feedback_type text NOT NULL CHECK (feedback_type IN ('accuracy', 'relevance', 'completeness', 'clarity', 'hallucination', 'general')),
  feedback_text text,
  context_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id text NOT NULL,
  version text NOT NULL,
  deployment_date timestamptz DEFAULT now(),
  performance_metrics jsonb DEFAULT '{}'::jsonb,
  training_data_count integer DEFAULT 0,
  is_active boolean DEFAULT false,
  notes text,
  UNIQUE(model_id, version)
);

CREATE INDEX IF NOT EXISTS idx_ai_model_versions_active ON ai_model_versions(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS ai_responses_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES copilot_messages(id) ON DELETE CASCADE,
  model_version_id uuid REFERENCES ai_model_versions(id),
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  response_time_ms integer DEFAULT 0,
  confidence_score numeric(3,2),
  citations jsonb DEFAULT '[]'::jsonb,
  hallucination_flags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_responses_log_created_at ON ai_responses_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_responses_log_confidence ON ai_responses_log(confidence_score);

-- ============================================================================
-- ENHANCED WORKFLOW SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS workflow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contract_types text[] DEFAULT '{}',
  jurisdictions text[] DEFAULT '{}',
  conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  actions jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_rules_active ON workflow_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_rules_priority ON workflow_rules(priority DESC);

CREATE TABLE IF NOT EXISTS compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  check_type text NOT NULL CHECK (check_type IN ('playbook', 'legal_requirement', 'policy', 'custom')),
  check_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('passed', 'failed', 'warning', 'pending', 'skipped')),
  details jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  auto_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES auth.users(id),
  checked_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_checks_contract ON compliance_checks(contract_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_severity ON compliance_checks(severity);

CREATE TABLE IF NOT EXISTS workflow_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES auth.users(id),
  task_type text NOT NULL CHECK (task_type IN ('review', 'approve', 'negotiate', 'update', 'sign', 'archive')),
  title text NOT NULL,
  description text,
  due_date timestamptz,
  priority text DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'escalated', 'cancelled')),
  dependencies uuid[] DEFAULT '{}',
  reminders_sent integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_due_date ON workflow_tasks(due_date);

-- ============================================================================
-- CONTEXT AND PERSONALIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  default_jurisdiction text DEFAULT 'DACH',
  default_language text DEFAULT 'de',
  industries text[] DEFAULT '{}',
  contract_types text[] DEFAULT '{}',
  preferred_models jsonb DEFAULT '{}'::jsonb,
  ui_preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

CREATE TABLE IF NOT EXISTS clause_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_text text NOT NULL,
  clause_type text NOT NULL,
  jurisdiction text NOT NULL,
  industry text,
  risk_level text CHECK (risk_level IN ('high', 'medium', 'low')),
  alternatives jsonb DEFAULT '[]'::jsonb,
  negotiation_notes text,
  usage_count integer DEFAULT 0,
  success_rate numeric(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clause_suggestions_jurisdiction ON clause_suggestions(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_clause_suggestions_type ON clause_suggestions(clause_type);
CREATE INDEX IF NOT EXISTS idx_clause_suggestions_industry ON clause_suggestions(industry);

CREATE TABLE IF NOT EXISTS precedent_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid REFERENCES contracts(id),
  case_summary text NOT NULL,
  outcome text CHECK (outcome IN ('success', 'partial', 'failed', 'pending')),
  lessons_learned text,
  relevant_clauses uuid[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_precedent_cases_outcome ON precedent_cases(outcome);
CREATE INDEX IF NOT EXISTS idx_precedent_cases_tags ON precedent_cases USING GIN(tags);

-- ============================================================================
-- SECURITY AND AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('view', 'edit', 'delete', 'export', 'share', 'download', 'print')),
  ip_address text,
  user_agent text,
  access_granted boolean NOT NULL,
  denial_reason text,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_access_log_user ON data_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_resource ON data_access_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_data_access_log_timestamp ON data_access_log(timestamp DESC);

CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL CHECK (incident_type IN ('unauthorized_access', 'data_breach', 'suspicious_activity', 'policy_violation', 'system_compromise')),
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  description text NOT NULL,
  affected_users uuid[] DEFAULT '{}',
  affected_resources jsonb DEFAULT '{}'::jsonb,
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolution_notes text,
  status text DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'mitigated', 'resolved', 'false_positive'))
);

CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Legal Sources: Read-only for authenticated users
ALTER TABLE legal_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read legal sources"
  ON legal_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage legal sources"
  ON legal_sources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- Legal Updates: Admins manage, users can view validated ones
ALTER TABLE legal_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view validated updates"
  ON legal_updates FOR SELECT
  TO authenticated
  USING (status = 'validated');

CREATE POLICY "Admins can manage updates"
  ON legal_updates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- AI Feedback: Users can manage their own feedback
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own feedback"
  ON ai_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON ai_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
  ON ai_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- AI Model Versions: Read-only for users, admins manage
ALTER TABLE ai_model_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active model versions"
  ON ai_model_versions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage model versions"
  ON ai_model_versions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- AI Responses Log: Users can view logs for their conversations
ALTER TABLE ai_responses_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own response logs"
  ON ai_responses_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM copilot_conversations
      WHERE copilot_conversations.id = ai_responses_log.conversation_id
      AND copilot_conversations.user_id = auth.uid()
    )
  );

-- Workflow Rules: Admins manage, users read
ALTER TABLE workflow_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active workflow rules"
  ON workflow_rules FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage workflow rules"
  ON workflow_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- Compliance Checks: Users see checks for their contracts
ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checks for their contracts"
  ON compliance_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = compliance_checks.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

-- Workflow Tasks: Users see assigned tasks
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned tasks"
  ON workflow_tasks FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Users can update assigned tasks"
  ON workflow_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

-- User Preferences: Users manage their own preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Clause Suggestions: Read-only for users
ALTER TABLE clause_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clause suggestions"
  ON clause_suggestions FOR SELECT
  TO authenticated
  USING (true);

-- Precedent Cases: Users see cases for their contracts
ALTER TABLE precedent_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view precedent cases"
  ON precedent_cases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = precedent_cases.contract_id
      AND contracts.owner_id = auth.uid()
    )
  );

-- Data Access Log: Read-only, users can view their own logs
ALTER TABLE data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access logs"
  ON data_access_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all access logs"
  ON data_access_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- Security Incidents: Admin-only
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security incidents"
  ON security_incidents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );

-- Legal Taxonomy: Read-only for users
ALTER TABLE legal_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view legal taxonomy"
  ON legal_taxonomy FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage legal taxonomy"
  ON legal_taxonomy FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role_id IN (SELECT id FROM roles WHERE name = 'admin')
    )
  );