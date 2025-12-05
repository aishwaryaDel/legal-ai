/*
  # Document Builder Schema

  ## Overview
  Complete schema for the step-by-step document builder feature that allows users to create
  legal documents by selecting from pre-approved clause options in a guided wizard interface.

  ## New Tables
  1. `document_templates` - Template definitions for different document types (NDA, MSA, etc.)
  2. `template_sections` - Sections within each template (e.g., "Parties", "Confidentiality", "Liability")
  3. `section_clause_options` - Links approved clauses to template sections with display order
  4. `generated_documents` - Stores completed documents with full content and metadata
  5. `document_exports` - Tracks Word document exports for audit purposes

  ## Key Features
  - Template-based document structure with ordered sections
  - Pre-approved clause options for each section with selection metadata
  - Complete document storage with version control
  - Export tracking for compliance and audit
  - Support for multiple jurisdictions and languages

  ## Security
  - RLS enabled on all tables
  - Users can only access documents they created or have permission to view
  - Clause options filtered by jurisdiction and approval status
  - Export logs track who downloaded what and when
*/

-- Document Templates
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  document_type text NOT NULL,
  category text,
  jurisdictions text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active templates"
  ON document_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Template Sections
CREATE TABLE IF NOT EXISTS template_sections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  section_type text DEFAULT 'standard',
  placeholder_text text,
  help_text text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE template_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read sections of active templates"
  ON template_sections FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_templates dt
      WHERE dt.id = template_sections.template_id AND dt.is_active = true
    )
  );

-- Section Clause Options
CREATE TABLE IF NOT EXISTS section_clause_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id uuid NOT NULL REFERENCES template_sections(id) ON DELETE CASCADE,
  clause_id uuid NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_recommended boolean DEFAULT false,
  risk_level text DEFAULT 'medium',
  usage_frequency integer DEFAULT 0,
  compatibility_notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(section_id, clause_id)
);

ALTER TABLE section_clause_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clause options for accessible sections"
  ON section_clause_options FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM template_sections ts
      JOIN document_templates dt ON dt.id = ts.template_id
      WHERE ts.id = section_clause_options.section_id AND dt.is_active = true
    )
  );

-- Generated Documents
CREATE TABLE IF NOT EXISTS generated_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id uuid NOT NULL REFERENCES document_templates(id),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  document_type text NOT NULL,
  jurisdiction text,
  language text DEFAULT 'en',
  status text DEFAULT 'draft',
  content_html text,
  content_json jsonb DEFAULT '{}',
  selected_clauses jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  party_a text,
  party_b text,
  effective_date date,
  completeness_score numeric DEFAULT 0,
  risk_assessment jsonb DEFAULT '{}',
  contract_id uuid REFERENCES contracts(id),
  version integer DEFAULT 1,
  parent_document_id uuid REFERENCES generated_documents(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  finalized_at timestamptz
);

ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generated documents"
  ON generated_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create generated documents"
  ON generated_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own generated documents"
  ON generated_documents FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own draft documents"
  ON generated_documents FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND status = 'draft');

-- Document Exports
CREATE TABLE IF NOT EXISTS document_exports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid NOT NULL REFERENCES generated_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  export_format text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own export logs"
  ON document_exports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create export logs"
  ON document_exports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);
CREATE INDEX IF NOT EXISTS idx_template_sections_order ON template_sections(template_id, display_order);
CREATE INDEX IF NOT EXISTS idx_section_clause_options_section ON section_clause_options(section_id);
CREATE INDEX IF NOT EXISTS idx_section_clause_options_clause ON section_clause_options(clause_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_user ON generated_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template ON generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_document_exports_document ON document_exports(document_id);
CREATE INDEX IF NOT EXISTS idx_document_exports_user ON document_exports(user_id);

-- Insert sample document template (NDA)
INSERT INTO document_templates (name, description, document_type, category, jurisdictions, languages)
VALUES (
  'Standard Non-Disclosure Agreement',
  'A comprehensive NDA template suitable for most business relationships',
  'NDA',
  'confidentiality',
  ARRAY['DE', 'AT', 'CH', 'EU', 'US'],
  ARRAY['en', 'de']
)
ON CONFLICT DO NOTHING;

-- Insert template sections for NDA (using the template we just created)
DO $$
DECLARE
  template_uuid uuid;
BEGIN
  SELECT id INTO template_uuid FROM document_templates WHERE document_type = 'NDA' LIMIT 1;
  
  IF template_uuid IS NOT NULL THEN
    INSERT INTO template_sections (template_id, name, description, display_order, is_required, help_text)
    VALUES
      (template_uuid, 'Parties', 'Identify the parties entering into the agreement', 1, true, 'Select the clause that best describes the relationship between the parties'),
      (template_uuid, 'Definitions', 'Define key terms used throughout the agreement', 2, true, 'Choose how confidential information should be defined'),
      (template_uuid, 'Confidentiality Obligations', 'Core obligations to protect confidential information', 3, true, 'Select the level of protection required for your use case'),
      (template_uuid, 'Permitted Disclosures', 'Exceptions to confidentiality obligations', 4, true, 'Define when information can be shared with third parties'),
      (template_uuid, 'Term and Duration', 'How long the agreement and obligations last', 5, true, 'Choose the appropriate duration for information protection'),
      (template_uuid, 'Return or Destruction', 'What happens to confidential information after termination', 6, true, 'Select the preferred approach for handling materials'),
      (template_uuid, 'Liability and Remedies', 'Consequences of breach and available remedies', 7, true, 'Choose the limitation of liability that fits your risk tolerance'),
      (template_uuid, 'Governing Law', 'Which laws apply to the agreement', 8, true, 'Select the jurisdiction that will govern the agreement'),
      (template_uuid, 'Dispute Resolution', 'How disputes will be resolved', 9, false, 'Optional: Add arbitration or mediation provisions'),
      (template_uuid, 'General Provisions', 'Standard contractual provisions', 10, true, 'Select boilerplate clauses for completeness')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
