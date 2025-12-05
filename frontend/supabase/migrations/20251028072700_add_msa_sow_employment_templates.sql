/*
  # Add MSA, SOW, and Employment Agreement Templates

  ## Overview
  This migration adds the missing document templates and their building blocks (sections) for:
  - Master Service Agreement (MSA)
  - Statement of Work (SOW)
  - Employment Agreement

  ## New Templates
  
  ### 1. Master Service Agreement (MSA)
  Framework agreements for ongoing business relationships with suppliers and partners.
  **Sections (10):**
  1. Parties and Recitals
  2. Scope of Services
  3. Service Levels and Performance Standards
  4. Pricing and Payment Terms
  5. Intellectual Property Rights
  6. Confidentiality
  7. Liability and Indemnification
  8. Term and Termination
  9. Governing Law and Dispute Resolution
  10. General Provisions

  ### 2. Statement of Work (SOW)
  Project-specific scope and deliverables definition, typically under an MSA.
  **Sections (9):**
  1. Project Overview and Objectives
  2. Scope of Work and Deliverables
  3. Project Timeline and Milestones
  4. Resource Requirements and Responsibilities
  5. Acceptance Criteria and Testing
  6. Project Fees and Payment Schedule
  7. Change Management Process
  8. Risks and Dependencies
  9. Project Governance and Reporting

  ### 3. Employment Agreement
  Comprehensive employment contracts for hiring employees.
  **Sections (12):**
  1. Position and Reporting Structure
  2. Employment Terms and Duration
  3. Compensation and Benefits
  4. Work Location and Schedule
  5. Duties and Responsibilities
  6. Performance Expectations
  7. Confidentiality and Non-Disclosure
  8. Intellectual Property Assignment
  9. Non-Competition and Non-Solicitation
  10. Termination and Severance
  11. Data Protection and Privacy
  12. General Employment Terms

  ## Key Features
  - All templates support multiple jurisdictions (DE, AT, CH, EU, US, UK)
  - Bilingual support (English and German)
  - Context-aware section requirements
  - Integration with existing clause filtering system

  ## Security
  - All templates follow existing RLS policies
  - Only authenticated users can access active templates
*/

-- ============================================================================
-- STEP 1: Create MSA Template
-- ============================================================================

