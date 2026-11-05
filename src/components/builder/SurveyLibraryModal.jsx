import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  FolderOpen, 
  Copy, 
  Trash2, 
  ExternalLink, 
  Check, 
  Search, 
  Clock, 
  HelpCircle, 
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2
} from 'lucide-react';

export default function SurveyLibraryModal({ 
  isOpen, 
  onClose, 
  surveys = [], 
  currentSurveyId, 
  onSelectSurvey, 
  onCreateNewSurvey, 
  onReloadSurveys,
  onOpenLiveRuntime 
}) {
  const [search, setSearch] = useState('');
  const [cloningId, setCloningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  if (!isOpen) return null;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Filter surveys
  const filtered = surveys.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (s.title || '').toLowerCase().includes(q) ||
      (s.slug || '').toLowerCase().includes(q) ||
      (s.status || '').toLowerCase().includes(q)
    );
  });

  // Duplicate survey
  const handleDuplicate = async (surveyId) => {
    setCloningId(surveyId);
    try {
      const res = await fetch(`/api/surveys/${surveyId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Survey duplicated successfully! Opening cloned survey...');
        await onReloadSurveys();
        if (data.survey) {
          onSelectSurvey(data.survey.id || data.survey.slug);
        }
      } else {
        alert('Failed to clone: ' + data.error);
      }
    } catch (err) {
      alert('Error duplicating survey: ' + err.message);
    } finally {
      setCloningId(null);
    }
  };

  // Delete survey
  const handleDelete = async (surveyId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(surveyId);
    try {
      const res = await fetch(`/api/surveys/${surveyId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Survey deleted successfully.');
        await onReloadSurveys();
      } else {
        alert('Failed to delete: ' + data.error);
      }
    } catch (err) {
      alert('Error deleting survey: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Survey Projects Library</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[11px] font-bold">
                  {surveys.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manage, launch, duplicate, or create multiple independent research studies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onCreateNewSurvey();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Blank Survey</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2 flex items-center justify-between">
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search surveys by title, slug, or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Surveys Grid / List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-slate-600 font-bold text-xs">No surveys found</div>
              <p className="text-slate-400 text-[11px]">
                {search ? 'Try adjusting your search criteria.' : 'Create your first survey using the button above.'}
              </p>
            </div>
          ) : (
            filtered.map((s) => {
              const isCurrent = (s.id && s.id === currentSurveyId) || (s.slug && s.slug === currentSurveyId);
              const qCount = Array.isArray(s.questions) ? s.questions.length : 0;
              const quotaCount = s.settings?.quotas?.length || 0;
              const createdDate = s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent';

              return (
                <div
                  key={s.id || s.slug}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/15 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Info */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">
                          {s.title || 'Untitled Survey'}
                        </h3>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                            Currently Active
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          s.status === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          s.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          s.status === 'closed' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {s.status || 'draft'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="font-mono text-slate-400">/s/{s.slug}</span>
                        <span>•</span>
                        <span>{qCount} Questions</span>
                        <span>•</span>
                        <span>Target: <strong className="text-slate-700">{s.target_responses || 400}</strong></span>
                        {quotaCount > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold">{quotaCount} Quotas</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="text-slate-400">Created: {createdDate}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Open in Builder */}
                      <button
                        onClick={() => {
                          onSelectSurvey(s.slug || s.id);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {isCurrent ? 'Continue Editing' : 'Open in Builder'}
                      </button>

                      {/* Test Live */}
                      <button
                        onClick={() => {
                          if (onOpenLiveRuntime) onOpenLiveRuntime(s.slug);
                        }}
                        title="Take / Test Survey"
                        className="p-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Clone */}
                      <button
                        onClick={() => handleDuplicate(s.id)}
                        disabled={cloningId === s.id}
                        title="Clone / Duplicate Survey"
                        className="p-2 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {cloningId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        disabled={deletingId === s.id}
                        title="Delete Survey"
                        className="p-2 border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs text-slate-500">
          <span>All survey changes and response datasets are stored in Supabase PostgreSQL.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
