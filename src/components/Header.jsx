import React from 'react';
import { BookOpen } from 'lucide-react';
import { SURVEY_METADATA } from '../surveyData';

export default function Header({ currentStepIndex, totalSteps, onOpenBuilder, onOpenStudio, onOpenAdmin }) {
  const percent = Math.min(100, Math.round(((currentStepIndex + 1) / totalSteps) * 100));

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
              {SURVEY_METADATA.title}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              {SURVEY_METADATA.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap justify-end">
          <button
            onClick={onOpenBuilder}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors cursor-pointer border border-indigo-200"
            title="Survey Builder"
          >
            <span className="hidden sm:inline">📝 Survey Builder</span>
            <span className="sm:hidden">📝 Builder</span>
          </button>

          <button
            onClick={onOpenStudio}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors cursor-pointer border border-blue-200"
            title="Q-Light Tabulation Studio"
          >
            <span className="hidden sm:inline">📊 Tabulation Studio</span>
            <span className="sm:hidden">📊 Studio</span>
          </button>

          <button
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            title="Admin & Quotas"
          >
            <span>⚙️ Admin</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </header>
  );
}
