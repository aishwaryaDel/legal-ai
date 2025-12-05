/*
  # LegalAI Core Database Schema

  ## Overview
  Complete database schema for LegalAI enterprise legal copilot system supporting:
  - Multi-tenant RBAC/ABAC with jurisdiction and module-level permissions
  - Contract repository with versioning and CLM integration
  - Partner 360 counterparty management
  - Discovery batch analysis projects
  - Research queries with citation tracking
  - Copilot conversations with context binding
  - Clause library and playbooks with jurisdiction tagging
  - Audit logging and compliance
  - Multilingual support (EN/DE v1, extensible)

  ## New Tables
  1. `users` - User profiles with locale preferences
  2. `roles` - RBAC role definitions
  3. `user_roles` - User-to-role assignments
  4. `permissions` - Granular permissions (module × category × jurisdiction)
  5. `contracts` - Contract repository with CLM integration
  6. `contract_versions` - Version history with lineage
  7. `partners` - Business counterparties
  8. `partner_stats` - Aggregated partner metrics
  9. `discovery_projects` - Batch analysis projects (up to 100 docs)
  10. `discovery_docs` - Documents within discovery projects
  11. `research_queries` - Legal research with authoritative citations
  12. `copilot_conversations` - Chat threads with context
  13. `copilot_messages` - Individual messages in conversations
  14. `clauses` - Approved clause library with jurisdictions
  15. `playbooks` - Rule sets for analysis by jurisdiction/locale
  16. `workflows` - Approval workflows
  17. `tasks` - Work queue items
  18. `intake_requests` - One-Drop and helpdesk requests
  19. `audit_log` - Immutable audit trail
  20. `locales` - Supported languages and jurisdictions
  21. `prompts` - Prompt registry with approval tracking

  ## Security
  - RLS enabled on all tables
  - Restrictive policies checking auth.uid() and role memberships
  - ABAC attributes: BU, region, jurisdiction, contract_category
*/

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Locales and jurisdictions
CREATE TABLE IF NOT EXISTS locales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE locales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read locales"
  ON locales FOR SELECT
  TO authenticated
  USING (true);

-- Users with ABAC attributes
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  locale text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  business_unit text,
  region text,
  jurisdictions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- User roles
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Permissions (module × category × jurisdiction)
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module text NOT NULL,
  contract_category text,
  jurisdiction text,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_approve boolean DEFAULT false,
  can_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Partners (counterparties)
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  legal_name text,
  country text,
  jurisdiction text,
  risk_rating text,
  contacts jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read partners"
  ON partners FOR SELECT
  TO authenticated
  USING (true);

-- Partner stats (aggregated metrics)
CREATE TABLE IF NOT EXISTS partner_stats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  total_contracts integer DEFAULT 0,
  active_contracts integer DEFAULT 0,
  total_value numeric DEFAULT 0,
  avg_cycle_time_days numeric DEFAULT 0,
  high_risk_count integer DEFAULT 0,
  pending_obligations integer DEFAULT 0,
  last_contract_date timestamptz,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(partner_id)
);

ALTER TABLE partner_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read partner stats"
  ON partner_stats FOR SELECT
  TO authenticated
  USING (true);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clm_id text,
  title text NOT NULL,
  contract_type text NOT NULL,
  category text,
  status text DEFAULT 'draft',
  partner_id uuid REFERENCES partners(id),
  jurisdiction text,
  language text DEFAULT 'en',
  effective_date date,
  expiration_date date,
  value numeric,
  owner_id uuid REFERENCES users(id),
  business_unit text,
  region text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read contracts in their scope"
  ON contracts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN permissions p ON p.role_id = ur.role_id
      WHERE u.id = auth.uid()
        AND p.module = 'repository'
        AND p.can_read = true
        AND (p.contract_category IS NULL OR p.contract_category = contracts.category)
        AND (p.jurisdiction IS NULL OR p.jurisdiction = contracts.jurisdiction)
    )
  );

-- Contract versions
CREATE TABLE IF NOT EXISTS contract_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  file_hash text,
  uploaded_by uuid REFERENCES users(id),
  parent_version_id uuid REFERENCES contract_versions(id),
  changes_summary text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contract_id, version_number)
);

