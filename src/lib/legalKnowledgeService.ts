import { supabase } from './supabase';

export interface LegalSource {
  id?: string;
  jurisdiction: string;
  source_type: 'law' | 'regulation' | 'case_law' | 'directive' | 'guideline' | 'commentary';
  title: string;
  reference_number: string;
  content: string;
  summary?: string;
  valid_from: string;
  valid_until?: string;
  parent_version_id?: string;
  source_url?: string;
  metadata?: {
    authority?: string;
    keywords?: string[];
    related_concepts?: string[];
    language?: string;
    [key: string]: any;
  };
}

export interface LegalUpdate {
  id?: string;
  source_id: string;
  change_type: 'new' | 'amended' | 'repealed' | 'clarified';
  change_summary: string;
  detected_at?: string;
  validated_by?: string;
  status: 'pending' | 'validated' | 'rejected' | 'archived';
  notification_sent: boolean;
}

export interface LegalTaxonomy {
  id?: string;
  concept_name: string;
  parent_id?: string;
  jurisdictions: string[];
  translations: {
    [language: string]: string;
  };
  related_sources: string[];
}

export interface ClauseSuggestion {
  id?: string;
  clause_text: string;
  clause_type: string;
  jurisdiction: string;
  industry?: string;
  risk_level: 'high' | 'medium' | 'low';
  alternatives: Array<{
    text: string;
    risk_level: string;
    notes: string;
  }>;
  negotiation_notes?: string;
  usage_count: number;
  success_rate: number;
}

class LegalKnowledgeService {
  async searchLegalSources(query: {
    jurisdiction?: string;
    source_type?: string;
    keywords?: string;
    valid_as_of?: string;
  }): Promise<LegalSource[]> {
    try {
      let queryBuilder = supabase
        .from('legal_sources')
        .select('*');

      if (query.jurisdiction) {
        queryBuilder = queryBuilder.eq('jurisdiction', query.jurisdiction);
      }

      if (query.source_type) {
        queryBuilder = queryBuilder.eq('source_type', query.source_type);
      }

      if (query.keywords) {
        queryBuilder = queryBuilder.or(
          `title.ilike.%${query.keywords}%,content.ilike.%${query.keywords}%,reference_number.ilike.%${query.keywords}%`
        );
      }

      if (query.valid_as_of) {
        queryBuilder = queryBuilder
          .lte('valid_from', query.valid_as_of)
          .or(`valid_until.is.null,valid_until.gte.${query.valid_as_of}`);
      }

      queryBuilder = queryBuilder.order('valid_from', { ascending: false });

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching legal sources:', error);
      return [];
    }
  }

  async getLegalSourceById(id: string): Promise<LegalSource | null> {
    try {
      const { data, error } = await supabase
        .from('legal_sources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching legal source:', error);
      return null;
    }
  }

