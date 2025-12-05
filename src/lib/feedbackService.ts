import { supabase } from './supabase';

export interface AIFeedback {
  id?: string;
  conversation_id: string;
  message_id: string;
  user_id: string;
  rating: number;
  feedback_type: 'accuracy' | 'relevance' | 'completeness' | 'clarity' | 'hallucination' | 'general';
  feedback_text?: string;
  context_metadata?: {
    jurisdiction?: string;
    contract_type?: string;
    user_role?: string;
    query_type?: string;
    [key: string]: any;
  };
  created_at?: string;
}

export interface AIResponseLog {
  id?: string;
  conversation_id: string;
  message_id: string;
  model_version_id?: string;
  prompt_tokens: number;
  completion_tokens: number;
  response_time_ms: number;
  confidence_score?: number;
  citations?: Array<{
    source: string;
    reference: string;
    url?: string;
  }>;
  hallucination_flags?: Array<{
    type: string;
    severity: string;
    description: string;
  }>;
}

export interface ModelPerformanceMetrics {
  model_id: string;
  version: string;
  average_rating: number;
  total_feedback_count: number;
  accuracy_score: number;
  hallucination_rate: number;
  average_response_time: number;
  token_efficiency: number;
}

class FeedbackService {
  async submitFeedback(feedback: AIFeedback): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_feedback')
        .insert({
          conversation_id: feedback.conversation_id,
          message_id: feedback.message_id,
          user_id: feedback.user_id,
          rating: feedback.rating,
          feedback_type: feedback.feedback_type,
          feedback_text: feedback.feedback_text,
          context_metadata: feedback.context_metadata || {},
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getFeedbackForMessage(messageId: string): Promise<AIFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      return [];
    }
  }

  async getUserFeedbackStats(userId: string): Promise<{
    total_feedback: number;
    average_rating: number;
    feedback_by_type: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('rating, feedback_type')
        .eq('user_id', userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          total_feedback: 0,
          average_rating: 0,
          feedback_by_type: {},
        };
      }

      const feedbackByType: Record<string, number> = {};
      let totalRating = 0;

      data.forEach((item) => {
        feedbackByType[item.feedback_type] = (feedbackByType[item.feedback_type] || 0) + 1;
        totalRating += item.rating > 0 ? item.rating : 0;
      });

