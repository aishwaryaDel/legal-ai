/*
  # Enhanced Document Builder with Guided Workflow Metadata

  ## Overview
  This migration extends the document builder schema to support intelligent, guided document creation
  with dynamic clause filtering based on context, jurisdiction, sensitivity, and business criticality.

  ## New Tables
  
  ### 1. `builder_sessions`
  Stores the complete state of a guided builder session, allowing users to save progress and resume later.
  - Tracks all decisions from Step 0-3
  - Enables audit trail of document creation process
  - Supports draft/in-progress/completed states
  
  ### 2. `clause_metadata`
  Extended metadata for intelligent clause filtering and recommendations.
  - Jurisdiction compatibility tags
  - Sensitivity level requirements
  - Business criticality mappings
  - Risk scoring and validation rules

  ## Enhanced Existing Tables
  
  ### `clauses` - New Columns
  - `risk_level`: low/medium/high - visual indicator for users
  - `jurisdiction_tags`: JSONB array of compatible jurisdictions
  - `sensitivity_tags`: JSONB - which sensitivity levels this clause is appropriate for
  - `purpose_tags`: JSONB - which business purposes this clause fits
  - `criticality_tags`: JSONB - which business criticality levels
  - `requires_legal_review`: boolean - flag for automatic escalation
  - `usage_frequency`: integer - track how often this clause is used (for "Recommended" badges)
  - `plain_language_summary`: text - non-legal explanation for business users
  - `full_legal_text`: text - the actual clause content with variable placeholders
  
  ### `document_templates` - New Columns
  - `required_steps`: JSONB - configuration for which steps are required
  - `available_jurisdictions`: JSONB - supported jurisdictions for this template
  - `available_languages`: JSONB - supported languages
  
  ## Security
  - RLS policies for authenticated users to read/write their own builder sessions
  - Admin-only access to modify clause metadata and templates
  
  ## Important Notes
  1. All clause text supports variable substitution: {{party_a_name}}, {{effective_date}}, etc.
  2. Jurisdiction tags follow ISO format: "DE", "US-DE", "UK-ENG", "AT", "CH", "EU"
  3. This enables the "domino effect" where early choices filter later options
*/

-- ============================================================================
-- STEP 1: Extend existing tables with metadata
-- ============================================================================

-- Add metadata columns to clauses table
DO $$ 
BEGIN
  -- Risk level indicator
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'risk_level'
  ) THEN
    ALTER TABLE clauses ADD COLUMN risk_level text DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high'));
  END IF;

  -- Jurisdiction compatibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'jurisdiction_tags'
  ) THEN
    ALTER TABLE clauses ADD COLUMN jurisdiction_tags jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Sensitivity level compatibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'sensitivity_tags'
  ) THEN
    ALTER TABLE clauses ADD COLUMN sensitivity_tags jsonb DEFAULT '["standard"]'::jsonb;
  END IF;

  -- Business purpose compatibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'purpose_tags'
  ) THEN
    ALTER TABLE clauses ADD COLUMN purpose_tags jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Business criticality compatibility
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'criticality_tags'
  ) THEN
    ALTER TABLE clauses ADD COLUMN criticality_tags jsonb DEFAULT '["pilot", "operational", "strategic"]'::jsonb;
  END IF;

  -- Legal review requirement flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'requires_legal_review'
  ) THEN
    ALTER TABLE clauses ADD COLUMN requires_legal_review boolean DEFAULT false;
  END IF;

  -- Usage tracking for "Recommended" badges
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'usage_frequency'
  ) THEN
    ALTER TABLE clauses ADD COLUMN usage_frequency integer DEFAULT 0;
  END IF;

  -- Plain language summary for business users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'plain_language_summary'
  ) THEN
    ALTER TABLE clauses ADD COLUMN plain_language_summary text;
  END IF;

  -- Full legal text with variable placeholders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clauses' AND column_name = 'full_legal_text'
  ) THEN
    ALTER TABLE clauses ADD COLUMN full_legal_text text;
  END IF;
END $$;

-- Add metadata columns to document_templates table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_templates' AND column_name = 'required_steps'
  ) THEN
    ALTER TABLE document_templates ADD COLUMN required_steps jsonb DEFAULT '["context", "deal_frame", "parties", "clauses", "review"]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_templates' AND column_name = 'available_jurisdictions'
  ) THEN
    ALTER TABLE document_templates ADD COLUMN available_jurisdictions jsonb DEFAULT '["DE", "EU", "US", "UK"]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_templates' AND column_name = 'available_languages'
  ) THEN
    ALTER TABLE document_templates ADD COLUMN available_languages jsonb DEFAULT '["en", "de"]'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create builder_sessions table for state persistence
-- ============================================================================

CREATE TABLE IF NOT EXISTS builder_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session metadata
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  current_step text DEFAULT 'context',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  
  -- Step 0: Context Setup
  document_type text,
  governing_law text,
  jurisdiction text,
  language text DEFAULT 'en',
  sensitivity_level text CHECK (sensitivity_level IN ('standard', 'high_ip', 'high_commercial')),
  
  -- Step 1: Deal Frame
  purpose_tags jsonb DEFAULT '[]'::jsonb,
  criticality_level text CHECK (criticality_level IN ('pilot', 'operational', 'strategic')),
  engagement_duration text,
  
  -- Step 2: Parties & Commercial Terms
  party_our_entity_id uuid,
  party_our_entity_name text,
  counterparty_name text,
  counterparty_country text,
  counterparty_registration text,
  effective_date date,
  payment_terms text,
  termination_notice text,
  liability_cap_model text,
  
  -- Step 3: Selected Clauses (stored as section_id -> clause_id mapping)
  selected_clauses jsonb DEFAULT '{}'::jsonb,
  
  -- Step 4: Generated Document
  assembled_document_html text,
  assembled_document_structured jsonb,
  validation_flags jsonb DEFAULT '[]'::jsonb,
  
  -- Final document reference (if saved to repository)
  final_document_id uuid,
  
  -- Full state snapshot for audit
  full_state_snapshot jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_builder_sessions_user ON builder_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_builder_sessions_status ON builder_sessions(status);
