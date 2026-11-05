// Helper for CSV escaping
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

// Qualtrics 3-Header Columns Specification
export const QUALTRICS_SCHEMA = [
  // 1. Meta / System
  { id: 'respondent_id', label: 'Response ID', importId: '{"ImportId":"_recordId"}' },
  { id: 'timestamp', label: 'Recorded Date', importId: '{"ImportId":"recordedDate"}' },
  { id: 'status', label: 'Survey Response Status', importId: '{"ImportId":"status"}' },
  { id: 'duration_seconds', label: 'Duration (in seconds)', importId: '{"ImportId":"duration"}' },
  { id: 'ip_address', label: 'IP Address', importId: '{"ImportId":"ipAddress"}' },
  { id: 'location', label: 'Location Coordinates / City', importId: '{"ImportId":"location"}' },

  // 2. Demographics & Screening
  { id: 'q1_age', label: 'Q1. How old are you? (Years)', importId: '{"ImportId":"QID1"}' },
  { id: 'q2_country', label: 'Q2. In which country do you currently live?', importId: '{"ImportId":"QID2"}' },
  { id: 'q2a_status', label: 'Q2a. Which best describes your status in Singapore?', importId: '{"ImportId":"QID2a"}' },
  { id: 'q2b_citizenship', label: 'Q2b. Country of citizenship (International)', importId: '{"ImportId":"QID2b"}' },
  { id: 'is_international', label: 'Is International Student (Derived)', importId: '{"ImportId":"is_international"}' },
  { id: 'q3_gender', label: 'Q3. How do you describe your gender?', importId: '{"ImportId":"QID3"}' },
  { id: 'q4_schooling', label: 'Q4. Current Schooling Institution', importId: '{"ImportId":"QID4"}' },
  { id: 'q5_current_level', label: 'Q5. Current School Year / Grade Level', importId: '{"ImportId":"QID5"}' },

  // 3. Q6 Tuition Category Grid
  { id: 'q6_academic_tuition', label: 'Q6_1. Academic subject tuition or tutoring', importId: '{"ImportId":"QID6_1"}' },
  { id: 'q6_exam_prep', label: 'Q6_2. Examination or test-preparation services', importId: '{"ImportId":"QID6_2"}' },
  { id: 'q6_academic_enrichment', label: 'Q6_3. Academic-based enrichment', importId: '{"ImportId":"QID6_3"}' },
  { id: 'q6_hobby_enrichment', label: 'Q6_4. Hobby or skill-based enrichment', importId: '{"ImportId":"QID6_4"}' },

  // 4. Q6b Multi-Select Subjects (Binary 0/1 Dummies for Q / SPSS "Pick Any")
  { id: 'q6b_math', label: 'Q6b_1. Active Subject: Mathematics or Additional Mathematics', importId: '{"ImportId":"QID6b_1"}' },
  { id: 'q6b_english', label: 'Q6b_2. Active Subject: English Language or General Paper', importId: '{"ImportId":"QID6b_2"}' },
  { id: 'q6b_sciences', label: 'Q6b_3. Active Subject: Biology, Chemistry or Physics', importId: '{"ImportId":"QID6b_3"}' },
  { id: 'q6b_humanities', label: 'Q6b_4. Active Subject: Humanities (Geog, Hist, SS, Lit)', importId: '{"ImportId":"QID6b_4"}' },
  { id: 'q6b_economics', label: 'Q6b_5. Active Subject: Economics or Business Management', importId: '{"ImportId":"QID6b_5"}' },
  { id: 'q6b_olevel_prep', label: 'Q6b_6. Active Subject: O-Level or N-Level preparation', importId: '{"ImportId":"QID6b_6"}' },
  { id: 'q6b_alevel_prep', label: 'Q6b_7. Active Subject: A-Level or H2 subject preparation', importId: '{"ImportId":"QID6b_7"}' },
  { id: 'q6b_study_skills', label: 'Q6b_8. Active Subject: Study skills, note-taking & revision strategy', importId: '{"ImportId":"QID6b_8"}' },

  // 5. Frequency & Decision Role
  { id: 'q7_weekly_hours', label: 'Q7. Approximate weekly hours spent across all paid services', importId: '{"ImportId":"QID7"}' },
  { id: 'q8_decision_role', label: 'Q8. Who usually decides which provider you attend?', importId: '{"ImportId":"QID8"}' },

  // 6. Unaided Recall
  { id: 'q9_unaided_1', label: 'Q9_1. Unaided Brand Recall - Mention 1', importId: '{"ImportId":"QID9_1"}' },
  { id: 'q9_unaided_2', label: 'Q9_2. Unaided Brand Recall - Mention 2', importId: '{"ImportId":"QID9_2"}' },
  { id: 'q9_unaided_3', label: 'Q9_3. Unaided Brand Recall - Mention 3', importId: '{"ImportId":"QID9_3"}' },

  // 7. Q10 Provider Awareness Grid (Key Commercial Centres)
  { id: 'q10_zenith', label: 'Q10_1. Provider Relationship: Zenith tuition group', importId: '{"ImportId":"QID10_1"}' },
  { id: 'q10_the_learning_lab', label: 'Q10_2. Provider Relationship: The Learning Lab', importId: '{"ImportId":"QID10_2"}' },
  { id: 'q10_aspire_hub', label: 'Q10_3. Provider Relationship: Aspire Hub Education', importId: '{"ImportId":"QID10_3"}' },
  { id: 'q10_mind_stretcher', label: 'Q10_4. Provider Relationship: Mind Stretcher', importId: '{"ImportId":"QID10_4"}' },
  { id: 'q10_indigo', label: 'Q10_5. Provider Relationship: Indigo Education Group', importId: '{"ImportId":"QID10_5"}' },
  { id: 'q10_mavis', label: 'Q10_6. Provider Relationship: Mavis Tutorial Centre', importId: '{"ImportId":"QID10_6"}' },
  { id: 'q10_private_tutor', label: 'Q10_7. Provider Relationship: Independent/private tutor', importId: '{"ImportId":"QID10_7"}' },

  // 8. Primary Provider & Zenith Metrics
  { id: 'primary_provider', label: 'Primary Provider (Main provider relied on most)', importId: '{"ImportId":"primary_provider"}' },
  { id: 'brand_loop_providers', label: 'Evaluated Providers in Brand Loop', importId: '{"ImportId":"brand_loop"}' },
  { id: 'q16_zenith_csat', label: 'Q16_Zenith. Overall satisfaction with Zenith tuition group', importId: '{"ImportId":"QID16_ZEN"}' },
  { id: 'q17_zenith_nps', label: 'Q17_Zenith. Likelihood to recommend Zenith (0-10 NPS)', importId: '{"ImportId":"QID17_ZEN"}' },
  { id: 'zenith_nps_group', label: 'Zenith Net Promoter Segment (Promoter/Passive/Detractor)', importId: '{"ImportId":"zenith_segment"}' },
  { id: 'q18_zenith_reason', label: 'Q18_Zenith. Why did you give this recommendation score?', importId: '{"ImportId":"QID18_ZEN"}' },

  // Primary Provider Metrics
  { id: 'q16_primary_csat', label: 'Q16_Primary. Overall satisfaction with Primary Provider', importId: '{"ImportId":"QID16_PRI"}' },
  { id: 'q17_primary_nps', label: 'Q17_Primary. Likelihood to recommend Primary Provider (0-10 NPS)', importId: '{"ImportId":"QID17_PRI"}' },
  { id: 'primary_nps_group', label: 'Primary Net Promoter Segment (Promoter/Passive/Detractor)', importId: '{"ImportId":"primary_segment"}' },
  { id: 'q18_primary_reason', label: 'Q18_Primary. Reason for recommendation score', importId: '{"ImportId":"QID18_PRI"}' },

  // 9. Q14 Ranked Choice Criteria (KPC)
  { id: 'q14_kpc_rank1', label: 'Q14_1. Provider Choice Factor - Ranked #1 Most Important', importId: '{"ImportId":"QID14_1"}' },
  { id: 'q14_kpc_rank2', label: 'Q14_2. Provider Choice Factor - Ranked #2', importId: '{"ImportId":"QID14_2"}' },
  { id: 'q14_kpc_rank3', label: 'Q14_3. Provider Choice Factor - Ranked #3', importId: '{"ImportId":"QID14_3"}' },
  { id: 'q14_kpc_rank4', label: 'Q14_4. Provider Choice Factor - Ranked #4', importId: '{"ImportId":"QID14_4"}' },
  { id: 'q14_kpc_rank5', label: 'Q14_5. Provider Choice Factor - Ranked #5', importId: '{"ImportId":"QID14_5"}' },

  // 10. Retention & Switching
  { id: 'q19_zenith_continue', label: 'Q19_Zenith. Likelihood to continue with Zenith next 12 months', importId: '{"ImportId":"QID19_ZEN"}' },
  { id: 'q19_primary_continue', label: 'Q19_Primary. Likelihood to continue with Primary next 12 months', importId: '{"ImportId":"QID19_PRI"}' },
  { id: 'q22_switched_12m', label: 'Q22. Switched from one provider to another in past 12 months?', importId: '{"ImportId":"QID22"}' },
  { id: 'q23_switched_from', label: 'Q23. Previous provider used before switching', importId: '{"ImportId":"QID23"}' },

  // Switching Barriers (Binary 0/1 Dummies for Q / SPSS)
  { id: 'q25_barrier_satisfied', label: 'Q25_1. Barrier: Satisfied with teaching & progress', importId: '{"ImportId":"QID25_1"}' },
  { id: 'q25_barrier_relationship', label: 'Q25_2. Barrier: Good relationship with tutor/instructor', importId: '{"ImportId":"QID25_2"}' },
  { id: 'q25_barrier_tutor_needs', label: 'Q25_3. Barrier: Tutor understands my learning needs', importId: '{"ImportId":"QID25_3"}' },
  { id: 'q25_barrier_no_disrupt', label: 'Q25_4. Barrier: Do not want to disrupt learning or exam prep', importId: '{"ImportId":"QID25_4"}' },
  { id: 'q25_barrier_convenient', label: 'Q25_5. Barrier: Location or schedule is convenient', importId: '{"ImportId":"QID25_5"}' },

  // 11. Tutor vs Brand Preferences
  { id: 'q26_tutor_vs_brand', label: 'Q26. Preference driven more by specific tutor or provider brand?', importId: '{"ImportId":"QID26"}' },

  // Tutor traits (Binary 0/1)
  { id: 'q27_trait_explain_clearly', label: 'Q27_1. Tutor Trait: Ability to explain clearly', importId: '{"ImportId":"QID27_1"}' },
  { id: 'q27_trait_knowledge', label: 'Q27_2. Tutor Trait: Strong subject knowledge', importId: '{"ImportId":"QID27_2"}' },
  { id: 'q27_trait_engaging', label: 'Q27_3. Tutor Trait: Engaging teaching style', importId: '{"ImportId":"QID27_3"}' },
  { id: 'q27_trait_patience', label: 'Q27_4. Tutor Trait: Patience and encouragement', importId: '{"ImportId":"QID27_4"}' },
  { id: 'q27_trait_exam_req', label: 'Q27_5. Tutor Trait: Understanding of exam requirements', importId: '{"ImportId":"QID27_5"}' },

  // Premium justifications (Binary 0/1)
  { id: 'q28_prem_smaller_class', label: 'Q28_1. Premium Fee: Smaller classes or personal attention', importId: '{"ImportId":"QID28_1"}' },
  { id: 'q28_prem_skilled_tutors', label: 'Q28_2. Premium Fee: More experienced or skilled tutors', importId: '{"ImportId":"QID28_2"}' },
  { id: 'q28_prem_results', label: 'Q28_3. Premium Fee: Strong record of improving results', importId: '{"ImportId":"QID28_3"}' },
  { id: 'q28_prem_materials', label: 'Q28_4. Premium Fee: Better notes, materials or technology', importId: '{"ImportId":"QID28_4"}' },

  // 12. Future Programmes Interest (Binary 0/1)
  { id: 'q29_prog_ai', label: 'Q29_1. Programme Interest: Practical use of AI for study & productivity', importId: '{"ImportId":"QID29_1"}' },
  { id: 'q29_prog_coding', label: 'Q29_2. Programme Interest: Coding and app/web development', importId: '{"ImportId":"QID29_2"}' },
  { id: 'q29_prog_data', label: 'Q29_3. Programme Interest: Data analytics & digital skills', importId: '{"ImportId":"QID29_3"}' },
  { id: 'q29_prog_speaking', label: 'Q29_4. Programme Interest: Public speaking, debate & presentation', importId: '{"ImportId":"QID29_4"}' },
  { id: 'q29_prog_entrepreneurship', label: 'Q29_5. Programme Interest: Entrepreneurship & financial literacy', importId: '{"ImportId":"QID29_5"}' },

  // Enrolment Likelihood (Q30)
  { id: 'q30_ai_enrolment', label: 'Q30_1. Enrolment Likelihood: AI for study programme', importId: '{"ImportId":"QID30_1"}' },
  { id: 'q30_coding_enrolment', label: 'Q30_2. Enrolment Likelihood: Coding/app development programme', importId: '{"ImportId":"QID30_2"}' },
  { id: 'q30_data_enrolment', label: 'Q30_3. Enrolment Likelihood: Data analytics programme', importId: '{"ImportId":"QID30_3"}' },
  { id: 'q30_speaking_enrolment', label: 'Q30_4. Enrolment Likelihood: Public speaking programme', importId: '{"ImportId":"QID30_4"}' }
];

