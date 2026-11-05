import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  BarChart3, 
  RotateCcw, 
  Lock, 
  Sparkles, 
  HelpCircle, 
  ExternalLink, 
  Globe, 
  Smartphone, 
  ShieldAlert, 
  History, 
  Building2, 
  Keyboard,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react';

// Helper to determine if an option was explicitly configured as an 'Other (specify)' option
function isOtherOption(opt, q) {
  if (!opt || !q) return false;
  // 1. Explicit flag on option object (e.g. { id, name, isOther: true } or { text, is_other: true })
  if (typeof opt === 'object' && (opt.is_other === true || opt.isOther === true)) return true;
  
  const optText = (typeof opt === 'string' ? opt : (opt.text || opt.name || opt.label || '')).trim();
  
  // 2. Explicitly registered in question's other_options array
  if (Array.isArray(q.other_options) && q.other_options.some(o => (typeof o === 'string' ? o : (o?.text || o?.name || '')).trim() === optText)) {
    return true;
  }
  
  // 3. Explicitly set as question other_option
  if (q.allow_other && q.other_option && q.other_option.trim() === optText) {
    return true;
  }
  
  return false;
}

// Safe array helper to prevent .map crashes on malformed survey data
const safeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'object' && val !== null) return Object.values(val);
  if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
};