  async addLegalSource(source: Omit<LegalSource, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('legal_sources')
        .insert({
          jurisdiction: source.jurisdiction,
          source_type: source.source_type,
          title: source.title,
          reference_number: source.reference_number,
          content: source.content,
          summary: source.summary,
          valid_from: source.valid_from,
          valid_until: source.valid_until,
          parent_version_id: source.parent_version_id,
          source_url: source.source_url,
          metadata: source.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error adding legal source:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getRecentLegalUpdates(jurisdiction?: string, limit: number = 20): Promise<LegalUpdate[]> {
    try {
      let query = supabase
        .from('legal_updates')
        .select('*, legal_sources(title, jurisdiction)')
        .eq('status', 'validated')
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (jurisdiction) {
        query = query.eq('legal_sources.jurisdiction', jurisdiction);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching legal updates:', error);
      return [];
    }
  }

  async createLegalUpdate(update: Omit<LegalUpdate, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('legal_updates')
        .insert({
          source_id: update.source_id,
          change_type: update.change_type,
          change_summary: update.change_summary,
          status: update.status,
          notification_sent: update.notification_sent,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating legal update:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getTaxonomyTree(jurisdiction?: string): Promise<LegalTaxonomy[]> {
    try {
      let query = supabase
        .from('legal_taxonomy')
        .select('*')
        .order('concept_name');

      if (jurisdiction) {
        query = query.contains('jurisdictions', [jurisdiction]);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching legal taxonomy:', error);
      return [];
    }
  }

  async getClauseSuggestions(params: {
    clause_type: string;
    jurisdiction: string;
    industry?: string;
  }): Promise<ClauseSuggestion[]> {
    try {
      let query = supabase
        .from('clause_suggestions')
        .select('*')
        .eq('clause_type', params.clause_type)
        .eq('jurisdiction', params.jurisdiction)
        .order('success_rate', { ascending: false })
        .limit(10);

      if (params.industry) {
        query = query.eq('industry', params.industry);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching clause suggestions:', error);
      return [];
    }
  }

  async addClauseSuggestion(
    suggestion: Omit<ClauseSuggestion, 'id' | 'usage_count' | 'success_rate'>
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('clause_suggestions')
        .insert({
          clause_text: suggestion.clause_text,
          clause_type: suggestion.clause_type,
          jurisdiction: suggestion.jurisdiction,
          industry: suggestion.industry,
          risk_level: suggestion.risk_level,
          alternatives: suggestion.alternatives,
          negotiation_notes: suggestion.negotiation_notes,
          usage_count: 0,
          success_rate: 0,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error adding clause suggestion:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async incrementClauseUsage(clauseId: string, wasSuccessful: boolean): Promise<void> {
    try {
      const { data: current, error: fetchError } = await supabase
        .from('clause_suggestions')
        .select('usage_count, success_rate')
        .eq('id', clauseId)
        .single();

      if (fetchError) throw fetchError;

      const newUsageCount = current.usage_count + 1;
      const currentSuccesses = Math.round((current.success_rate / 100) * current.usage_count);
      const newSuccesses = currentSuccesses + (wasSuccessful ? 1 : 0);
      const newSuccessRate = (newSuccesses / newUsageCount) * 100;

      const { error: updateError } = await supabase
        .from('clause_suggestions')
        .update({
          usage_count: newUsageCount,
          success_rate: newSuccessRate,
        })
        .eq('id', clauseId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error incrementing clause usage:', error);
    }
  }

  async crossReferenceJurisdictions(
    conceptName: string,
    sourceJurisdiction: string
  ): Promise<Array<{
    jurisdiction: string;
    equivalent_concept: string;
    legal_sources: LegalSource[];
    differences: string[];
  }>> {
    try {
      const { data: taxonomy, error: taxError } = await supabase
        .from('legal_taxonomy')
        .select('*')
        .ilike('concept_name', `%${conceptName}%`)
        .contains('jurisdictions', [sourceJurisdiction]);

      if (taxError) throw taxError;

      if (!taxonomy || taxonomy.length === 0) {
        return [];
      }

      const allJurisdictions = new Set<string>();
      taxonomy.forEach(t => t.jurisdictions.forEach((j: string) => allJurisdictions.add(j)));

      const results = [];

      for (const jurisdiction of allJurisdictions) {
        if (jurisdiction === sourceJurisdiction) continue;

        const relatedTaxonomy = taxonomy.find(t => t.jurisdictions.includes(jurisdiction));

        if (relatedTaxonomy) {
          const sources = await this.searchLegalSources({
            jurisdiction,
            keywords: conceptName,
          });

          results.push({
            jurisdiction,
            equivalent_concept: relatedTaxonomy.translations[jurisdiction] || conceptName,
            legal_sources: sources.slice(0, 5),
            differences: this.identifyJurisdictionalDifferences(sourceJurisdiction, jurisdiction, conceptName),
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error cross-referencing jurisdictions:', error);
      return [];
    }
  }

  private identifyJurisdictionalDifferences(
    sourceJurisdiction: string,
    targetJurisdiction: string,
    concept: string
  ): string[] {
    const knownDifferences: Record<string, Record<string, string[]>> = {
      'data_protection': {
        'DACH-US': [
          'GDPR applies in DACH region with stricter consent requirements',
          'US follows sectoral approach with laws like CCPA, HIPAA',
          'Right to be forgotten exists in EU but limited in US',
        ],
        'EU-US': [
          'GDPR requires explicit consent; US varies by state',
          'Data transfer mechanisms differ (Standard Contractual Clauses vs Privacy Shield)',
          'Enforcement and penalties are more stringent under GDPR',
        ],
      },
      'termination': {
        'DACH-US': [
          'German law provides stronger employee protection',
          'At-will employment is standard in US but not in Germany',
          'Notice periods are typically longer in DACH region',
        ],
      },
    };

    const key = `${sourceJurisdiction}-${targetJurisdiction}`;
    return knownDifferences[concept]?.[key] || [
      'Detailed comparative analysis required',
      'Consult local legal counsel for specific differences',
    ];
  }

  async generateLegalSummary(sourceId: string): Promise<string> {
    try {
      const source = await this.getLegalSourceById(sourceId);

      if (!source) {
        return 'Source not found';
      }

      const maxLength = 500;
      if (source.content.length <= maxLength) {
        return source.content;
      }

      const sentences = source.content.match(/[^.!?]+[.!?]+/g) || [];
      let summary = '';
      for (const sentence of sentences) {
        if ((summary + sentence).length > maxLength) break;
        summary += sentence;
      }

      return summary || source.content.substring(0, maxLength) + '...';
    } catch (error) {
      console.error('Error generating legal summary:', error);
      return 'Error generating summary';
    }
  }
}

export const legalKnowledgeService = new LegalKnowledgeService();