export function flattenResponseForQualtrics(r) {
  const ans = r.answers || {};
  const q6 = ans.q6_matrix || {};
  const getQ6 = (term) => {
    for (const [k, v] of Object.entries(q6)) {
      if (k.toLowerCase().includes(term.toLowerCase())) return v;
    }
    return '';
  };

  const q6b = ans.q6b_types || [];
  const hasSubj = (term) => q6b.some(s => s.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;

  const q10 = ans.q10_grid || {};
  const evals = ans.brand_evaluations || {};
  const zenithEval = evals['Zenith tuition group'] || {};
  const primaryProv = ans.primary_provider || '';
  const primaryEval = evals[primaryProv] || {};

  const getNpsGroup = (nps) => {
    if (nps === undefined || nps === null || nps === '') return '';
    const n = Number(nps);
    if (n >= 9) return 'Promoter';
    if (n >= 7) return 'Passive';
    return 'Detractor';
  };

  const kpcs = ans.q14_ranked_kpcs || [];
  const barriers = ans.q25_barriers || [];
  const hasBarrier = (term) => barriers.some(b => b.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;

  const traits = ans.q27_tutor_traits || [];
  const hasTrait = (term) => traits.some(t => t.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;

  const prems = ans.q28_premium || [];
  const hasPrem = (term) => prems.some(p => p.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;

  const progs = ans.q29_programmes || [];
  const hasProg = (term) => progs.some(p => p.toLowerCase().includes(term.toLowerCase())) ? 1 : 0;

  const q30 = ans.q30_enrolment || {};

  return {
    respondent_id: r.id || '',
    timestamp: r.timestamp || new Date().toISOString(),
    status: r.status || 'QUALIFIED',
    duration_seconds: r.duration_seconds || 0,
    ip_address: r.ip_address || '',
    location: r.location || '',

    q1_age: ans.q1_age ?? '',
    q2_country: ans.q2_country ?? '',
    q2a_status: ans.q2a_status ?? '',
    q2b_citizenship: ans.q2b_citizenship ?? '',
    is_international: (r.flags?.isInternational || r.flags?.is_international) ? 'YES' : 'NO',
    q3_gender: ans.q3_gender ?? '',
    q4_schooling: ans.q4_schooling ?? '',
    q5_current_level: ans.q5_level ?? '',

    q6_academic_tuition: getQ6('Academic subject tuition'),
    q6_exam_prep: getQ6('Examination or test-prep'),
    q6_academic_enrichment: getQ6('Academic-based enrichment'),
    q6_hobby_enrichment: getQ6('Hobby or skill-based enrichment'),

    q6b_math: hasSubj('Mathematics'),
    q6b_english: hasSubj('English'),
    q6b_sciences: hasSubj('Biology') || hasSubj('Chemistry') || hasSubj('Physics') ? 1 : 0,
    q6b_humanities: hasSubj('Humanities'),
    q6b_economics: hasSubj('Economics'),
    q6b_olevel_prep: hasSubj('O-Level') || hasSubj('N-Level') ? 1 : 0,
    q6b_alevel_prep: hasSubj('A-Level') || hasSubj('H2') ? 1 : 0,
    q6b_study_skills: hasSubj('Study skills'),

    q7_weekly_hours: ans.q7_hours ?? '',
    q8_decision_role: ans.q8_decision_role ?? '',

    q9_unaided_1: ans.q9_unaided?.[0] ?? '',
    q9_unaided_2: ans.q9_unaided?.[1] ?? '',
    q9_unaided_3: ans.q9_unaided?.[2] ?? '',

    q10_zenith: q10['Zenith tuition group'] ?? '',
    q10_the_learning_lab: q10['The Learning Lab'] ?? '',
    q10_aspire_hub: q10['Aspire Hub Education'] ?? '',
    q10_mind_stretcher: q10['Mind Stretcher'] ?? '',
    q10_indigo: q10['Indigo Education Group'] ?? '',
    q10_mavis: q10['Mavis Tutorial Centre'] ?? '',
    q10_private_tutor: q10['Independent/private tutor'] ?? '',

    primary_provider: primaryProv,
    brand_loop_providers: Array.isArray(r.brand_loop) ? r.brand_loop.join('; ') : '',

    q16_zenith_csat: zenithEval.q16_csat ?? '',
    q17_zenith_nps: zenithEval.q17_nps ?? '',
    zenith_nps_group: getNpsGroup(zenithEval.q17_nps),
    q18_zenith_reason: zenithEval.q18_reason ?? '',

    q16_primary_csat: primaryEval.q16_csat ?? '',
    q17_primary_nps: primaryEval.q17_nps ?? '',
    primary_nps_group: getNpsGroup(primaryEval.q17_nps),
    q18_primary_reason: primaryEval.q18_reason ?? '',

    q14_kpc_rank1: kpcs[0] ?? '',
    q14_kpc_rank2: kpcs[1] ?? '',
    q14_kpc_rank3: kpcs[2] ?? '',
    q14_kpc_rank4: kpcs[3] ?? '',
    q14_kpc_rank5: kpcs[4] ?? '',

    q19_zenith_continue: ans.q19_continue?.['Zenith tuition group'] ?? '',
    q19_primary_continue: ans.q19_continue?.[primaryProv] ?? '',
    q22_switched_12m: ans.q22_switched ?? '',
    q23_switched_from: ans.q23_switched_from ?? '',

    q25_barrier_satisfied: hasBarrier('satisfied'),
    q25_barrier_relationship: hasBarrier('good relationship'),
    q25_barrier_tutor_needs: hasBarrier('understands my learning'),
    q25_barrier_no_disrupt: hasBarrier('disrupt'),
    q25_barrier_convenient: hasBarrier('convenient'),

    q26_tutor_vs_brand: ans.q26_tutor_vs_brand ?? '',

    q27_trait_explain_clearly: hasTrait('explain clearly'),
    q27_trait_knowledge: hasTrait('strong subject knowledge'),
    q27_trait_engaging: hasTrait('engaging'),
    q27_trait_patience: hasTrait('patience'),
    q27_trait_exam_req: hasTrait('examination requirements'),

    q28_prem_smaller_class: hasPrem('smaller class'),
    q28_prem_skilled_tutors: hasPrem('experienced or highly skilled'),
    q28_prem_results: hasPrem('improving students'),
    q28_prem_materials: hasPrem('better notes'),

    q29_prog_ai: hasProg('ai for study'),
    q29_prog_coding: hasProg('coding'),
    q29_prog_data: hasProg('data analytics'),
    q29_prog_speaking: hasProg('public speaking'),
    q29_prog_entrepreneurship: hasProg('entrepreneurship'),

    q30_ai_enrolment: q30['Practical use of AI for study and productivity'] ?? '',
    q30_coding_enrolment: q30['Coding and app or website development'] ?? '',
    q30_data_enrolment: q30['Data analytics and digital skills'] ?? '',
    q30_speaking_enrolment: q30['Public speaking, debate and presentation skills'] ?? ''
  };
}

export function buildQualtricsCsv(responses) {
  const row1_varNames = QUALTRICS_SCHEMA.map(s => escapeCsvCell(s.id)).join(',');
  const row2_questionText = QUALTRICS_SCHEMA.map(s => escapeCsvCell(s.label)).join(',');
  const row3_importIds = QUALTRICS_SCHEMA.map(s => escapeCsvCell(s.importId)).join(',');

  const rows = [row1_varNames, row2_questionText, row3_importIds];

  for (const resp of responses) {
    const flat = flattenResponseForQualtrics(resp);
    const line = QUALTRICS_SCHEMA.map(s => escapeCsvCell(flat[s.id])).join(',');
    rows.push(line);
  }

  return rows.join('\n') + '\n';
}
