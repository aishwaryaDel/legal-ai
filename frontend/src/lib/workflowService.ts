import { supabase } from './supabase';

export interface WorkflowRule {
  id?: string;
  name: string;
  contract_types: string[];
  jurisdictions: string[];
  conditions: {
    risk_score_threshold?: number;
    clause_types?: string[];
    contract_value_threshold?: number;
    requires_legal_review?: boolean;
    custom_conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  actions: {
    route_to?: string[];
    escalate_to?: string[];
    notify?: string[];
    auto_approve?: boolean;
    require_approval_count?: number;
    compliance_checks?: string[];
  };
  priority: number;
  is_active: boolean;
}

export interface ComplianceCheck {
  id?: string;
  contract_id: string;
  check_type: 'playbook' | 'legal_requirement' | 'policy' | 'custom';
  check_name: string;
  status: 'passed' | 'failed' | 'warning' | 'pending' | 'skipped';
  details: {
    violations?: Array<{
      clause: string;
      issue: string;
      recommendation: string;
    }>;
    warnings?: string[];
    passed_checks?: string[];
    metadata?: any;
  };
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  auto_resolved: boolean;
  resolved_by?: string;
  checked_at?: string;
}

export interface WorkflowTask {
  id?: string;
  workflow_id: string;
  contract_id: string;
  assigned_to: string;
  task_type: 'review' | 'approve' | 'negotiate' | 'update' | 'sign' | 'archive';
  title: string;
  description?: string;
  due_date?: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'escalated' | 'cancelled';
  dependencies: string[];
  reminders_sent: number;
  completed_at?: string;
}

class WorkflowService {
  async evaluateWorkflowRules(contractData: {
    id: string;
    contract_type: string;
    jurisdiction: string;
    risk_score?: number;
    clause_types?: string[];
    value?: number;
  }): Promise<WorkflowRule[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      if (!data) return [];

      const matchingRules = data.filter(rule => {
        if (rule.contract_types.length > 0 && !rule.contract_types.includes(contractData.contract_type)) {
          return false;
        }

        if (rule.jurisdictions.length > 0 && !rule.jurisdictions.includes(contractData.jurisdiction)) {
          return false;
        }

        const conditions = rule.conditions as WorkflowRule['conditions'];

        if (conditions.risk_score_threshold && contractData.risk_score) {
          if (contractData.risk_score < conditions.risk_score_threshold) {
            return false;
          }
        }

        if (conditions.contract_value_threshold && contractData.value) {
          if (contractData.value < conditions.contract_value_threshold) {
            return false;
          }
        }

        if (conditions.clause_types && contractData.clause_types) {
          const hasRequiredClause = conditions.clause_types.some(ct =>
            contractData.clause_types?.includes(ct)
          );
          if (!hasRequiredClause) {
            return false;
          }
        }

        return true;
      });

      return matchingRules as WorkflowRule[];
    } catch (error) {
      console.error('Error evaluating workflow rules:', error);
      return [];
    }
  }

  async createWorkflowRule(rule: WorkflowRule): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('workflow_rules')
        .insert({
          name: rule.name,
          contract_types: rule.contract_types,
          jurisdictions: rule.jurisdictions,
          conditions: rule.conditions,
          actions: rule.actions,
          priority: rule.priority,
          is_active: rule.is_active,
          created_by: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating workflow rule:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async runComplianceChecks(contractId: string, contractData: {
    content: string;
    contract_type: string;
    jurisdiction: string;
    clauses?: any[];
  }): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];

    const requiredClausesCheck = await this.checkRequiredClauses(contractId, contractData);
    checks.push(requiredClausesCheck);

    const riskClausesCheck = await this.checkHighRiskClauses(contractId, contractData);
    checks.push(riskClausesCheck);

    const dataProtectionCheck = await this.checkDataProtectionCompliance(contractId, contractData);
    checks.push(dataProtectionCheck);

    const jurisdictionCheck = await this.checkJurisdictionCompliance(contractId, contractData);
    checks.push(jurisdictionCheck);

    try {
      const { error } = await supabase
        .from('compliance_checks')
        .insert(checks.map(check => ({
          contract_id: check.contract_id,
          check_type: check.check_type,
          check_name: check.check_name,
          status: check.status,
          details: check.details,
          severity: check.severity,
          auto_resolved: check.auto_resolved,
        })));

      if (error) throw error;
    } catch (error) {
      console.error('Error saving compliance checks:', error);
    }

    return checks;
  }

  private async checkRequiredClauses(contractId: string, contractData: any): Promise<ComplianceCheck> {
    const requiredClausesByType: Record<string, string[]> = {
      'NDA': ['confidentiality', 'term', 'governing_law'],
      'MSA': ['scope', 'payment_terms', 'termination', 'liability', 'governing_law'],
      'SOW': ['deliverables', 'timeline', 'payment_terms', 'acceptance_criteria'],
      'EMPLOYMENT': ['job_description', 'compensation', 'termination', 'confidentiality'],
    };

    const requiredClauses = requiredClausesByType[contractData.contract_type] || [];
    const presentClauses = contractData.clauses?.map((c: any) => c.type) || [];

    const missingClauses = requiredClauses.filter(rc => !presentClauses.includes(rc));

    return {
      contract_id: contractId,
      check_type: 'legal_requirement',
      check_name: 'Required Clauses Check',
      status: missingClauses.length === 0 ? 'passed' : 'failed',
      details: {
        violations: missingClauses.map(clause => ({
          clause,
          issue: `Missing required clause: ${clause}`,
          recommendation: `Add ${clause} clause to the contract`,
        })),
        passed_checks: presentClauses,
      },
      severity: missingClauses.length > 0 ? 'high' : 'info',
      auto_resolved: false,
    };
  }

