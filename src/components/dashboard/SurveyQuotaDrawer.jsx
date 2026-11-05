import React, { useState, useEffect } from 'react';
import { 
  X, 
  Target, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  BarChart3,
  ExternalLink 
} from 'lucide-react';

export default function SurveyQuotaDrawer({ survey, onClose, onOpenStudio }) {
  const [loading, setLoading] = useState(true);
  const [quotaData, setQuotaData] = useState(null);

  const fetchQuotaStatus = async () => {
    if (!survey) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/surveys/${survey.slug || survey.id}/quota-status`);
      const data = await res.json();
      if (data.success) {
        setQuotaData(data);
      }
    } catch (err) {
      console.error('Failed to load quota status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (survey) {
      fetchQuotaStatus();
    }
  }, [survey]);

  if (!survey) return null;

  const quotas = quotaData?.quotas || survey.settings?.quotas || [];
  const totalQualified = quotaData?.totalQualified || 0;
  const maxCap = quotaData?.maxCap || survey.target_responses || 400;
  const overallProgress = Math.min(100, Math.round((totalQualified / maxCap) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        
        {/* Header (Dense) */}
        <div className="px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-white truncate">
                Live Quotas & Fieldwork
              </h2>
              <p className="text-[10px] text-slate-400 font-medium truncate">
                {survey.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={fetchQuotaStatus}
              disabled={loading}
              title="Refresh Quotas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overall Sample Gauge (Compact) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Total Study Capacity</span>
            <span className="font-mono font-black text-slate-900">
              {totalQualified} / {maxCap} Completes ({overallProgress}%)
            </span>
          </div>
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          {quotaData?.isOverMaxCap && (
            <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3" />
              <span>Overall response capacity reached. Auto-shutoff active.</span>
            </div>
          )}
        </div>

        {/* Quota Cells List (High Information Density) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>Quota Cell Buckets ({quotas.length})</span>
            <span>Progress</span>
          </div>

          {quotas.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2 text-xs text-slate-400">
              <Target className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No demographic quotas configured</p>
              <p className="text-[11px]">You can configure target limits inside Survey Builder &gt; Settings & Quotas.</p>
            </div>
          ) : (
            quotas.map((q) => {
              const count = q.current_count || 0;
              const limit = q.target_limit || 100;
              const pct = Math.min(100, Math.round((count / limit) * 100));
              const isFull = q.is_full || count >= limit;

              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isFull
                      ? 'border-amber-300 bg-amber-50/50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {q.name}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                        isFull
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isFull ? 'FULL (Closed)' : 'OPEN'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Target Limit: <strong className="text-slate-800">{limit}</strong></span>
                    <span className="font-mono font-bold text-slate-700">{count} / {limit} ({pct}%)</span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between gap-2">
          <button
            onClick={() => onOpenStudio && onOpenStudio(survey.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Open Studio Analytics</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
