import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  GitBranch, 
  Play, 
  Save, 
  Share2, 
  Database, 
  BarChart3, 
  HelpCircle, 
  Check, 
  AlertCircle, 
  Sparkles, 
  ListOrdered, 
  CheckSquare, 
  CircleDot, 
  Star, 
  Grid, 
  Type, 
  Hash, 
  Gauge, 
  ExternalLink,
  Repeat,
  ArrowLeft,
  FolderOpen,
  RefreshCw,
  Eye,
  Building2,
  Link2,
  Globe
} from 'lucide-react';
import LogicRuleEditor from './LogicRuleEditor';
import SurveySettingsModal from './SurveySettingsModal';
import SurveyLibraryModal from './SurveyLibraryModal';

// Safe array normalizer to prevent .map crashes on non-array options
export const safeArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'object' && val !== null) return Object.values(val);
  if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
  return [];
};

// 8 Supported Enterprise Question Types
export const QUESTION_TYPES = [
  { type: 'single_choice', label: 'Single Choice', icon: CircleDot, desc: 'Radio buttons (select one option)' },
  { type: 'multiple_choice', label: 'Multiple Choice', icon: CheckSquare, desc: 'Checkboxes (select multiple options)' },
  { type: 'rating_scale', label: 'Rating Scale', icon: Star, desc: '1-5 or 1-10 Likert rating' },
  { type: 'nps', label: 'Net Promoter Score', icon: Gauge, desc: 'Standard 0-10 NPS gauge' },
  { type: 'matrix', label: 'Matrix Grid', icon: Grid, desc: 'Row statements evaluated by rating columns' },
  { type: 'ranking', label: 'Item Ranking', icon: ListOrdered, desc: 'Prioritize top 3-5 items' },
  { type: 'text', label: 'Open-ended Text', icon: Type, desc: 'Short or long textual feedback' },
  { type: 'numeric', label: 'Numeric / Currency', icon: Hash, desc: 'Age, hours, budget with validation' }
];

// Matrix Scale Presets for fast 1-click scale configuration
export const MATRIX_SCALE_PRESETS = [
  { 
    id: 'agreement_5', 
    label: '5-Point Agreement (Strongly Disagree to Strongly Agree)', 
    columns: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] 
  },
  { 
    id: 'satisfaction_5', 
    label: '5-Point Satisfaction (Very Dissatisfied to Very Satisfied)', 
    columns: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] 
  },
  { 
    id: 'performance_4', 
    label: '4-Point Quality (Poor to Excellent)', 
    columns: ['1 - Poor', '2 - Fair', '3 - Good', '4 - Excellent'] 
  },
  { 
    id: 'frequency_5', 
    label: '5-Point Frequency (Never to Always)', 
    columns: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] 
  },
  { 
    id: 'importance_4', 
    label: '4-Point Importance (Not to Very Important)', 
    columns: ['Not Important', 'Somewhat Important', 'Important', 'Very Important'] 
  },
  { 
    id: 'usage_sg', 
    label: '5-Point Usage Situation (Tuition / Enrichment Study)', 
    columns: ['Currently use', 'Used in last 6 months', 'Used before last 6 months', 'Would consider', 'Would not consider'] 
  },
  { 
    id: 'numeric_5', 
    label: 'Numeric Scale (1 to 5)', 
    columns: ['1', '2', '3', '4', '5'] 
  }
];

// Helper to determine if an option is explicitly configured as 'Other (specify)'
export function isOptionOther(opt, q) {
  if (!opt || !q) return false;
  if (typeof opt === 'object' && (opt.is_other === true || opt.isOther === true)) return true;
  const optText = (typeof opt === 'string' ? opt : (opt.text || opt.name || opt.label || '')).trim();
  if (Array.isArray(q.other_options) && q.other_options.some(o => (typeof o === 'string' ? o : (o?.text || o?.name || '')).trim() === optText)) return true;
  if (q.allow_other && q.other_option && q.other_option.trim() === optText) return true;
  return false;
}

// Factory function for an empty, clean survey
export const createBlankSurvey = () => {
  const randomSlug = 'survey-' + Math.random().toString(36).substring(2, 8);
  return {
    id: null,
    title: 'Untitled Survey',
    slug: randomSlug,
    description: '',
    status: 'draft',
    target_responses: 400,
    theme: { primaryColor: '#4f46e5', font: 'Inter' },
    questions: [], // Starts 100% blank!
    logic_rules: [],
    settings: {
      qualified_title: 'Survey Completed Successfully!',
      qualified_message: 'Thank you for your valuable feedback. Your responses have been securely recorded in the cloud database.',
      qualified_redirect_url: '',
      screenout_title: 'Thank You for Your Interest',
      screenout_message: 'Based on your preliminary answers, you do not meet the qualification criteria required for this specific research study.',
      screenout_redirect_url: '',
      quota_full_title: 'Quota Reached for Your Group',
      quota_full_message: 'Thank you for taking the time to start this survey. The quota for your demographic group has already been reached.',
      quota_full_redirect_url: '',
      prevent_duplicates: true,
      allow_back_button: true,
      max_responses_cap: 400,
      survey_expiry_date: '',
      quotas: []
    }
  };
};

