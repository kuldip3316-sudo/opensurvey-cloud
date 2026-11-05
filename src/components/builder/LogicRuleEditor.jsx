import React, { useState } from 'react';
import { 
  GitBranch, 
  Trash2, 
  Plus, 
  AlertTriangle, 
  FastForward, 
  Repeat, 
  X, 
  Check, 
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LogicRuleEditor({ 
  questions, 
  rules, 
  onChangeRules, 
  selectedQuestionId,
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' or 'looping'
  
  // State for creating a new rule
  const [newRule, setNewRule] = useState({
    triggerQuestionId: selectedQuestionId || (questions[0]?.id || ''),
    operator: 'equals',
    value: '',
    action: 'jump_to', // 'jump_to' | 'screenout' | 'show' | 'hide'
    targetQuestionId: '',
    screenoutReason: 'Does not meet survey qualification criteria'
  });

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  const handleAddRule = () => {
    if (!newRule.triggerQuestionId) return;

    const ruleObj = {
      id: 'rule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      triggerQuestionId: newRule.triggerQuestionId,
      operator: newRule.operator,
      value: newRule.value,
      action: newRule.action,
      targetQuestionId: newRule.action === 'jump_to' ? newRule.targetQuestionId : null,
      screenoutReason: newRule.action === 'screenout' ? newRule.screenoutReason : null,
      createdAt: new Date().toISOString()
    };

    onChangeRules([...(rules || []), ruleObj]);

    // Reset some fields
    setNewRule(prev => ({
      ...prev,
      value: '',
      targetQuestionId: '',
      screenoutReason: 'Does not meet survey qualification criteria'
    }));
  };

  const handleDeleteRule = (ruleId) => {
    onChangeRules((rules || []).filter(r => r.id !== ruleId));
  };

  // Helper to get choices of trigger question if available
  const triggerQ = questions.find(q => q.id === newRule.triggerQuestionId);
  const triggerChoices = triggerQ?.options || [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">Survey Logic & Routing Rules</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Configure conditional skip logic and screenouts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Active Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span>Configured Rules</span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px]">
                  {(rules || []).length}
                </span>
              </h4>
              {selectedQuestionId && (
                <span className="text-[11px] sm:text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium">
                  For: <strong>{selectedQuestionId}</strong>
                </span>
              )}
            </div>

            {(!rules || rules.length === 0) ? (
              <div className="border border-dashed border-slate-200 rounded-xl p-6 sm:p-8 text-center bg-slate-50/50">
                <GitBranch className="w-7 h-7 sm:w-8 sm:h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs sm:text-sm font-semibold text-slate-600">No logic rules configured yet</p>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Add skip jumps or screenouts below to build personalized survey paths and disqualify unqualified respondents.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, idx) => {
                  const srcQ = questions.find(q => q.id === rule.triggerQuestionId);
                  const tgtQ = questions.find(q => q.id === rule.targetQuestionId);

                  const isScreenout = rule.action === 'screenout';
                  const isJump = rule.action === 'jump_to';

                  return (
                    <div 
                      key={rule.id || idx} 
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm ${
                        isScreenout 
                          ? 'border-rose-200 bg-rose-50/40 text-rose-950' 
                          : 'border-indigo-100 bg-indigo-50/30 text-indigo-950'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 mt-0.5 sm:mt-0 ${isScreenout ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {isScreenout ? <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <FastForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        </div>
                        <div className="leading-snug min-w-0">
                          <div className="font-semibold flex items-center gap-1 flex-wrap text-xs sm:text-sm">
                            <span className="text-slate-500 font-mono text-[11px]">IF</span>
                            <span className="px-1.5 py-0.2 bg-white border rounded font-mono text-[11px] text-slate-800">
                              {srcQ ? srcQ.id : rule.triggerQuestionId}
                            </span>
                            <span className="text-indigo-600 font-semibold">{rule.operator}</span>
                            <span className="px-1.5 py-0.2 bg-white border border-slate-200 rounded font-semibold text-slate-900 truncate max-w-[140px] sm:max-w-none">
                              "{rule.value}"
                            </span>
                          </div>

                          <div className="text-[11px] sm:text-xs mt-1 flex items-center gap-1.5 text-slate-600 flex-wrap">
                            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400">THEN</span>
                            {isScreenout ? (
                              <span className="font-semibold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded">
                                Screenout: {rule.screenoutReason || 'Standard Termination'}
                              </span>
                            ) : isJump ? (
                              <span className="font-semibold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded truncate max-w-[200px] sm:max-w-none">
                                Jump to {tgtQ ? `${tgtQ.id}` : (rule.targetQuestionId || 'End of Survey')}
                              </span>
                            ) : (
                              <span>Action: {rule.action}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="self-end sm:self-center p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 rounded-lg transition-colors shrink-0"
                        title="Delete rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Rule Creator Card */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 border-b border-slate-200 pb-2.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Create New Condition & Action</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Trigger Question */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">If Question (Trigger):</label>
                <select
                  value={newRule.triggerQuestionId}
                  onChange={(e) => setNewRule(prev => ({ ...prev, triggerQuestionId: e.target.value, value: '' }))}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {questions.map((q, idx) => (
                    <option key={q.id} value={q.id}>
                      Q{idx + 1}: {q.id} - {q.title?.substring(0, 30)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Condition Operator:</label>
                <select
                  value={newRule.operator}
                  onChange={(e) => setNewRule(prev => ({ ...prev, operator: e.target.value }))}
                  className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="equals">is equal to (=)</option>
                  <option value="not_equals">is not equal to (≠)</option>
                  <option value="contains">contains (multi-choice)</option>
                  <option value="greater_than">is greater than (&gt;)</option>
                  <option value="less_than">is less than (&lt;)</option>
                  <option value="is_empty">is unanswered / empty</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Trigger Value:</label>
                {triggerChoices.length > 0 ? (
                  <select
                    value={newRule.value}
                    onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Choice Option --</option>
                    {triggerChoices.map((opt, oIdx) => {
                      const optVal = typeof opt === 'string' ? opt : opt.label || opt.text;
                      return (
                        <option key={oIdx} value={optVal}>
                          {optVal}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Value (e.g. 18 or Singapore)"
                    value={newRule.value}
                    onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                )}
              </div>
            </div>

            {/* Action Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Then Action:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRule(prev => ({ ...prev, action: 'jump_to' }))}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      newRule.action === 'jump_to'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Jump / Skip To</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewRule(prev => ({ ...prev, action: 'screenout' }))}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      newRule.action === 'screenout'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Screenout Terminate</span>
                  </button>
                </div>
              </div>

              {/* Action Parameter */}
              <div>
                {newRule.action === 'jump_to' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Target Question to Jump To:</label>
                    <select
                      value={newRule.targetQuestionId}
                      onChange={(e) => setNewRule(prev => ({ ...prev, targetQuestionId: e.target.value }))}
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Jump to Question --</option>
                      {questions.map((q, idx) => (
                        <option key={q.id} value={q.id}>
                          Q{idx + 1}: {q.id} - {q.title?.substring(0, 32)}...
                        </option>
                      ))}
                      <option value="END_SURVEY">🏁 End of Survey (Submit Directly)</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Screenout Reason (shown to respondent):</label>
                    <input
                      type="text"
                      placeholder="e.g. Disqualified: Not within age range"
                      value={newRule.screenoutReason}
                      onChange={(e) => setNewRule(prev => ({ ...prev, screenoutReason: e.target.value }))}
                      className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!newRule.triggerQuestionId || (newRule.action === 'jump_to' && !newRule.targetQuestionId)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Logic Rule</span>
              </button>
            </div>
          </div>

          {/* Dynamic Piping & Looping Guide */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2 text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Dynamic Piping & Looping Superpowers</span>
            </div>
            <p>
              • <strong>Dynamic Piping:</strong> Type <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">&#123;&#123;question_id&#125;&#125;</code> inside any Question Title or Subtitle (e.g. <em>"Why did you choose &#123;&#123;q2_brand&#125;&#125;?"</em>). The live survey engine will dynamically insert the respondent's exact answer!
            </p>
            <p>
              • <strong>Dynamic Looping:</strong> In the Question Editor, select <em>"Loop for each choice selected in..."</em>. If a respondent picks 3 brands, that question will automatically repeat 3 times, once for each selected brand!
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>All rules are evaluated dynamically in real time.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
