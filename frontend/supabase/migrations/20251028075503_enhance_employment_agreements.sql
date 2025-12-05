/*
  # Enhance Employment Agreement Support

  ## Overview
  This migration adapts the system to properly handle Employment Agreements where the counterparty
  is an individual person (employee) rather than a company. It also implements proper German
  employment law requirements including probation periods (Probezeit) and differentiated notice periods.

  ## Key Changes

  ### 1. Database Schema Updates
  - Extend `builder_sessions` to support employment-specific fields
  - Add employment fields: employee name, position, probation period, notice periods
  - Extend `generated_documents` to handle both company and individual counterparties
  - Add proper differentiation between B2B contracts and employment contracts

  ### 2. Employment-Specific Fields
  - **Probation Period**: Duration of probationary period (Probezeit) with jurisdiction-specific defaults
  - **Notice Period During Probation**: Typically 2 weeks in Germany
  - **Notice Period After Probation**: Typically 3+ months in Germany, may scale with tenure
  - **Employment Type**: Full-time, part-time, fixed-term, etc.
  - **Employee Name**: Individual person's name (replaces company counterparty)
  - **Position/Title**: Job title and role

  ### 3. Jurisdiction-Specific Defaults
  - Germany (DE): 6 months probation, 2 weeks notice during, 3 months after
  - Austria (AT): 1 month probation, 1 week notice during, 1 month after
  - Switzerland (CH): 1-3 months probation, 7 days notice during, 1-3 months after
  - US: At-will employment, no mandatory probation or notice periods

  ## Security
  - All tables maintain existing RLS policies
  - Users can only access their own builder sessions and documents
*/

-- ============================================================================
-- STEP 1: Extend builder_sessions for employment-specific fields
-- ============================================================================

DO $$
BEGIN
  -- Add employment-specific fields to builder_sessions if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'employee_name'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN employee_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'employee_position'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN employee_position text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'employee_department'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN employee_department text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'employment_start_date'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN employment_start_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN employment_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'probation_period_months'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN probation_period_months integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'notice_period_during_probation'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN notice_period_during_probation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'notice_period_after_probation'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN notice_period_after_probation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'builder_sessions' AND column_name = 'counterparty_type'
  ) THEN
    ALTER TABLE builder_sessions ADD COLUMN counterparty_type text DEFAULT 'company' CHECK (counterparty_type IN ('company', 'individual'));
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Extend generated_documents for employment-specific fields
-- ============================================================================

DO $$
BEGIN
  -- Add employment-specific fields to generated_documents if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'employee_name'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN employee_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'employee_position'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN employee_position text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'employee_department'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN employee_department text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'employment_type'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN employment_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'probation_period_months'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN probation_period_months integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'notice_period_during_probation'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN notice_period_during_probation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'notice_period_after_probation'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN notice_period_after_probation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'counterparty_type'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN counterparty_type text DEFAULT 'company' CHECK (counterparty_type IN ('company', 'individual'));
  END IF;

  -- Rename effective_date to employment_start_date for clarity in employment contexts
  -- Note: We keep effective_date for backward compatibility and use it for both
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_documents' AND column_name = 'employment_start_date'
  ) THEN
    ALTER TABLE generated_documents ADD COLUMN employment_start_date date;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create employment configuration reference table
-- ============================================================================

CREATE TABLE IF NOT EXISTS employment_jurisdiction_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL UNIQUE,
  default_probation_months integer NOT NULL,
  notice_during_probation_days integer NOT NULL,
  notice_after_probation_months numeric NOT NULL,
  description text,
  legal_reference text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employment_jurisdiction_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can read employment defaults"
  ON employment_jurisdiction_defaults FOR SELECT
  TO authenticated
  USING (true);

-- Insert jurisdiction-specific employment defaults
INSERT INTO employment_jurisdiction_defaults (
  jurisdiction,
  default_probation_months,
  notice_during_probation_days,
  notice_after_probation_months,
  description,
  legal_reference
) VALUES
  (
    'DE',
    6,
    14,
    3,
    'Germany: 6 months probation (Probezeit), 2 weeks notice during, 3 months after (BGB §622)',
    'BGB §622 - German Civil Code'
  ),
  (
    'AT',
    1,
    7,
    1,
    'Austria: 1 month probation, 1 week notice during, 1 month after',
    'Austrian Employment Law'
  ),
  (
    'CH',
    3,
    7,
    2,
    'Switzerland: Typically 3 months probation, 7 days notice during, 2 months after',
    'Swiss Code of Obligations (OR) Art. 335b'
  ),
  (
    'EU',
    3,
    14,
    2,
    'EU General: 3 months probation, 2 weeks notice during, 2 months after',
    'EU Employment Directives'
  ),
  (
    'US-DE',
    0,
    0,
    0,
    'US Delaware: At-will employment, no mandatory probation or notice periods',
    'Delaware At-Will Employment Doctrine'
  ),
  (
    'UK-ENG',
    6,
    7,
    1,
    'UK England & Wales: 6 months probation common, 1 week minimum statutory notice',
    'Employment Rights Act 1996'
  )
ON CONFLICT (jurisdiction) DO NOTHING;

-- ============================================================================
-- STEP 4: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_builder_sessions_counterparty_type ON builder_sessions(counterparty_type);
CREATE INDEX IF NOT EXISTS idx_builder_sessions_employment_start ON builder_sessions(employment_start_date);
CREATE INDEX IF NOT EXISTS idx_generated_documents_counterparty_type ON generated_documents(counterparty_type);
CREATE INDEX IF NOT EXISTS idx_generated_documents_employment_start ON generated_documents(employment_start_date);

-- ============================================================================
-- STEP 5: Add helpful comments
-- ============================================================================

COMMENT ON COLUMN builder_sessions.counterparty_type IS 'Type of counterparty: company (from Partner 360) or individual (employee)';
COMMENT ON COLUMN builder_sessions.employee_name IS 'Full name of employee (used when counterparty_type = individual)';
COMMENT ON COLUMN builder_sessions.probation_period_months IS 'Duration of probation period (Probezeit) in months';
COMMENT ON COLUMN builder_sessions.notice_period_during_probation IS 'Notice period applicable during probation (e.g., "2_weeks")';
COMMENT ON COLUMN builder_sessions.notice_period_after_probation IS 'Notice period applicable after probation ends (e.g., "3_months")';

COMMENT ON COLUMN generated_documents.counterparty_type IS 'Type of counterparty: company (from Partner 360) or individual (employee)';
COMMENT ON COLUMN generated_documents.employee_name IS 'Full name of employee (used when counterparty_type = individual)';
COMMENT ON COLUMN generated_documents.employment_start_date IS 'Employment commencement date (for employment contracts)';
COMMENT ON COLUMN generated_documents.effective_date IS 'Agreement effective date (for B2B contracts) or employment start date';

COMMENT ON TABLE employment_jurisdiction_defaults IS 'Reference table with jurisdiction-specific employment law defaults for probation and notice periods';
