import { useState, useEffect, useMemo } from 'react';
import { PROVIDER_LIST, KPC_LIST, SERVICE_CATEGORIES } from './surveyData';

// Anti-PII helper: checks for email addresses or phone-number-like sequences
export function checkPii(text) {
  if (!text || typeof text !== 'string') return null;
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
  const phoneRegex = /(?:\+?65)?\s*[689]\d{3}\s*\d{4}|\b\d{7,12}\b/;
  
  if (emailRegex.test(text)) {
    return 'For your privacy, please do not include personal email addresses in your answer.';
  }
  if (phoneRegex.test(text)) {
    return 'For your privacy, please do not include phone numbers in your answer.';
  }
  return null;
}

export function useSurveyEngine() {
  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem('sg_survey_answers_draft');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const saved = localStorage.getItem('sg_survey_step_index');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [status, setStatus] = useState('IN_PROGRESS'); // IN_PROGRESS | TERMINATED | COMPLETED
  const [terminationReason, setTerminationReason] = useState('');
  const [softPromptWarning, setSoftPromptWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const startTime = useMemo(() => Date.now(), []);

  // Sync draft to localStorage
  useEffect(() => {
    localStorage.setItem('sg_survey_answers_draft', JSON.stringify(answers));
    localStorage.setItem('sg_survey_step_index', currentStepIndex.toString());
  }, [answers, currentStepIndex]);

  // Derived classification flags
  const flags = useMemo(() => {
    const age = parseInt(answers.q1_age, 10);
    const country = answers.q2_country;
    const q2a = answers.q2a_status;
    const isInternational = [
      "Student’s Pass holder",
      "Dependant’s Pass holder",
      "Long-Term Visit Pass holder",
      "Other non-citizen status"
    ].includes(q2a);

    // Q6 service segments
    const q6Matrix = answers.q6_matrix || {};
    const currentServices = [];
    const lapsedServices = [];
    const considerServices = [];
    const currentOrRecentLapsedServices = [];

    Object.entries(q6Matrix).forEach(([service, val]) => {
      if (val === "Currently use") {
        currentServices.push(service);
        currentOrRecentLapsedServices.push(service);
      } else if (val === "Used in the last 6 months, but not currently") {
        lapsedServices.push(service);
        currentOrRecentLapsedServices.push(service);
      } else if (val === "Used before the last 6 months, but not currently") {
        lapsedServices.push(service);
      } else if (val === "Do not currently use, but would consider") {
        considerServices.push(service);
      }
    });

    // Q10 Provider segments
    const q10Grid = answers.q10_grid || {};
    const currentProviders = [];
    const recentLapsedProviders = [];
    const pastProviders = [];
    const consideredNeverUsedProviders = [];
    const everUsedProviders = [];

    Object.entries(q10Grid).forEach(([provName, relCode]) => {
      if (relCode === 6 || relCode === "Currently use") {
        currentProviders.push(provName);
        everUsedProviders.push(provName);
      } else if (relCode === 5 || relCode === "Used in last 6 months, not current") {
        recentLapsedProviders.push(provName);
        everUsedProviders.push(provName);
      } else if (relCode === 4 || relCode === "Used, not in last 6 months") {
        pastProviders.push(provName);
        everUsedProviders.push(provName);
      } else if (relCode === 3 || relCode === "Considered, never used") {
        consideredNeverUsedProviders.push(provName);
      }
    });

    // BRAND_LOOP Selection (Max 4 providers, Zenith prioritized)
    const brandLoop = [];
    const zenithName = "Zenith tuition group";
    const hasZenith = everUsedProviders.includes(zenithName);
    if (hasZenith) {
      brandLoop.push(zenithName);
    }

    // Add current providers first
    const pool = currentProviders.filter(p => p !== zenithName);
    if (pool.length + brandLoop.length < 4) {
      recentLapsedProviders.forEach(p => {
        if (!pool.includes(p) && p !== zenithName) pool.push(p);
      });
    }
    
    // Pick remaining up to 4
    for (const p of pool) {
      if (brandLoop.length < 4 && !brandLoop.includes(p)) {
        brandLoop.push(p);
      }
    }

    // Primary provider determination
    let primaryProvider = answers.primary_provider;
    if (!primaryProvider) {
      if (currentProviders.length === 1) {
        primaryProvider = currentProviders[0];
      } else if (currentProviders.length > 1) {
        primaryProvider = answers.q12_1_primary || currentProviders[0];
      } else if (everUsedProviders.length > 0) {
        primaryProvider = everUsedProviders[0];
      }
    }

    return {
      age,
      country,
      isInternational,
      currentServices,
      lapsedServices,
      considerServices,
      currentOrRecentLapsedServices,
      currentProviders,
      recentLapsedProviders,
      pastProviders,
      consideredNeverUsedProviders,
      everUsedProviders,
      brandLoop,
      primaryProvider
    };
  }, [answers]);

  // Construct dynamic step list based on current answers
  const steps = useMemo(() => {
    const list = [
      { id: 'q1_age', title: 'Q1. Age', type: 'numeric' },
      { id: 'q2_country', title: 'Q2. Country of Residence', type: 'single_choice' },
      { id: 'q2a_status', title: 'Q2a. Status in Singapore', type: 'single_choice' }
    ];

    if (flags.isInternational) {
      list.push({ id: 'q2b_citizenship', title: 'Q2b. Country of Citizenship', type: 'single_choice' });
    }

    list.push(
      { id: 'q3_gender', title: 'Q3. Gender', type: 'single_choice' },
      { id: 'q4_schooling', title: 'Q4. Current Schooling', type: 'single_choice' },
      { id: 'q5_level', title: 'Q5. Current Level / Grade', type: 'single_choice' },
      { id: 'q6_matrix', title: 'Q6. Types of Paid Services', type: 'service_matrix' }
    );

    if (flags.considerServices.length > 0) {
      list.push({ id: 'q6a_types', title: 'Q6a. Programmes You Would Consider', type: 'multi_select' });
    }

    if (flags.currentOrRecentLapsedServices.length > 0) {
      list.push({ id: 'q6b_types', title: 'Q6b. Specific Types You Use or Have Used', type: 'multi_select' });
    }

    if (flags.lapsedServices.length > 0) {
      list.push({ id: 'q6c_reasons', title: 'Q6c. Reasons for Stopping', type: 'multi_select', optional: true });
    }

    list.push(
      { id: 'q7_hours', title: 'Q7. Weekly Hours Spent in Paid Services', type: 'single_choice' },
      { id: 'q8_decision_role', title: 'Q8. Provider Decision Role', type: 'single_choice' },
      { id: 'q9_unaided', title: 'Q9. Top-of-Mind Provider Recall', type: 'unaided_brands' },
      { id: 'q10_grid', title: 'Q10. Provider Awareness & Relationship', type: 'provider_grid' }
    );

    if (flags.consideredNeverUsedProviders.length > 0) {
      list.push({ id: 'q11_reasons', title: 'Q11. Reasons for Not Choosing Considered Providers', type: 'considered_reasons' });
    }

    if (flags.currentProviders.length >= 2) {
      list.push({ id: 'q12_1_primary', title: 'Q12.1 Primary Provider', type: 'single_choice' });
    }

    // Brand Loop Evaluation steps (Q12 to Q18)
    if (flags.brandLoop.length > 0) {
      list.push({ id: 'brand_evaluations', title: 'Provider Experience & Ratings (Q12–Q18)', type: 'brand_loop_block' });
    }

    // Q14 Choice criteria ranking
    list.push({ id: 'q14_ranked_kpcs', title: 'Q14. Top 5 Factors in Choosing a Provider', type: 'ranking_kpc' });

    // Retention & Continuation (Q19, Q20/Q21)
    if (flags.currentProviders.length > 0) {
      list.push({ id: 'q19_continue', title: 'Q19. Likelihood to Continue Next 12 Months', type: 'continuation_ratings' });
    }

    // Switching (Q22 to Q25)
    list.push({ id: 'q22_switching', title: 'Q22–Q25. Switching Behaviour & Barriers', type: 'switching_block' });

    // Tutor vs Brand (Q26, Q27, Q28)
    list.push({ id: 'tutor_and_brand', title: 'Q26–Q28. Tutor Characteristics & Premium Value', type: 'tutor_brand_block' });

    // New programmes (Q29, Q30)
    list.push({ id: 'new_programmes', title: 'Q29–Q30. Interest in New Educational Programmes', type: 'new_programmes_block' });

    return list;
  }, [flags]);

  const currentStep = steps[currentStepIndex] || steps[0];

  // Set an answer field
  const updateAnswer = (key, value) => {
    setSoftPromptWarning(null);
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Immediate termination handler
  const triggerTermination = (reason) => {
    setStatus('TERMINATED');
    setTerminationReason(reason);
    submitResponse('TERMINATED_' + reason);
  };

  // Step validation
  const validateCurrentStep = () => {
    if (!currentStep) return true;

    // Screening Q1 (PDF: Terminate if anything less than 13 or greater than 19 is written)
    if (currentStep.id === 'q1_age') {
      const age = parseInt(answers.q1_age, 10);
      if (isNaN(age)) return 'Please enter your age.';
      if (age < 13 || age > 19) {
        triggerTermination('AGE_OUT_OF_RANGE');
        return false;
      }
    }

    // Screening Q2 (PDF: Terminate if not Singapore)
    if (currentStep.id === 'q2_country') {
      if (!answers.q2_country) return 'Please select your country of residence.';
      if (answers.q2_country !== 'Singapore') {
        triggerTermination('NOT_SINGAPORE_RESIDENT');
        return false;
      }
    }

    // Screening Q2a (PDF: Terminate if code 7 Not sure / Prefer not to say)
    if (currentStep.id === 'q2a_status') {
      if (!answers.q2a_status) return 'Please select your status in Singapore.';
      if (answers.q2a_status.includes('TERMINATE') || answers.q2a_status === 'Not sure / Prefer not to say') {
        triggerTermination('STATUS_INELIGIBLE');
        return false;
      }
    }

    // Screening Q4 (PDF: Qualify if select any of codes 1–4, 6-8, otherwise terminate)
    if (currentStep.id === 'q4_schooling') {
      if (!answers.q4_schooling) return 'Please select your current schooling institution.';
      const ineligible = ['Special Education', 'Polytechnic', 'ITE', 'Private diploma', 'Home-schooling', 'Not currently enrolled'];
      if (ineligible.some(term => answers.q4_schooling.includes(term))) {
        triggerTermination('SCHOOLING_INELIGIBLE');
        return false;
      }
    }

    // Screening Q5 (PDF: Pipe options by institution type)
    if (currentStep.id === 'q5_level') {
      if (!answers.q5_level) return 'Please select your current level / grade.';
    }

    // Q6 Matrix termination check
    if (currentStep.id === 'q6_matrix') {
      const q6 = answers.q6_matrix || {};
      if (Object.keys(q6).length < SERVICE_CATEGORIES.length) {
        return 'Please provide a response for each service category.';
      }
      const hasActive = Object.values(q6).some(val => 
        val === "Currently use" || val === "Used in the last 6 months, but not currently"
      );
      if (!hasActive) {
        triggerTermination('NO_CURRENT_OR_RECENT_TUITION');
        return false;
      }
    }

    // Q9 Anti-PII check
    if (currentStep.id === 'q9_unaided') {
      const unaided = answers.q9_unaided || [];
      const hasAtLeastOne = unaided.some(t => t && t.trim().length > 0);
      if (!hasAtLeastOne) return 'Please name at least one provider, brand or centre.';
      for (const str of unaided) {
        const piiError = checkPii(str);
        if (piiError) return piiError;
      }
    }

    // Q10 Provider Grid termination check
    if (currentStep.id === 'q10_grid') {
      const q10 = answers.q10_grid || {};
      if (Object.keys(q10).length < PROVIDER_LIST.length) {
        return 'Please rate your relationship with each listed provider.';
      }
      const hasActiveProvider = Object.values(q10).some(v => v === 6 || v === 5 || v === "Currently use" || v === "Used in last 6 months, not current");
      if (!hasActiveProvider) {
        triggerTermination('NO_ACTIVE_PROVIDER_RELATIONSHIP');
        return false;
      }
    }

    return true;
  };

  // Advance to next step
  const handleNext = () => {
    const validation = validateCurrentStep();
    if (validation !== true) {
      if (typeof validation === 'string') {
        setSoftPromptWarning(validation);
      }
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final step -> Complete Survey
      submitResponse('QUALIFIED');
    }
  };

  // Back to previous step
  const handlePrev = () => {
    setSoftPromptWarning(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final submission
  const submitResponse = async (finalStatus = 'QUALIFIED') => {
    setIsSubmitting(true);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const payload = {
      id: 'RESP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      status: finalStatus,
      duration_seconds: durationSeconds,
      flags,
      brand_loop: flags.brandLoop,
      answers
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSubmissionResult(data);
      if (finalStatus.startsWith('TERMINATED')) {
        setStatus('TERMINATED');
      } else {
        setStatus('COMPLETED');
      }
    } catch (err) {
      console.warn('Backend offline, saving locally to localStorage:', err);
      const existing = JSON.parse(localStorage.getItem('sg_survey_all_local_responses') || '[]');
      existing.push(payload);
      localStorage.setItem('sg_survey_all_local_responses', JSON.stringify(existing));
      setSubmissionResult({ success: true, localOnly: true, payload });
      if (finalStatus.startsWith('TERMINATED')) {
        setStatus('TERMINATED');
      } else {
        setStatus('COMPLETED');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSurvey = () => {
    localStorage.removeItem('sg_survey_answers_draft');
    localStorage.removeItem('sg_survey_step_index');
    setAnswers({});
    setCurrentStepIndex(0);
    setStatus('IN_PROGRESS');
    setTerminationReason('');
    setSubmissionResult(null);
  };

  return {
    answers,
    updateAnswer,
    currentStepIndex,
    currentStep,
    totalSteps: steps.length,
    steps,
    status,
    terminationReason,
    softPromptWarning,
    isSubmitting,
    submissionResult,
    handleNext,
    handlePrev,
    resetSurvey,
    flags
  };
}