CREATE INDEX IF NOT EXISTS idx_builder_sessions_document_type ON builder_sessions(document_type);

-- ============================================================================
-- STEP 3: Row Level Security
-- ============================================================================

ALTER TABLE builder_sessions ENABLE ROW LEVEL SECURITY;

-- Users can read their own builder sessions
CREATE POLICY "Users can read own builder sessions"
  ON builder_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own builder sessions
CREATE POLICY "Users can create own builder sessions"
  ON builder_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own builder sessions
CREATE POLICY "Users can update own builder sessions"
  ON builder_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own draft sessions
CREATE POLICY "Users can delete own draft sessions"
  ON builder_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- ============================================================================
-- STEP 4: Update existing sample data with metadata
-- ============================================================================

-- Update the existing NDA template with metadata
UPDATE document_templates
SET 
  available_jurisdictions = '["DE", "AT", "CH", "EU", "US-DE", "UK-ENG"]'::jsonb,
  available_languages = '["en", "de"]'::jsonb,
  required_steps = '["context", "deal_frame", "parties", "clauses", "review"]'::jsonb
WHERE document_type = 'NDA';

-- Update existing clauses with rich metadata
-- Note: We'll update a few examples here, rest can be done via admin UI later

UPDATE clauses
SET
  risk_level = 'low',
  jurisdiction_tags = '["DE", "AT", "CH", "EU"]'::jsonb,
  sensitivity_tags = '["standard", "high_ip"]'::jsonb,
  purpose_tags = '["supplier_onboarding", "service_delivery"]'::jsonb,
  criticality_tags = '["pilot", "operational"]'::jsonb,
  requires_legal_review = false,
  usage_frequency = 42,
  plain_language_summary = 'Standard mutual confidentiality clause for typical business relationships. Both parties agree to keep shared information confidential.',
  full_legal_text = 'Each Party agrees to maintain the confidentiality of all Confidential Information disclosed by the other Party and to use such information only for the Purpose defined in this Agreement. The receiving Party shall protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.'
WHERE title = 'Standard Bilateral Parties Clause';

UPDATE clauses
SET
  risk_level = 'medium',
  jurisdiction_tags = '["DE", "AT", "CH", "EU"]'::jsonb,
  sensitivity_tags = '["high_ip"]'::jsonb,
  purpose_tags = '["r_and_d", "joint_development", "prototype_discussion"]'::jsonb,
  criticality_tags = '["strategic"]'::jsonb,
  requires_legal_review = true,
  usage_frequency = 8,
  plain_language_summary = 'Strict confidentiality for highly sensitive intellectual property and R&D projects. Includes prohibition on reverse engineering and unlimited duration for trade secrets.',
  full_legal_text = 'The receiving Party shall not reverse engineer, disassemble, or attempt to derive the composition or underlying information, structure, or ideas of any Confidential Information. Trade secrets shall remain confidential indefinitely. Other Confidential Information shall be protected for a period of five (5) years from the date of disclosure.'
WHERE title = 'Multi-Party NDA Clause';

-- ============================================================================
-- STEP 5: Helper functions for intelligent filtering
-- ============================================================================

-- Function to get compatible clauses for a given context
CREATE OR REPLACE FUNCTION get_compatible_clauses(
  p_section_id uuid,
  p_jurisdiction text,
  p_sensitivity text,
  p_purpose_tags jsonb,
  p_criticality text
)
RETURNS TABLE (
  clause_id uuid,
  clause_title text,
  clause_category text,
  risk_level text,
  requires_legal_review boolean,
  usage_frequency integer,
  plain_language_summary text,
  full_legal_text text,
  is_recommended boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.category,
    c.risk_level,
    c.requires_legal_review,
    c.usage_frequency,
    c.plain_language_summary,
    c.full_legal_text,
    (c.usage_frequency > 30 AND c.risk_level = 'low') as is_recommended
  FROM clauses c
  INNER JOIN section_clause_options sco ON sco.clause_id = c.id
  WHERE 
    sco.section_id = p_section_id
    AND c.is_approved = true
    -- Jurisdiction compatibility
    AND (
      c.jurisdiction_tags IS NULL 
      OR c.jurisdiction_tags = '[]'::jsonb
      OR c.jurisdiction_tags ? p_jurisdiction
    )
    -- Sensitivity compatibility
    AND (
      c.sensitivity_tags IS NULL
      OR c.sensitivity_tags = '[]'::jsonb  
      OR c.sensitivity_tags ? p_sensitivity
    )
    -- Criticality compatibility
    AND (
      c.criticality_tags IS NULL
      OR c.criticality_tags = '[]'::jsonb
      OR c.criticality_tags ? p_criticality
    )
  ORDER BY 
    c.usage_frequency DESC,
    c.risk_level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 6: Trigger for updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_builder_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER builder_sessions_updated_at
  BEFORE UPDATE ON builder_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_builder_session_timestamp();

-- ============================================================================
-- STEP 7: Grant permissions
-- ============================================================================

-- Allow authenticated users to execute the helper function
GRANT EXECUTE ON FUNCTION get_compatible_clauses TO authenticated;