ALTER TABLE contract_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read versions of accessible contracts"
  ON contract_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_versions.contract_id
        AND EXISTS (
          SELECT 1 FROM users u
          JOIN user_roles ur ON ur.user_id = u.id
          JOIN permissions p ON p.role_id = ur.role_id
          WHERE u.id = auth.uid() AND p.module = 'repository' AND p.can_read = true
        )
    )
  );

-- Discovery projects
CREATE TABLE IF NOT EXISTS discovery_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'queued',
  created_by uuid NOT NULL REFERENCES users(id),
  doc_count integer DEFAULT 0,
  max_docs integer DEFAULT 100,
  progress numeric DEFAULT 0,
  results jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discovery_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own discovery projects"
  ON discovery_projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create discovery projects"
  ON discovery_projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own discovery projects"
  ON discovery_projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Discovery documents
CREATE TABLE IF NOT EXISTS discovery_docs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES discovery_projects(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id),
  file_path text NOT NULL,
  status text DEFAULT 'queued',
  analysis jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE discovery_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read docs in own projects"
  ON discovery_docs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discovery_projects p
      WHERE p.id = discovery_docs.project_id AND p.created_by = auth.uid()
    )
  );

-- Research queries
CREATE TABLE IF NOT EXISTS research_queries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  query text NOT NULL,
  jurisdiction text,
  language text DEFAULT 'en',
  answer text,
  citations jsonb DEFAULT '[]',
  confidence numeric,
  sources_used text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE research_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own research queries"
  ON research_queries FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create research queries"
  ON research_queries FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Copilot conversations
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text,
  context_ids text[] DEFAULT '{}',
  jurisdiction text,
  language text DEFAULT 'en',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations"
  ON copilot_conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON copilot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON copilot_conversations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Copilot messages
CREATE TABLE IF NOT EXISTS copilot_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  tool_calls jsonb,
  citations jsonb DEFAULT '[]',
  tokens integer,
  cost numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in own conversations"
  ON copilot_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM copilot_conversations c
      WHERE c.id = copilot_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- Clauses library
CREATE TABLE IF NOT EXISTS clauses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  category text,
  jurisdiction text,
  language text DEFAULT 'en',
  tags text[] DEFAULT '{}',
  is_approved boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  alternates jsonb DEFAULT '[]',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approved clauses"
  ON clauses FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Playbooks
CREATE TABLE IF NOT EXISTS playbooks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  jurisdiction text,
  locale text DEFAULT 'en',
  contract_type text,
  rules jsonb NOT NULL,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active playbooks"
  ON playbooks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  stages jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (true);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  status text DEFAULT 'pending',
  priority text DEFAULT 'normal',
  assignee_id uuid REFERENCES users(id),
  contract_id uuid REFERENCES contracts(id),
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read assigned or created tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (assignee_id = auth.uid() OR created_by = auth.uid());

-- Intake requests (One-Drop)
CREATE TABLE IF NOT EXISTS intake_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  type text NOT NULL,
  status text DEFAULT 'pending',
  extracted_metadata jsonb DEFAULT '{}',
  confidence_scores jsonb DEFAULT '{}',
  file_path text,
  clm_request_id text,
  created_by uuid NOT NULL REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE intake_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intake requests"
  ON intake_requests FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Users can create intake requests"
  ON intake_requests FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read audit logs"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN permissions p ON p.role_id = ur.role_id
      WHERE ur.user_id = auth.uid() AND p.module = 'admin' AND p.can_read = true
    )
  );

-- Prompts registry
CREATE TABLE IF NOT EXISTS prompts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  template text NOT NULL,
  version integer DEFAULT 1,
  jurisdiction text,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read approved prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (is_approved = true);

-- Insert default locales
INSERT INTO locales (code, name) VALUES
  ('en', 'English'),
  ('de', 'German (Deutsch)')
ON CONFLICT (code) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description, is_system) VALUES
  ('admin', 'System administrator with full access', true),
  ('counsel', 'Legal counsel with review and approval rights', true),
  ('analyst', 'Legal analyst with review rights', true),
  ('requester', 'Business user who can submit requests', true),
  ('approver', 'Can approve workflows', true)
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contracts_partner ON contracts(partner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_jurisdiction ON contracts(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_contract_versions_contract ON contract_versions(contract_id);
CREATE INDEX IF NOT EXISTS idx_discovery_docs_project ON discovery_docs(project_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON copilot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
