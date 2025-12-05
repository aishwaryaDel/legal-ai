/*
  # Fix get_compatible_clauses Column Names

  ## Problem
    Function returns columns as clause_id, clause_title, clause_category
    But frontend expects: id, title, category
    
  ## Solution
    Drop and recreate function with correct return column names
*/

DROP FUNCTION IF EXISTS get_compatible_clauses(uuid, text, text, jsonb, text, text);

CREATE OR REPLACE FUNCTION get_compatible_clauses(
  p_section_id uuid,
  p_jurisdiction text,
  p_sensitivity text,
  p_purpose_tags jsonb,
  p_criticality text,
  p_document_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  category text,
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
    (sco.is_recommended OR (c.usage_frequency > 30 AND c.risk_level = 'low')) as is_recommended
  FROM clauses c
  INNER JOIN section_clause_options sco ON sco.clause_id = c.id
  WHERE 
    sco.section_id = p_section_id
    AND c.is_approved = true
    -- Document type compatibility
    AND (
      p_document_type IS NULL 
      OR c.document_type_tags IS NULL
      OR c.document_type_tags = '[]'::jsonb
      OR c.document_type_tags ? p_document_type
    )
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
    sco.display_order ASC,
    c.usage_frequency DESC,
    c.risk_level ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;