INSERT INTO document_templates (name, description, document_type, category, jurisdictions, languages, is_active, available_jurisdictions, available_languages)
VALUES (
  'Standard Master Service Agreement',
  'Comprehensive framework agreement for ongoing service relationships with suppliers and partners',
  'MSA',
  'commercial',
  ARRAY['DE', 'AT', 'CH', 'EU', 'US-DE', 'UK-ENG'],
  ARRAY['en', 'de'],
  true,
  '["DE", "AT", "CH", "EU", "US-DE", "UK-ENG"]'::jsonb,
  '["en", "de"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert MSA sections
DO $$
DECLARE
  msa_template_uuid uuid;
BEGIN
  SELECT id INTO msa_template_uuid FROM document_templates WHERE document_type = 'MSA' LIMIT 1;
  
  IF msa_template_uuid IS NOT NULL THEN
    INSERT INTO template_sections (template_id, name, description, display_order, is_required, help_text)
    VALUES
      (msa_template_uuid, 'Parties and Recitals', 'Identify the contracting parties and background context', 1, true, 'Select the clause that properly identifies both parties and sets the context for the agreement'),
      (msa_template_uuid, 'Scope of Services', 'Define the general scope of services to be provided', 2, true, 'Choose how broadly or specifically you want to define the services'),
      (msa_template_uuid, 'Service Levels and Performance Standards', 'Set quality expectations and service level commitments', 3, true, 'Select appropriate SLA requirements for your business criticality'),
      (msa_template_uuid, 'Pricing and Payment Terms', 'Define pricing model and payment conditions', 4, true, 'Choose payment terms that align with your commercial model'),
      (msa_template_uuid, 'Intellectual Property Rights', 'Clarify IP ownership for work product and pre-existing IP', 5, true, 'Critical for determining who owns deliverables and innovations'),
      (msa_template_uuid, 'Confidentiality', 'Protect confidential business information', 6, true, 'Select confidentiality provisions appropriate for your sensitivity level'),
      (msa_template_uuid, 'Liability and Indemnification', 'Define liability limits and indemnity obligations', 7, true, 'Choose liability caps that match your risk tolerance'),
      (msa_template_uuid, 'Term and Termination', 'Set agreement duration and termination rights', 8, true, 'Define how long the relationship lasts and exit options'),
      (msa_template_uuid, 'Governing Law and Dispute Resolution', 'Select applicable law and dispute mechanisms', 9, true, 'Choose jurisdiction and arbitration or litigation approach'),
      (msa_template_uuid, 'General Provisions', 'Standard boilerplate clauses', 10, true, 'Select standard contractual provisions for completeness')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create SOW Template
-- ============================================================================

INSERT INTO document_templates (name, description, document_type, category, jurisdictions, languages, is_active, available_jurisdictions, available_languages)
VALUES (
  'Standard Statement of Work',
  'Project-specific scope definition for service delivery engagements',
  'SOW',
  'project',
  ARRAY['DE', 'AT', 'CH', 'EU', 'US-DE', 'UK-ENG'],
  ARRAY['en', 'de'],
  true,
  '["DE", "AT", "CH", "EU", "US-DE", "UK-ENG"]'::jsonb,
  '["en", "de"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert SOW sections
DO $$
DECLARE
  sow_template_uuid uuid;
BEGIN
  SELECT id INTO sow_template_uuid FROM document_templates WHERE document_type = 'SOW' LIMIT 1;
  
  IF sow_template_uuid IS NOT NULL THEN
    INSERT INTO template_sections (template_id, name, description, display_order, is_required, help_text)
    VALUES
      (sow_template_uuid, 'Project Overview and Objectives', 'Define project purpose and business objectives', 1, true, 'Clearly state what the project aims to achieve'),
      (sow_template_uuid, 'Scope of Work and Deliverables', 'Detailed description of work to be performed and outputs', 2, true, 'Be specific about what will be delivered'),
      (sow_template_uuid, 'Project Timeline and Milestones', 'Key dates, phases, and milestone checkpoints', 3, true, 'Define project schedule and critical deadlines'),
      (sow_template_uuid, 'Resource Requirements and Responsibilities', 'Team composition and party responsibilities', 4, true, 'Clarify who does what and resource commitments'),
      (sow_template_uuid, 'Acceptance Criteria and Testing', 'How deliverables will be validated and accepted', 5, true, 'Define clear acceptance criteria to avoid disputes'),
      (sow_template_uuid, 'Project Fees and Payment Schedule', 'Pricing structure tied to milestones', 6, true, 'Link payments to deliverables and milestones'),
      (sow_template_uuid, 'Change Management Process', 'How to handle scope changes and variations', 7, true, 'Essential for managing scope creep'),
      (sow_template_uuid, 'Risks and Dependencies', 'Identify key risks and external dependencies', 8, false, 'Optional: Document assumptions and risk factors'),
      (sow_template_uuid, 'Project Governance and Reporting', 'Meeting cadence and status reporting requirements', 9, true, 'Define how project will be managed and tracked')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: Create Employment Agreement Template
-- ============================================================================

INSERT INTO document_templates (name, description, document_type, category, jurisdictions, languages, is_active, available_jurisdictions, available_languages)
VALUES (
  'Standard Employment Agreement',
  'Comprehensive employment contract for hiring full-time employees',
  'Employment',
  'hr',
  ARRAY['DE', 'AT', 'CH', 'EU', 'US-DE', 'UK-ENG'],
  ARRAY['en', 'de'],
  true,
  '["DE", "AT", "CH", "EU", "US-DE", "UK-ENG"]'::jsonb,
  '["en", "de"]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Insert Employment Agreement sections
DO $$
DECLARE
  emp_template_uuid uuid;
BEGIN
  SELECT id INTO emp_template_uuid FROM document_templates WHERE document_type = 'Employment' LIMIT 1;
  
  IF emp_template_uuid IS NOT NULL THEN
    INSERT INTO template_sections (template_id, name, description, display_order, is_required, help_text)
    VALUES
      (emp_template_uuid, 'Position and Reporting Structure', 'Job title, department, and reporting relationships', 1, true, 'Define the employee''s role within the organization'),
      (emp_template_uuid, 'Employment Terms and Duration', 'Type of employment and probation period', 2, true, 'Specify whether permanent, fixed-term, and probation details'),
      (emp_template_uuid, 'Compensation and Benefits', 'Salary, bonuses, and benefits package', 3, true, 'Detail all forms of compensation and benefits'),
      (emp_template_uuid, 'Work Location and Schedule', 'Primary workplace and working hours', 4, true, 'Specify location, remote work options, and schedule'),
      (emp_template_uuid, 'Duties and Responsibilities', 'Core job responsibilities and expectations', 5, true, 'Describe what the employee will be responsible for'),
      (emp_template_uuid, 'Performance Expectations', 'Performance metrics and evaluation process', 6, true, 'Set clear performance standards and review process'),
      (emp_template_uuid, 'Confidentiality and Non-Disclosure', 'Protection of company confidential information', 7, true, 'Essential to protect trade secrets and sensitive data'),
      (emp_template_uuid, 'Intellectual Property Assignment', 'Ownership of work product and inventions', 8, true, 'Ensure company owns IP created during employment'),
      (emp_template_uuid, 'Non-Competition and Non-Solicitation', 'Post-employment restrictions', 9, false, 'Optional: Restrict competition and poaching after employment ends'),
      (emp_template_uuid, 'Termination and Severance', 'Notice periods and termination procedures', 10, true, 'Define how employment can be terminated by either party'),
      (emp_template_uuid, 'Data Protection and Privacy', 'GDPR and employee data handling', 11, true, 'Critical for EU jurisdictions - employee privacy rights'),
      (emp_template_uuid, 'General Employment Terms', 'Boilerplate and standard employment provisions', 12, true, 'Standard terms including amendments, notices, etc.')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: Create indexes for the new templates
-- ============================================================================

-- Indexes already exist from previous migration, but ensure they cover new data
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(document_type);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_template_sections_template ON template_sections(template_id);

-- ============================================================================
-- STEP 5: Verify data
-- ============================================================================

-- Count check to ensure all templates are created
DO $$
DECLARE
  template_count integer;
BEGIN
  SELECT COUNT(*) INTO template_count FROM document_templates WHERE document_type IN ('NDA', 'MSA', 'SOW', 'Employment');
  
  IF template_count < 4 THEN
    RAISE WARNING 'Expected 4 templates (NDA, MSA, SOW, Employment) but found %', template_count;
  END IF;
END $$;