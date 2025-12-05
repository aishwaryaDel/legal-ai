/*
  # Add GPT-5 Models to AI Models Table

  This migration adds support for GPT-5 and GPT-5-Turbo models to the LegalAI application.

  ## Changes Made

  1. **New AI Models**
     - GPT-5: Latest flagship model with 200K context window
     - GPT-5-Turbo: Optimized version with fast inference and 200K context

  2. **Model Configuration**
     - GPT-5-Turbo set as new default model (is_default = true)
     - Previous default (GPT-4o Mini) updated to non-default
     - Sort order adjusted to prioritize GPT-5 models
     - Full capabilities enabled for both models

  3. **Capabilities**
     - Summarization, extraction, analysis, drafting enabled
     - Translation and multilingual support
     - Long context support (200K tokens)
     - German focus and US law expertise

  ## Important Notes
     - GPT-5 models require OpenAI API key with GPT-5 access
     - Models are active and available for immediate use
     - Jurisdiction support: DACH, EU, US, GLOBAL
*/

-- Update GPT-4o Mini to non-default
UPDATE ai_models 
SET is_default = false 
WHERE model_id = 'gpt-4o-mini';

-- Update sort order for existing models to make room for GPT-5 models
UPDATE ai_models 
SET sort_order = sort_order + 2 
WHERE sort_order >= 1;

-- Check if GPT-5-Turbo already exists and delete it
DELETE FROM ai_models WHERE model_id = 'gpt-5-turbo';

-- Insert GPT-5-Turbo (new default)
INSERT INTO ai_models (
  name,
  display_name,
  provider,
  model_id,
  description,
  jurisdictions,
  regions,
  capabilities,
  context_window,
  is_active,
  is_default,
  sort_order
)
VALUES (
  'gpt-5-turbo',
  'GPT-5 Turbo',
  'openai',
  'gpt-5-turbo',
  'Latest GPT-5 Turbo model with optimized performance, fast inference, and 200K context window. Best for most legal tasks.',
  ARRAY['DACH', 'EU', 'US', 'GLOBAL'],
  ARRAY['EU', 'US', 'APAC'],
  jsonb_build_object(
    'summarization', true,
    'extraction', true,
    'analysis', true,
    'drafting', true,
    'translation', true,
    'multilingual', true,
    'longContext', true,
    'germanFocus', true,
    'usLaw', true
  ),
  200000,
  true,
  true,
  1
);

-- Check if GPT-5 already exists and delete it
DELETE FROM ai_models WHERE model_id = 'gpt-5';

-- Insert GPT-5 (flagship model)
INSERT INTO ai_models (
  name,
  display_name,
  provider,
  model_id,
  description,
  jurisdictions,
  regions,
  capabilities,
  context_window,
  is_active,
  is_default,
  sort_order
)
VALUES (
  'gpt-5',
  'GPT-5',
  'openai',
  'gpt-5',
  'Most advanced GPT-5 flagship model with maximum capabilities and 200K context window. Ideal for complex legal analysis.',
  ARRAY['DACH', 'EU', 'US', 'GLOBAL'],
  ARRAY['EU', 'US', 'APAC'],
  jsonb_build_object(
    'summarization', true,
    'extraction', true,
    'analysis', true,
    'drafting', true,
    'translation', true,
    'multilingual', true,
    'longContext', true,
    'germanFocus', true,
    'usLaw', true
  ),
  200000,
  true,
  false,
  2
);
