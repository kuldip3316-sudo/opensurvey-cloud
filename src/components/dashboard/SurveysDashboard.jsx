import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Target, 
  BarChart3, 
  FileText, 
  Copy, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Layers, 
  Sparkles,
  Play,
  Clock,
  ArrowRight,
  TrendingUp,
  Sliders,
  Check
} from 'lucide-react';
import SurveyQuotaDrawer from './SurveyQuotaDrawer';
import AiSurveyImportModal from './AiSurveyImportModal';

export default function SurveysDashboard({ 
  onOpenBuilder, 
  onOpenStudio, 
  onOpenRuntime 
}) {
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | live | draft | paused | closed
  const [selectedQuotaSurvey, setSelectedQuotaSurvey] = useState(null);
  const [cloningId, setCloningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiImportModal, setShowAiImportModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/summary');
      const data = await res.json();
      if (data.success) {
        setSummaryData(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Quick Duplicate
  const handleDuplicate = async (surveyId) => {
    setCloningId(surveyId);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Survey duplicated successfully!');
        await loadDashboardData();
      } else {
        alert('Failed to clone: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setCloningId(null);
    }
  };

  // Quick Delete
  const handleDelete = async (surveyId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    setDeletingId(surveyId);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Survey deleted.');
        await loadDashboardData();
      } else {
        alert('Failed to delete: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Change Status inline
  const handleStatusChange = async (survey, newStatus) => {
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...survey,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Survey status updated to ${newStatus.toUpperCase()}`);
        loadDashboardData();
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Copy Live Link
  const handleCopyLink = (slug) => {
    const url = `${window.location.origin}/s/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('Survey public link copied to clipboard!');
  };

  // Filter surveys
  const surveys = summaryData?.surveys || [];
  const filtered = surveys.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (s.title || '').toLowerCase().includes(q) || (s.slug || '').toLowerCase().includes(q);
    }
    return true;
  });

  const stats = summaryData?.stats || {
    totalSurveys: surveys.length,
    liveSurveys: surveys.filter(s => s.status === 'live').length,
    totalQualified: 0,
    totalSubmitted: 0,
    avgCompletionRate: 0
  };

  return (
    <div className="min-h-[calc(100vh-50px)] bg-slate-50 text-slate-900 font-sans">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-14 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-in fade-in">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Main Container (Compact, Dense) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        
        {/* Top Header Strip with Primary "+ Create Survey" Call to Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="space-y-0.5">
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Research Projects & Fieldwork</span>
              <span className="px-2 py-0.2 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold">
                {surveys.length} Studies
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage live questionnaires, monitor real-time quotas, and launch instant cross-tabulations.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAiImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-500/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>✨ AI Import (Word / PDF)</span>
            </button>
            <button
              onClick={() => onOpenBuilder && onOpenBuilder('new')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/25 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create New Survey</span>
            </button>
            <button
              onClick={loadDashboardData}
              disabled={loading}
              title="Refresh Stats"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Dense KPI Cards Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Surveys</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.totalSurveys}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Live</div>
              <div className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">{stats.liveSurveys}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Play className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completes (N)</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">{stats.totalQualified}</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Completion</div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 mt-0.5">{stats.avgCompletionRate}%</div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

        </div>

        {/* Filter & Search Bar (Dense) */}
        <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search survey title or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
            {['all', 'live', 'draft', 'paused', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* High Information Density Surveys Grid */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2 text-xs text-slate-400">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">No surveys found</p>
              <p className="text-[11px]">Click "+ Create New Survey" above to build your study.</p>
            </div>
          ) : (
            filtered.map((s) => {
              const targetN = s.target_responses || 400;
              const completes = s.qualified_count || 0;
              const progressPct = Math.min(100, Math.round((completes / targetN) * 100));
              const quotasCount = s.settings?.quotas?.length || 0;

              return (
                <div
                  key={s.id || s.slug}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-3 sm:p-3.5 shadow-2xs transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Left: Metadata & Details */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {s.title}
                        </h2>

                        {/* Clickable Status Switcher */}
                        <select
                          value={s.status || 'draft'}
                          onChange={(e) => handleStatusChange(s, e.target.value)}
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${
                            s.status === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            s.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                            s.status === 'closed' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            'bg-slate-100 text-slate-600 border-slate-300'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="live">Live</option>
                          <option value="paused">Paused</option>
                          <option value="closed">Closed</option>
                        </select>

                        {quotasCount > 0 && (
                          <button
                            onClick={() => setSelectedQuotaSurvey(s)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition"
                          >
                            <Target className="w-2.5 h-2.5" />
                            <span>{quotasCount} Quotas</span>
                          </button>
                        )}
                      </div>

                      {/* URL slug & stats row */}
                      <div className="flex items-center gap-2 sm:gap-4 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-mono text-indigo-600 bg-indigo-50/50 px-1.5 py-0.2 rounded border border-indigo-100">
                          /s/{s.slug}
                        </span>
                        <span>•</span>
                        <span>Completes: <strong className="text-slate-800 font-mono">{completes}</strong> / {targetN}</span>
                        <span>•</span>
                        <span>Screenouts: <strong className="text-slate-600 font-mono">{s.screenout_count || 0}</strong></span>
                        <span>•</span>
                        <span>Rate: <strong className="text-emerald-700 font-bold">{s.completion_rate || 0}%</strong></span>
                      </div>

                      {/* Compact Progress Bar */}
                      <div className="w-full max-w-md bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Right: Interconnected Action Buttons (Compact) */}
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap pt-1 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      
                      {/* 1. Edit in Builder */}
                      <button
                        onClick={() => onOpenBuilder && onOpenBuilder(s.id || s.slug)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                        title="Edit Survey Questions & Settings"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Builder</span>
                      </button>

                      {/* 2. Live Quotas Drawer */}
                      <button
                        onClick={() => setSelectedQuotaSurvey(s)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="View Live Quota Targets & Fills"
                      >
                        <Target className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Quotas</span>
                      </button>

                      {/* 3. Analytics Studio Pre-selected */}
                      <button
                        onClick={() => onOpenStudio && onOpenStudio(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
                        title="Open Cross-Tabulation & Reports Studio"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Analytics</span>
                      </button>

                      {/* 4. Test / Live Link */}
                      <button
                        onClick={() => onOpenRuntime && onOpenRuntime(s.slug)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        title="Open Live Survey Form"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* 5. Copy Public Link */}
                      <button
                        onClick={() => handleCopyLink(s.slug)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                        title="Copy Public Survey Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      {/* 6. Clone */}
                      <button
                        onClick={() => handleDuplicate(s.id)}
                        disabled={cloningId === s.id}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer disabled:opacity-40"
                        title="Clone / Duplicate Study"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* 7. Delete */}
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        disabled={deletingId === s.id}
                        className="p-1.5 border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer disabled:opacity-40"
                        title="Delete Survey"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Slide-over Quota Drawer */}
      {selectedQuotaSurvey && (
        <SurveyQuotaDrawer
          survey={selectedQuotaSurvey}
          onClose={() => setSelectedQuotaSurvey(null)}
          onOpenStudio={(surveyId) => {
            setSelectedQuotaSurvey(null);
            if (onOpenStudio) onOpenStudio(surveyId);
          }}
        />
      )}

      {/* AI Survey Ingestion & Verification Modal */}
      {showAiImportModal && (
        <AiSurveyImportModal
          isOpen={showAiImportModal}
          onClose={() => setShowAiImportModal(false)}
          onSurveyImported={(surveyOrId) => {
            loadDashboardData();
            showToast('AI Survey compiled & verified successfully!');
            if (typeof surveyOrId === 'string') {
              onOpenBuilder && onOpenBuilder(surveyOrId);
            } else if (surveyOrId?.id) {
              onOpenBuilder && onOpenBuilder(surveyOrId.id);
            } else {
              onOpenBuilder && onOpenBuilder('new');
            }
          }}
        />
      )}

    </div>
  );
}
