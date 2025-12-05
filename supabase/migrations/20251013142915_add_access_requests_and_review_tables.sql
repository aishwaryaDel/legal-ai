/*
  # Add Access Requests and Review Enhancement Tables

  ## Overview
  Extends the schema with:
  - Access requests from Auth page
  - Review issues and analysis results
  - Clause alternates and fallback chains
  - Playbook test results

  ## New Tables
  1. `access_requests` - User access requests from auth page
  2. `review_sessions` - Document review sessions
  3. `review_issues` - Issues found during review with severity
  4. `clause_alternates` - Clause alternate versions and fallback chains
  5. `playbook_tests` - Test bench results for playbooks

  ## Security
  - RLS enabled on all tables
  - Restrictive policies based on user roles
*/

-- Access requests
CREATE TABLE IF NOT EXISTS access_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text NOT NULL,
  department text NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read access requests"
  ON access_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN permissions p ON p.role_id = ur.role_id
      WHERE ur.user_id = auth.uid() AND p.module = 'admin' AND p.can_read = true
    )
  );

CREATE POLICY "Anyone can create access requests"
  ON access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Review sessions
CREATE TABLE IF NOT EXISTS review_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  version_id uuid REFERENCES contract_versions(id),
  playbook_id uuid REFERENCES playbooks(id),
  user_id uuid NOT NULL REFERENCES users(id),
  status text DEFAULT 'in_progress',
  analysis_results jsonb DEFAULT '{}',
  diff_summary jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE review_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own review sessions"
  ON review_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create review sessions"
  ON review_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own review sessions"
  ON review_sessions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Review issues
CREATE TABLE IF NOT EXISTS review_issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
  clause_type text NOT NULL,
  severity text NOT NULL,
  title text NOT NULL,
  description text,
  recommendation text,
  citations text[] DEFAULT '{}',
  status text DEFAULT 'open',
  position_start integer,
  position_end integer,
  resolved_by uuid REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read issues in own sessions"
  ON review_issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM review_sessions rs
      WHERE rs.id = review_issues.session_id AND rs.user_id = auth.uid()
    )
  );

-- Clause alternates
CREATE TABLE IF NOT EXISTS clause_alternates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clause_id uuid NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  jurisdiction text,
  language text DEFAULT 'en',
  priority integer DEFAULT 1,
  fallback_to uuid REFERENCES clause_alternates(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clause_alternates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clause alternates"
  ON clause_alternates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clauses c
      WHERE c.id = clause_alternates.clause_id AND c.is_approved = true
    )
  );

-- Playbook tests
CREATE TABLE IF NOT EXISTS playbook_tests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id uuid NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES contracts(id),
  test_file_path text,
  findings jsonb NOT NULL,
  passed boolean DEFAULT true,
  executed_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE playbook_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own playbook tests"
  ON playbook_tests FOR SELECT
  TO authenticated
  USING (executed_by = auth.uid());

CREATE POLICY "Users can create playbook tests"
  ON playbook_tests FOR INSERT
  TO authenticated
  WITH CHECK (executed_by = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_review_sessions_contract ON review_sessions(contract_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_user ON review_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_review_issues_session ON review_issues(session_id);
CREATE INDEX IF NOT EXISTS idx_review_issues_severity ON review_issues(severity);
CREATE INDEX IF NOT EXISTS idx_clause_alternates_clause ON clause_alternates(clause_id);
CREATE INDEX IF NOT EXISTS idx_playbook_tests_playbook ON playbook_tests(playbook_id);
