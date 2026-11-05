import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Target, 
  DoorOpen, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink,
  HelpCircle,
  Clock,
  Lock,
  Radio,
  Sliders,
  Sparkles,
  Globe,
  Smartphone,
  Palette,
  Building2,
  Link2
} from 'lucide-react';

export default function SurveySettingsModal({ 
  isOpen, 
  onClose, 
  survey, 
  onUpdateSurvey,
  initialTab = 'quotas'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'quotas' | 'exit_screens' | 'restrictions' | 'whitelabel'
  const [newQuotaQuestionId, setNewQuotaQuestionId] = useState(
    () => survey?.questions?.find(q => q.type === 'single_choice')?.id || ''
  );
  const [newQuotaValue, setNewQuotaValue] = useState('');
  const [newQuotaTarget, setNewQuotaTarget] = useState(100);

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen || !survey) return null;

  // Extract settings with safe defaults
  const settings = survey.settings || {
    qualified_title: 'Survey Completed Successfully!',
    qualified_message: 'Thank you for your valuable feedback. Your responses have been securely recorded in the cloud database.',
    qualified_redirect_url: '',
    
    screenout_title: 'Thank You for Your Interest',
    screenout_message: 'Based on your preliminary answers, you do not meet the qualification criteria required for this specific research study.',
    screenout_redirect_url: '',

    quota_full_title: 'Quota Reached for Your Group',
    quota_full_message: 'Thank you for taking the time to start this survey. However, the maximum quota for your demographic group has already been reached.',
    quota_full_redirect_url: '',

    prevent_duplicates: true,
    device_fingerprint_lock: true,
    allow_back_button: true,
    max_responses_cap: survey.target_responses || 400,
    survey_expiry_date: '',
    
    // Geo / Location Restrictions
    geo_restriction_enabled: false,
    allowed_countries: ['Singapore'],
    geo_block_message: 'This research study is restricted to participants residing in Singapore.',

    // Data Integrity & Speeder Detection
    speeder_protection_enabled: true,
    min_completion_seconds: 60,

    // Whitelabeling & Custom Client Domain
    whitelabel_enabled: false,
    custom_domain: '',
    client_brand_name: '',
    brand_logo_url: '',
    hide_powered_by: false,
    custom_primary_color: '#4f46e5',

    quotas: []
  };

  const quotas = settings.quotas || [];

  // Helper to update a field in settings
  const handleSettingChange = (field, value) => {
    onUpdateSurvey({
      ...survey,
      settings: {
        ...settings,
        [field]: value
      }
    });
  };

  // Status changer
  const handleStatusChange = (newStatus) => {
    onUpdateSurvey({
      ...survey,
      status: newStatus
    });
  };

  // Add a quota rule
  const handleAddQuota = () => {
    if (!newQuotaQuestionId || !newQuotaValue || !newQuotaTarget) return;

    const selectedQ = survey.questions.find(q => q.id === newQuotaQuestionId);
    const newQuota = {
      id: 'quota_' + Date.now(),
      name: `${selectedQ?.title?.substring(0, 24) || 'Question'} = "${newQuotaValue}"`,
      question_id: newQuotaQuestionId,
      target_value: newQuotaValue,
      target_limit: Number(newQuotaTarget),
      current_count: 0
    };

    const updatedQuotas = [...quotas, newQuota];
    handleSettingChange('quotas', updatedQuotas);
    setNewQuotaValue('');
  };

  // Delete a quota rule
  const handleDeleteQuota = (quotaId) => {
    const updatedQuotas = quotas.filter(q => q.id !== quotaId);
    handleSettingChange('quotas', updatedQuotas);
  };

  // Choice options for the selected question in quota builder
  const selectedQuestion = survey.questions?.find(q => q.id === newQuotaQuestionId);
  const availableOptions = selectedQuestion?.options || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Survey Settings & Fieldwork Controls</h2>
                <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                  survey.status === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  survey.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  survey.status === 'closed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {survey.status || 'draft'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Configure Quotas, Custom Exit Screens, Redirect URLs & Security Restrictions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('quotas')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'quotas'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Quota Management</span>
            {quotas.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-indigo-100 text-indigo-700 font-mono">
                {quotas.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('exit_screens')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'exit_screens'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Custom Exit Screens & Redirects</span>
          </button>

          <button
            onClick={() => setActiveTab('restrictions')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'restrictions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Restrictions, Geo & Integrity</span>
          </button>

          <button
            onClick={() => setActiveTab('whitelabel')}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition cursor-pointer ${
              activeTab === 'whitelabel'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Whitelabeling & Custom Domain</span>
            {settings.whitelabel_enabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: QUOTA MANAGEMENT */}
          {activeTab === 'quotas' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 flex gap-3">
                <Target className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold">What are Quotas in Market Research?</p>
                  <p className="text-indigo-800 leading-relaxed">
                    Quotas let you set exact participant caps for demographic groups (e.g. 100 Males, 100 Females).
                    When a quota bucket reaches 100%, any new respondent answering with that choice is automatically routed to the 
                    <strong className="text-indigo-950 font-black"> Quota Full Screen</strong> instead of getting screenout or eating budget.
                  </p>
                </div>
              </div>

              {/* Add New Quota Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Add New Quota Target</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Question</label>
                    <select
                      value={newQuotaQuestionId}
                      onChange={(e) => {
                        setNewQuotaQuestionId(e.target.value);
                        setNewQuotaValue('');
                      }}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {(!survey.questions || survey.questions.length === 0) ? (
                        <option value="" disabled>-- No questions created yet --</option>
                      ) : (
                        survey.questions.map((q, idx) => (
                          <option key={q.id} value={q.id}>
                            {idx + 1}. {(q.title || 'Untitled Question').substring(0, 32)}...
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Option / Choice</label>
                    {availableOptions.length > 0 ? (
                      <select
                        value={newQuotaValue}
                        onChange={(e) => setNewQuotaValue(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Choose Choice --</option>
                        {availableOptions.map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter value"
                        value={newQuotaValue}
                        onChange={(e) => setNewQuotaValue(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Target Limit (Count)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        value={newQuotaTarget}
                        onChange={(e) => setNewQuotaTarget(e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                      />
                      <button
                        onClick={handleAddQuota}
                        disabled={!newQuotaValue || !newQuotaTarget}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition"
                      >
                        Add Quota
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Quotas List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Active Survey Quotas ({quotas.length})
                </h3>

                {quotas.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    No quotas defined for this survey yet. Click "Add Quota" above to cap demographic choices.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {quotas.map((q) => (
                      <div 
                        key={q.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs hover:border-slate-300 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{q.name}</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono text-slate-600">
                              Question: {q.question_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Target: <strong className="text-slate-800 font-mono">{q.target_limit} completes</strong></span>
                            <span className="text-indigo-600 font-semibold">• Action on Full: Route to Quota Full Screen</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteQuota(q.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete Quota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM EXIT SCREENS & PANEL REDIRECTS */}
          {activeTab === 'exit_screens' && (
            <div className="space-y-6">
              
              {/* Complete Screen */}
              <div className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    1. Qualified / Complete Screen
                  </h3>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Headline</label>
                    <input
                      type="text"
                      value={settings.qualified_title || ''}
                      onChange={(e) => handleSettingChange('qualified_title', e.target.value)}
                      placeholder="Survey Completed Successfully!"
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Message Body</label>
                    <textarea
                      rows={2}
                      value={settings.qualified_message || ''}
                      onChange={(e) => handleSettingChange('qualified_message', e.target.value)}
                      placeholder="Thank you for participating..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Panel Complete Redirect URL (e.g. Cint, Dynata, Prolific)
                    </label>
                    <input
                      type="url"
                      value={settings.qualified_redirect_url || ''}
                      onChange={(e) => handleSettingChange('qualified_redirect_url', e.target.value)}
                      placeholder="https://panel.provider.com/complete?rid={respondentId}"
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                    <span className="text-[10px] text-slate-400">Use {'{respondentId}'} to dynamically pass respondent session ID.</span>
                  </div>
                </div>
              </div>

              {/* Screenout Screen */}
              <div className="border border-rose-200 rounded-2xl p-4 bg-rose-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    ✕
                  </div>
                  <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                    2. Disqualified / Screenout Screen
                  </h3>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Headline</label>
                    <input
                      type="text"
                      value={settings.screenout_title || ''}
                      onChange={(e) => handleSettingChange('screenout_title', e.target.value)}
                      placeholder="Thank You for Your Interest"
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Message Body</label>
                    <textarea
                      rows={2}
                      value={settings.screenout_message || ''}
                      onChange={(e) => handleSettingChange('screenout_message', e.target.value)}
                      placeholder="Based on your answers, you do not meet the qualification criteria..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Panel Terminate Redirect URL
                    </label>
                    <input
                      type="url"
                      value={settings.screenout_redirect_url || ''}
                      onChange={(e) => handleSettingChange('screenout_redirect_url', e.target.value)}
                      placeholder="https://panel.provider.com/screenout?rid={respondentId}"
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Quota Full Screen */}
              <div className="border border-amber-200 rounded-2xl p-4 bg-amber-50/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                    ⚠
                  </div>
                  <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    3. Quota Full (Over-Quota) Screen
                  </h3>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Headline</label>
                    <input
                      type="text"
                      value={settings.quota_full_title || ''}
                      onChange={(e) => handleSettingChange('quota_full_title', e.target.value)}
                      placeholder="Quota Reached for Your Group"
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Message Body</label>
                    <textarea
                      rows={2}
                      value={settings.quota_full_message || ''}
                      onChange={(e) => handleSettingChange('quota_full_message', e.target.value)}
                      placeholder="The maximum quota for your demographic group has already been reached..."
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-3 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Panel Quota Full Redirect URL
                    </label>
                    <input
                      type="url"
                      value={settings.quota_full_redirect_url || ''}
                      onChange={(e) => handleSettingChange('quota_full_redirect_url', e.target.value)}
                      placeholder="https://panel.provider.com/quotafull?rid={respondentId}"
                      className="w-full text-xs font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RESTRICTIONS & SURVEY LIFECYCLE */}
          {activeTab === 'restrictions' && (
            <div className="space-y-6">

              {/* Survey Status Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Survey Lifecycle Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'draft', label: 'Draft', desc: 'Editing phase, testing link only' },
                    { val: 'live', label: 'Live', desc: 'Accepting real respondent answers' },
                    { val: 'paused', label: 'Paused', desc: 'Temporarily halts respondent entry' },
                    { val: 'closed', label: 'Closed', desc: 'Fieldwork concluded' }
                  ].map(st => (
                    <button
                      key={st.val}
                      type="button"
                      onClick={() => handleStatusChange(st.val)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        survey.status === st.val
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs capitalize text-slate-900">{st.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{st.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Fraud, Device & Location Integrity Settings */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Fieldwork Integrity & Restrictions
                </h3>

                <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-2xs">
                  {/* Prevent Multiple Submissions (Same Device) */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Same Device Restriction (Prevent Duplicate Submissions)</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Restricts 1 response per respondent device/browser using local storage tokens and ballot-stuffing locks.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.prevent_duplicates !== false}
                        onChange={(e) => handleSettingChange('prevent_duplicates', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Device Fingerprinting Lock */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Advanced Device Fingerprint Lock</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Generates a cryptographic browser canvas & screen fingerprint to prevent incognito mode repeat attempts.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.device_fingerprint_lock !== false}
                        onChange={(e) => handleSettingChange('device_fingerprint_lock', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* Location / Geo Restriction */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-blue-600" />
                          <span>Location / Geo-Fencing Restriction</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Auto-verifies respondent's locale/timezone and blocks access from countries outside your allowlist.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={!!settings.geo_restriction_enabled}
                          onChange={(e) => handleSettingChange('geo_restriction_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {settings.geo_restriction_enabled && (
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2 mt-2">
                        <div className="text-[11px] font-bold text-blue-900 uppercase">
                          Allowed Participant Countries (Allowlist):
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['Singapore', 'Malaysia', 'Indonesia', 'Australia', 'United Kingdom', 'United States'].map((country) => {
                            const isSelected = (settings.allowed_countries || ['Singapore']).includes(country);
                            return (
                              <button
                                key={country}
                                type="button"
                                onClick={() => {
                                  const current = settings.allowed_countries || ['Singapore'];
                                  const updated = isSelected 
                                    ? current.filter(c => c !== country) 
                                    : [...current, country];
                                  handleSettingChange('allowed_countries', updated.length ? updated : ['Singapore']);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                }`}
                              >
                                {isSelected && "✓ "}{country}
                              </button>
                            );
                          })}
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">
                            Custom Location Restriction Message:
                          </label>
                          <input
                            type="text"
                            value={settings.geo_block_message || ''}
                            onChange={(e) => handleSettingChange('geo_block_message', e.target.value)}
                            placeholder="This research study is restricted to participants residing in Singapore."
                            className="w-full text-xs bg-white border border-blue-200 rounded-lg px-2.5 py-1.5 text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Speeder Protection (Speed Trap) */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Speeder Protection (Minimum Completion Time Lock)</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Disqualifies bots or click-farm respondents who finish unnaturally fast without reading questions.
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.speeder_protection_enabled !== false}
                          onChange={(e) => handleSettingChange('speeder_protection_enabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {settings.speeder_protection_enabled !== false && (
                      <div className="flex items-center gap-3 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/70 text-xs">
                        <span className="text-amber-900 font-medium">Minimum completion threshold:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="15"
                            max="600"
                            value={settings.min_completion_seconds || 60}
                            onChange={(e) => handleSettingChange('min_completion_seconds', Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white border border-amber-300 rounded-lg text-slate-900"
                          />
                          <span className="text-slate-600 font-bold">seconds</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Allow Back Navigation */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">Allow Back Navigation (Previous Button)</div>
                      <div className="text-[11px] text-slate-500">
                        When disabled, respondents cannot go back to alter demographic screening responses.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings.allow_back_button !== false}
                        onChange={(e) => handleSettingChange('allow_back_button', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Target & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Max Overall Response Cap</label>
                  <p className="text-[10px] text-slate-500">Survey auto-closes once this number of qualified responses is met.</p>
                  <input
                    type="number"
                    min="0"
                    placeholder="400"
                    value={settings.max_responses_cap === 0 ? '0' : (settings.max_responses_cap ?? '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = val === '' ? '' : parseInt(val, 10);
                      handleSettingChange('max_responses_cap', num);
                      onUpdateSurvey({ ...survey, target_responses: num });
                    }}
                    onBlur={() => {
                      if (settings.max_responses_cap === '' || isNaN(settings.max_responses_cap)) {
                        handleSettingChange('max_responses_cap', 400);
                        onUpdateSurvey({ ...survey, target_responses: 400 });
                      }
                    }}
                    className="w-full mt-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Survey Expiry Date</label>
                  <p className="text-[10px] text-slate-500">Optional automatic closing date.</p>
                  <input
                    type="datetime-local"
                    value={settings.survey_expiry_date || ''}
                    onChange={(e) => handleSettingChange('survey_expiry_date', e.target.value)}
                    className="w-full mt-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: WHITELABELING & CUSTOM CLIENT DOMAIN */}
          {activeTab === 'whitelabel' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border border-indigo-200 rounded-2xl p-4 flex gap-3">
                <Building2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold">Enterprise Whitelabeling & Client CNAME</p>
                  <p className="text-indigo-800 leading-relaxed">
                    Deliver research surveys directly on your client's own corporate domain (e.g. <code className="bg-white px-1.5 py-0.5 rounded font-mono text-indigo-900 border border-indigo-200">surveys.clientbrand.com</code>) with their custom logo, colors, and zero platform watermarks.
                  </p>
                </div>
              </div>

              {/* Master Whitelabel Toggle */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>Enable Client Whitelabeling Mode</span>
                    {settings.whitelabel_enabled && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Switches the live questionnaire header, footer, and sharing link to client's brand identity.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!settings.whitelabel_enabled}
                    onChange={(e) => handleSettingChange('whitelabel_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Whitelabel Configuration Fields */}
              <div className="space-y-4">
                
                {/* 1. Instant Branded Subdomain (Zero CNAME / 1-Click Setup) */}
                <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-3 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/40 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Instant Branded Subdomain (Zero DNS / No CNAME Needed)</span>
                    </label>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono rounded-full border border-emerald-200">
                      1-CLICK INSTANT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Type your agency or company name (e.g. <span className="font-mono text-indigo-700 font-bold">researchconnect</span>). Your survey link is instantly branded on our platform domain without touching any DNS!
                  </p>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono text-slate-500">
                      https://
                    </span>
                    <input
                      type="text"
                      value={settings.brand_subdomain || ''}
                      onChange={(e) => handleSettingChange('brand_subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="researchconnect"
                      className="w-44 sm:w-56 px-3 py-2.5 text-xs font-mono font-bold bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="px-3 py-2.5 bg-slate-100 border border-l-0 border-slate-300 rounded-r-xl text-xs font-mono font-bold text-slate-600">
                      .{typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : 'surveybuilder.io'}
                    </span>
                  </div>
                  {settings.brand_subdomain && (
                    <div className="p-2.5 bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                        Generated Branded Link:
                      </span>
                      <strong className="font-mono text-indigo-800 break-all select-all">
                        https://{settings.brand_subdomain}.{typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' ? window.location.hostname : 'surveybuilder.io'}/s/{survey.slug}
                      </strong>
                    </div>
                  )}
                </div>

                {/* 2. External Custom Domain (Optional CNAME Mapping) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-slate-500" />
                      <span>Or External Custom Domain (Requires CNAME)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    If your client wants their own independent corporate domain (e.g. <code className="font-mono text-slate-700">surveys.clientbrand.com</code>).
                  </p>
                  <div className="flex items-center">
                    <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-xs font-mono text-slate-500">
                      https://
                    </span>
                    <input
                      type="text"
                      value={settings.custom_domain || ''}
                      onChange={(e) => handleSettingChange('custom_domain', e.target.value.toLowerCase().trim())}
                      placeholder="surveys.zenitheducation.sg"
                      className="flex-1 px-3 py-2.5 text-xs font-mono font-bold bg-white border border-slate-300 rounded-r-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {settings.custom_domain && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-800 flex items-center justify-between">
                      <span>External Domain Link:</span>
                      <strong className="font-mono text-slate-900">
                        https://{settings.custom_domain}/s/{survey.slug}
                      </strong>
                    </div>
                  )}
                </div>

                {/* Client Brand Name & Logo URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Client Organization / Brand Name
                    </label>
                    <input
                      type="text"
                      value={settings.client_brand_name || ''}
                      onChange={(e) => handleSettingChange('client_brand_name', e.target.value)}
                      placeholder="e.g. Zenith Education Studio"
                      className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">Displayed in browser tab and survey title headers.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Client Brand Logo URL
                    </label>
                    <input
                      type="url"
                      value={settings.brand_logo_url || ''}
                      onChange={(e) => handleSettingChange('brand_logo_url', e.target.value)}
                      placeholder="https://example.com/client-logo.png"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400">Replaces default portal logo at the top of the survey.</p>
                  </div>
                </div>

                {/* Primary Color & Remove Watermark */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Brand Accent Color</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.custom_primary_color || '#4f46e5'}
                        onChange={(e) => handleSettingChange('custom_primary_color', e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={settings.custom_primary_color || '#4f46e5'}
                        onChange={(e) => handleSettingChange('custom_primary_color', e.target.value)}
                        className="w-28 px-3 py-2 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded-xl text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div className="space-y-0.5 pr-3">
                      <div className="text-xs font-bold text-slate-900">Hide "Powered by" Footer</div>
                      <div className="text-[11px] text-slate-500">
                        100% white-label: Removes all portal branding and badges for direct client agency delivery.
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!settings.hide_powered_by}
                        onChange={(e) => handleSettingChange('hide_powered_by', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 cursor-pointer transition"
          >
            Apply & Done
          </button>
        </div>

      </div>
    </div>
  );
}
