import React from 'react';
import { CheckCircle2, Download, RotateCcw, Database } from 'lucide-react';

export default function SuccessScreen({ respondentId, onRestart, onOpenAdmin }) {
  const handleDownloadCsv = () => {
    window.open('/api/export-csv', '_blank');
  };

  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Survey Completed!</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Your responses have been successfully recorded and saved directly to the local data repository (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-blue-600 font-mono">data/survey_responses.csv</code>).
        </p>
        {respondentId && (
          <div className="inline-block bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-mono text-slate-600 mt-2">
            Respondent ID: <span className="font-bold text-slate-900">{respondentId}</span>
          </div>
        )}
      </div>

      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={handleDownloadCsv}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer shadow-md shadow-blue-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Download Master CSV</span>
        </button>

        <button
          onClick={onOpenAdmin}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Database className="w-4 h-4 text-slate-500" />
          <span>View All Records</span>
        </button>

        <button
          onClick={onRestart}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Entry</span>
        </button>
      </div>
    </div>
  );
}
