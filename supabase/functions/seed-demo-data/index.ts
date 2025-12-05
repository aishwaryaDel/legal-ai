import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create demo user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'demo@tesa.com',
      password: 'demo123',
      email_confirm: true,
      user_metadata: { full_name: 'Demo User' },
    });

    if (authError && !authError.message.includes('already')) {
      throw authError;
    }

    const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'demo@tesa.com')?.id;

    if (!userId) {
      throw new Error('Failed to create or find demo user');
    }

    // Insert user profile
    await supabase.from('users').upsert({
      id: userId,
      email: 'demo@tesa.com',
      full_name: 'Demo User',
      locale: 'en',
      business_unit: 'Legal',
      region: 'EMEA',
      jurisdictions: ['DE', 'US', 'UK'],
    });

    // Assign counsel role
    const { data: roles } = await supabase.from('roles').select('id, name');
    const counselRole = roles?.find(r => r.name === 'counsel');
    
    if (counselRole) {
      await supabase.from('user_roles').upsert({
        user_id: userId,
        role_id: counselRole.id,
      }, { onConflict: 'user_id,role_id' });
      
      // Add permissions
      await supabase.from('permissions').upsert([
        { role_id: counselRole.id, module: 'repository', can_read: true, can_write: true },
        { role_id: counselRole.id, module: 'review', can_read: true, can_write: true },
        { role_id: counselRole.id, module: 'copilot', can_read: true, can_write: true },
        { role_id: counselRole.id, module: 'discovery', can_read: true, can_write: true },
      ], { onConflict: 'role_id,module' });
    }

    // Insert partners
    const { data: partners } = await supabase.from('partners').insert([
      {
        name: 'Acme Corp',
        legal_name: 'Acme Corporation GmbH',
        country: 'DE',
        jurisdiction: 'DE',
        risk_rating: 'medium',
      },
      {
        name: 'TechVendor Inc',
        legal_name: 'TechVendor Incorporated',
        country: 'US',
        jurisdiction: 'US',
        risk_rating: 'low',
      },
      {
        name: 'Global Supplies Ltd',
        legal_name: 'Global Supplies Limited',
        country: 'UK',
        jurisdiction: 'UK',
        risk_rating: 'high',
      },
    ]).select();

    if (!partners || partners.length === 0) {
      throw new Error('Failed to create partners');
    }

    // Insert partner stats
    await supabase.from('partner_stats').insert([
      {
        partner_id: partners[0].id,
        total_contracts: 12,
        active_contracts: 8,
        total_value: 2500000,
        avg_cycle_time_days: 14,
        high_risk_count: 2,
        pending_obligations: 3,
        last_contract_date: new Date('2024-10-01').toISOString(),
      },
      {
        partner_id: partners[1].id,
        total_contracts: 6,
        active_contracts: 4,
        total_value: 850000,
        avg_cycle_time_days: 8,
        high_risk_count: 0,
        pending_obligations: 1,
        last_contract_date: new Date('2024-09-15').toISOString(),
      },
      {
        partner_id: partners[2].id,
        total_contracts: 18,
        active_contracts: 10,
        total_value: 4200000,
        avg_cycle_time_days: 21,
        high_risk_count: 5,
        pending_obligations: 8,
        last_contract_date: new Date('2024-10-10').toISOString(),
      },
    ]);

    // Insert contracts
    const { data: contracts } = await supabase.from('contracts').insert([
      {
        title: 'Master Service Agreement - Acme Corp',
        contract_type: 'MSA',
        category: 'services',
        status: 'review',
        partner_id: partners[0].id,
        jurisdiction: 'DE',
        language: 'en',
        effective_date: '2024-11-01',
        expiration_date: '2027-10-31',
        value: 500000,
        owner_id: userId,
        business_unit: 'Legal',
        metadata: { risk: 'high' },
      },
      {
        title: 'Non-Disclosure Agreement - TechVendor',
        contract_type: 'NDA',
        category: 'confidentiality',
        status: 'active',
        partner_id: partners[1].id,
        jurisdiction: 'US',
        language: 'en',
        effective_date: '2024-01-15',
        expiration_date: '2027-01-14',
        owner_id: userId,
        business_unit: 'Legal',
      },
      {
        title: 'Data Processing Agreement - Global Supplies',
        contract_type: 'DPA',
        category: 'data_privacy',
        status: 'review',
        partner_id: partners[2].id,
        jurisdiction: 'UK',
        language: 'en',
        effective_date: '2024-12-01',
        value: 150000,
        owner_id: userId,
        business_unit: 'Legal',
        metadata: { risk: 'high' },
      },
    ]).select();

    if (!contracts || contracts.length === 0) {
      throw new Error('Failed to create contracts');
    }

    // Insert playbooks
    const { data: playbooks } = await supabase.from('playbooks').insert([
      {
        name: 'Standard NDA Review v2.3',
        description: 'Standard playbook for NDA review in DACH region',
        jurisdiction: 'DE',
        locale: 'en',
        contract_type: 'NDA',
        rules: {
          rules: [
            {
              id: '1',
              clauseType: 'confidentiality_period',
              operator: 'less_than',
              value: '3 years',
              severity: 'high',
              recommendation: 'Minimum 3 years required',
              rationale: 'Industry standard for trade secrets protection',
            },
            {
              id: '2',
              clauseType: 'unilateral_nda',
              operator: 'equals',
              value: 'true',
              severity: 'high',
              recommendation: 'Convert to mutual NDA',
              rationale: 'Company policy requires mutual obligations',
            },
          ],
        },
        created_by: userId,
      },
    ]).select();

    // Insert clauses
    const { data: clauses } = await supabase.from('clauses').insert([
      {
        title: 'Limitation of Liability - DE (Preferred)',
        content: 'The total liability of either party under this Agreement shall be limited to the greater of (i) the fees paid or payable in the twelve (12) months preceding the claim, or (ii) EUR 100,000.',
        category: 'liability',
        jurisdiction: 'DE',
        language: 'en',
        tags: ['liability', 'msa', 'de'],
        is_approved: true,
        usage_count: 24,
        created_by: userId,
      },
      {
        title: 'Confidentiality Obligation',
        content: 'Each party agrees to maintain in confidence all Confidential Information disclosed by the other party and to use such information solely for the purposes of this Agreement.',
        category: 'confidentiality',
        jurisdiction: 'DE',
        language: 'en',
        tags: ['confidentiality', 'nda', 'de'],
        is_approved: true,
        usage_count: 47,
        created_by: userId,
      },
    ]).select();

    if (clauses && clauses.length > 0) {
      // Insert alternates
      await supabase.from('clause_alternates').insert([
        {
          clause_id: clauses[0].id,
          title: 'Limitation of Liability - DE (Alternative 1)',
          content: 'The total liability shall not exceed 200% of the fees paid in the preceding twelve (12) months.',
          jurisdiction: 'DE',
          language: 'en',
          priority: 2,
        },
        {
          clause_id: clauses[0].id,
          title: 'Limitation of Liability - UK (Fallback)',
          content: 'Liability shall be limited to £250,000 or the contract value, whichever is greater.',
          jurisdiction: 'UK',
          language: 'en',
          priority: 3,
        },
      ]);
    }

    // Insert tasks
    await supabase.from('tasks').insert([
      {
        title: 'Review MSA - Acme Corp',
        description: 'High-value MSA requires review before Nov 1st',
        type: 'review',
        status: 'pending',
        priority: 'high',
        assignee_id: userId,
        contract_id: contracts[0].id,
        due_date: new Date('2024-10-25').toISOString(),
        created_by: userId,
      },
      {
        title: 'Review DPA - Global Supplies',
        description: 'Data privacy agreement needs compliance review',
        type: 'review',
        status: 'pending',
        priority: 'high',
        assignee_id: userId,
        contract_id: contracts[2].id,
        due_date: new Date('2024-10-28').toISOString(),
        created_by: userId,
      },
    ]);

    // Insert discovery project
    await supabase.from('discovery_projects').insert([
      {
        name: 'Q3 2024 Vendor Contracts Analysis',
        description: 'Batch analysis of vendor contracts for compliance',
        status: 'queued',
        created_by: userId,
        doc_count: 0,
        max_docs: 100,
        progress: 0,
      },
    ]);

    return new Response(
      JSON.stringify({ success: true, message: 'Demo data seeded successfully', userId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Seed error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});