/*
  # Fix Security and Performance Issues - Part 1: Indexes

  ## Missing Foreign Key Indexes (40 indexes)
    Add indexes for all foreign key columns to improve query performance.
    This dramatically improves JOIN performance and foreign key constraint checking.

  ## Tables Covered
    - access_requests, ai_feedback, ai_responses_log, clause_alternates
    - clauses, compliance_checks, contract_versions, contracts
    - discovery_docs, discovery_projects, document_templates
    - generated_documents, intake_requests, legal_sources, legal_updates
    - model_preferences, permissions, playbook_tests, playbooks
    - precedent_cases, prompts, research_queries, review_issues
    - review_sessions, tasks, user_roles, workflow_rules, workflow_tasks

  ## Important Notes
    - All changes are backward compatible
    - No data loss or structure changes
    - Only performance improvements
*/

-- access_requests
CREATE INDEX IF NOT EXISTS idx_access_requests_reviewed_by ON public.access_requests(reviewed_by);

-- ai_feedback
CREATE INDEX IF NOT EXISTS idx_ai_feedback_conversation_id ON public.ai_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_message_id ON public.ai_feedback(message_id);

-- ai_responses_log
CREATE INDEX IF NOT EXISTS idx_ai_responses_log_conversation_id ON public.ai_responses_log(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_log_message_id ON public.ai_responses_log(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_log_model_version_id ON public.ai_responses_log(model_version_id);

-- clause_alternates
CREATE INDEX IF NOT EXISTS idx_clause_alternates_fallback_to ON public.clause_alternates(fallback_to);

-- clauses
CREATE INDEX IF NOT EXISTS idx_clauses_created_by ON public.clauses(created_by);

-- compliance_checks
CREATE INDEX IF NOT EXISTS idx_compliance_checks_resolved_by ON public.compliance_checks(resolved_by);

-- contract_versions
CREATE INDEX IF NOT EXISTS idx_contract_versions_parent_version_id ON public.contract_versions(parent_version_id);
CREATE INDEX IF NOT EXISTS idx_contract_versions_uploaded_by ON public.contract_versions(uploaded_by);

-- contracts
CREATE INDEX IF NOT EXISTS idx_contracts_owner_id ON public.contracts(owner_id);

-- discovery_docs
CREATE INDEX IF NOT EXISTS idx_discovery_docs_contract_id ON public.discovery_docs(contract_id);

-- discovery_projects
CREATE INDEX IF NOT EXISTS idx_discovery_projects_created_by ON public.discovery_projects(created_by);

-- document_templates
CREATE INDEX IF NOT EXISTS idx_document_templates_created_by ON public.document_templates(created_by);

-- generated_documents
CREATE INDEX IF NOT EXISTS idx_generated_documents_contract_id ON public.generated_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_parent_document_id ON public.generated_documents(parent_document_id);

-- intake_requests
CREATE INDEX IF NOT EXISTS idx_intake_requests_assigned_to ON public.intake_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_intake_requests_created_by ON public.intake_requests(created_by);

-- legal_sources
CREATE INDEX IF NOT EXISTS idx_legal_sources_parent_version_id ON public.legal_sources(parent_version_id);

-- legal_updates
CREATE INDEX IF NOT EXISTS idx_legal_updates_source_id ON public.legal_updates(source_id);
CREATE INDEX IF NOT EXISTS idx_legal_updates_validated_by ON public.legal_updates(validated_by);

-- model_preferences
CREATE INDEX IF NOT EXISTS idx_model_preferences_preferred_model_id ON public.model_preferences(preferred_model_id);

-- permissions
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON public.permissions(role_id);

-- playbook_tests
CREATE INDEX IF NOT EXISTS idx_playbook_tests_contract_id ON public.playbook_tests(contract_id);
CREATE INDEX IF NOT EXISTS idx_playbook_tests_executed_by ON public.playbook_tests(executed_by);

-- playbooks
CREATE INDEX IF NOT EXISTS idx_playbooks_created_by ON public.playbooks(created_by);

-- precedent_cases
CREATE INDEX IF NOT EXISTS idx_precedent_cases_contract_id ON public.precedent_cases(contract_id);

-- prompts
CREATE INDEX IF NOT EXISTS idx_prompts_approved_by ON public.prompts(approved_by);
CREATE INDEX IF NOT EXISTS idx_prompts_created_by ON public.prompts(created_by);

-- research_queries
CREATE INDEX IF NOT EXISTS idx_research_queries_user_id ON public.research_queries(user_id);

-- review_issues
CREATE INDEX IF NOT EXISTS idx_review_issues_resolved_by ON public.review_issues(resolved_by);

-- review_sessions
CREATE INDEX IF NOT EXISTS idx_review_sessions_playbook_id ON public.review_sessions(playbook_id);
CREATE INDEX IF NOT EXISTS idx_review_sessions_version_id ON public.review_sessions(version_id);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_contract_id ON public.tasks(contract_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON public.tasks(assignee_id);

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

-- workflow_rules
CREATE INDEX IF NOT EXISTS idx_workflow_rules_created_by ON public.workflow_rules(created_by);

-- workflow_tasks
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_contract_id ON public.workflow_tasks(contract_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_id ON public.workflow_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON public.workflow_tasks(assigned_to);