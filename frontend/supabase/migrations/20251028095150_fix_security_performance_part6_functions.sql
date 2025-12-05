/*
  # Fix Security and Performance Issues - Part 6: Function Security

  ## Function Security Fixes
    Fix search_path for functions to prevent SQL injection attacks.
    Add SECURITY DEFINER with SET search_path = public.

  ## Functions Fixed
    - update_builder_session_timestamp
    - get_compatible_clauses

  ## Important Notes
    - Prevents search_path manipulation attacks
    - Maintains function behavior
    - No performance impact
*/

-- Fix update_builder_session_timestamp function
CREATE OR REPLACE FUNCTION public.update_builder_session_timestamp()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix get_compatible_clauses function
CREATE OR REPLACE FUNCTION public.get_compatible_clauses(
  p_document_type text,
  p_jurisdiction text,
  p_tags text[]
)
RETURNS TABLE (
  id uuid,
  title text,
  clause_text text,
  tags text[],
  risk_level text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.clause_text,
    c.tags,
    c.risk_level
  FROM public.clauses c
  WHERE 
    c.document_types @> ARRAY[p_document_type]
    AND c.jurisdictions @> ARRAY[p_jurisdiction]
    AND (
      p_tags IS NULL 
      OR c.tags && p_tags
    )
  ORDER BY c.title;
END;
$$;