      return {
        total_feedback: data.length,
        average_rating: totalRating / data.length,
        feedback_by_type: feedbackByType,
      };
    } catch (error) {
      console.error('Error fetching user feedback stats:', error);
      return {
        total_feedback: 0,
        average_rating: 0,
        feedback_by_type: {},
      };
    }
  }

  async logAIResponse(log: AIResponseLog): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_responses_log')
        .insert({
          conversation_id: log.conversation_id,
          message_id: log.message_id,
          model_version_id: log.model_version_id,
          prompt_tokens: log.prompt_tokens,
          completion_tokens: log.completion_tokens,
          response_time_ms: log.response_time_ms,
          confidence_score: log.confidence_score,
          citations: log.citations || [],
          hallucination_flags: log.hallucination_flags || [],
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error logging AI response:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getModelPerformanceMetrics(modelId: string, days: number = 30): Promise<ModelPerformanceMetrics | null> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('ai_feedback')
        .select('rating, context_metadata')
        .gte('created_at', cutoffDate.toISOString());

      if (feedbackError) throw feedbackError;

      const { data: responseData, error: responseError } = await supabase
        .from('ai_responses_log')
        .select('prompt_tokens, completion_tokens, response_time_ms, hallucination_flags, confidence_score')
        .gte('created_at', cutoffDate.toISOString());

      if (responseError) throw responseError;

      if (!feedbackData || feedbackData.length === 0 || !responseData || responseData.length === 0) {
        return null;
      }

      const totalFeedback = feedbackData.length;
      const averageRating = feedbackData.reduce((sum, item) => sum + (item.rating > 0 ? item.rating : 0), 0) / totalFeedback;

      const hallucinationCount = responseData.filter(item => item.hallucination_flags && item.hallucination_flags.length > 0).length;
      const hallucinationRate = (hallucinationCount / responseData.length) * 100;

      const averageResponseTime = responseData.reduce((sum, item) => sum + item.response_time_ms, 0) / responseData.length;

      const totalTokens = responseData.reduce((sum, item) => sum + item.prompt_tokens + item.completion_tokens, 0);
      const tokenEfficiency = totalTokens / responseData.length;

      const averageConfidence = responseData
        .filter(item => item.confidence_score !== null && item.confidence_score !== undefined)
        .reduce((sum, item) => sum + (item.confidence_score || 0), 0) / responseData.length;

      return {
        model_id: modelId,
        version: 'latest',
        average_rating: averageRating,
        total_feedback_count: totalFeedback,
        accuracy_score: averageConfidence * 100,
        hallucination_rate: hallucinationRate,
        average_response_time: averageResponseTime,
        token_efficiency: tokenEfficiency,
      };
    } catch (error) {
      console.error('Error fetching model performance metrics:', error);
      return null;
    }
  }

  async detectHallucinations(responseText: string, citations: any[]): Promise<Array<{
    type: string;
    severity: string;
    description: string;
  }>> {
    const flags: Array<{ type: string; severity: string; description: string }> = [];

    if (citations.length === 0 && responseText.includes('according to') || responseText.includes('as stated in')) {
      flags.push({
        type: 'missing_citation',
        severity: 'medium',
        description: 'Response references sources without providing citations',
      });
    }

    const confidencePatterns = [
      /I'm not (sure|certain|confident)/i,
      /may (be|have|not)/i,
      /possibly|perhaps|might/i,
    ];

    const hasLowConfidenceIndicators = confidencePatterns.some(pattern => pattern.test(responseText));
    if (hasLowConfidenceIndicators) {
      flags.push({
        type: 'low_confidence',
        severity: 'low',
        description: 'Response contains uncertainty indicators',
      });
    }

    const contradictionPatterns = [
      { pattern: /(yes|no).{0,50}(but|however|although)/i, description: 'Contradictory statements detected' },
      { pattern: /(always).{0,100}(never|rarely)/i, description: 'Conflicting absolute statements' },
    ];

    contradictionPatterns.forEach(({ pattern, description }) => {
      if (pattern.test(responseText)) {
        flags.push({
          type: 'contradiction',
          severity: 'high',
          description,
        });
      }
    });

    const specificDatePattern = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/g;
    const dateMatches = responseText.match(specificDatePattern);
    if (dateMatches && dateMatches.length > 0 && citations.length === 0) {
      flags.push({
        type: 'unsupported_claim',
        severity: 'high',
        description: 'Specific dates mentioned without supporting citations',
      });
    }

    return flags;
  }

  async calculateConfidenceScore(
    responseText: string,
    citations: any[],
    modelId: string
  ): Promise<number> {
    let score = 0.7;

    if (citations.length > 0) {
      score += 0.15;
    }

    const hedgingPatterns = [
      /I believe|I think|probably|likely|seems|appears/gi,
    ];
    const hedgingCount = hedgingPatterns.reduce((count, pattern) => {
      const matches = responseText.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (hedgingCount === 0) {
      score += 0.05;
    } else if (hedgingCount > 3) {
      score -= 0.15;
    }

    const factualPatterns = [
      /according to|as stated in|pursuant to|under|per/gi,
    ];
    const factualIndicators = factualPatterns.reduce((count, pattern) => {
      const matches = responseText.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);

    if (factualIndicators > 0) {
      score += Math.min(0.1, factualIndicators * 0.02);
    }

    const wordCount = responseText.split(/\s+/).length;
    if (wordCount > 100 && wordCount < 500) {
      score += 0.05;
    } else if (wordCount > 1000) {
      score -= 0.05;
    }

    return Math.max(0, Math.min(1, score));
  }
}

export const feedbackService = new FeedbackService();
