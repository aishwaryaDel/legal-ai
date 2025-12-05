/*
  # Fix AI Models - Use Real OpenAI Models

  ## Overview
  Updates the ai_models table to use actually available OpenAI models
  instead of fictional GPT-5 models. Sets GPT-4o as the default model
  since it is the most capable currently available model.

  ## Changes
  1. Deactivate fictional GPT-5 models
  2. Update GPT-4o Mini to be more prominent
  3. Set GPT-4o (upgrade from GPT-4 Turbo) as default
  4. Ensure proper sort order

  ## Available Models
  - gpt-4o: Most capable model (newest GPT-4 variant)
  - gpt-4o-mini: Cost-effective, fast, capable
  - gpt-4-turbo-preview: Previous generation turbo
  - o1-mini: Reasoning model (if needed)
*/

-- Deactivate the fictional GPT-5 models
UPDATE ai_models 
SET is_active = false, is_default = false 
WHERE model_id IN ('gpt-5', 'gpt-5-turbo');

-- Set GPT-4o as the default model (most capable current model)
UPDATE ai_models 
SET is_default = false 
WHERE is_default = true;

-- Add GPT-4o if it doesn't exist and make it default
INSERT INTO ai_models (
  name,
  display_name,
  provider,
  model_id,
  description,
  context_window,
  is_active,
  is_default,
  sort_order,
  capabilities
) VALUES (
  'gpt-4o',
  'GPT-4o (Recommended)',
  'openai',
  'gpt-4o',
  'Most capable OpenAI model with vision, function calling, and structured outputs',
  128000,
  true,
  true,
  0,
  '{"vision": true, "function_calling": true, "json_mode": true}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  is_default = true,
  is_active = true,
  sort_order = 0,
  display_name = 'GPT-4o (Recommended)',
  description = 'Most capable OpenAI model with vision, function calling, and structured outputs';

-- Update GPT-4o Mini sort order
UPDATE ai_models 
SET sort_order = 1, display_name = 'GPT-4o Mini (Fast)'
WHERE model_id = 'gpt-4o-mini';

-- Update other models sort order
UPDATE ai_models 
SET sort_order = 2
WHERE model_id = 'gpt-4-turbo-preview';

UPDATE ai_models 
SET sort_order = 3
WHERE model_id = 'gpt-4' AND display_name NOT LIKE '%(US)%';

UPDATE ai_models 
SET sort_order = 4
WHERE model_id = 'gpt-3.5-turbo';