export default function SurveyBuilder({ 
  initialSurveyId, 
  onNavigateToStudio, 
  onNavigateToRuntime, 
  onBackToApp 
}) {
  // Survey State - default is completely blank
  const [survey, setSurvey] = useState(() => createBlankSurvey());

  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);
  const [isLogicModalOpen, setIsLogicModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState('quotas');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWhitelabelLink, setCopiedWhitelabelLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [showSurveyListModal, setShowSurveyListModal] = useState(false);

  const openSettingsWithTab = (tab = 'quotas') => {
    setSettingsActiveTab(tab);
    setIsSettingsModalOpen(true);
  };
  const [matrixBulkMode, setMatrixBulkMode] = useState({});
  const [matrixBulkText, setMatrixBulkText] = useState({});
  const [recentlyAddedId, setRecentlyAddedId] = useState(null);
  const [recentlyAddedType, setRecentlyAddedType] = useState(null);
  const [floatingToast, setFloatingToast] = useState(null);

  const triggerToast = (msg, type = 'success') => {
    setFloatingToast({ msg, type });
    setTimeout(() => setFloatingToast(null), 3000);
  };

  // Fetch list of surveys from Supabase / server
  const loadSurveys = async () => {
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (data.success && data.surveys) {
        setAvailableSurveys(data.surveys);
      }
    } catch (err) {
      console.error('Failed to load surveys:', err);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  // Initialize a fresh blank survey
  const handleCreateNewSurvey = () => {
    setSurvey(createBlankSurvey());
    setSelectedQuestionId(null);
    setSaveMessage({ type: 'success', text: 'Created a blank survey canvas! Ready to add questions.' });
    setTimeout(() => setSaveMessage(null), 3500);
  };

  // If initialSurveyId passed or chosen
  const handleLoadSurvey = async (slugOrId) => {
    try {
      const res = await fetch(`/api/surveys/${slugOrId}`);
      const data = await res.json();
      if (data.success && data.survey) {
        setSurvey(data.survey);
        setShowSurveyListModal(false);
        setSaveMessage({ type: 'success', text: `Loaded "${data.survey.title}" successfully!` });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } catch (err) {
      alert('Error loading survey: ' + err.message);
    }
  };

  useEffect(() => {
    if (initialSurveyId === 'new') {
      handleCreateNewSurvey();
    } else if (initialSurveyId) {
      handleLoadSurvey(initialSurveyId);
    }
  }, [initialSurveyId]);

  // Save to Supabase Cloud
  const handleSaveToSupabase = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(survey)
      });
      const data = await res.json();
      if (data.success) {
        setSurvey(data.survey);
        setSaveMessage({ type: 'success', text: 'Saved to Supabase Cloud Database successfully!' });
        loadSurveys();
      } else {
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save survey' });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.message });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(null), 4000);
    }
  };

  // Add Question
  const handleAddQuestion = (type) => {
    const qCount = survey.questions.length + 1;
    const newId = `q${qCount}_${type.substring(0, 4)}`;
    
    let template = {
      id: newId,
      type,
      title: `New ${QUESTION_TYPES.find(t => t.type === type)?.label || 'Question'}`,
      subtitle: '',
      required: true
    };

    if (type === 'single_choice' || type === 'multiple_choice' || type === 'ranking') {
      template.options = ['Option 1', 'Option 2', 'Option 3'];
    } else if (type === 'rating_scale') {
      template.minRating = 1;
      template.maxRating = 5;
      template.minLabel = 'Poor';
      template.maxLabel = 'Excellent';
    } else if (type === 'matrix') {
      const defaultRows = ['Quality of teaching', 'Course materials', 'Value for money', 'Location / Facility'];
      const defaultCols = ['1 - Poor', '2 - Fair', '3 - Good', '4 - Very Good', '5 - Excellent'];
      template.rows = defaultRows;
      template.options = defaultRows;
      template.columns = defaultCols;
      template.matrix_columns = defaultCols;
    } else if (type === 'text') {
      template.placeholder = 'Type response here...';
    } else if (type === 'numeric') {
      template.minVal = 0;
      template.maxVal = 100;
      template.suffix = '';
    }

    setSurvey(prev => ({
      ...prev,
      questions: [...prev.questions, template]
    }));

    // Interactive Click Feedback & Toast
    const typeLabel = QUESTION_TYPES.find(t => t.type === type)?.label || type;
    setRecentlyAddedType(type);
    setRecentlyAddedId(newId);
    triggerToast(`Added Q${qCount}: ${typeLabel} to questionnaire flow!`, 'success');

    setTimeout(() => {
      setRecentlyAddedType(null);
    }, 1500);

    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 3000);

    // Smoothly scroll down to newly added question card
    setTimeout(() => {
      const el = document.getElementById(`question_card_${newId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  };

  // Update specific question field
  const updateQuestion = (index, updates) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      qs[index] = { ...qs[index], ...updates };
      return { ...prev, questions: qs };
    });
  };

  // Move Question
  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= survey.questions.length) return;
    setSurvey(prev => {
      const qs = [...prev.questions];
      const temp = qs[index];
      qs[index] = qs[newIndex];
      qs[newIndex] = temp;
      return { ...prev, questions: qs };
    });
  };

  // Duplicate Question
  const duplicateQuestion = (index) => {
    setSurvey(prev => {
      const source = prev.questions[index];
      const copy = {
        ...source,
        id: `${source.id}_copy_${Math.random().toString(36).substring(2, 5)}`,
        title: `${source.title} (Copy)`
      };
      const qs = [...prev.questions];
      qs.splice(index + 1, 0, copy);
      return { ...prev, questions: qs };
    });
  };

  // Delete Question
  const deleteQuestion = (index) => {
    if (survey.questions.length <= 1) {
      alert('A survey must have at least one question.');
      return;
    }
    const targetQId = survey.questions[index].id;
    setSurvey(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
      logic_rules: (prev.logic_rules || []).filter(
        r => r.triggerQuestionId !== targetQId && r.targetQuestionId !== targetQId
      )
    }));
  };

  // Choice options manager
  const addOption = (qIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const currentOpts = qs[qIdx].options || [];
      qs[qIdx] = {
        ...qs[qIdx],
        options: [...currentOpts, `Option ${currentOpts.length + 1}`]
      };
      return { ...prev, questions: qs };
    });
  };

  const addOtherOption = (qIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const currentOpts = q.options || [];
      const newOtherLabel = 'Other (Please specify)';
      
      const nextOpts = [...currentOpts, newOtherLabel];
      const nextOtherOpts = [...(q.other_options || []), newOtherLabel];

      qs[qIdx] = {
        ...q,
        options: nextOpts,
        other_options: nextOtherOpts,
        other_option: newOtherLabel,
        allow_other: true,
        other_placeholder: 'Please specify your response...'
      };
      return { ...prev, questions: qs };
    });
  };

  // Explicitly toggle open textbox on any choice
  const toggleOptionOther = (qIdx, optIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const currentOpts = safeArray(q.options);
      const opt = currentOpts[optIdx];
      const optText = typeof opt === 'string' ? opt : (opt?.text || opt?.name || '');
      
      const currentOtherList = q.other_options || [];
      const isCurrentlyOther = currentOtherList.includes(optText) || (typeof opt === 'object' && (opt?.is_other || opt?.isOther));

      let nextOtherList;
      let nextOptions = [...currentOpts];

      if (isCurrentlyOther) {
        nextOtherList = currentOtherList.filter(item => item !== optText);
        if (typeof opt === 'object') {
          nextOptions[optIdx] = { ...opt, is_other: false, isOther: false };
        }
      } else {
        nextOtherList = [...currentOtherList, optText];
        if (typeof opt === 'object') {
          nextOptions[optIdx] = { ...opt, is_other: true, isOther: true };
        }
      }

      qs[qIdx] = {
        ...q,
        options: nextOptions,
        other_options: nextOtherList,
        allow_other: nextOtherList.length > 0
      };
      return { ...prev, questions: qs };
    });
  };

  const updateOption = (qIdx, optIdx, val) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const currentOpts = [...safeArray(q.options)];
      const oldOpt = currentOpts[optIdx];
      const oldText = typeof oldOpt === 'string' ? oldOpt : (oldOpt?.text || oldOpt?.name || '');
      
      if (typeof oldOpt === 'object') {
        currentOpts[optIdx] = { ...oldOpt, text: val };
      } else {
        currentOpts[optIdx] = val;
      }

      let updatedOtherOpts = q.other_options || [];
      if (updatedOtherOpts.includes(oldText)) {
        updatedOtherOpts = updatedOtherOpts.map(o => o === oldText ? val : o);
      }

      qs[qIdx] = { 
        ...q, 
        options: currentOpts,
        other_options: updatedOtherOpts
      };
      return { ...prev, questions: qs };
    });
  };

  const deleteOption = (qIdx, optIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const currentOpts = [...safeArray(q.options)];
      const removedOpt = currentOpts[optIdx];
      const removedText = typeof removedOpt === 'string' ? removedOpt : (removedOpt?.text || removedOpt?.name || '');
      currentOpts.splice(optIdx, 1);

      const updatedOtherOpts = (q.other_options || []).filter(o => o !== removedText);

      qs[qIdx] = { 
        ...q, 
        options: currentOpts,
        other_options: updatedOtherOpts,
        allow_other: updatedOtherOpts.length > 0
      };
      return { ...prev, questions: qs };
    });
  };

  // Matrix Row functions
  const addMatrixRow = (qIdx, atIndex = null) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const currentRows = q.rows || q.options || [];
      const newRow = `Statement ${currentRows.length + 1}`;
      let nextRows = [...currentRows];
      if (atIndex !== null && atIndex >= 0 && atIndex <= currentRows.length) {
        nextRows.splice(atIndex, 0, newRow);
      } else {
        nextRows.push(newRow);
      }
      qs[qIdx] = {
        ...q,
        rows: nextRows,
        options: nextRows
      };
      return { ...prev, questions: qs };
    });
  };

  const updateMatrixRow = (qIdx, rIdx, val) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const nextRows = [...(q.rows || q.options || [])];
      nextRows[rIdx] = val;
      qs[qIdx] = {
        ...q,
        rows: nextRows,
        options: nextRows
      };
      return { ...prev, questions: qs };
    });
  };

  const deleteMatrixRow = (qIdx, rIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const nextRows = [...(q.rows || q.options || [])];
      if (nextRows.length <= 1) {
        alert('A matrix question must have at least one statement row.');
        return prev;
      }
      nextRows.splice(rIdx, 1);
      qs[qIdx] = {
        ...q,
        rows: nextRows,
        options: nextRows
      };
      return { ...prev, questions: qs };
    });
  };

  const moveMatrixRow = (qIdx, rIdx, dir) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const nextRows = [...(q.rows || q.options || [])];
      const targetIdx = rIdx + dir;
      if (targetIdx < 0 || targetIdx >= nextRows.length) return prev;
      const temp = nextRows[rIdx];
      nextRows[rIdx] = nextRows[targetIdx];
      nextRows[targetIdx] = temp;
      qs[qIdx] = {
        ...q,
        rows: nextRows,
        options: nextRows
      };
      return { ...prev, questions: qs };
    });
  };

  // Matrix Column functions
  const addMatrixColumn = (qIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const currentCols = q.columns || q.matrix_columns || [];
      const newCol = `Column ${currentCols.length + 1}`;
      const nextCols = [...currentCols, newCol];
      qs[qIdx] = {
        ...q,
        columns: nextCols,
        matrix_columns: nextCols
      };
      return { ...prev, questions: qs };
    });
  };

  const updateMatrixColumn = (qIdx, cIdx, val) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const nextCols = [...(q.columns || q.matrix_columns || [])];
      nextCols[cIdx] = val;
      qs[qIdx] = {
        ...q,
        columns: nextCols,
        matrix_columns: nextCols
      };
      return { ...prev, questions: qs };
    });
  };

  const deleteMatrixColumn = (qIdx, cIdx) => {
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      const nextCols = [...(q.columns || q.matrix_columns || [])];
      if (nextCols.length <= 1) {
        alert('A matrix question must have at least one rating column.');
        return prev;
      }
      nextCols.splice(cIdx, 1);
      qs[qIdx] = {
        ...q,
        columns: nextCols,
        matrix_columns: nextCols
      };
      return { ...prev, questions: qs };
    });
  };

  const applyMatrixScalePreset = (qIdx, presetId) => {
    const preset = MATRIX_SCALE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSurvey(prev => {
      const qs = [...prev.questions];
      const q = qs[qIdx];
      qs[qIdx] = {
        ...q,
        columns: [...preset.columns],
        matrix_columns: [...preset.columns]
      };
      return { ...prev, questions: qs };
    });
  };

  const applyBulkRows = (qIdx, qId) => {
    const rawText = matrixBulkText[qId] ?? (survey.questions[qIdx].rows || survey.questions[qIdx].options || []).join('\n');
    const parsed = rawText.split('\n').map(s => s.trim()).filter(Boolean);
    if (parsed.length === 0) {
      alert('Please enter at least one statement row.');
      return;
    }
    updateQuestion(qIdx, { rows: parsed, options: parsed });
    setMatrixBulkMode(prev => ({ ...prev, [qId]: false }));
  };

  // Base platform domain & live link URLs
  const platformDomain = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? window.location.hostname
    : 'surveybuilder.io';

  const publicShareUrl = `${window.location.origin}/s/${survey.slug}`;
  const brandSubdomain = (survey.settings?.brand_subdomain || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const subdomainUrl = brandSubdomain ? `https://${brandSubdomain}.${platformDomain}/s/${survey.slug}` : null;
  const customDomain = (survey.settings?.custom_domain || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const customDomainUrl = customDomain ? `https://${customDomain}/s/${survey.slug}` : null;
  const whitelabelUrl = customDomainUrl || subdomainUrl;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Builder Toolbar & Survey Settings */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 sm:py-3 shadow-xs sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          
          {/* Survey Title & Metadata */}
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={survey.title}
                onChange={(e) => setSurvey(prev => ({ ...prev, title: e.target.value }))}
                className="text-base sm:text-xl font-black text-slate-900 tracking-tight bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none transition-colors w-full sm:max-w-xl"
                placeholder="Survey Title..."
              />
              <select
                value={survey.status || 'draft'}
                onChange={(e) => setSurvey(prev => ({ ...prev, status: e.target.value }))}
                className={`text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                  survey.status === 'live' 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : survey.status === 'paused'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : survey.status === 'closed'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <option value="draft">🟡 Draft</option>
                <option value="live">🟢 Live</option>
                <option value="paused">🟠 Paused</option>
                <option value="closed">🔴 Closed</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <span className="font-mono text-slate-400">Slug:</span>
                <input
                  type="text"
                  value={survey.slug}
                  onChange={(e) => setSurvey(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-') }))}
                  className="font-mono text-indigo-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 focus:outline-none focus:border-indigo-500 max-w-[130px] sm:max-w-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">Target N:</span>
                <input
                  type="number"
                  min="0"
                  placeholder="400"
                  value={survey.target_responses === 0 ? '0' : (survey.target_responses ?? '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSurvey(prev => ({
                      ...prev,
                      target_responses: val === '' ? '' : parseInt(val, 10)
                    }));
                  }}
                  onBlur={() => {
                    if (survey.target_responses === '' || isNaN(survey.target_responses)) {
                      setSurvey(prev => ({ ...prev, target_responses: 400 }));
                    }
                  }}
                  className="w-16 sm:w-20 text-center font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-300 focus:outline-none focus:border-indigo-500 focus:bg-white transition text-xs"
                />
              </div>

              {survey.settings?.quotas?.length > 0 && (
                <span className="text-indigo-600 font-bold flex items-center gap-1">
                  🎯 {survey.settings.quotas.length} Quota Targets Active
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleCreateNewSurvey}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-200"
              title="Create a new blank survey canvas"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>+ New Blank Survey</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSurveyListModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
              title="Browse & switch surveys"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>My Surveys</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-mono text-[10px]">
                {availableSurveys.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => openSettingsWithTab('quotas')}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Settings & Quotas</span>
              {(survey.settings?.quotas?.length > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-mono text-[10px]">
                  {survey.settings.quotas.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => openSettingsWithTab('whitelabel')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${
                survey.settings?.whitelabel_enabled
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Configure Custom Brand Domain (CNAME) and Whitelabeling"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>Whitelabel & Domain</span>
              {survey.settings?.whitelabel_enabled && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-mono text-[9px] font-bold">
                  ACTIVE
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedQuestionId(null);
                setIsLogicModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
            >
              <GitBranch className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Logic ({survey.logic_rules?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToSupabase}
              disabled={isSaving}
              className="inline-flex items-center gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isSaving ? 'Saving...' : 'Save to Cloud'}</span>
            </button>
          </div>

        </div>

        {/* Save feedback banner */}
        {saveMessage && (
          <div className={`mt-3 max-w-7xl mx-auto p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
            saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {saveMessage.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span>{saveMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Workspace: Left Palette + Center Canvas */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 8 Question Types Palette */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs sticky top-24">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Add Question Type</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {QUESTION_TYPES.map((t) => {
                const Icon = t.icon;
                const isJustAdded = recentlyAddedType === t.type;
                return (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => handleAddQuestion(t.type)}
                    className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-150 group cursor-pointer active:scale-[0.97] select-none ${
                      isJustAdded
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/30 shadow-md scale-[1.02]'
                        : 'border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-xs'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
                      isJustAdded
                        ? 'bg-emerald-600 text-white shadow-sm scale-110'
                        : 'bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600'
                    }`}>
                      {isJustAdded ? <Check className="w-4 h-4 animate-in zoom-in-75" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold transition-colors ${
                          isJustAdded ? 'text-emerald-950 font-black' : 'text-slate-800 group-hover:text-indigo-900'
                        }`}>
                          {t.label}
                        </span>
                        {isJustAdded && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase animate-pulse shrink-0">
                            Added ✓
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Templates Box */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Superpowers & Rules</span>
              </div>
              <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <p>• <strong>Piping:</strong> Insert <code className="bg-white px-1 border rounded text-[11px] font-mono text-indigo-600">&#123;&#123;q_id&#125;&#125;</code> in titles.</p>
                <p>• <strong>Looping:</strong> Toggle "Loop for each choice" to evaluate each brand or product dynamically.</p>
                <p>• <strong>Jumps:</strong> Auto-skip to any question or screenout instantly.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Center Column: Questions Canvas */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <span>Questionnaire Flow</span>
              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                {survey.questions.length} Questions
              </span>
            </h2>
          </div>

          {(!survey.questions || survey.questions.length === 0) ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                <Plus className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-black text-slate-800">Your Questionnaire is Blank</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Start building your custom survey from scratch. Click any question type from the palette on the left, or use the quick button below.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('single_choice')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Single Choice Question</span>
                </button>
              </div>
            </div>
          ) : (
            survey.questions.map((q, qIdx) => {
            const typeInfo = QUESTION_TYPES.find(t => t.type === q.type) || QUESTION_TYPES[0];
            const Icon = typeInfo.icon;
            const attachedRules = (survey.logic_rules || []).filter(r => r.triggerQuestionId === q.id);

            return (
              <div 
                id={`question_card_${q.id}`}
                key={q.id || qIdx} 
                className={`bg-white rounded-2xl border transition-all duration-300 p-3.5 sm:p-6 space-y-3.5 sm:space-y-4 ${
                  recentlyAddedId === q.id
                    ? 'border-emerald-500 ring-4 ring-emerald-500/25 shadow-lg scale-[1.01] bg-emerald-50/10'
                    : 'border-slate-200/90 shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Question Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      Q{qIdx + 1}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium flex-wrap">
                      <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-bold text-slate-800">{typeInfo.label}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-slate-400 text-[11px]">ID:</span>
                      <input
                        type="text"
                        value={q.id}
                        onChange={(e) => updateQuestion(qIdx, { id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                        className="font-mono text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 w-24 sm:w-28 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Actions (Reorder, Duplicate, Delete) */}
                  <div className="flex items-center justify-end gap-1 shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      disabled={qIdx === 0}
                      onClick={() => moveQuestion(qIdx, -1)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={qIdx === survey.questions.length - 1}
                      onClick={() => moveQuestion(qIdx, 1)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => duplicateQuestion(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteQuestion(qIdx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Title & Subtitle */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Question Title:</label>
                    <input
                      type="text"
                      value={q.title}
                      onChange={(e) => updateQuestion(qIdx, { title: e.target.value })}
                      placeholder="e.g. How satisfied are you with our service?"
                      className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      value={q.subtitle || ''}
                      onChange={(e) => updateQuestion(qIdx, { subtitle: e.target.value })}
                      placeholder="Optional instructions or subtitle (e.g. Select only one)..."
                      className="w-full text-xs text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Type-Specific Options Editor */}
                {(q.type === 'single_choice' || q.type === 'multiple_choice' || q.type === 'ranking') && (
                  <div className="pt-2 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-slate-700">Answer Choices:</label>
                      <span className="text-[10px] text-slate-400 font-medium">Click + Add 'Other' to provide open text response</span>
                    </div>

                    <div className="space-y-2">
                      {safeArray(q.options).map((opt, optIdx) => {
                        const optText = typeof opt === 'string' ? opt : (opt.text || opt.name || '');
                        const isOther = isOptionOther(opt, q);

                        return (
                          <div key={optIdx} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono w-4">{optIdx + 1}.</span>
                              <input
                                type="text"
                                value={optText}
                                onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className={`flex-1 text-xs px-3 py-1.5 rounded-lg border bg-white text-slate-800 focus:outline-none focus:ring-2 ${
                                  isOther 
                                    ? 'border-amber-300 focus:ring-amber-500 bg-amber-50/20 font-medium' 
                                    : 'border-slate-200 focus:ring-indigo-500'
                                }`}
                              />

                              {/* Interactive toggle for dynamic textbox */}
                              <button
                                type="button"
                                onClick={() => toggleOptionOther(qIdx, optIdx)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border flex items-center gap-1 transition cursor-pointer shrink-0 ${
                                  isOther 
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 shadow-2xs' 
                                    : 'text-slate-400 hover:text-amber-700 bg-slate-50 hover:bg-amber-50 border-slate-200 hover:border-amber-300'
                                }`}
                                title={isOther ? 'Click to disable open textbox for this choice' : 'Click to enable open textbox when respondent selects this choice'}
                              >
                                <Type className={`w-3 h-3 ${isOther ? 'text-amber-700' : 'text-slate-400'}`} />
                                <span>{isOther ? '✏️ Opens Textbox' : '+ Specify Box'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => deleteOption(qIdx, optIdx)}
                                className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer"
                                title="Delete option"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Visual cue in builder showing respondent will see open text box */}
                            {isOther && (
                              <div className="ml-6 pl-3 border-l-2 border-amber-400 py-1 flex items-center justify-between bg-amber-50/60 rounded-r-lg px-2.5 text-[11px] text-amber-900 border border-amber-200/50">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>Dynamic Input: When respondent selects this, an open text box will expand.</span>
                                </span>
                                <span className="font-mono text-[9px] text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded font-bold uppercase">
                                  Enabled
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-md hover:bg-indigo-50 transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Option</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => addOtherOption(qIdx)}
                        className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg font-bold cursor-pointer transition shadow-2xs"
                        title="Add 'Other (Please specify)' option with automatic open textbox"
                      >
                        <Type className="w-3.5 h-3.5 text-amber-600" />
                        <span>+ Add 'Other (Please specify)'</span>
                      </button>
                    </div>

                    {/* Advanced Option Controls */}
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      {/* Allow Other */}
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={!!q.allow_other && (q.other_options || []).length > 0}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            if (isChecked) {
                              addOtherOption(qIdx);
                            } else {
                              updateQuestion(qIdx, { 
                                allow_other: false,
                                other_options: [],
                                other_option: null
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />
                        <span className="text-[11px] font-semibold text-slate-700">
                          Allow "Other (Please specify)" with dynamic text input box
                        </span>
                      </label>

                      {/* Randomize Choices Order */}
                      <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={!!q.randomize_options}
                          onChange={(e) => updateQuestion(qIdx, { randomize_options: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                        />
                        <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                          <span>🔀 Randomize choices order</span>
                          <span className="text-[10px] text-slate-400 font-normal">("Other" and "None" stay pinned at bottom)</span>
                        </span>
                      </label>

                      {/* Multiple Choice Constraints: Min & Max */}
                      {q.type === 'multiple_choice' && (
                        <div className="pt-1 flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">Min Select:</span>
                            <input
                              type="number"
                              min="0"
                              max={q.options?.length || 10}
                              value={q.min_select || ''}
                              onChange={(e) => updateQuestion(qIdx, { min_select: e.target.value ? parseInt(e.target.value) : undefined })}
                              placeholder="0"
                              className="w-14 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-600">Max Select:</span>
                            <input
                              type="number"
                              min="1"
                              max={q.options?.length || 10}
                              value={q.max_select || ''}
                              onChange={(e) => updateQuestion(qIdx, { max_select: e.target.value ? parseInt(e.target.value) : undefined })}
                              placeholder="All"
                              className="w-14 px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white"
                            />
                          </div>
                          <span className="text-[10px] text-indigo-600 font-medium ml-auto">
                            💡 "None of the above" options auto-clear all others
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rating Scale Details */}
                {q.type === 'rating_scale' && (
                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Scale Range:</label>
                      <div className="flex items-center gap-2 text-xs">
                        <span>1 to</span>
                        <select
                          value={q.maxRating || 5}
                          onChange={(e) => updateQuestion(qIdx, { maxRating: parseInt(e.target.value) })}
                          className="px-2 py-1 rounded border border-slate-200 bg-white"
                        >
                          <option value={5}>5 Points</option>
                          <option value={7}>7 Points</option>
                          <option value={10}>10 Points</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Anchor Labels:</label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input
                          type="text"
                          value={q.minLabel || ''}
                          onChange={(e) => updateQuestion(qIdx, { minLabel: e.target.value })}
                          placeholder="Min: e.g. Poor"
                          className="px-2 py-1 rounded border border-slate-200"
                        />
                        <input
                          type="text"
                          value={q.maxLabel || ''}
                          onChange={(e) => updateQuestion(qIdx, { maxLabel: e.target.value })}
                          placeholder="Max: e.g. Excellent"
                          className="px-2 py-1 rounded border border-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Matrix Grid Details */}
                {q.type === 'matrix' && (() => {
                  const currentRows = q.rows || q.options || ['Statement 1', 'Statement 2', 'Statement 3'];
                  const currentCols = q.columns || q.matrix_columns || ['1 - Poor', '2 - Fair', '3 - Good', '4 - Excellent'];
                  const isBulkActive = !!matrixBulkMode[q.id];

                  return (
                    <div className="pt-2 space-y-4 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200 text-xs">
                      
                      {/* 1. Statements (Rows) Section */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <Grid className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Matrix Statements (Rows):</span>
                            </span>
                            <p className="text-[11px] text-slate-500">
                              Each statement will be evaluated across the rating scale. Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] font-bold text-slate-700 shadow-2xs">Enter ↵</kbd> to add the next row below.
                            </p>
                          </div>

                          {/* Toggle between Individual Row inputs and Bulk Paste */}
                          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setMatrixBulkMode(prev => ({ ...prev, [q.id]: false }))}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                !isBulkActive 
                                  ? 'bg-white text-indigo-900 shadow-2xs' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              List View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setMatrixBulkText(prev => ({
                                  ...prev,
                                  [q.id]: (q.rows || q.options || []).join('\n')
                                }));
                                setMatrixBulkMode(prev => ({ ...prev, [q.id]: true }));
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                                isBulkActive 
                                  ? 'bg-white text-indigo-900 shadow-2xs' 
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <span>📋 Paste Multiple / Bulk</span>
                            </button>
                          </div>
                        </div>

                        {/* Mode A: Bulk Textarea Mode */}
                        {isBulkActive ? (
                          <div className="space-y-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-200">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-indigo-900 flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Paste or type statements (one per line, press Enter / Alt+Enter freely):</span>
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {((matrixBulkText[q.id] || '').split('\n').filter(s => s.trim().length > 0)).length} statements detected
                              </span>
                            </div>
                            <textarea
                              rows={6}
                              value={matrixBulkText[q.id] ?? currentRows.join('\n')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMatrixBulkText(prev => ({ ...prev, [q.id]: val }));
                              }}
                              className="w-full p-2.5 bg-white rounded-lg border border-indigo-300 font-sans text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              placeholder="Academic subject tuition (Math, Science, English)&#10;Examination or test-preparation (O-Level, A-Level)&#10;Academic-based enrichment (debate, study skills)&#10;Hobby or skill-based enrichment (coding, arts, music)"
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setMatrixBulkMode(prev => ({ ...prev, [q.id]: false }))}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => applyBulkRows(qIdx, q.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Apply All Statements</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Mode B: Visual Row Inputs with Enter to create next row */
                          <div className="space-y-1.5">
                            {currentRows.map((rowText, rIdx) => (
                              <div key={rIdx} className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-400 font-mono w-5 shrink-0 text-right">{rIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={rowText}
                                  onChange={(e) => updateMatrixRow(qIdx, rIdx, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addMatrixRow(qIdx, rIdx + 1);
                                    }
                                  }}
                                  placeholder={`Statement ${rIdx + 1}`}
                                  className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                                />
                                
                                {/* Reorder Buttons */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={rIdx === 0}
                                    onClick={() => moveMatrixRow(qIdx, rIdx, -1)}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                    title="Move up"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={rIdx === currentRows.length - 1}
                                    onClick={() => moveMatrixRow(qIdx, rIdx, 1)}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                    title="Move down"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Delete Row */}
                                <button
                                  type="button"
                                  onClick={() => deleteMatrixRow(qIdx, rIdx)}
                                  className="p-1 text-slate-300 hover:text-rose-500 cursor-pointer shrink-0"
                                  title="Delete statement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}

                            <div className="flex items-center gap-2 pt-1.5">
                              <button
                                type="button"
                                onClick={() => addMatrixRow(qIdx)}
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold px-2.5 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Statement Row (or press Enter)</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Rating Columns (Scale) Section */}
                      <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-slate-800 text-xs">Rating Columns (Scale):</span>
                            <p className="text-[11px] text-slate-500">The options available for respondents across each statement row.</p>
                          </div>

                          {/* Quick Preset Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-500 font-medium">Scale Preset:</span>
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  applyMatrixScalePreset(qIdx, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              defaultValue=""
                              className="text-[11px] font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:ring-1 focus:ring-indigo-500"
                            >
                              <option value="" disabled>Choose Scale Preset...</option>
                              {MATRIX_SCALE_PRESETS.map(preset => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Columns visual chips / inputs */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {currentCols.map((colText, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                                <span className="text-[10px] font-mono font-bold text-slate-400">{cIdx + 1}</span>
                                <input
                                  type="text"
                                  value={colText}
                                  onChange={(e) => updateMatrixColumn(qIdx, cIdx, e.target.value)}
                                  placeholder={`Column ${cIdx + 1}`}
                                  className="flex-1 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteMatrixColumn(qIdx, cIdx)}
                                  className="p-0.5 text-slate-300 hover:text-rose-500 cursor-pointer"
                                  title="Delete column"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => addMatrixColumn(qIdx)}
                              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-indigo-600 font-semibold px-2 py-1 rounded hover:bg-slate-100 transition cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Column</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 3. Live Matrix Preview */}
                      <div className="pt-2 border-t border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Live Matrix Grid Preview:
                        </span>
                        <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 p-2 shadow-2xs">
                          <table className="w-full text-[11px] text-left">
                            <thead>
                              <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="py-1.5 px-2.5 font-bold text-slate-600">Statement</th>
                                {currentCols.map((c, i) => (
                                  <th key={i} className="py-1.5 px-2 text-center font-bold text-slate-500 whitespace-nowrap">
                                    {c}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {currentRows.slice(0, 4).map((r, i) => (
                                <tr key={i}>
                                  <td className="py-1.5 px-2.5 font-medium text-slate-700 truncate max-w-[200px]">{r}</td>
                                  {currentCols.map((_, ci) => (
                                    <td key={ci} className="py-1.5 px-2 text-center">
                                      <span className="inline-block w-3.5 h-3.5 rounded-full border border-slate-300"></span>
                                    </td>
                                  ))}
                                </tr>
                              ))}
                              {currentRows.length > 4 && (
                                <tr>
                                  <td colSpan={currentCols.length + 1} className="py-1 px-2.5 text-[10px] text-slate-400 italic">
                                    + {currentRows.length - 4} more statements...
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  );
                })()}

                {/* Bottom Logic & Looping Configuration Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <label className="flex items-center gap-1.5 text-slate-600 font-medium cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={q.required !== false}
                        onChange={(e) => updateQuestion(qIdx, { required: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Required</span>
                    </label>

                    {/* Dynamic Looping Option */}
                    <div className="flex items-center gap-1 text-slate-600 flex-wrap">
                      <Repeat className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-[11px]">Loop:</span>
                      <select
                        value={q.loop_over || ''}
                        onChange={(e) => updateQuestion(qIdx, { loop_over: e.target.value || null })}
                        className="px-1.5 py-0.5 rounded border border-slate-200 bg-white font-mono text-[11px] max-w-[130px] sm:max-w-none"
                      >
                        <option value="">(None)</option>
                        {survey.questions.slice(0, qIdx).filter(prevQ => prevQ.type === 'multiple_choice').map(mq => (
                          <option key={mq.id} value={mq.id}>
                            {mq.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Logic Rules Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedQuestionId(q.id);
                      setIsLogicModalOpen(true);
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer w-full sm:w-auto ${
                      attachedRules.length > 0
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GitBranch className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>
                      {attachedRules.length > 0 ? `${attachedRules.length} Logic Rules` : '+ Add Skip / Jump Logic'}
                    </span>
                  </button>
                </div>
              </div>
            );
          }))}
        </div>

      </div>

      {/* Logic Rule Editor Modal */}
      {isLogicModalOpen && (
        <LogicRuleEditor
          questions={survey.questions}
          rules={survey.logic_rules || []}
          selectedQuestionId={selectedQuestionId}
          onChangeRules={(newRules) => setSurvey(prev => ({ ...prev, logic_rules: newRules }))}
          onClose={() => setIsLogicModalOpen(false)}
        />
      )}

      {/* Share / Live Link Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <span>Share Live Survey Link</span>
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Share this link with respondents. Responses will be saved directly into Supabase PostgreSQL and synced for real-time cross-tabulation.
            </p>

            {/* 1. If Custom Domain or Instant Subdomain is set and Whitelabel is enabled */}
            {whitelabelUrl && survey.settings?.whitelabel_enabled ? (
              <div className="p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-950">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>{subdomainUrl ? 'Branded Subdomain URL:' : 'Custom Domain URL:'}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono rounded-full border border-emerald-200">
                    {subdomainUrl ? 'ZERO DNS ACTIVE' : 'CNAME ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={whitelabelUrl}
                    className="flex-1 font-mono text-xs px-3 py-2.5 rounded-xl border border-purple-200 bg-white text-purple-950 font-bold selection:bg-purple-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whitelabelUrl);
                      setCopiedWhitelabelLink(true);
                      setTimeout(() => setCopiedWhitelabelLink(false), 2000);
                    }}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors shrink-0"
                  >
                    {copiedWhitelabelLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-purple-700 pt-0.5">
                  <span>
                    {subdomainUrl 
                      ? `Instant link under workspace '${brandSubdomain}' (No DNS needed)` 
                      : `Delivered on your client domain (${customDomain})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsShareModalOpen(false);
                      openSettingsWithTab('whitelabel');
                    }}
                    className="underline hover:text-purple-900 font-semibold cursor-pointer"
                  >
                    Edit Subdomain / Brand
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Want your own name in the link?</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Get an instant link like <code className="bg-white px-1 py-0.2 rounded border border-indigo-200 text-indigo-900 font-mono font-bold">https://researchconnect.{platformDomain}/...</code> with 0 setup!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsShareModalOpen(false);
                    openSettingsWithTab('whitelabel');
                  }}
                  className="px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  Set Subdomain ➔
                </button>
              </div>
            )}

            {/* Standard Public Portal Survey URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {whitelabelUrl && survey.settings?.whitelabel_enabled ? 'Standard Portal Fallback URL:' : 'Public Survey URL:'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicShareUrl}
                  className="flex-1 font-mono text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(publicShareUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-colors shrink-0"
                >
                  {copiedLink ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Embed on your own website without any CNAME/DNS configuration */}
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Embed on Your Website (No CNAME / DNS Required):</span>
                </label>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                  Zero DNS Setup
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`<iframe src="${publicShareUrl}" width="100%" height="800" frameborder="0" style="border:none;border-radius:16px;"></iframe>`}
                  className="flex-1 font-mono text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="${publicShareUrl}" width="100%" height="800" frameborder="0" style="border:none;border-radius:16px;"></iframe>`);
                    setCopiedEmbed(true);
                    setTimeout(() => setCopiedEmbed(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-colors shrink-0 border border-slate-200"
                >
                  {copiedEmbed ? 'Copied!' : 'Copy Embed'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Paste this code on any webpage of your website (e.g. <span className="font-mono text-indigo-600 font-semibold">yourdomain.com/survey</span>). Users will see your own domain in their address bar!
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onNavigateToRuntime && onNavigateToRuntime(survey.slug)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Open in Browser</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Survey Projects Library Modal */}
      <SurveyLibraryModal
        isOpen={showSurveyListModal}
        onClose={() => setShowSurveyListModal(false)}
        surveys={availableSurveys}
        currentSurveyId={survey.id || survey.slug}
        onSelectSurvey={handleLoadSurvey}
        onCreateNewSurvey={handleCreateNewSurvey}
        onReloadSurveys={loadSurveys}
        onOpenLiveRuntime={(slug) => onNavigateToRuntime && onNavigateToRuntime(slug)}
      />

      {/* Per-Survey Settings & Quotas Modal */}
      <SurveySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        survey={survey}
        onUpdateSurvey={setSurvey}
        initialTab={settingsActiveTab}
      />

      {/* Floating Action Confirmation Toast */}
      {floatingToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-100">{floatingToast.msg}</span>
        </div>
      )}

    </div>
  );
}
