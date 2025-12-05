import { supabase } from './supabase';

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  document_type: string;
  category: string;
  jurisdictions: string[];
  languages: string[];
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface TemplateSection {
  id: string;
  template_id: string;
  name: string;
  description: string;
  display_order: number;
  is_required: boolean;
  section_type: string;
  placeholder_text: string;
  help_text: string;
  metadata: Record<string, unknown>;
}

export interface SectionClauseOption {
  id: string;
  section_id: string;
  clause_id: string;
  display_order: number;
  is_recommended: boolean;
  risk_level: string;
  usage_frequency: number;
  compatibility_notes: string;
  metadata: Record<string, unknown>;
  clause?: {
    id: string;
    title: string;
    content: string;
    category: string;
    jurisdiction: string;
    language: string;
    tags: string[];
    usage_count: number;
  };
}

export interface GeneratedDocument {
  id?: string;
  template_id: string;
  user_id: string;
  title: string;
  document_type: string;
  jurisdiction: string;
  language: string;
  status: string;
  content_html: string;
  content_json: Record<string, unknown>;
  selected_clauses: SelectedClause[];
  metadata: Record<string, unknown>;
  party_a?: string;
  party_b?: string;
  effective_date?: string;
  completeness_score: number;
  risk_assessment: Record<string, unknown>;
  contract_id?: string;
  version: number;
}

export interface SelectedClause {
  section_id: string;
  section_name: string;
  clause_id: string;
  clause_title: string;
  clause_content: string;
  customizations?: string;
}

export const documentBuilderService = {
  async getActiveTemplates() {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as DocumentTemplate[];
  },

  async getTemplateById(templateId: string) {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();

    if (error) throw error;
    return data as DocumentTemplate | null;
  },

  async getTemplateSections(templateId: string) {
    const { data, error } = await supabase
      .from('template_sections')
      .select('*')
      .eq('template_id', templateId)
      .order('display_order');

    if (error) throw error;
    return data as TemplateSection[];
  },

  async getSectionClauseOptions(sectionId: string) {
    const { data, error } = await supabase
      .from('section_clause_options')
      .select(`
        *,
        clause:clauses(
          id,
          title,
          content,
          category,
          jurisdiction,
          language,
          tags,
          usage_count
        )
      `)
      .eq('section_id', sectionId)
      .order('display_order');

    if (error) throw error;
    return data as SectionClauseOption[];
  },

  async saveGeneratedDocument(document: GeneratedDocument) {
    const { data, error } = await supabase
      .from('generated_documents')
      .insert(document)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateGeneratedDocument(id: string, updates: Partial<GeneratedDocument>) {
    const { data, error } = await supabase
      .from('generated_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getGeneratedDocument(id: string) {
    const { data, error } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as GeneratedDocument | null;
  },

  async getUserDocuments(userId: string, status?: string) {
    let query = supabase
      .from('generated_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as GeneratedDocument[];
  },

  async logDocumentExport(documentId: string, userId: string, format: string, fileName: string) {
    const { data, error } = await supabase
      .from('document_exports')
      .insert({
        document_id: documentId,
        user_id: userId,
        export_format: format,
        file_name: fileName,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  generateDocumentHTML(
    template: DocumentTemplate,
    selectedClauses: SelectedClause[],
    metadata: { party_a?: string; party_b?: string; effective_date?: string; jurisdiction?: string }
  ): string {
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${template.name}</title>
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 8.5in;
      margin: 1in auto;
      padding: 0 0.5in;
    }
    h1 {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin-bottom: 1em;
      text-transform: uppercase;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    p {
      margin-bottom: 1em;
      text-align: justify;
    }
    .metadata {
      margin-bottom: 2em;
    }
  </style>
</head>
<body>
  <h1>${template.name}</h1>
  <div class="metadata">`;

    if (metadata.party_a && metadata.party_b) {
      html += `<p>This ${template.document_type} is entered into`;
      if (metadata.effective_date) {
        html += ` as of ${metadata.effective_date}`;
      }
      html += ` by and between <strong>${metadata.party_a}</strong> ("Party A") and <strong>${metadata.party_b}</strong> ("Party B").</p>`;
    }

    if (metadata.jurisdiction) {
      html += `<p>Jurisdiction: <strong>${metadata.jurisdiction}</strong></p>`;
    }

    html += `</div>`;

    selectedClauses.forEach((selected) => {
      html += `
  <h2>${selected.section_name}</h2>
  <p>${selected.customizations || selected.clause_content}</p>`;
    });

    html += `
</body>
</html>`;

    return html;
  },

  calculateCompletenessScore(sections: TemplateSection[], selectedClauses: SelectedClause[]): number {
    const requiredSections = sections.filter(s => s.is_required);
    const selectedSectionIds = selectedClauses.map(c => c.section_id);
    const completedRequired = requiredSections.filter(s => selectedSectionIds.includes(s.id)).length;

    if (requiredSections.length === 0) return 100;
    return Math.round((completedRequired / requiredSections.length) * 100);
  },
};