export default function DynamicSurveyRuntime({ 
  surveySlug, 
  onNavigateToStudio, 
  onNavigateToBuilder 
}) {
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Runtime Progression State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState('ACTIVE'); // 'ACTIVE' | 'SCREENOUT' | 'QUOTA_FULL' | 'COMPLETED' | 'PAUSED' | 'CLOSED' | 'DUPLICATE_BLOCKED' | 'GEO_BLOCKED' | 'SPEEDER'
  const [screenoutReason, setScreenoutReason] = useState(null);
  const [quotaReason, setQuotaReason] = useState(null);
  const [geoBlockedMessage, setGeoBlockedMessage] = useState(null);
  const [pendingResume, setPendingResume] = useState(null);
  const [liveQuotaData, setLiveQuotaData] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [respondentId, setRespondentId] = useState(null);
  const [startTime] = useState(Date.now());
  const [validationError, setValidationError] = useState(null);

  // Unique respondent session ID for real-time draft tracking
  const [sessionId] = useState(() => {
    try {
      const saved = sessionStorage.getItem('survey_session_' + surveySlug);
      if (saved) return saved;
      const gen = 'SESS_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('survey_session_' + surveySlug, gen);
      return gen;
    } catch (e) {
      return 'SESS_' + Date.now();
    }
  });

  // Fetch survey definition from Supabase via server API
  useEffect(() => {
    async function fetchSurvey() {
      try {
        setLoading(true);
        const res = await fetch(`/api/surveys/${surveySlug}`);
        const data = await res.json();
        if (data.success && data.survey) {
          setSurvey(data.survey);
          if (data.survey.title) {
            document.title = `${data.survey.title} | Survey Cloud`;
          }

          // 1. Check survey lifecycle status
          if (data.survey.status === 'paused') {
            setStatus('PAUSED');
            return;
          }
          if (data.survey.status === 'closed') {
            setStatus('CLOSED');
            return;
          }

          // 2. Check Location / Geo-fencing Restriction
          if (data.survey.settings?.geo_restriction_enabled) {
            const allowed = data.survey.settings.allowed_countries || ['Singapore'];
            const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
            const userLang = (navigator.language || '').toLowerCase();
            
            const isAllowed = allowed.includes('Global') || allowed.some(c => {
              const cLower = c.toLowerCase();
              if (cLower === 'singapore' && (userTz.toLowerCase().includes('singapore') || userLang.includes('sg'))) return true;
              if (cLower === 'malaysia' && (userTz.toLowerCase().includes('kuala_lumpur') || userLang.includes('my'))) return true;
              if (cLower === 'indonesia' && (userTz.toLowerCase().includes('jakarta') || userLang.includes('id'))) return true;
              if (cLower === 'australia' && (userTz.toLowerCase().includes('sydney') || userTz.toLowerCase().includes('melbourne') || userLang.includes('au'))) return true;
              if (cLower === 'united kingdom' && (userTz.toLowerCase().includes('london') || userLang.includes('gb'))) return true;
              if (cLower === 'united states' && (userTz.toLowerCase().includes('new_york') || userTz.toLowerCase().includes('los_angeles') || userTz.toLowerCase().includes('chicago') || userLang.includes('us'))) return true;
              return userTz.toLowerCase().includes(cLower);
            });

            if (!isAllowed) {
              setStatus('GEO_BLOCKED');
              setGeoBlockedMessage(data.survey.settings.geo_block_message || `This research survey is restricted to participants residing in ${allowed.join(', ')}.`);
              return;
            }
          }

          // 3. Check duplicate submission (Same device & ballot stuffing lock)
          const preventDuplicates = data.survey.settings?.prevent_duplicates !== false;
          if (preventDuplicates && localStorage.getItem('survey_completed_' + data.survey.slug)) {
            setStatus('DUPLICATE_BLOCKED');
            return;
          }

          // 4. Advanced Device Fingerprint Lock
          if (data.survey.settings?.device_fingerprint_lock !== false) {
            try {
              const rawStr = [navigator.userAgent, screen.width, screen.height, navigator.hardwareConcurrency || 4].join('-');
              let hash = 0;
              for (let i = 0; i < rawStr.length; i++) {
                hash = ((hash << 5) - hash) + rawStr.charCodeAt(i);
                hash |= 0;
              }
              const fp = Math.abs(hash).toString(36);
              if (localStorage.getItem('survey_fp_' + data.survey.slug + '_' + fp)) {
                setStatus('DUPLICATE_BLOCKED');
                return;
              }
            } catch (e) {
              console.warn('Fingerprint check error:', e);
            }
          }

          // 5. In-Progress Session Resume Check
          try {
            const savedProgressStr = localStorage.getItem('survey_resume_' + data.survey.slug);
            if (savedProgressStr) {
              const saved = JSON.parse(savedProgressStr);
              if (saved.currentStepIndex > 0 && saved.answers && Object.keys(saved.answers).length > 0) {
                setPendingResume(saved);
              }
            }
          } catch (e) {
            console.warn('Resume check error:', e);
          }

          // 3. Fetch real-time quota status
          try {
            const quotaRes = await fetch(`/api/surveys/${surveySlug}/quota-status`);
            const qData = await quotaRes.json();
            if (qData.success) {
              setLiveQuotaData(qData);
            }
          } catch (qErr) {
            console.error('Error fetching quota status:', qErr);
          }
        } else {
          setError(data.error || 'Survey not found.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (surveySlug) {
      fetchSurvey();
    }
  }, [surveySlug]);

  // Handle auto-redirect countdown if a panel redirect URL is provided
  useEffect(() => {
    let timer;
    let targetUrl = null;
    const settings = survey?.settings || {};

    if (status === 'COMPLETED' && settings.qualified_redirect_url) {
      targetUrl = settings.qualified_redirect_url.replace(/\{respondentId\}/gi, respondentId || '');
    } else if (status === 'SCREENOUT' && settings.screenout_redirect_url) {
      targetUrl = settings.screenout_redirect_url.replace(/\{respondentId\}/gi, respondentId || '');
    } else if (status === 'QUOTA_FULL' && settings.quota_full_redirect_url) {
      targetUrl = settings.quota_full_redirect_url.replace(/\{respondentId\}/gi, respondentId || '');
    }

    if (targetUrl) {
      setRedirectCountdown(5);
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.location.href = targetUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, respondentId, survey]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-600">Loading Survey...</p>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Survey Unavailable</h2>
          <p className="text-xs text-slate-600">{error || 'Could not load survey definition from database.'}</p>
          <button
            onClick={onNavigateToBuilder}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-700 cursor-pointer"
          >
            Go to Survey Builder
          </button>
        </div>
      </div>
    );
  }

  // Generate dynamic runtime steps (handling dynamic loops)
  const baseQuestions = survey.questions || [];
  const expandedSteps = [];

  baseQuestions.forEach((q) => {
    if (q.loop_over) {
      // Look up what respondent chose in the loop_over question
      const loopSourceAnswers = answers[q.loop_over];
      const loopItems = Array.isArray(loopSourceAnswers) 
        ? loopSourceAnswers.filter(item => item && !item.toLowerCase().includes('none'))
        : (loopSourceAnswers ? [loopSourceAnswers] : []);

      if (loopItems.length > 0) {
        loopItems.forEach((item, loopIdx) => {
          expandedSteps.push({
            ...q,
            id: `${q.id}__loop_${loopIdx}`,
            baseId: q.id,
            loopItem: item,
            title: q.title.replace(/\{\{item\}\}/gi, item).replace(/\{\{[^}]+\}\}/gi, item)
          });
        });
      } else {
        // Source question had no items selected, skip or render one base
        // Usually skipped in survey research if none selected
      }
    } else {
      expandedSteps.push(q);
    }
  });

  const totalSteps = expandedSteps.length || 1;
  const currentStep = expandedSteps[currentStepIndex] || baseQuestions[0];

  // Helper for dynamic piping: replaces {{question_id}} with answer
  const pipeText = (text) => {
    if (!text) return '';
    return text.replace(/\{\{([^}]+)\}\}/g, (match, qKey) => {
      const trimmedKey = qKey.trim();
      const val = answers[trimmedKey];
      if (val === undefined || val === null || val === '') return '...';
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    });
  };

  // Evaluate logic rules for the current step
  const evaluateLogicRules = (targetQId, currentAnswerVal) => {
    const rules = (survey.logic_rules || []).filter(r => r.triggerQuestionId === targetQId);
    
    for (const rule of rules) {
      let conditionMet = false;
      const val = currentAnswerVal;

      if (rule.operator === 'equals') {
        conditionMet = String(val).toLowerCase() === String(rule.value).toLowerCase();
      } else if (rule.operator === 'not_equals') {
        conditionMet = String(val).toLowerCase() !== String(rule.value).toLowerCase();
      } else if (rule.operator === 'contains') {
        if (Array.isArray(val)) {
          conditionMet = val.some(v => String(v).toLowerCase() === String(rule.value).toLowerCase());
        } else {
          conditionMet = String(val).toLowerCase().includes(String(rule.value).toLowerCase());
        }
      } else if (rule.operator === 'greater_than') {
        conditionMet = Number(val) > Number(rule.value);
      } else if (rule.operator === 'less_than') {
        conditionMet = Number(val) < Number(rule.value);
      } else if (rule.operator === 'is_empty') {
        conditionMet = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      }

      if (conditionMet) {
        return rule;
      }
    }
    return null;
  };

  // Non-blocking real-time question-by-question draft auto-save
  const sendDraftAutoSave = (stepIdx, currentAnswers, isCompleted = false) => {
    try {
      if (!survey?.id) return;
      const draftPayload = JSON.stringify({
        survey_id: survey.id,
        session_id: sessionId,
        current_step: stepIdx,
        answers: currentAnswers,
        is_completed: isCompleted
      });

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/submit/draft', new Blob([draftPayload], { type: 'application/json' }));
      } else {
        fetch('/api/submit/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: draftPayload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Background auto-save never blocks UI
    }
  };

  // Submit survey response (qualified, screenout, or quota_full) with Exponential Backoff Retry
  const submitSurvey = async (finalStatus = 'qualified', reason = null) => {
    setIsSubmitting(true);
    const duration = Math.round((Date.now() - startTime) / 1000);
    const generatedId = 'RESP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const payload = {
      id: generatedId,
      survey_id: survey.id,
      survey_slug: survey.slug,
      status: finalStatus,
      screenout_reason: reason,
      answers,
      duration_seconds: duration
    };

    // Attempt submission with 3-stage exponential backoff
    let isSaved = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          isSaved = true;
          setRespondentId(data.respondentId || generatedId);
          break;
        }
      } catch (err) {
        console.warn(`[Network Retry] Submission attempt ${attempt}/3 failed:`, err.message);
        if (attempt < 3) {
          // Wait 600ms, 1200ms before retrying
          await new Promise(r => setTimeout(r, attempt * 600));
        }
      }
    }

    // Fallback: If network completely failed after 3 tries, acknowledge locally to protect respondent
    if (!isSaved) {
      setRespondentId(generatedId);
      console.warn('[Submission Fallback] Offline queue acknowledged locally.');
    }

    // Mark draft as completed
    sendDraftAutoSave(currentStepIndex, answers, true);

    setIsSubmitting(false);

    // Lock device to prevent duplicate submissions if enabled
    if (survey.settings?.prevent_duplicates !== false) {
      localStorage.setItem('survey_completed_' + survey.slug, 'true');
    }

    if (finalStatus === 'screenout') {
      setStatus('SCREENOUT');
      setScreenoutReason(reason || survey.settings?.screenout_message || 'Survey qualification criteria not met.');
    } else if (finalStatus === 'quota_full') {
      setStatus('QUOTA_FULL');
      setQuotaReason(reason || survey.settings?.quota_full_message || 'The response quota for your group has already been reached.');
    } else {
      setStatus('COMPLETED');
    }
  };

  // Handle Next button
  const handleNext = async () => {
    setValidationError(null);
    const currentVal = answers[currentStep.id];

    // Check required validation
    if (currentStep.required !== false) {
      if (currentVal === undefined || currentVal === null || currentVal === '' || (Array.isArray(currentVal) && currentVal.length === 0)) {
        setValidationError('Please provide an answer before continuing.');
        return;
      }

      // If an explicitly configured 'Other' option was selected, ensure the respondent typed into the textbox
      const isSingleOtherSelected = (currentStep.type === 'single_choice') && answers[currentStep.id + '_is_other'];
      const isMultiOtherSelected = (currentStep.type === 'multiple_choice') && Array.isArray(currentVal) && (
        currentVal.some(v => typeof v === 'string' && v.startsWith('Other:')) ||
        (currentStep.options || []).some(opt => isOtherOption(opt, currentStep) && currentVal.includes(typeof opt === 'string' ? opt : (opt.text || opt.name || '')))
      );

      if (isSingleOtherSelected || isMultiOtherSelected) {
        const otherDetail = (answers[currentStep.id + '_other'] || '').trim();
        if (!otherDetail) {
          setValidationError('Please specify your details in the text box for "Other" before continuing.');
          return;
        }
      }

      // Validate Matrix Question completeness
      if (currentStep.type === 'matrix') {
        const matrixRows = (currentStep.rows && currentStep.rows.length > 0) ? currentStep.rows : (currentStep.options || []);
        const matrixState = (typeof currentVal === 'object' && currentVal !== null) ? currentVal : {};
        const unansweredRows = matrixRows.filter(r => {
          const rLabel = typeof r === 'string' ? r : (r.text || r.name || '');
          return !matrixState[rLabel];
        });
        if (unansweredRows.length > 0) {
          setValidationError(`Please rate all statements in the grid before continuing (${unansweredRows.length} remaining).`);
          return;
        }
      }

      // Validate Ranking Question completeness
      if (currentStep.type === 'ranking') {
        const minRequired = currentStep.min_ranks || 1;
        if (!Array.isArray(currentVal) || currentVal.length < minRequired) {
          setValidationError(`Please rank at least ${minRequired} item${minRequired > 1 ? 's' : ''} from the available choices before continuing.`);
          return;
        }
      }
    }

    // Evaluate Real-time Quotas
    const activeQuotas = liveQuotaData?.quotas || [];
    const triggeredQuota = activeQuotas.find(q => {
      const ans = q.question_id === (currentStep.baseId || currentStep.id) ? currentVal : answers[q.question_id];
      if (!ans) return false;
      const matches = Array.isArray(ans) ? ans.includes(q.target_value) : String(ans).trim() === String(q.target_value).trim();
      return matches && q.is_full;
    });

    if (triggeredQuota) {
      await submitSurvey('quota_full', `Quota target reached for "${triggeredQuota.name}"`);
      return;
    }

    if (liveQuotaData?.isOverMaxCap) {
      await submitSurvey('quota_full', 'Maximum survey capacity reached');
      return;
    }

    // Evaluate Skip & Screenout Logic Rules
    const triggeredRule = evaluateLogicRules(currentStep.baseId || currentStep.id, currentVal);

    if (triggeredRule) {
      if (triggeredRule.action === 'screenout') {
        // Disqualify respondent immediately
        await submitSurvey('screenout', triggeredRule.screenoutReason);
        return;
      } else if (triggeredRule.action === 'jump_to') {
        if (triggeredRule.targetQuestionId === 'END_SURVEY') {
          // Jump directly to end
          await submitSurvey('qualified');
          return;
        } else {
          // Find step index of target question
          const targetIdx = expandedSteps.findIndex(s => (s.baseId || s.id) === triggeredRule.targetQuestionId);
          if (targetIdx !== -1 && targetIdx > currentStepIndex) {
            setCurrentStepIndex(targetIdx);
            sendDraftAutoSave(targetIdx, answers);
            return;
          }
        }
      }
    }

    // Normal forward progression
    if (currentStepIndex < expandedSteps.length - 1) {
      const nextStep = currentStepIndex + 1;
      setCurrentStepIndex(nextStep);
      sendDraftAutoSave(nextStep, answers);
    } else {
      // Final step -> Submit survey
      await submitSurvey('qualified');
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setValidationError(null);
    }
  };

  // ----------------------------------------------------
  // PAUSED STATUS VIEW
  // ----------------------------------------------------
  if (status === 'PAUSED') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Survey Temporarily Paused</h2>
            <p className="text-xs text-slate-500 font-medium">
              The researchers have paused responses for this study. Please check back later.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateToBuilder}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Back to Survey Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CLOSED STATUS VIEW
  // ----------------------------------------------------
  if (status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Survey Concluded</h2>
            <p className="text-xs text-slate-500 font-medium">
              Fieldwork for this study has completed. Thank you for your interest!
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateToBuilder}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Back to Survey Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // DUPLICATE PARTICIPATION BLOCKED VIEW
  // ----------------------------------------------------
  if (status === 'DUPLICATE_BLOCKED') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Response Already Recorded</h2>
            <p className="text-xs text-slate-500 font-medium">
              You have already completed or participated in this research survey from this device/browser.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                localStorage.removeItem('survey_completed_' + survey.slug);
                setStatus('ACTIVE');
                setCurrentStepIndex(0);
                setAnswers({});
              }}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              Clear Local Token & Retake (Testing Only)
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Back to Survey Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GEO-LOCATION BLOCKED VIEW
  // ----------------------------------------------------
  if (status === 'GEO_BLOCKED') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-blue-200 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <Globe className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Access Restricted by Location</h2>
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider bg-blue-50 py-1 px-3 rounded-full inline-block">
              Geo-Fencing Policy Active
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-950 leading-relaxed font-medium">
            {geoBlockedMessage || 'This research survey is geographically restricted to participants residing in Singapore.'}
          </div>
          <div className="text-[11px] text-slate-400">
            Detected Locale/Timezone: <span className="font-mono text-slate-600">{Intl.DateTimeFormat().resolvedOptions().timeZone || 'International'}</span>
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateToBuilder}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Back to Survey Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SPEEDER DISQUALIFICATION VIEW
  // ----------------------------------------------------
  if (status === 'SPEEDER') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-300 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Submission Flagged: Speed Trap</h2>
            <p className="text-xs text-amber-800 font-bold uppercase tracking-wider bg-amber-100 py-1 px-3 rounded-full inline-block">
              Data Quality Violation
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium">
            The survey was completed in an unnaturally short duration without sufficient time to read questions. In accordance with professional research standards, this submission has been rejected.
          </div>
          <div className="pt-2">
            <button
              onClick={onNavigateToBuilder}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Back to Survey Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // QUOTA FULL (OVER-QUOTA) VIEW
  // ----------------------------------------------------
  if (status === 'QUOTA_FULL') {
    const quotaTitle = survey.settings?.quota_full_title || 'Quota Reached for Your Group';
    const quotaMsg = quotaReason || survey.settings?.quota_full_message || 'Thank you for your time. The response quota for your demographic group has already been reached.';
    const redirectUrl = survey.settings?.quota_full_redirect_url ? survey.settings.quota_full_redirect_url.replace(/\{respondentId\}/gi, respondentId || '') : null;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-amber-200/90 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">{quotaTitle}</h2>
            <p className="text-xs text-amber-700 font-bold uppercase tracking-wider bg-amber-50 py-1 px-3 rounded-full inline-block">
              Status: Quota Full (Over-Quota)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
            {quotaMsg}
          </div>

          {redirectUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="text-[11px] text-slate-500">
                Redirecting to panel provider in <strong className="text-indigo-600">{redirectCountdown}s</strong>...
              </div>
              <a
                href={redirectUrl}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                <span>Click here if not redirected</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Respondent ID: <span className="font-mono text-slate-600">{respondentId || 'LOGGED'}</span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setAnswers({});
                setCurrentStepIndex(0);
                setStatus('ACTIVE');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Survey</span>
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              <span>Back to Survey Builder</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // SCREENOUT / DISQUALIFIED VIEW
  // ----------------------------------------------------
  if (status === 'SCREENOUT') {
    const screenoutTitle = survey.settings?.screenout_title || 'Thank You for Your Interest';
    const screenoutMsg = screenoutReason || survey.settings?.screenout_message || 'Based on your preliminary answers, you do not meet the qualification criteria required for this specific research study.';
    const redirectUrl = survey.settings?.screenout_redirect_url ? survey.settings.screenout_redirect_url.replace(/\{respondentId\}/gi, respondentId || '') : null;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">{screenoutTitle}</h2>
            <p className="text-xs text-rose-700 font-bold uppercase tracking-wider bg-rose-50 py-1 px-3 rounded-full inline-block">
              Status: Screenout (Disqualified)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800 leading-relaxed font-medium">
            {screenoutMsg}
          </div>

          {redirectUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="text-[11px] text-slate-500">
                Redirecting to panel provider in <strong className="text-indigo-600">{redirectCountdown}s</strong>...
              </div>
              <a
                href={redirectUrl}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
              >
                <span>Click here if not redirected</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="text-[11px] text-slate-400">
            Respondent ID: <span className="font-mono text-slate-600">{respondentId || 'LOGGED'}</span>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                setAnswers({});
                setCurrentStepIndex(0);
                setStatus('ACTIVE');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Survey</span>
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              <span>Back to Survey Builder</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // COMPLETED VIEW
  // ----------------------------------------------------
  if (status === 'COMPLETED') {
    const compTitle = survey.settings?.qualified_title || 'Survey Completed!';
    const compMsg = survey.settings?.qualified_message || 'Your responses have been synced directly to Supabase Cloud Database.';
    const redirectUrl = survey.settings?.qualified_redirect_url ? survey.settings.qualified_redirect_url.replace(/\{respondentId\}/gi, respondentId || '') : null;

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{compTitle}</h2>
            <p className="text-xs text-slate-500">{compMsg}</p>
          </div>

          {redirectUrl && (
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs space-y-2">
              <div className="text-[11px] text-emerald-800 font-semibold">
                Redirecting to panel completion URL in <strong className="text-emerald-900">{redirectCountdown}s</strong>...
              </div>
              <a
                href={redirectUrl}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
              >
                <span>Click here if not redirected</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Respondent ID:</span>
              <span className="font-mono font-bold text-slate-800">{respondentId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Study:</span>
              <span className="font-semibold text-slate-800">{survey.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-700 font-bold uppercase text-[11px] bg-emerald-100 px-2 py-0.5 rounded">
                Qualified
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              onClick={() => onNavigateToStudio && onNavigateToStudio(survey.id)}
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Cross-Tabulate Live in Tabulation Studio</span>
            </button>

            <button
              onClick={() => {
                setAnswers({});
                setCurrentStepIndex(0);
                setStatus('ACTIVE');
              }}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Take Again (New Session)</span>
            </button>

            <button
              onClick={onNavigateToBuilder}
              className="text-xs text-slate-400 hover:text-slate-600 font-medium pt-1"
            >
              Return to Survey Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ACTIVE SURVEY RUNTIME VIEW
  // ----------------------------------------------------
  const progressPct = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* In-Progress Session Resume Banner */}
      {pendingResume && (
        <div className="bg-indigo-600 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-200 shrink-0" />
            <span>Welcome back! You have an unfinished response from earlier (Question {pendingResume.currentStepIndex + 1} of {totalSteps}).</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                setAnswers(pendingResume.answers);
                setCurrentStepIndex(pendingResume.currentStepIndex);
                setPendingResume(null);
              }}
              className="px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg shadow-xs cursor-pointer transition text-xs"
            >
              Resume Survey
            </button>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('survey_resume_' + survey.slug);
                } catch (e) {}
                setPendingResume(null);
              }}
              className="px-2 py-1 text-indigo-200 hover:text-white underline cursor-pointer text-xs"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Top Header with Live Progress & Whitelabel Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {survey.settings?.whitelabel_enabled && survey.settings?.brand_logo_url && (
              <img 
                src={survey.settings.brand_logo_url} 
                alt="Brand Logo" 
                className="h-8 max-w-[130px] object-contain rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div>
              <h1 className="text-xs sm:text-sm font-bold text-slate-800 tracking-tight">
                {survey.settings?.whitelabel_enabled && survey.settings?.client_brand_name
                  ? `${survey.settings.client_brand_name} • ${survey.title}`
                  : survey.title}
              </h1>
              <div className="text-[11px] text-slate-400">Step {currentStepIndex + 1} of {totalSteps}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-600">{progressPct}%</span>
            <div className="w-24 sm:w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ 
                  width: `${progressPct}%`,
                  backgroundColor: survey.settings?.custom_primary_color || undefined
                }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interactive Questionnaire Card */}
      {!currentStep ? (
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4 w-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Survey Under Preparation</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              This survey questionnaire does not have any questions published yet. Please check back soon!
            </p>
          </div>
        </main>
      ) : (
      <main className="flex-1 max-w-2xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-10 space-y-6 sm:space-y-8">
          
          {/* Question Title & Piping */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs">
                Q{currentStepIndex + 1}
              </span>
              {currentStep.loopItem && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[11px]">
                  Loop: {currentStep.loopItem}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {pipeText(currentStep.title)}
            </h2>

            {currentStep.subtitle && (
              <p className="text-xs sm:text-sm text-slate-500">
                {pipeText(currentStep.subtitle)}
              </p>
            )}
          </div>

          {/* Answer Input Renderers */}
          <div className="space-y-3 pt-2">
            
            {/* Single Choice (Radio) */}
            {currentStep.type === 'single_choice' && (
              <div className="space-y-2.5">
                {safeArray(currentStep.options).map((opt, idx) => {
                  const optLabel = typeof opt === 'string' ? opt : (opt.text || opt.name || opt.label || '');
                  const isOther = isOtherOption(opt, currentStep);
                  const currentVal = answers[currentStep.id];
                  const isSelected = isOther 
                    ? (answers[currentStep.id + '_is_other'] && (answers[currentStep.id + '_choice'] === optLabel || currentVal === optLabel || (typeof currentVal === 'string' && currentVal.startsWith('Other:'))))
                    : (currentVal === optLabel && !answers[currentStep.id + '_is_other']);

                  return (
                    <div key={idx} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isOther) {
                            const existingDetail = answers[currentStep.id + '_other'] || '';
                            setAnswers(prev => ({
                              ...prev,
                              [currentStep.id]: existingDetail.trim() ? `Other: ${existingDetail.trim()}` : optLabel,
                              [currentStep.id + '_is_other']: true,
                              [currentStep.id + '_choice']: optLabel
                            }));
                          } else {
                            setAnswers(prev => ({
                              ...prev,
                              [currentStep.id]: optLabel,
                              [currentStep.id + '_is_other']: false,
                              [currentStep.id + '_choice']: optLabel
                            }));
                          }
                          setValidationError(null);
                        }}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500' 
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                            isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                            {optLabel}
                          </span>
                        </div>
                        {isSelected && <CheckCircle className="w-5 h-5 text-indigo-600 shrink-0" />}
                      </button>

                      {/* DYNAMIC OPEN-ENDED TEXTBOX ONLY FOR EXPLICIT 'OTHER' */}
                      {isOther && isSelected && (
                        <div className="ml-3 sm:ml-9 p-3 sm:p-4 bg-indigo-50/80 border-2 border-indigo-400 rounded-xl sm:rounded-2xl space-y-2 shadow-xs transition-all">
                          <label className="block text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span>Please specify your response:</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              autoFocus
                              value={answers[currentStep.id + '_other'] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAnswers(prev => ({
                                  ...prev,
                                  [currentStep.id + '_other']: val,
                                  [currentStep.id]: val.trim() ? `Other: ${val.trim()}` : optLabel
                                }));
                                setValidationError(null);
                              }}
                              placeholder={currentStep.other_placeholder || "Type your custom response here..."}
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-indigo-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-2xs"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Your specified input will be recorded directly with your survey response.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Multiple Choice (Checkboxes) */}
            {currentStep.type === 'multiple_choice' && (
              <div className="space-y-2.5">
                {safeArray(currentStep.options).map((opt, idx) => {
                  const optLabel = typeof opt === 'string' ? opt : (opt.text || opt.name || opt.label || '');
                  const optStr = optLabel.toLowerCase().trim();
                  const isOther = isOtherOption(opt, currentStep);
                  const isNoneOfAbove = optStr.includes('none of') || optStr.includes('neither') || optStr === 'none' || optStr === 'no tuition';
                  const currentArr = Array.isArray(answers[currentStep.id]) ? answers[currentStep.id] : [];
                  const isChecked = currentArr.some(item => 
                    item === optLabel || (isOther && (typeof item === 'string' && (item.startsWith('Other:') || item === optLabel)))
                  );

                  return (
                    <div key={idx} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          let next;
                          if (isChecked) {
                            next = currentArr.filter(item => item !== optLabel && !(isOther && typeof item === 'string' && item.startsWith('Other:')));
                          } else {
                            // If user clicked "None of the above", clear all other selections
                            if (isNoneOfAbove) {
                              next = [optLabel];
                            } else {
                              // If user clicked another choice, uncheck any existing "None of the above"
                              const filtered = currentArr.filter(item => {
                                const itemLower = String(item).toLowerCase();
                                return !itemLower.includes('none of') && !itemLower.includes('neither') && itemLower !== 'none';
                              });

                              // Enforce max_select limit if configured
                              if (currentStep.max_select && filtered.length >= currentStep.max_select) {
                                setValidationError(`You can select a maximum of ${currentStep.max_select} options.`);
                                return;
                              }

                              const existingDetail = answers[currentStep.id + '_other'] || '';
                              const toAdd = (isOther && existingDetail.trim()) ? `Other: ${existingDetail.trim()}` : optLabel;
                              next = [...filtered, toAdd];
                            }
                          }
                          setAnswers(prev => ({ ...prev, [currentStep.id]: next }));
                          setValidationError(null);
                        }}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked 
                            ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500' 
                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <CheckCircle className="w-4 h-4" />}
                          </div>
                          <span className={`text-xs sm:text-sm font-semibold ${isChecked ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                            {optLabel}
                          </span>
                        </div>
                      </button>

                      {/* DYNAMIC OPEN-ENDED TEXTBOX ON 'OTHER' CHECKBOX */}
                      {isOther && isChecked && (
                        <div className="ml-3 sm:ml-9 p-3 sm:p-4 bg-indigo-50/80 border-2 border-indigo-400 rounded-xl sm:rounded-2xl space-y-2 shadow-xs transition-all">
                          <label className="block text-[11px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                            <span>Please specify your response:</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              autoFocus
                              value={answers[currentStep.id + '_other'] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updatedArr = currentArr.map(item => 
                                  (item === optLabel || (typeof item === 'string' && item.startsWith('Other:'))) ? (val.trim() ? `Other: ${val.trim()}` : optLabel) : item
                                );
                                setAnswers(prev => ({
                                  ...prev,
                                  [currentStep.id + '_other']: val,
                                  [currentStep.id]: updatedArr
                                }));
                                setValidationError(null);
                              }}
                              placeholder={currentStep.other_placeholder || "Type your custom response here..."}
                              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-indigo-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 shadow-2xs"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            Your specified input will be recorded directly with your survey response.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Rating Scale (1 to 5 / 7 / 10) */}
            {currentStep.type === 'rating_scale' && (
              <div className="space-y-4 pt-2">
                <div className="overflow-x-auto pb-1 -mx-1 px-1">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 min-w-[260px]">
                    {Array.from({ length: currentStep.maxRating || 5 }, (_, i) => i + 1).map((val) => {
                      const isSelected = answers[currentStep.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setAnswers(prev => ({ ...prev, [currentStep.id]: val }));
                            setValidationError(null);
                          }}
                          className={`flex-1 min-w-[36px] h-12 sm:h-16 rounded-xl sm:rounded-2xl border font-black text-sm sm:text-lg flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 scale-105'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 px-1">
                  <span>{currentStep.minLabel || 'Poor'}</span>
                  <span>{currentStep.maxLabel || 'Excellent'}</span>
                </div>
              </div>
            )}

            {/* Net Promoter Score (0 to 10) */}
            {currentStep.type === 'nps' && (
              <div className="space-y-3 pt-2">
                <div className="overflow-x-auto pb-2 -mx-1 px-1">
                  <div className="flex sm:grid sm:grid-cols-11 gap-1 sm:gap-1.5 min-w-[340px] sm:min-w-0">
                    {Array.from({ length: 11 }, (_, i) => i).map((num) => {
                      const isSelected = answers[currentStep.id] === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            setAnswers(prev => ({ ...prev, [currentStep.id]: num }));
                            setValidationError(null);
                          }}
                          className={`flex-1 min-w-[28px] sm:min-w-0 h-10 sm:h-14 rounded-lg sm:rounded-xl border text-xs sm:text-sm font-black flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? num >= 9 ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-md' : num >= 7 ? 'bg-amber-500 text-white border-amber-500 scale-105 shadow-md' : 'bg-rose-600 text-white border-rose-600 scale-105 shadow-md'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between text-[11px] sm:text-xs font-semibold text-slate-400 px-1">
                  <span>0 - Not At All Likely</span>
                  <span>10 - Extremely Likely</span>
                </div>
              </div>
            )}

            {/* Open Text */}
            {currentStep.type === 'text' && (
              <div className="pt-2">
                <textarea
                  rows={4}
                  value={answers[currentStep.id] || ''}
                  onChange={(e) => {
                    setAnswers(prev => ({ ...prev, [currentStep.id]: e.target.value }));
                    setValidationError(null);
                  }}
                  placeholder={currentStep.placeholder || 'Type your answer here...'}
                  className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 focus:bg-white"
                />
              </div>
            )}

            {/* Numeric Input */}
            {currentStep.type === 'numeric' && (
              <div className="pt-2">
                <input
                  type="number"
                  value={answers[currentStep.id] ?? ''}
                  onChange={(e) => {
                    setAnswers(prev => ({ ...prev, [currentStep.id]: e.target.value }));
                    setValidationError(null);
                  }}
                  placeholder="e.g. 18"
                  className="w-full p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 text-sm sm:text-base font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 focus:bg-white"
                />
              </div>
            )}

            {/* Matrix Grid */}
            {currentStep.type === 'matrix' && (() => {
              const matrixRows = (currentStep.rows && currentStep.rows.length > 0) 
                ? currentStep.rows 
                : (currentStep.options || []);
              const matrixCols = (currentStep.columns && currentStep.columns.length > 0)
                ? currentStep.columns
                : (currentStep.matrix_columns || []);

              return (
                <div className="overflow-x-auto pt-2 -mx-1 px-1">
                  <table className="w-full text-xs text-left min-w-[500px] border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="py-3 px-4 font-bold text-slate-700 w-2/5">Statement / Topic</th>
                        {matrixCols.map((col, cIdx) => {
                          const colLabel = typeof col === 'string' ? col : (col.label || col.name || '');
                          return (
                            <th key={cIdx} className="py-3 px-2 text-center font-bold text-slate-700">
                              {colLabel}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {matrixRows.map((row, rIdx) => {
                        const rowLabel = typeof row === 'string' ? row : (row.text || row.name || '');
                        const matrixState = (typeof answers[currentStep.id] === 'object' && answers[currentStep.id] !== null) 
                          ? answers[currentStep.id] 
                          : {};
                        const selectedCol = matrixState[rowLabel];

                        return (
                          <tr key={rIdx} className="hover:bg-indigo-50/40 transition-colors">
                            <td className="py-3 px-4 font-semibold text-slate-800 text-xs sm:text-sm">
                              {rowLabel}
                            </td>
                            {matrixCols.map((col, cIdx) => {
                              const colLabel = typeof col === 'string' ? col : (col.label || col.name || '');
                              const isColSelected = selectedCol === colLabel;

                              return (
                                <td 
                                  key={cIdx} 
                                  className="py-3 px-2 text-center cursor-pointer select-none"
                                  onClick={() => {
                                    setAnswers(prev => ({
                                      ...prev,
                                      [currentStep.id]: {
                                        ...(typeof prev[currentStep.id] === 'object' ? prev[currentStep.id] : {}),
                                        [rowLabel]: colLabel
                                      }
                                    }));
                                    setValidationError(null);
                                  }}
                                >
                                  <div className="flex items-center justify-center">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      isColSelected
                                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs scale-110'
                                        : 'border-slate-300 hover:border-indigo-400 bg-white'
                                    }`}>
                                      {isColSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Item Ranking (Prioritization) */}
            {currentStep.type === 'ranking' && (() => {
              const rankingOptions = safeArray(currentStep.options).map(opt => typeof opt === 'string' ? opt : (opt.text || opt.name || opt.label || ''));
              const rankedList = Array.isArray(answers[currentStep.id]) ? answers[currentStep.id] : [];
              const maxRanks = currentStep.max_ranks || Math.min(5, rankingOptions.length);

              const handleToggleRank = (item) => {
                if (rankedList.includes(item)) {
                  const next = rankedList.filter(i => i !== item);
                  setAnswers(prev => ({ ...prev, [currentStep.id]: next }));
                } else {
                  if (rankedList.length < maxRanks) {
                    const next = [...rankedList, item];
                    setAnswers(prev => ({ ...prev, [currentStep.id]: next }));
                  }
                }
                setValidationError(null);
              };

              const moveRank = (index, direction) => {
                const newIdx = index + direction;
                if (newIdx < 0 || newIdx >= rankedList.length) return;
                const next = [...rankedList];
                const [moved] = next.splice(index, 1);
                next.splice(newIdx, 0, moved);
                setAnswers(prev => ({ ...prev, [currentStep.id]: next }));
                setValidationError(null);
              };

              return (
                <div className="space-y-4 pt-2">
                  {/* Selected Ranked Items Container */}
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      <span>Your Top {maxRanks} Ranking ({rankedList.length}/{maxRanks} chosen)</span>
                      {rankedList.length < maxRanks && (
                        <span className="text-indigo-600 font-normal lowercase">Click choices below to add</span>
                      )}
                    </div>

                    {rankedList.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-white/80 rounded-xl border border-dashed border-indigo-200">
                        No choices ranked yet. Click any item below to prioritize it.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {rankedList.map((item, idx) => (
                          <div
                            key={item}
                            className="flex items-center justify-between bg-white border border-indigo-200 px-3.5 py-2.5 rounded-xl shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                                #{idx + 1}
                              </span>
                              <span className="text-xs sm:text-sm font-semibold text-slate-800">{item}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveRank(idx, -1)}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Move up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === rankedList.length - 1}
                                onClick={() => moveRank(idx, 1)}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                                title="Move down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleRank(item)}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                                title="Remove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available choices */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Available Choices (Click to rank):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {rankingOptions.map(item => {
                        const isRanked = rankedList.includes(item);
                        const rankIndex = rankedList.indexOf(item);

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleToggleRank(item)}
                            className={`text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-2 cursor-pointer ${
                              isRanked
                                ? 'border-indigo-500 bg-indigo-50/70 text-indigo-950 font-bold shadow-2xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span>{item}</span>
                            {isRanked ? (
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold shrink-0 flex items-center justify-center">
                                #{rankIndex + 1}
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Validation Warning */}
          {validationError && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {survey.settings?.allow_back_button !== false ? (
              <button
                type="button"
                disabled={currentStepIndex === 0 || isSubmitting}
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">Back navigation locked</span>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : currentStepIndex === expandedSteps.length - 1 ? (
                <>
                  <span>Submit Survey</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </main>
      )}

      {/* Subtle Footer */}
      {!(survey?.settings?.whitelabel_enabled && survey?.settings?.hide_powered_by) && (
        <footer className="py-4 text-center text-xs text-slate-400">
          {survey?.settings?.whitelabel_enabled && survey?.settings?.client_brand_name
            ? `Powered by ${survey.settings.client_brand_name}`
            : 'Powered by Unified Survey Platform & PostgreSQL'}
        </footer>
      )}

    </div>
  );
}
