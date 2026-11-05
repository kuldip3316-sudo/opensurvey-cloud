import React from 'react';
import { AlertCircle, Check, Info } from 'lucide-react';
import GridQuestion from './GridQuestion';
import RankingQuestion from './RankingQuestion';
import {
  COUNTRIES,
  SERVICE_CATEGORIES,
  SERVICE_USAGE_COLUMNS,
  PROVIDER_LIST,
  PROVIDER_RELATIONSHIP_COLUMNS,
  KPC_LIST
} from '../surveyData';

export default function QuestionRenderer({
  step,
  answers,
  updateAnswer,
  flags,
  softPromptWarning
}) {
  if (!step) return null;

  return (
    <div className="space-y-6">
      {/* Soft prompt warning message */}
      {softPromptWarning && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-pulse">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{softPromptWarning}</span>
        </div>
      )}

      {/* Q1. Age */}
      {step.id === 'q1_age' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Screening & Eligibility</span>
            <h2 className="text-xl font-bold text-slate-900">How old are you?</h2>
            <p className="text-sm text-slate-500">Please enter your age in years (numerical value).</p>
          </div>
          <div className="max-w-xs">
            <input
              type="number"
              min="10"
              max="25"
              value={answers.q1_age || ''}
              onChange={e => updateAnswer('q1_age', e.target.value)}
              placeholder="e.g. 16"
              className="w-full px-4 py-3 text-lg font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white shadow-xs"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Q2. Country of residence */}
      {step.id === 'q2_country' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Screening & Eligibility</span>
            <h2 className="text-xl font-bold text-slate-900">In which country do you currently live?</h2>
            <p className="text-sm text-slate-500">Select your current country of residence.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COUNTRIES.map(country => {
              const isSelected = answers.q2_country === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => updateAnswer('q2_country', country)}
                  className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{country}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q2a. Status in Singapore */}
      {step.id === 'q2a_status' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Residency Status</span>
            <h2 className="text-xl font-bold text-slate-900">Which best describes your status in Singapore?</h2>
          </div>
          <div className="space-y-2">
            {[
              "Singapore citizen",
              "Permanent resident",
              "Student’s Pass holder",
              "Dependant’s Pass holder",
              "Long-Term Visit Pass holder",
              "Other non-citizen status",
              "Not sure / Prefer not to say"
            ].map(statusOption => {
              const isSelected = answers.q2a_status === statusOption;
              return (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => updateAnswer('q2a_status', statusOption)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{statusOption}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
          {answers.q2a_status === 'Other non-citizen status' && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-300 rounded-xl space-y-1.5 shadow-2xs">
              <label className="block text-xs font-bold text-blue-900 uppercase">Please specify your residency status:</label>
              <input
                type="text"
                autoFocus
                placeholder="e.g. Special pass, diplomatic visa, etc."
                value={answers.q2a_status_other || ''}
                onChange={e => updateAnswer('q2a_status_other', e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Q2b. Country of citizenship (Conditional for international) */}
      {step.id === 'q2b_citizenship' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Citizenship</span>
            <h2 className="text-xl font-bold text-slate-900">What is your country of citizenship?</h2>
            <p className="text-sm text-slate-500">Please select your primary country of citizenship.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {COUNTRIES.filter(c => c !== 'Singapore').map(country => {
              const isSelected = answers.q2b_citizenship === country;
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => updateAnswer('q2b_citizenship', country)}
                  className={`p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{country}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q3. Gender */}
      {step.id === 'q3_gender' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Demographics</span>
            <h2 className="text-xl font-bold text-slate-900">How do you describe your gender?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {["Female", "Male", "Non-binary or another identity", "Prefer not to say"].map(gender => {
              const isSelected = answers.q3_gender === gender;
              return (
                <button
                  key={gender}
                  type="button"
                  onClick={() => updateAnswer('q3_gender', gender)}
                  className={`p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{gender}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q4. Current Schooling */}
      {step.id === 'q4_schooling' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Education Level</span>
            <h2 className="text-xl font-bold text-slate-900">Which of the following best describes your current schooling?</h2>
          </div>
          <div className="space-y-2">
            {[
              "Government, government-aided or autonomous secondary school",
              "Independent, specialised independent or specialised secondary school",
              "International or foreign-system school",
              "Private secondary school",
              "Junior college / pre-university programme",
              "Millennia Institute",
              "University",
              "Special Education (SPED) school",
              "Polytechnic",
              "ITE",
              "Private diploma or another post-secondary institution",
              "Home-schooling",
              "Not currently enrolled"
            ].map(school => {
              const isSelected = answers.q4_schooling === school;
              return (
                <button
                  key={school}
                  type="button"
                  onClick={() => updateAnswer('q4_schooling', school)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{school}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q5. Current Level / Grade (Piped by Q4) */}
      {step.id === 'q5_level' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Grade / Year</span>
            <h2 className="text-xl font-bold text-slate-900">Which school year, grade or equivalent level are you currently in?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(() => {
              const schooling = answers.q4_schooling || '';
              const isSecondary = schooling.includes('secondary') || schooling.includes('International');
              const levels = isSecondary
                ? ["Secondary 1", "Secondary 2", "Secondary 3", "Secondary 4", "Secondary 5", "Other year or equivalent level"]
                : ["Junior college / Pre-university Year 1", "Junior college / Pre-university Year 2", "University year 1", "University year 2", "Other year or equivalent level"];

              return levels.map(lvl => {
                const isSelected = answers.q5_level === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => updateAnswer('q5_level', lvl)}
                    className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{lvl}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Q6. Types of Paid Services Matrix */}
      {step.id === 'q6_matrix' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Service Usage</span>
            <h2 className="text-xl font-bold text-slate-900">
              For each of the following types of paid services (outside your normal school lessons), please indicate which best describes your situation.
            </h2>
            <p className="text-sm text-slate-500">Single select per row.</p>
          </div>
          <GridQuestion
            rows={SERVICE_CATEGORIES}
            columns={SERVICE_USAGE_COLUMNS}
            values={answers.q6_matrix || {}}
            onChange={(rowKey, colLabel) => {
              const current = answers.q6_matrix || {};
              updateAnswer('q6_matrix', { ...current, [rowKey]: colLabel });
            }}
          />
        </div>
      )}

      {/* Q6a. Considered service deep-dive */}
      {step.id === 'q6a_types' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Future Interest</span>
            <h2 className="text-xl font-bold text-slate-900">
              You mentioned you would consider some services. Which of the following types would you be most interested in?
            </h2>
            <p className="text-sm text-slate-500">Please select up to 2 options.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Music (e.g. instrument, vocal, theory)",
              "Visual arts (e.g. drawing, painting, design)",
              "Drama, public speaking or debate",
              "Dance",
              "Sport or physical fitness",
              "Coding, robotics or STEM",
              "Academic examination preparation",
              "Language tuition or enrichment",
              "Other enrichment area"
            ].map(item => {
              const selectedList = answers.q6a_types || [];
              const isSelected = selectedList.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      updateAnswer('q6a_types', selectedList.filter(i => i !== item));
                    } else if (selectedList.length < 2) {
                      updateAnswer('q6a_types', [...selectedList, item]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{item}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q6b. Current/lapsed specific types */}
      {step.id === 'q6b_types' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active & Recent Subjects</span>
            <h2 className="text-xl font-bold text-slate-900">
              For services you currently use or have used in the last 6 months, which specific subject(s) or type(s) do you use?
            </h2>
            <p className="text-sm text-slate-500">Please select all that apply.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "Mathematics or Additional Mathematics",
              "English Language or General Paper",
              "Biology, Chemistry or Physics (Pure or Combined)",
              "Humanities (e.g. Geography, History, Social Studies, Literature)",
              "Economics or Business Management",
              "O-Level or N-Level preparation",
              "A-Level or H2 subject preparation",
              "IB, IGCSE or other international curriculum exam prep",
              "Advanced olympiad/competition math or science",
              "Study skills, note-taking and revision strategy",
              "Using AI effectively and responsibly for learning",
              "Other subject / programme"
            ].map(item => {
              const selectedList = answers.q6b_types || [];
              const isSelected = selectedList.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      updateAnswer('q6b_types', selectedList.filter(i => i !== item));
                    } else {
                      updateAnswer('q6b_types', [...selectedList, item]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{item}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q6c. Reasons for stopping (Optional / skip allowed) */}
      {step.id === 'q6c_reasons' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Lapsed Experience (Optional)</span>
            <h2 className="text-xl font-bold text-slate-900">
              What were the main reasons you stopped using past tutoring/enrichment services?
            </h2>
            <p className="text-sm text-slate-500">Select up to 3 reasons (or skip if not applicable).</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              "My programme or examination came to an end",
              "I moved to a different school year or education stage",
              "Fees were too high or increased",
              "It did not offer good value for money",
              "Class timings or schedule became difficult",
              "Location or travel was inconvenient",
              "Teaching style or curriculum did not suit me",
              "Tutor or instructor quality was inconsistent",
              "Results or progress were not strong enough",
              "Class size or personal attention was not right",
              "I lost interest or motivation",
              "I switched to self-study, online or free resources",
              "My parent or guardian decided to stop",
              "The provider closed or class was no longer available",
              "Other reason"
            ].map(reason => {
              const selectedList = answers.q6c_reasons || [];
              const isSelected = selectedList.includes(reason);
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      updateAnswer('q6c_reasons', selectedList.filter(r => r !== reason));
                    } else if (selectedList.length < 3) {
                      updateAnswer('q6c_reasons', [...selectedList, reason]);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{reason}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q7. Weekly Hours Spent */}
      {step.id === 'q7_hours' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Weekly Commitment</span>
            <h2 className="text-xl font-bold text-slate-900">
              During a typical school-term week, approximately how many hours do you spend in paid tuition, test-prep or enrichment across all subjects?
            </h2>
          </div>
          <div className="space-y-2">
            {[
              "Less than 1 hour",
              "1 to less than 2 hours",
              "2 to less than 4 hours",
              "4 to less than 6 hours",
              "6 to less than 8 hours",
              "8 hours or more",
              "Not sure"
            ].map(option => {
              const isSelected = answers.q7_hours === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateAnswer('q7_hours', option)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q8. Decision Role */}
      {step.id === 'q8_decision_role' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Decision Making</span>
            <h2 className="text-xl font-bold text-slate-900">
              Thinking about the tutoring or enrichment you use, who usually decides which provider you attend?
            </h2>
          </div>
          <div className="space-y-2">
            {[
              "I decide by myself",
              "My parent or guardian and I decide together",
              "My parent or guardian decides",
              "It varies depending on the provider"
            ].map(option => {
              const isSelected = answers.q8_decision_role === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => updateAnswer('q8_decision_role', option)}
                  className={`w-full p-3.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{option}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Q9. Unaided Brand Awareness (Anti-PII protected) */}
      {step.id === 'q9_unaided' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Unaided Recall</span>
            <h2 className="text-xl font-bold text-slate-900">
              Thinking about tutoring or enrichment in Singapore, which providers, brands, or centres come to mind?
            </h2>
            <p className="text-sm text-slate-500">Please list up to 3 names (at least 1 required). Please do not write personal contact info.</p>
          </div>
          <div className="space-y-3 max-w-md">
            {[0, 1, 2].map(idx => {
              const currentVal = answers.q9_unaided?.[idx] || '';
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-6">#{idx + 1}</span>
                  <input
                    type="text"
                    value={currentVal}
                    onChange={e => {
                      const updated = [...(answers.q9_unaided || ['', '', ''])];
                      updated[idx] = e.target.value;
                      updateAnswer('q9_unaided', updated);
                    }}
                    placeholder={`e.g. Provider Name ${idx + 1}`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Q10. Provider Relationship Grid */}
      {step.id === 'q10_grid' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Brand Experience Grid</span>
            <h2 className="text-xl font-bold text-slate-900">
              For each provider shown, select the one statement that best describes your relationship with it.
            </h2>
            <p className="text-sm text-slate-500">Select one option per row for all listed institutions.</p>
          </div>
          <GridQuestion
            rows={PROVIDER_LIST}
            columns={PROVIDER_RELATIONSHIP_COLUMNS}
            values={answers.q10_grid || {}}
            onChange={(provName, colLabel) => {
              const current = answers.q10_grid || {};
              updateAnswer('q10_grid', { ...current, [provName]: colLabel });
            }}
          />
        </div>
      )}

      {/* Q11. Reasons for not choosing considered providers */}
      {step.id === 'q11_reasons' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Consideration Barriers</span>
            <h2 className="text-xl font-bold text-slate-900">
              You mentioned that you considered the following providers, but never used them. What were the main reasons you did not choose them?
            </h2>
            <p className="text-sm text-slate-500">Select up to 3 reasons per provider.</p>
          </div>
          <div className="space-y-6">
            {flags.consideredNeverUsedProviders.slice(0, 3).map(prov => {
              const provReasons = answers.q11_reasons?.[prov] || [];
              const reasonsList = [
                "Fees were too high or value was unclear",
                "Location was inconvenient",
                "Suitable class timings were unavailable",
                "Desired subject/programme was unavailable",
                "Teaching approach or curriculum did not seem suitable",
                "Class size or level of personal attention was unsuitable",
                "I have greater confidence in another provider/tutor",
                "Trial lesson or consultation experience was unsatisfactory",
                "Not enough information was available to decide",
                "My needs changed or tuition was no longer required",
                "Other reason"
              ];

              return (
                <div key={prov} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    {prov}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {reasonsList.map(r => {
                      const isSelected = provReasons.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            let next;
                            if (isSelected) {
                              next = provReasons.filter(item => item !== r);
                            } else if (provReasons.length < 3) {
                              next = [...provReasons, r];
                            } else {
                              return;
                            }
                            updateAnswer('q11_reasons', {
                              ...(answers.q11_reasons || {}),
                              [prov]: next
                            });
                          }}
                          className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>{r}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Q12.1 Primary Provider */}
      {step.id === 'q12_1_primary' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Primary Tutoring Centre</span>
            <h2 className="text-xl font-bold text-slate-900">
              You told us you currently use more than one provider. Which one would you describe as your main provider — the one you rely on most?
            </h2>
          </div>
          <div className="space-y-2">
            {flags.currentProviders.map(prov => {
              const isSelected = answers.q12_1_primary === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => {
                    updateAnswer('q12_1_primary', prov);
                    updateAnswer('primary_provider', prov);
                  }}
                  className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{prov}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brand Loop Evaluations (Q12–Q18) */}
      {step.id === 'brand_evaluations' && (
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">In-Depth Brand Evaluations</span>
            <h2 className="text-xl font-bold text-slate-900">Experience with Your Evaluated Providers</h2>
            <p className="text-sm text-slate-500">
              Please rate your experience with up to 4 selected providers ({flags.brandLoop.join(', ')}).
            </p>
          </div>

          {flags.brandLoop.map(brand => {
            const ev = answers.brand_evaluations?.[brand] || {};
            const updateBrandEval = (field, val) => {
              const allEvals = answers.brand_evaluations || {};
              updateAnswer('brand_evaluations', {
                ...allEvals,
                [brand]: {
                  ...(allEvals[brand] || {}),
                  [field]: val
                }
              });
            };

            return (
              <div key={brand} className="p-6 rounded-2xl border-2 border-slate-200 bg-white shadow-xs space-y-6">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="w-3 h-3 rounded-full bg-blue-600" />
                  <h3 className="text-lg font-bold text-slate-900">{brand}</h3>
                </div>

                {/* Q12 Initial Awareness */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Q12. How did you initially hear about {brand}? (Select up to 2)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Recommendation from a friend or classmate",
                      "A sibling or family member attended",
                      "Recommendation or decision by a parent or guardian",
                      "Recommendation from a school teacher",
                      "Social media, such as Instagram or TikTok",
                      "Online search, such as Google",
                      "Online or offline advertising",
                      "Saw the centre, its signage or premises",
                      "Tuition agency or referral service",
                      "Other"
                    ].map(src => {
                      const selected = ev.q12_sources || [];
                      const isSel = selected.includes(src);
                      return (
                        <button
                          key={src}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              updateBrandEval('q12_sources', selected.filter(s => s !== src));
                            } else if (selected.length < 2) {
                              updateBrandEval('q12_sources', [...selected, src]);
                            }
                          }}
                          className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSel
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                          }`}
                        >
                          <span>{src}</span>
                          {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q13 Attendance Mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Q13. In which formats do you receive these {brand} services? (Select all that apply)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "One-to-one lessons in person",
                      "Small-group lessons in person with 2-6 students",
                      "Classroom lessons in person with 7 or more students",
                      "Live online lessons",
                      "Hybrid lessons combining in-person and online delivery",
                      "Self-paced app or recorded course"
                    ].map(mode => {
                      const selected = ev.q13_modes || [];
                      const isSel = selected.includes(mode);
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            if (isSel) {
                              updateBrandEval('q13_modes', selected.filter(m => m !== mode));
                            } else {
                              updateBrandEval('q13_modes', [...selected, mode]);
                            }
                          }}
                          className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSel
                              ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                              : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                          }`}
                        >
                          <span>{mode}</span>
                          {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q16 CSAT */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Q16. Overall, how satisfied are you with {brand}?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"].map((sat, i) => {
                      const isSel = ev.q16_csat === sat;
                      return (
                        <button
                          key={sat}
                          type="button"
                          onClick={() => updateBrandEval('q16_csat', sat)}
                          className={`p-3 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                            isSel
                              ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="text-base mb-0.5">{['😞', '🙁', '😐', '🙂', '😄'][i]}</div>
                          <div>{sat}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q17 NPS (0-10) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <span>Q17. How likely are you to recommend {brand}?</span>
                    <span className="text-slate-400 font-normal">0 = Not at all, 10 = Extremely</span>
                  </div>
                  <div className="grid grid-cols-11 gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(score => {
                      const isSel = ev.q17_nps === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => updateBrandEval('q17_nps', score)}
                          className={`py-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600 ring-offset-1'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Q18 Open text reason */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Q18. Why did you give this recommendation score to {brand}? (Min 6 characters)
                  </label>
                  <textarea
                    rows={2}
                    value={ev.q18_reason || ''}
                    onChange={e => updateBrandEval('q18_reason', e.target.value)}
                    placeholder="Tell us what influenced your rating (please do not write phone numbers or emails)..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white text-xs sm:text-sm"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Q14. Ranking of Top 5 KPCs */}
      {step.id === 'q14_ranked_kpcs' && (
        <RankingQuestion
          title="Q14. Provider Choice Criteria Ranking"
          subtitle="Which factors are most important to you when choosing a tuition or enrichment provider? Please rank your top 5 factors (1 is most important, 5 is 5th most important)."
          items={KPC_LIST}
          rankedList={answers.q14_ranked_kpcs || []}
          onChange={ranked => updateAnswer('q14_ranked_kpcs', ranked)}
          maxRanks={5}
        />
      )}

      {/* Q19, Q20/Q21 Retention & Continuation */}
      {step.id === 'q19_continue' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Retention & Continuation</span>
            <h2 className="text-xl font-bold text-slate-900">
              Future Plans with Your Current Provider(s)
            </h2>
          </div>

          {flags.currentProviders.slice(0, 3).map(prov => {
            const continueRating = answers.q19_continue?.[prov];
            const setContinueRating = (r) => {
              updateAnswer('q19_continue', {
                ...(answers.q19_continue || {}),
                [prov]: r
              });
            };

            return (
              <div key={prov} className="p-5 rounded-xl border border-slate-200 bg-white space-y-4 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Q19. How likely are you to continue with <strong>{prov}</strong> over the next 12 months?</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {["Not at all likely", "Unlikely", "Neither likely nor unlikely", "Likely", "Extremely likely"].map((opt, i) => {
                    const isSel = continueRating === opt || continueRating === i + 1;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setContinueRating(opt)}
                        className={`p-3 rounded-lg border text-center text-xs font-medium transition-all cursor-pointer ${
                          isSel
                            ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Conditional Q20 (if Likely or Extremely Likely) */}
                {(continueRating === "Likely" || continueRating === "Extremely likely" || continueRating >= 4) && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Q20. What are the main reasons you are likely to continue with {prov}? (Select up to 3)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Quality of teaching",
                        "Good results or progress",
                        "Curriculum relevant to my schoolwork or goals",
                        "Enough personal attention",
                        "Convenient location",
                        "Convenient schedule and flexible learning options",
                        "Good value for money",
                        "Enjoyable and motivating lessons",
                        "Trust in the provider and its reputation",
                        "Influence of parents, guardians or friends",
                        "Other"
                      ].map(reason => {
                        const sel = answers.q20_reasons?.[prov] || [];
                        const isSel = sel.includes(reason);
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              let next;
                              if (isSel) {
                                next = sel.filter(s => s !== reason);
                              } else if (sel.length < 3) {
                                next = [...sel, reason];
                              } else {
                                return;
                              }
                              updateAnswer('q20_reasons', {
                                ...(answers.q20_reasons || {}),
                                [prov]: next
                              });
                            }}
                            className={`p-2 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                              isSel ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <span>{reason}</span>
                            {isSel && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Conditional Q21 (if Unlikely or Not at all likely) */}
                {(continueRating === "Unlikely" || continueRating === "Not at all likely" || continueRating <= 2) && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Q21. What are the main reasons you are unlikely to continue with {prov}? (Select up to 3)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "Course completed or tuition no longer required",
                        "Lack of results or progress",
                        "Poor value for money",
                        "Inconvenient schedule",
                        "Inconvenient location",
                        "Unsuitable teaching quality or style",
                        "Unsuitable class size or personal attention",
                        "Loss of interest or motivation",
                        "Preference for another provider or self-study",
                        "Parent or guardian’s decision",
                        "Other"
                      ].map(reason => {
                        const sel = answers.q21_reasons?.[prov] || [];
                        const isSel = sel.includes(reason);
                        return (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => {
                              let next;
                              if (isSel) {
                                next = sel.filter(s => s !== reason);
                              } else if (sel.length < 3) {
                                next = [...sel, reason];
                              } else {
                                return;
                              }
                              updateAnswer('q21_reasons', {
                                ...(answers.q21_reasons || {}),
                                [prov]: next
                              });
                            }}
                            className={`p-2 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                              isSel ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          >
                            <span>{reason}</span>
                            {isSel && <Check className="w-3.5 h-3.5 text-amber-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Q22-Q25 Switching Behaviour & Barriers */}
      {step.id === 'q22_switching' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Switching Behaviour</span>
            <h2 className="text-xl font-bold text-slate-900">Provider Switching & Retention Barriers</h2>
          </div>

          {/* Q22 Switched in past 12m */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <label className="block text-sm font-semibold text-slate-800">
              Q22. In the past 12 months, have you switched from one tutoring or enrichment provider to another?
            </label>
            <div className="flex gap-3">
              {["Yes", "No"].map(val => {
                const isSel = answers.q22_switched === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => updateAnswer('q22_switched', val)}
                    className={`px-6 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      isSel ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Q22 = Yes -> Q23 and Q24 */}
          {answers.q22_switched === 'Yes' && (
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Q23. Which provider were you using immediately before switching to your primary provider?
                </label>
                <select
                  value={answers.q23_switched_from || ''}
                  onChange={e => updateAnswer('q23_switched_from', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm"
                >
                  <option value="">Select previous provider...</option>
                  {PROVIDER_LIST.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                {answers.q23_switched_from === 'Other provider, please specify' && (
                  <div className="pt-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Please specify name of other tuition provider..."
                      value={answers.q23_switched_from_other || ''}
                      onChange={e => updateAnswer('q23_switched_from_other', e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-blue-400 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Q24. What were the main reasons you switched? (Select up to 3)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Course or exam ended",
                    "Moved to a different education stage",
                    "Poor results or slow progress",
                    "No longer needed/interested",
                    "Fees or a price increase",
                    "Schedule difficulty",
                    "Location or travel inconvenience",
                    "Teaching style did not suit me",
                    "Tutor or instructor quality",
                    "Class size or lack of personal attention",
                    "Materials or technology",
                    "Switched to self-study or free resources",
                    "Parent or guardian decided",
                    "Provider closed or course unavailable",
                    "Other"
                  ].map(r => {
                    const sel = answers.q24_reasons || [];
                    const isSel = sel.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          if (isSel) updateAnswer('q24_reasons', sel.filter(s => s !== r));
                          else if (sel.length < 3) updateAnswer('q24_reasons', [...sel, r]);
                        }}
                        className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                          isSel ? 'border-blue-600 bg-blue-100/70 text-blue-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>{r}</span>
                        {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
                {(answers.q24_reasons || []).includes('Other') && (
                  <div className="p-3 bg-blue-50/80 border border-blue-300 rounded-xl space-y-1 mt-2">
                    <label className="block text-xs font-bold text-blue-900 uppercase">Please specify other reason:</label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Please specify why you switched..."
                      value={answers.q24_reasons_other || ''}
                      onChange={e => updateAnswer('q24_reasons_other', e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Q25 Barriers to switching */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Q25. Which of the following would make you reluctant to switch away from your current provider? (Select up to 3)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "I am satisfied with the teaching and my progress",
                "I have a good relationship with my tutor or instructor",
                "My tutor understands my learning needs and history",
                "I do not want to disrupt my learning or exam preparation",
                "The location, timetable or class format is convenient",
                "My friends or classmates attend the same provider",
                "My parent or guardian prefers the current provider",
                "Finding and comparing another provider would take too much effort",
                "I am unsure whether another provider would be better",
                "Fees or a course package have already been paid",
                "Suitable classes may not be available elsewhere",
                "The current provider offers good value for money",
                "Nothing would make me reluctant to switch",
                "Other"
              ].map(barr => {
                const sel = answers.q25_barriers || [];
                const isSel = sel.includes(barr);
                return (
                  <button
                    key={barr}
                    type="button"
                    onClick={() => {
                      if (barr === "Nothing would make me reluctant to switch") {
                        updateAnswer('q25_barriers', [barr]);
                      } else {
                        const clean = sel.filter(b => b !== "Nothing would make me reluctant to switch");
                        if (isSel) updateAnswer('q25_barriers', clean.filter(b => b !== barr));
                        else if (clean.length < 3) updateAnswer('q25_barriers', [...clean, barr]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSel ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>{barr}</span>
                    {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Q26-Q28 Tutor vs Brand & Premium Value */}
      {step.id === 'tutor_and_brand' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Perception & Brand Value</span>
            <h2 className="text-xl font-bold text-slate-900">Tutor vs. Provider Brand Preferences</h2>
          </div>

          {/* Q26 Tutor vs brand */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Q26. When choosing a provider, is your preference driven more by the specific tutor or by the provider brand?
            </label>
            <div className="space-y-2">
              {[
                "Entirely the tutor; the provider brand does not matter to me",
                "Mostly the tutor",
                "Roughly equal",
                "Mostly the provider brand",
                "Entirely the provider brand; I would stay regardless of who teaches me"
              ].map(opt => {
                const isSel = answers.q26_tutor_vs_brand === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateAnswer('q26_tutor_vs_brand', opt)}
                    className={`w-full p-3 rounded-lg border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSel ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt}</span>
                    {isSel && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q27 Tutor traits */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Q27. Which tutor characteristics matter most to you? (Select up to 3)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Strong subject knowledge",
                "Ability to explain clearly",
                "Engaging teaching style",
                "Patience and encouragement",
                "Understanding of examination requirements",
                "Personalised attention",
                "Track record of student results",
                "Academic credentials",
                "Availability outside lessons",
                "A good personal connection with the student",
                "Other"
              ].map(trait => {
                const sel = answers.q27_tutor_traits || [];
                const isSel = sel.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => {
                      if (isSel) updateAnswer('q27_tutor_traits', sel.filter(t => t !== trait));
                      else if (sel.length < 3) updateAnswer('q27_tutor_traits', [...sel, trait]);
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSel ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>{trait}</span>
                    {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q28 Premium justifications */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Q28. Which features would make a tuition or enrichment provider feel worth paying a higher fee for? (Select up to 3)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Smaller classes or more individual attention",
                "More experienced or highly skilled tutors",
                "A strong record of improving students’ results",
                "A teaching style that suits how I learn",
                "A specialised or more advanced curriculum",
                "Better notes, learning materials or technology",
                "More flexible class timings or learning formats",
                "More regular feedback on my progress",
                "A stronger reputation or greater trust",
                "None of these would justify a higher fee",
                "Other"
              ].map(prem => {
                const sel = answers.q28_premium || [];
                const isSel = sel.includes(prem);
                return (
                  <button
                    key={prem}
                    type="button"
                    onClick={() => {
                      if (prem === "None of these would justify a higher fee") {
                        updateAnswer('q28_premium', [prem]);
                      } else {
                        const clean = sel.filter(p => p !== "None of these would justify a higher fee");
                        if (isSel) updateAnswer('q28_premium', clean.filter(p => p !== prem));
                        else if (clean.length < 3) updateAnswer('q28_premium', [...clean, prem]);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSel ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>{prem}</span>
                    {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Q29-Q30 New Educational Programmes */}
      {step.id === 'new_programmes' && (
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Future Offerings</span>
            <h2 className="text-xl font-bold text-slate-900">Interest in Adjacent Programmes</h2>
            <p className="text-sm text-slate-500">
              Some providers offer programmes beyond regular school syllabus. Which would you be interested in taking in the next 12 months?
            </p>
          </div>

          {/* Q29 Programmes Selection */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Q29. Select up to 3 programmes of interest:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Practical use of AI for study and productivity",
                "Coding and app or website development",
                "Data analytics and digital skills",
                "Robotics and applied STEM projects",
                "Public speaking, debate and presentation skills",
                "Entrepreneurship and financial literacy",
                "Career readiness and interview preparation",
                "Language and communication support",
                ...(flags.isInternational ? ["Support adapting to the Singapore curriculum or examinations"] : []),
                "None of these — I am happy with what I currently do",
                "Other"
              ].map(prog => {
                const sel = answers.q29_programmes || [];
                const isSel = sel.includes(prog);
                return (
                  <button
                    key={prog}
                    type="button"
                    onClick={() => {
                      if (prog.startsWith("None of these")) {
                        updateAnswer('q29_programmes', [prog]);
                      } else {
                        const clean = sel.filter(p => !p.startsWith("None of these"));
                        if (isSel) updateAnswer('q29_programmes', clean.filter(p => p !== prog));
                        else if (clean.length < 3) updateAnswer('q29_programmes', [...clean, prog]);
                      }
                    }}
                    className={`p-3 rounded-lg border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                      isSel ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold' : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>{prog}</span>
                    {isSel && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Q30 Enrolment likelihood for each selected programme */}
          {(answers.q29_programmes || []).filter(p => !p.startsWith("None of these")).length > 0 && (
            <div className="p-5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-4">
              <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Q30. If your primary provider ({flags.primaryProvider || 'your preferred tuition centre'}) offered these programmes, how likely would you be to enrol?
              </label>
              <div className="space-y-4">
                {(answers.q29_programmes || []).filter(p => !p.startsWith("None of these")).map(prog => {
                  const currentRating = answers.q30_enrolment?.[prog];
                  return (
                    <div key={prog} className="p-3 bg-white rounded-lg border border-indigo-100 space-y-2">
                      <span className="text-xs font-semibold text-slate-800">{prog}</span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                        {["Very unlikely", "Unlikely", "Not sure", "Likely", "Very likely"].map(scale => {
                          const isSel = currentRating === scale;
                          return (
                            <button
                              key={scale}
                              type="button"
                              onClick={() => {
                                updateAnswer('q30_enrolment', {
                                  ...(answers.q30_enrolment || {}),
                                  [prog]: scale
                                });
                              }}
                              className={`py-2 px-1 text-center rounded border text-[11px] font-medium transition-all cursor-pointer ${
                                isSel ? 'border-indigo-600 bg-indigo-600 text-white font-bold' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              {scale}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
