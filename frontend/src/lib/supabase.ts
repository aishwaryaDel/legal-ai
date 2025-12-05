import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          locale: string;
          timezone: string;
          business_unit: string | null;
          region: string | null;
          jurisdictions: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          clm_id: string | null;
          title: string;
          contract_type: string;
          category: string | null;
          status: string;
          partner_id: string | null;
          jurisdiction: string | null;
          language: string;
          effective_date: string | null;
          expiration_date: string | null;
          value: number | null;
          owner_id: string | null;
          business_unit: string | null;
          region: string | null;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
      };
      partners: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          country: string | null;
          jurisdiction: string | null;
          risk_rating: string | null;
          contacts: any;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
      };
      discovery_projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: string;
          created_by: string;
          doc_count: number;
          max_docs: number;
          progress: number;
          results: any;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
      };
      research_queries: {
        Row: {
          id: string;
          user_id: string;
          query: string;
          jurisdiction: string | null;
          language: string;
          answer: string | null;
          citations: any;
          confidence: number | null;
          sources_used: string[];
          created_at: string;
        };
      };
      copilot_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          context_ids: string[];
          jurisdiction: string | null;
          language: string;
          metadata: any;
          created_at: string;
          updated_at: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: string;
          status: string;
          priority: string;
          assignee_id: string | null;
          contract_id: string | null;
          due_date: string | null;
          completed_at: string | null;
          created_by: string | null;
          created_at: string;
        };
      };
    };
  };
};
