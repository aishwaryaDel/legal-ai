import { supabase } from './supabase';
import { legalKnowledgeService } from './legalKnowledgeService';
import { feedbackService } from './feedbackService';

export interface UserContext {
  user_id: string;
  jurisdiction: string;
  language: string;
  role: string;
  industries: string[];
  contract_types: string[];
  expertise_level: 'beginner' | 'intermediate' | 'expert';
}

export interface QueryContext {
  contract_id?: string;
  contract_type?: string;
  jurisdiction: string;
  industry?: string;
  query_type: 'drafting' | 'review' | 'analysis' | 'research' | 'negotiation' | 'general';
  relevant_clauses?: string[];
  historical_context?: {
    similar_contracts: string[];
    previous_decisions: string[];
  };
}

export interface ContextualPrompt {
  system_prompt: string;
  user_prompt: string;
  context_metadata: {
    jurisdiction: string;
    contract_type?: string;
    user_role: string;
    query_type: string;
    relevant_sources: string[];
    precedents: string[];
  };
  suggested_models: string[];
  temperature: number;
}

class ContextEngine {
  async getUserContext(userId: string): Promise<UserContext | null> {
    try {
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (prefError) throw prefError;

      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId)
        .maybeSingle();

      if (userError) throw userError;

      const role = (userData as any)?.roles?.name || 'user';

      if (!preferences) {
        return {
          user_id: userId,
          jurisdiction: 'DACH',
          language: 'de',
          role,
          industries: [],
          contract_types: [],
          expertise_level: 'intermediate',
        };
      }

      return {
        user_id: userId,
        jurisdiction: preferences.default_jurisdiction,
        language: preferences.default_language,
        role,
        industries: preferences.industries || [],
        contract_types: preferences.contract_types || [],
        expertise_level: 'intermediate',
      };
    } catch (error) {
      console.error('Error fetching user context:', error);
      return null;
    }
  }

  async buildContextualPrompt(
    userContext: UserContext,
    queryContext: QueryContext,
    userQuery: string
  ): Promise<ContextualPrompt> {
    const systemPrompt = await this.generateSystemPrompt(userContext, queryContext);

    const relevantSources = await this.findRelevantLegalSources(queryContext);

    const precedents = await this.findRelevantPrecedents(queryContext);

    const enhancedUserPrompt = await this.enhanceUserPrompt(
      userQuery,
      queryContext,
      relevantSources,
      precedents
    );

    const suggestedModels = this.selectOptimalModels(userContext, queryContext);

    const temperature = this.determineTemperature(queryContext.query_type);

    return {
      system_prompt: systemPrompt,
      user_prompt: enhancedUserPrompt,
      context_metadata: {
        jurisdiction: queryContext.jurisdiction,
        contract_type: queryContext.contract_type,
        user_role: userContext.role,
        query_type: queryContext.query_type,
        relevant_sources: relevantSources.map(s => s.reference_number),
        precedents: precedents.map(p => p.id!),
      },
      suggested_models: suggestedModels,
      temperature,
    };
  }

  private async generateSystemPrompt(
    userContext: UserContext,
    queryContext: QueryContext
  ): Promise<string> {
    const rolePrompts: Record<string, string> = {
      admin: 'You are an expert legal AI assistant supporting administrative and strategic decisions.',
      legal_counsel: 'You are an expert legal AI assistant supporting qualified legal professionals with deep legal analysis.',
      user: 'You are a helpful legal AI assistant providing clear guidance to business users.',
      viewer: 'You are a legal AI assistant providing informational support.',
    };

    const queryTypePrompts: Record<string, string> = {
      drafting: 'Focus on generating legally sound, comprehensive contract language.',
      review: 'Provide detailed analysis of contract terms, identifying risks, issues, and improvements.',
      analysis: 'Deliver in-depth legal analysis with citations and multi-jurisdictional considerations.',
      research: 'Provide thorough legal research with comprehensive citations and case law references.',
      negotiation: 'Offer strategic negotiation guidance, alternative clauses, and risk assessments.',
      general: 'Provide helpful, accurate legal information and guidance.',
    };

    const jurisdictionContext = this.getJurisdictionContext(queryContext.jurisdiction);

    let systemPrompt = `${rolePrompts[userContext.role] || rolePrompts.user}\n\n`;
    systemPrompt += `Jurisdiction: ${queryContext.jurisdiction} - ${jurisdictionContext}\n\n`;
    systemPrompt += `${queryTypePrompts[queryContext.query_type]}\n\n`;

    if (queryContext.contract_type) {
      systemPrompt += `Contract Type: ${queryContext.contract_type}\n\n`;
    }

    if (queryContext.industry) {
      systemPrompt += `Industry: ${queryContext.industry}\n\n`;
    }

    systemPrompt += `Important Guidelines:\n`;
    systemPrompt += `- Always cite legal sources with specific references (e.g., BGB §123, GDPR Art. 6)\n`;
    systemPrompt += `- Clearly state when you're uncertain or when legal counsel should be consulted\n`;
    systemPrompt += `- Consider jurisdiction-specific requirements and best practices\n`;
    systemPrompt += `- Provide practical, actionable recommendations\n`;
    systemPrompt += `- Flag high-risk terms and potential compliance issues\n`;

    if (userContext.expertise_level === 'beginner') {
      systemPrompt += `- Explain legal terms and concepts in clear, accessible language\n`;
      systemPrompt += `- Provide context and rationale for recommendations\n`;
    }

    return systemPrompt;
  }

  private getJurisdictionContext(jurisdiction: string): string {
    const contexts: Record<string, string> = {
      DACH: 'Apply German (BGB, HGB), Austrian (ABGB), and Swiss (OR) legal principles. Consider strict data protection (GDPR/BDSG), strong employee protection, and formal contract requirements.',
      EU: 'Apply EU directives and regulations, especially GDPR. Consider cross-border implications and harmonized EU law. Be aware of member state variations.',
      US: 'Apply common law principles, UCC for commercial transactions, and state-specific requirements. Consider at-will employment, extensive indemnification clauses.',
      GLOBAL: 'Consider international commercial law, UNIDROIT principles, and CISG for international sales. Be aware of jurisdictional variations.',
    };

    return contexts[jurisdiction] || contexts.GLOBAL;
  }

  private async findRelevantLegalSources(queryContext: QueryContext): Promise<any[]> {
    if (!queryContext.contract_type) {
      return [];
    }

    const keywords = this.extractLegalKeywords(queryContext);

    const sources = await legalKnowledgeService.searchLegalSources({
      jurisdiction: queryContext.jurisdiction,
      keywords: keywords.join(' '),
      valid_as_of: new Date().toISOString().split('T')[0],
    });

    return sources.slice(0, 5);
  }

  private extractLegalKeywords(queryContext: QueryContext): string[] {
    const contractTypeKeywords: Record<string, string[]> = {
      NDA: ['confidentiality', 'non-disclosure', 'trade secret', 'proprietary information'],
      MSA: ['service agreement', 'liability', 'indemnification', 'termination'],
      SOW: ['deliverables', 'scope', 'acceptance', 'milestones'],
      EMPLOYMENT: ['employment', 'termination', 'compensation', 'benefits'],
      LICENSE: ['intellectual property', 'license', 'royalty', 'usage rights'],
    };

    return contractTypeKeywords[queryContext.contract_type || ''] || [];
  }

  private async findRelevantPrecedents(queryContext: QueryContext): Promise<any[]> {
    try {
      if (!queryContext.contract_id) {
        return [];
      }

      const { data: currentContract } = await supabase
        .from('contracts')
        .select('contract_type, jurisdiction')
        .eq('id', queryContext.contract_id)
        .maybeSingle();

      if (!currentContract) return [];

      const { data: precedents, error } = await supabase
        .from('precedent_cases')
        .select('*, contracts(contract_type, jurisdiction)')
        .eq('outcome', 'success')
        .limit(5);

      if (error) throw error;

      return precedents || [];
    } catch (error) {
      console.error('Error finding relevant precedents:', error);
      return [];
    }
  }

  private async enhanceUserPrompt(
    userQuery: string,
    queryContext: QueryContext,
    sources: any[],
    precedents: any[]
  ): Promise<string> {
    let enhancedPrompt = userQuery;

    if (sources.length > 0) {
      enhancedPrompt += '\n\nRelevant Legal Sources:\n';
      sources.forEach((source, idx) => {
        enhancedPrompt += `${idx + 1}. ${source.reference_number}: ${source.title}\n`;
        if (source.summary) {
          enhancedPrompt += `   Summary: ${source.summary.substring(0, 200)}...\n`;
        }
      });
    }

    if (precedents.length > 0) {
      enhancedPrompt += '\n\nRelevant Internal Precedents:\n';
      precedents.forEach((precedent, idx) => {
        enhancedPrompt += `${idx + 1}. ${precedent.case_summary.substring(0, 150)}...\n`;
        if (precedent.lessons_learned) {
          enhancedPrompt += `   Lesson: ${precedent.lessons_learned.substring(0, 100)}...\n`;
        }
      });
    }

    if (queryContext.relevant_clauses && queryContext.relevant_clauses.length > 0) {
      enhancedPrompt += '\n\nRelevant Contract Clauses:\n';
      enhancedPrompt += queryContext.relevant_clauses.join(', ') + '\n';
    }

    return enhancedPrompt;
  }

  private selectOptimalModels(
    userContext: UserContext,
    queryContext: QueryContext
  ): string[] {
    const modelPreferences: Record<string, string[]> = {
      drafting: ['gpt-5-turbo', 'gpt-5', 'claude-3-opus-20240229'],
      review: ['gpt-5', 'gpt-5-turbo', 'gpt-4'],
      analysis: ['gpt-5', 'claude-3-opus-20240229', 'gpt-5-turbo'],
      research: ['gpt-5', 'claude-3-opus-20240229', 'gpt-4-turbo'],
      negotiation: ['gpt-5-turbo', 'gpt-5', 'claude-3-sonnet-20240229'],
      general: ['gpt-5-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    };

    let models = modelPreferences[queryContext.query_type] || modelPreferences.general;

    if (userContext.jurisdiction === 'DACH' && userContext.language === 'de') {
      models = ['claude-3-opus-20240229', 'gpt-5', 'gpt-5-turbo'];
    }

    return models;
  }

  private determineTemperature(queryType: string): number {
    const temperatureMap: Record<string, number> = {
      drafting: 0.5,
      review: 0.3,
      analysis: 0.4,
      research: 0.3,
      negotiation: 0.6,
      general: 0.7,
    };

    return temperatureMap[queryType] || 0.7;
  }

  async updateUserPreferencesFromUsage(
    userId: string,
    queryContext: QueryContext
  ): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('user_preferences')
        .select('contract_types, industries')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const contractTypes = new Set(existing?.contract_types || []);
      const industries = new Set(existing?.industries || []);

      if (queryContext.contract_type) {
        contractTypes.add(queryContext.contract_type);
      }

      if (queryContext.industry) {
        industries.add(queryContext.industry);
      }

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({
            contract_types: Array.from(contractTypes),
            industries: Array.from(industries),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: userId,
            contract_types: Array.from(contractTypes),
            industries: Array.from(industries),
          });
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  async generateNegotiationStrategy(
    contractId: string,
    clauseType: string,
    userContext: UserContext
  ): Promise<{
    current_position: string;
    alternatives: Array<{ text: string; risk: string; rationale: string }>;
    negotiation_tips: string[];
    fallback_positions: string[];
  }> {
    try {
      const suggestions = await legalKnowledgeService.getClauseSuggestions({
        clause_type: clauseType,
        jurisdiction: userContext.jurisdiction,
      });

      const alternatives = suggestions.slice(0, 3).map(s => ({
        text: s.clause_text,
        risk: s.risk_level,
        rationale: s.negotiation_notes || 'Standard clause with proven track record',
      }));

      return {
        current_position: 'Current clause requires review',
        alternatives,
        negotiation_tips: [
          'Start with your ideal position but be prepared to compromise',
          'Focus on business objectives rather than legal technicalities',
          'Consider the long-term relationship with the counterparty',
          'Document all agreed changes in writing',
        ],
        fallback_positions: [
          'Accept with risk mitigation measures',
          'Request additional protective clauses',
          'Limit scope or duration',
        ],
      };
    } catch (error) {
      console.error('Error generating negotiation strategy:', error);
      return {
        current_position: 'Unable to analyze',
        alternatives: [],
        negotiation_tips: [],
        fallback_positions: [],
      };
    }
  }
}

export const contextEngine = new ContextEngine();