  private async checkHighRiskClauses(contractId: string, contractData: any): Promise<ComplianceCheck> {
    const riskKeywords = [
      { keyword: 'unlimited liability', severity: 'critical' as const },
      { keyword: 'perpetual', severity: 'high' as const },
      { keyword: 'irrevocable', severity: 'high' as const },
      { keyword: 'non-compete', severity: 'medium' as const },
      { keyword: 'indemnify', severity: 'medium' as const },
    ];

    const foundRisks: Array<{ clause: string; issue: string; recommendation: string }> = [];

    riskKeywords.forEach(({ keyword, severity }) => {
      if (contractData.content.toLowerCase().includes(keyword)) {
        foundRisks.push({
          clause: keyword,
          issue: `High-risk keyword detected: ${keyword}`,
          recommendation: `Review and assess the implications of "${keyword}" clause`,
        });
      }
    });

    return {
      contract_id: contractId,
      check_type: 'policy',
      check_name: 'High-Risk Clauses Check',
      status: foundRisks.length === 0 ? 'passed' : 'warning',
      details: {
        violations: foundRisks,
        warnings: foundRisks.map(r => r.issue),
      },
      severity: foundRisks.length > 0 ? 'high' : 'info',
      auto_resolved: false,
    };
  }

  private async checkDataProtectionCompliance(contractId: string, contractData: any): Promise<ComplianceCheck> {
    const gdprKeywords = ['personal data', 'data protection', 'gdpr', 'privacy', 'data processing'];
    const hasDataProcessing = gdprKeywords.some(kw =>
      contractData.content.toLowerCase().includes(kw)
    );

    const requiredDataClauses = [
      'data protection officer',
      'data breach notification',
      'data subject rights',
      'processing agreement',
    ];

    const violations: Array<{ clause: string; issue: string; recommendation: string }> = [];

    if (hasDataProcessing && contractData.jurisdiction.includes('EU')) {
      requiredDataClauses.forEach(clause => {
        if (!contractData.content.toLowerCase().includes(clause.toLowerCase())) {
          violations.push({
            clause,
            issue: `Missing GDPR-required clause: ${clause}`,
            recommendation: `Add ${clause} clause to ensure GDPR compliance`,
          });
        }
      });
    }

    return {
      contract_id: contractId,
      check_type: 'legal_requirement',
      check_name: 'GDPR/Data Protection Compliance',
      status: violations.length === 0 ? 'passed' : 'failed',
      details: {
        violations,
        metadata: {
          jurisdiction: contractData.jurisdiction,
          has_data_processing: hasDataProcessing,
        },
      },
      severity: violations.length > 0 ? 'critical' : 'info',
      auto_resolved: false,
    };
  }

  private async checkJurisdictionCompliance(contractId: string, contractData: any): Promise<ComplianceCheck> {
    const warnings: string[] = [];

    if (contractData.jurisdiction === 'DACH' || contractData.jurisdiction === 'EU') {
      if (!contractData.content.toLowerCase().includes('governing law')) {
        warnings.push('No explicit governing law clause found');
      }

      if (!contractData.content.toLowerCase().includes('jurisdiction')) {
        warnings.push('No jurisdiction/venue clause found');
      }
    }

    return {
      contract_id: contractId,
      check_type: 'legal_requirement',
      check_name: 'Jurisdiction-Specific Compliance',
      status: warnings.length === 0 ? 'passed' : 'warning',
      details: {
        warnings,
        metadata: {
          jurisdiction: contractData.jurisdiction,
        },
      },
      severity: warnings.length > 0 ? 'medium' : 'info',
      auto_resolved: false,
    };
  }

  async createTask(task: Omit<WorkflowTask, 'id'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('workflow_tasks')
        .insert({
          workflow_id: task.workflow_id,
          contract_id: task.contract_id,
          assigned_to: task.assigned_to,
          task_type: task.task_type,
          title: task.title,
          description: task.description,
          due_date: task.due_date,
          priority: task.priority,
          status: task.status,
          dependencies: task.dependencies,
          reminders_sent: task.reminders_sent,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, id: data.id };
    } catch (error) {
      console.error('Error creating workflow task:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async getUserTasks(userId: string): Promise<WorkflowTask[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_tasks')
        .select('*')
        .eq('assigned_to', userId)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  async updateTaskStatus(
    taskId: string,
    status: WorkflowTask['status']
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('workflow_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating task status:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  async checkTaskDependencies(taskId: string): Promise<boolean> {
    try {
      const { data: task, error } = await supabase
        .from('workflow_tasks')
        .select('dependencies')
        .eq('id', taskId)
        .single();

      if (error) throw error;

      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }

      const { data: dependencyTasks, error: depError } = await supabase
        .from('workflow_tasks')
        .select('status')
        .in('id', task.dependencies);

      if (depError) throw depError;

      const allCompleted = dependencyTasks?.every(dt => dt.status === 'completed') || false;

      return allCompleted;
    } catch (error) {
      console.error('Error checking task dependencies:', error);
      return false;
    }
  }
}

export const workflowService = new WorkflowService();
