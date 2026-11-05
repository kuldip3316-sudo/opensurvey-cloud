import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export default function TerminationModal({ onRestart }) {
  return (
    <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-lg text-center space-y-6">
      <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
        <ShieldAlert className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-slate-900">Thank You for Your Time</h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Based on the current participant profile required for this specific research study, you do not meet the screening criteria for this session.
        </p>
        <p className="text-slate-500 text-xs mt-3">
          We deeply appreciate your interest and willingness to participate in educational research.
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors cursor-pointer shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Restart Survey</span>
        </button>
      </div>
    </div>
  );
}
