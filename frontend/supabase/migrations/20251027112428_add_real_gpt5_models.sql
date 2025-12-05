/*
  # Add Real GPT-5 Models

  ## Overview
  Adds the actual GPT-5 model variants from OpenAI's August 2025 release.
  These models use different API parameters (max_completion_tokens, no temperature).

  ## Models Added
  1. **gpt-5-mini**: Fast, cost-effective GPT-5 variant with reasoning (RECOMMENDED DEFAULT)
     - Lower latency than full GPT-5
     - Still includes reasoning capabilities
     - Best for chat applications
  
  2. **gpt-5**: Full GPT-5 model with deep reasoning
     - Slower but more capable
     - Higher cost
     - Best for complex analysis
  
  3. **gpt-5-instant**: Lowest latency variant
     - Fastest response time
     - Less reasoning depth
     - Best for quick interactions

  ## Changes
  - Reactivate GPT-5 models with correct model IDs
  - Set gpt-5-mini as default (best balance of speed/capability)
  - Update descriptions with accurate information
  - Proper sort order

  ## Security
  - Read-only access for all users maintained
  - RLS policies unchanged
*/

-- Remove old placeholder GPT-5 models if they exist
DELETE FROM ai_models WHERE model_id IN ('gpt-5-turbo', 'gpt-5') AND provider = 'openai';

-- Add GPT-5 Mini (recommended default)
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
  'gpt-5-mini',
  'GPT-5 Mini (Recommended)',
  'openai',
  'gpt-5-mini',
  'Fast GPT-5 variant with reasoning. Best balance of speed and capability for most tasks. Released August 2025.',
  200000,
  true,
  true,
  0,
  '{"reasoning": true, "vision": true, "function_calling": true, "json_mode": true}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  is_default = true,
  is_active = true,
  sort_order = 0,
  display_name = 'GPT-5 Mini (Recommended)',
  model_id = 'gpt-5-mini',
  description = 'Fast GPT-5 variant with reasoning. Best balance of speed and capability for most tasks. Released August 2025.';

-- Update GPT-4o to not be default anymore
UPDATE ai_models 
SET is_default = false, sort_order = 1, display_name = 'GPT-4o (Previous Gen)'
WHERE model_id = 'gpt-4o';

-- Add full GPT-5 (slower, more capable)
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
  'gpt-5',
  'GPT-5 (Deep Reasoning)',
  'openai',
  'gpt-5',
  'Full GPT-5 with extended reasoning. Slower but more thorough. Best for complex legal analysis.',
  200000,
  true,
  false,
  2,
  '{"reasoning": true, "deep_thinking": true, "vision": true, "function_calling": true}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  is_active = true,
  sort_order = 2,
  model_id = 'gpt-5',
  display_name = 'GPT-5 (Deep Reasoning)',
  description = 'Full GPT-5 with extended reasoning. Slower but more thorough. Best for complex legal analysis.';

-- Add GPT-5 Instant (fastest)
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
  'gpt-5-instant',
  'GPT-5 Instant (Fastest)',
  'openai',
  'gpt-5-instant',
  'Lowest latency GPT-5 variant. Optimized for speed with lighter reasoning.',
  128000,
  true,
  false,
  3,
  '{"reasoning": false, "vision": true, "low_latency": true}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  is_active = true,
  sort_order = 3,
  model_id = 'gpt-5-instant',
  display_name = 'GPT-5 Instant (Fastest)';

-- Update sort order for other models
UPDATE ai_models SET sort_order = 4 WHERE model_id = 'gpt-4o-mini';
UPDATE ai_models SET sort_order = 5 WHERE model_id = 'gpt-4-turbo-preview';
UPDATE ai_models SET sort_order = 6 WHERE model_id = 'gpt-4' AND display_name NOT LIKE '%(US)%';
