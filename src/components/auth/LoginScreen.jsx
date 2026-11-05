import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  BarChart3, 
  Layers, 
  Star, 
  CheckSquare, 
  CircleDot, 
  Eye, 
  EyeOff, 
  Activity, 
  Users, 
  Check, 
  ChevronRight, 
  TrendingUp, 
  PieChart,
  FileCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  // Demo / User Credentials
  const DEMO_EMAIL = 'admin@singaporesurveys.sg';
  const DEMO_PASSWORD = 'S@mfit456789@#';

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Live Survey Simulation Animation State
  const [simStep, setSimStep] = useState(0); // 0: CSAT Stars, 1: NPS Slider, 2: Multi-select
  const [activeStar, setActiveStar] = useState(0);
  const [activeNps, setActiveNps] = useState(0);
  const [selectedMulti, setSelectedMulti] = useState([]);

  // Automated Survey Simulation Loop (Cycles every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setSimStep((prev) => (prev + 1) % 3);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  // Animate survey interactions per step
  useEffect(() => {
    if (simStep === 0) {
      setActiveStar(0);
      const t1 = setTimeout(() => setActiveStar(1), 250);
      const t2 = setTimeout(() => setActiveStar(3), 600);
      const t3 = setTimeout(() => setActiveStar(5), 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (simStep === 1) {
      setActiveNps(0);
      const t1 = setTimeout(() => setActiveNps(4), 350);
      const t2 = setTimeout(() => setActiveNps(8), 750);
      const t3 = setTimeout(() => setActiveNps(10), 1200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else if (simStep === 2) {
      setSelectedMulti([]);
      const t1 = setTimeout(() => setSelectedMulti(['Math (A-Math & H2)']), 400);
      const t2 = setTimeout(() => setSelectedMulti(['Math (A-Math & H2)', 'Sciences (Physics/Chem)']), 1000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [simStep]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setLoading(true);

    setTimeout(() => {
      const user = {
        name: email.split('@')[0] || 'Research Director',
        email: email || DEMO_EMAIL,
        role: 'Principal Survey Analyst',
        avatar: '👨‍💼',
        loginTime: new Date().toISOString()
      };
      localStorage.setItem('survey_portal_auth', JSON.stringify(user));
      setLoading(false);
      onLoginSuccess(user);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6 text-slate-800 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      
      {/* Background Subtle Gradient Blurs (Light Mode) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-200/50 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-200/40 rounded-full blur-[130px]"></div>
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-80 bg-emerald-100/60 rounded-full blur-[100px]"></div>
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40"></div>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: CRISP LIGHT-THEME INTERACTIVE SURVEY SIMULATION */}
        {/* ============================================================ */}
        <div className="lg:col-span-6 space-y-6 hidden md:block">
          
          {/* Main Title Banner */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-indigo-200 rounded-full text-xs font-bold text-indigo-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Enterprise Research & Tabulation Portal</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Design, Deploy & <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-600">
                Tabulate Surveys in Real Time
              </span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-500 leading-relaxed max-w-md">
              Fieldwork quota management, dynamic branch logic, and instant publication-grade cross-tabulations.
            </p>
          </div>

          {/* THE LIVE LIGHT-THEME SURVEY SIMULATOR CARD */}
          <div className="relative">
            
            {/* Top Floating Logic Jump Badge */}
            <div className="absolute -top-4 -right-2 z-20 bg-white border border-amber-300 rounded-2xl p-2.5 shadow-lg shadow-amber-500/10 flex items-center gap-2 animate-bounce-subtle">
              <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-black text-slate-800 block">Smart Jump Logic</span>
                <span className="text-amber-700 font-semibold text-[10px]">Citizen ➔ Skip to Demographics</span>
              </div>
            </div>

            {/* Bottom Floating Quota Badge */}
            <div className="absolute -bottom-4 -left-2 z-20 bg-white border border-emerald-300 rounded-2xl p-2.5 shadow-lg shadow-emerald-500/10 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-[11px] leading-tight">
                <div className="flex items-center justify-between gap-3 font-bold text-slate-800">
                  <span>Quota Tracker</span>
                  <span className="text-emerald-600 font-mono">382/400 (95.5%)</span>
                </div>
                <div className="w-28 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full w-[95.5%] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Main Interactive Questionnaire Canvas */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xl shadow-slate-200/70 space-y-4 relative z-10">
              
              {/* Card Window Title Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-bold text-slate-600 ml-1">
                    Live Survey Questionnaire Runtime
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active Session</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>Singapore Student Tuition Study 2026</span>
                  <span className="text-indigo-600 font-mono">Question {simStep === 0 ? '16' : simStep === 1 ? '17' : '6b'} of 30</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: simStep === 0 ? '53%' : simStep === 1 ? '56%' : '20%' }}
                  ></div>
                </div>
              </div>

              {/* Question Body */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase">
                    {simStep === 0 ? 'CSAT Rating' : simStep === 1 ? 'Net Promoter Score' : 'Multi-Select Options'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">Single select per student</span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug min-h-[38px] flex items-center">
                  {simStep === 0 && "Overall, how satisfied are you with your tuition centre's teaching quality?"}
                  {simStep === 1 && "How likely are you to recommend Zenith Education Studio to a classmate?"}
                  {simStep === 2 && "Which academic subjects do you currently take tuition for?"}
                </h3>

                {/* Dynamic Animated Inputs */}
                <div className="min-h-[85px] flex flex-col justify-center">
                  
                  {/* SIM STEP 0: GOLDEN 5-STAR RATING ANIMATION */}
                  {simStep === 0 && (
                    <div className="space-y-2 text-center">
                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`p-2 rounded-xl border transition-all duration-300 transform ${
                              s <= activeStar
                                ? 'bg-amber-50 border-amber-300 text-amber-500 scale-110 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-300 scale-95'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${s <= activeStar ? 'fill-amber-400 text-amber-500' : ''}`} />
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{activeStar === 5 ? 'Rating: 5/5 — Extremely Satisfied' : 'Selecting response...'}</span>
                      </div>
                    </div>
                  )}

                  {/* SIM STEP 1: NPS 0-10 GAUGE ANIMATION */}
                  {simStep === 1 && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-11 gap-1">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
                          const isSelected = n <= activeNps;
                          const isFinal = n === activeNps;
                          return (
                            <div
                              key={n}
                              className={`py-1.5 text-center text-xs font-mono font-bold rounded-lg border transition-all duration-200 ${
                                isFinal
                                  ? 'bg-emerald-600 text-white border-emerald-600 scale-110 shadow-md shadow-emerald-600/30'
                                  : isSelected
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-white text-slate-400 border-slate-200'
                              }`}
                            >
                              {n}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                        <span>0: Not likely</span>
                        <span className="text-emerald-700 font-black">Score: 10 • Promoter (+100 NPS)</span>
                        <span>10: Extremely likely</span>
                      </div>
                    </div>
                  )}

                  {/* SIM STEP 2: CHECKBOXES AUTO-CHECK ANIMATION */}
                  {simStep === 2 && (
                    <div className="grid grid-cols-2 gap-2">
                      {['Math (A-Math & H2)', 'Sciences (Physics/Chem)', 'English / General Paper', 'Economics'].map((subj) => {
                        const isChecked = selectedMulti.includes(subj);
                        return (
                          <div
                            key={subj}
                            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs font-bold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span className="truncate">{subj}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </div>

              {/* Bottom Live Feed Note */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Latest response: <strong>RESP_9482 (Sec 4 Student, Singapore)</strong></span>
                </div>
                <span className="font-mono text-slate-400 text-[10px]">Just recorded</span>
              </div>

            </div>

          </div>

        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: CRISP LIGHT-THEME LOGIN FORM & CREDENTIALS CARD*/}
        {/* ============================================================ */}
        <div className="lg:col-span-6 max-w-md w-full mx-auto space-y-5">
          
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-slate-200/70 space-y-5 relative">
            
            {/* Header Brand */}
            <div className="text-center space-y-1.5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 mb-1">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Researcher Portal Login
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Access Survey Builder, Live Quotas & Analytics Studio
              </p>
            </div>

            {/* Error message if any */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {authError}
              </div>
            )}

            {/* Main Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@singaporesurveys.sg"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Password with Show/Hide Toggle */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <a 
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Demo / Master Account: admin@singaporesurveys.sg\nPassword: S@mfit456789@#");
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-2xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[11px] font-medium text-slate-600">Remember this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Verifying & Accessing Portal...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Fast Instant Login */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
                <span>1-Click Instant Director Login</span>
              </button>
            </div>

            {/* Security Guarantee Badge */}
            <div className="text-center flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by PostgreSQL • 30 Questions Active</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

