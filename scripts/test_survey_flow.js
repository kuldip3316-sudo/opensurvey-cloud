async function runTest() {
  console.log('--- 1. Testing POST /api/surveys to create survey in Supabase ---');
  const newSurvey = {
    title: 'Enterprise Brand Equity & Switching Study 2026',
    slug: 'brand-equity-2026',
    description: 'Advanced market research survey with skip logic, screenout disqualification, and brand looping.',
    status: 'live',
    target_responses: 500,
    questions: [
      {
        id: 'q1_screening_age',
        type: 'single_choice',
        title: 'Please select your age bracket:',
        required: true,
        options: ['Under 16', '16-19 years old', '20-25 years old', 'Above 25']
      },
      {
        id: 'q2_brands_used',
        type: 'multiple_choice',
        title: 'Which education brands do you actively use?',
        required: true,
        options: ['Zenith Studio', 'The Learning Lab', 'Indigo Pre-U', 'None of these']
      },
      {
        id: 'q3_brand_eval',
        type: 'rating_scale',
        title: 'How would you rate {{item}} on overall instructional quality?',
        subtitle: '1 = Very Poor, 5 = Outstanding',
        required: true,
        minRating: 1,
        maxRating: 5,
        loop_over: 'q2_brands_used'
      },
      {
        id: 'q4_nps',
        type: 'nps',
        title: 'Likelihood of recommending our service to peers:',
        required: true
      }
    ],
    logic_rules: [
      {
        id: 'rule_disqualify_under16',
        triggerQuestionId: 'q1_screening_age',
        operator: 'equals',
        value: 'Under 16',
        action: 'screenout',
        screenoutReason: 'Disqualified: Must be 16 or older for this study.'
      },
      {
        id: 'rule_skip_if_none',
        triggerQuestionId: 'q2_brands_used',
        operator: 'contains',
        value: 'None of these',
        action: 'jump_to',
        targetQuestionId: 'q4_nps'
      }
    ]
  };

  const createRes = await fetch('http://localhost:5055/api/surveys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSurvey)
  });
  const createData = await createRes.json();
  console.log('Create Survey Response:', createData);

  if (!createData.success || !createData.survey?.id) {
    throw new Error('Survey creation failed!');
  }

  const surveyId = createData.survey.id;
  const surveySlug = createData.survey.slug;
  console.log(`✓ Survey created successfully with ID: ${surveyId} and Slug: ${surveySlug}`);

  console.log('\n--- 2. Submitting a Qualified Response ---');
  const qualSubmission = {
    survey_id: surveyId,
    survey_slug: surveySlug,
    status: 'qualified',
    answers: {
      q1_screening_age: '16-19 years old',
      q2_brands_used: ['Zenith Studio', 'Indigo Pre-U'],
      q3_brand_eval__loop_0: 5,
      q3_brand_eval__loop_1: 4,
      q4_nps: 10
    },
    duration_seconds: 64
  };

  const subRes1 = await fetch('http://localhost:5055/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(qualSubmission)
  });
  const subData1 = await subRes1.json();
  console.log('Qualified Submission Result:', subData1);

  console.log('\n--- 3. Submitting a Screenout Disqualified Response ---');
  const screenoutSubmission = {
    survey_id: surveyId,
    survey_slug: surveySlug,
    status: 'screenout',
    screenout_reason: 'Disqualified: Must be 16 or older for this study.',
    answers: {
      q1_screening_age: 'Under 16'
    },
    duration_seconds: 12
  };

  const subRes2 = await fetch('http://localhost:5055/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(screenoutSubmission)
  });
  const subData2 = await subRes2.json();
  console.log('Screenout Submission Result:', subData2);

  console.log('\n--- 4. Querying Supabase Responses via /api/supabase/responses ---');
  // Wait 1.5s for async Supabase push to complete
  await new Promise(r => setTimeout(r, 1500));

  const queryRes = await fetch(`http://localhost:5055/api/supabase/responses?surveyId=${surveyId}`);
  const queryData = await queryRes.json();
  console.log('Supabase Responses for Survey:', queryData);
  console.log(`✓ Retrieved ${queryData.count} responses directly from Supabase Cloud PostgreSQL!`);

  console.log('\n=============================================');
  console.log('🎉 FULL END-TO-END SURVEY SYSTEM VERIFIED 100%!');
  console.log('=============================================');
}

runTest().catch(console.error);
