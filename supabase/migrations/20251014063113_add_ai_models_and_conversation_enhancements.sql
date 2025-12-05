/*
  # AI Models and Conversation Enhancements

  ## Overview
  Adds support for multiple AI models with jurisdiction-specific configurations
  and enhances conversation tracking with model selection.

  ## New Tables
  1. `ai_models` - Available AI models with capabilities and jurisdiction support
  2. `model_preferences` - User preferences for model selection

  ## Changes to Existing Tables
  1. `copilot_conversations` - Add model_id and model_name fields

  ## Security
  - RLS enabled on all new tables
  - Users can read all active models
  - Users can manage their own model preferences
*/

-- AI Models registry
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  provider text NOT NULL,
  model_id text NOT NULL,
  description text,
  jurisdictions text[] DEFAULT '{}',
  regions text[] DEFAULT '{}',
  capabilities jsonb DEFAULT '{}',
  pricing jsonb DEFAULT '{}',
  context_window integer,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active models"
  ON ai_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User model preferences
CREATE TABLE IF NOT EXISTS model_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jurisdiction text,
  preferred_model_id uuid REFERENCES ai_models(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, jurisdiction)
);

ALTER TABLE model_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own model preferences"
  ON model_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own model preferences"
  ON model_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own model preferences"
  ON model_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own model preferences"
  ON model_preferences FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add model tracking to conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'copilot_conversations' AND column_name = 'model_id'
  ) THEN
    ALTER TABLE copilot_conversations ADD COLUMN model_id uuid REFERENCES ai_models(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'copilot_conversations' AND column_name = 'model_name'
  ) THEN
    ALTER TABLE copilot_conversations ADD COLUMN model_name text;
  END IF;
END $$;

-- Add delete policy for conversations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'copilot_conversations' AND policyname = 'Users can delete own conversations'
  ) THEN
    CREATE POLICY "Users can delete own conversations"
      ON copilot_conversations FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Insert default AI models
INSERT INTO ai_models (name, display_name, provider, model_id, description, jurisdictions, regions, capabilities, context_window, is_active, is_default, sort_order) VALUES
  -- General Models
  (
    'gpt-4',
    'GPT-4',
    'openai',
    'gpt-4',
    'Most capable model for complex legal analysis',
    ARRAY['DACH', 'EU', 'US', 'GLOBAL'],
    ARRAY['EU', 'US', 'APAC'],
    '{"summarization": true, "extraction": true, "analysis": true, "drafting": true, "multilingual": true}'::jsonb,
    8192,
    true,
    true,
    1
  ),
  (
    'gpt-4-turbo',
    'GPT-4 Turbo',
    'openai',
    'gpt-4-turbo-preview',
    'Faster version with 128K context window',
    ARRAY['DACH', 'EU', 'US', 'GLOBAL'],
    ARRAY['EU', 'US', 'APAC'],
    '{"summarization": true, "extraction": true, "analysis": true, "drafting": true, "multilingual": true, "long_context": true}'::jsonb,
    128000,
    true,
    false,
    2
  ),
  (
    'gpt-3.5-turbo',
    'GPT-3.5 Turbo',
    'openai',
    'gpt-3.5-turbo',
    'Fast and cost-effective for simple tasks',
    ARRAY['DACH', 'EU', 'US', 'GLOBAL'],
    ARRAY['EU', 'US', 'APAC'],
    '{"summarization": true, "extraction": true, "analysis": false, "drafting": true, "multilingual": true}'::jsonb,
    16385,
    true,
    false,
    3
  ),
  -- European/DACH Models
  (
    'claude-3-opus',
    'Claude 3 Opus',
    'anthropic',
    'claude-3-opus-20240229',
    'Best for complex reasoning and German legal texts',
    ARRAY['DACH', 'EU'],
    ARRAY['EU'],
    '{"summarization": true, "extraction": true, "analysis": true, "drafting": true, "multilingual": true, "german_focus": true}'::jsonb,
    200000,
    true,
    false,
    4
  ),
  (
    'claude-3-sonnet',
    'Claude 3 Sonnet',
    'anthropic',
    'claude-3-sonnet-20240229',
    'Balanced performance for EU compliance',
    ARRAY['DACH', 'EU'],
    ARRAY['EU'],
    '{"summarization": true, "extraction": true, "analysis": true, "drafting": true, "multilingual": true}'::jsonb,
    200000,
    true,
    false,
    5
  ),
  -- US-specific Models
  (
    'gpt-4-us',
    'GPT-4 (US)',
    'openai',
    'gpt-4',
    'Optimized for US legal standards',
    ARRAY['US'],
    ARRAY['US'],
    '{"summarization": true, "extraction": true, "analysis": true, "drafting": true, "us_law": true}'::jsonb,
    8192,
    true,
    false,
    6
  ),
  -- Specialized Models
  (
    'legal-bert',
    'LegalBERT',
    'huggingface',
    'nlpaueb/legal-bert-base-uncased',
    'Specialized for legal text classification',
    ARRAY['GLOBAL'],
    ARRAY['EU', 'US'],
    '{"classification": true, "ner": true, "extraction": true}'::jsonb,
    512,
    true,
    false,
    7
  ),
  (
    'deepl-translate',
    'DeepL Translation',
    'deepl',
    'deepl-api',
    'High-quality translation for German legal documents',
    ARRAY['DACH', 'EU'],
    ARRAY['EU'],
    '{"translation": true, "german_focus": true}'::jsonb,
    0,
    true,
    false,
    8
  )
ON CONFLICT (name) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_models_jurisdictions ON ai_models USING GIN(jurisdictions);
CREATE INDEX IF NOT EXISTS idx_ai_models_active ON ai_models(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_model_preferences_user ON model_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_model ON copilot_conversations(model_id);
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user_updated ON copilot_conversations(user_id, updated_at DESC);
