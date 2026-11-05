import React from 'react';
import { ArrowUp, ArrowDown, X, Check } from 'lucide-react';

export default function RankingQuestion({
  title,
  subtitle,
  items,
  rankedList = [],
  onChange,
  maxRanks = 5
}) {
  const handleToggleItem = (item) => {
    if (rankedList.includes(item)) {
      onChange(rankedList.filter(i => i !== item));
    } else {
      if (rankedList.length < maxRanks) {
        onChange([...rankedList, item]);
      }
    }
  };

  const moveRank = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= rankedList.length) return;
    const next = [...rankedList];
    const [moved] = next.splice(index, 1);
    next.splice(newIdx, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* Selected & Ranked list */}
      <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          <span>Your Top {maxRanks} Ranking ({rankedList.length}/{maxRanks} selected)</span>
          {rankedList.length < maxRanks && (
            <span className="text-blue-600 font-normal">Click options below to add</span>
          )}
        </div>

        {rankedList.length === 0 ? (
          <div className="text-center py-6 text-sm text-slate-400 bg-white/60 rounded-lg border border-dashed border-blue-200">
            No factors ranked yet. Select up to {maxRanks} factors below.
          </div>
        ) : (
          <div className="space-y-2">
            {rankedList.map((item, idx) => (
              <div
                key={item}
                className="flex items-center justify-between bg-white border border-blue-200 px-3.5 py-2.5 rounded-lg shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{item}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveRank(idx, -1)}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === rankedList.length - 1}
                    onClick={() => moveRank(idx, 1)}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleItem(item)}
                    className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer ml-1"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available choices */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Available Factors (Click to rank):
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map(item => {
            const isRanked = rankedList.includes(item);
            const rankIndex = rankedList.indexOf(item);

            return (
              <button
                key={item}
                type="button"
                onClick={() => handleToggleItem(item)}
                className={`text-left p-3 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-start justify-between gap-2 cursor-pointer ${
                  isRanked
                    ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-semibold'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span>{item}</span>
                {isRanked ? (
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold shrink-0 flex items-center justify-center">
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
}
