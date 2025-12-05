/*
  # Add Employment Clauses - Final Fix

  ## Root Cause
    Employment template exists but has ZERO clauses linked to sections.
    Step 3 shows no options, Step 4 is empty.

  ## Solution
    Create Employment clauses for all 12 actual sections.
*/

DO $$
DECLARE
  v_template_id uuid;
  v_section_id uuid;
  v_clause_id uuid;
BEGIN
  SELECT id INTO v_template_id FROM document_templates WHERE document_type = 'Employment' AND is_active = true LIMIT 1;

  -- Position and Reporting Structure
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Position and Reporting Structure';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Standard Position Definition', 'Employee serves in designated position', 'The Employee shall hold the position of [POSITION] and shall report directly to [REPORTING_MANAGER].', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Employment Terms and Duration
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Employment Terms and Duration';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Permanent with Probation', 'Indefinite employment with probation', 'Employment commences on [START_DATE] and continues indefinitely. First [PROBATION_MONTHS] months are probationary.', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Compensation and Benefits
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Compensation and Benefits';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Base Salary', 'Annual salary with benefits', 'Employee receives EUR [AMOUNT] annually, paid in 12 monthly installments.', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
    
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Salary with Bonus', 'Base plus performance bonus', 'Base salary of EUR [BASE_AMOUNT] plus target bonus of [BONUS_PERCENTAGE]% based on performance.', 'employment', 'DE', 'en', 'medium', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 2, false);
  END IF;

  -- Work Location and Schedule
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Work Location and Schedule';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Office-Based', 'Standard office hours', 'Principal workplace is [ADDRESS]. Standard hours are [HOURS] per week, Monday-Friday [START_TIME] to [END_TIME].', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
    
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Hybrid Work', 'Mix of office and remote', 'Hybrid arrangement with up to [REMOTE_DAYS] days remote per week. Specific schedule agreed with supervisor.', 'employment', 'DE', 'en', 'medium', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 2, false);
  END IF;

  -- Duties and Responsibilities
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Duties and Responsibilities';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('General Duties', 'Core job duties', 'Employee shall diligently perform all position duties and devote full business time to the role.', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Performance Expectations
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Performance Expectations';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Performance Reviews', 'Regular evaluations', 'Regular performance evaluations per company system. Employee expected to meet or exceed established standards.', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Confidentiality and Non-Disclosure
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Confidentiality and Non-Disclosure';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Confidentiality', 'Protect company information', 'Employee shall maintain confidentiality of proprietary information and not disclose or use except as required for duties.', 'employment', 'DE', 'en', 'high', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Intellectual Property Assignment
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Intellectual Property Assignment';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('IP Assignment', 'Work product belongs to employer', 'All inventions and intellectual property created during employment are employer property. Employee assigns all rights.', 'employment', 'DE', 'en', 'high', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Non-Competition and Non-Solicitation
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Non-Competition and Non-Solicitation';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('No Restrictions', 'No post-employment non-compete', 'No post-employment restrictions. Upon termination, employee free to work for any employer, subject to confidentiality.', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Termination and Severance
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Termination and Severance';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Notice Periods', 'Standard termination notice', 'Either party may terminate with notice. Probation: [PROBATION_NOTICE] days. Post-probation: [POST_PROBATION_NOTICE] months.', 'employment', 'DE', 'en', 'medium', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- Data Protection and Privacy
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'Data Protection and Privacy';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('GDPR Compliance', 'Data protection obligations', 'Employee shall comply with GDPR and all data protection laws. Process personal data only per employer instructions.', 'employment', 'DE', 'en', 'high', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

  -- General Employment Terms
  SELECT id INTO v_section_id FROM template_sections WHERE template_id = v_template_id AND name = 'General Employment Terms';
  IF v_section_id IS NOT NULL THEN
    INSERT INTO clauses (title, content, full_legal_text, category, jurisdiction, language, risk_level, is_approved, document_type_tags, jurisdiction_tags)
    VALUES ('Standard Terms', 'Boilerplate provisions', 'This Agreement is the entire agreement. Amendments must be in writing. German law applies. If any provision is invalid, others remain in force.', 'employment', 'DE', 'en', 'low', true, '["Employment"]'::jsonb, '["DE"]'::jsonb) RETURNING id INTO v_clause_id;
    INSERT INTO section_clause_options (section_id, clause_id, display_order, is_recommended) VALUES (v_section_id, v_clause_id, 1, true);
  END IF;

END $$;