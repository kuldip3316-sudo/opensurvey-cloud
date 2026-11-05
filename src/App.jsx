import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import QuestionRenderer from './components/QuestionRenderer';
import TerminationModal from './components/TerminationModal';
import SuccessScreen from './components/SuccessScreen';
import AdminDashboard from './components/AdminDashboard';
import TabulationStudio from './components/TabulationStudio';
import SurveyBuilder from './components/builder/SurveyBuilder';
import DynamicSurveyRuntime from './components/runtime/DynamicSurveyRuntime';
import LoginScreen from './components/auth/LoginScreen';
import ProductNavbar from './components/navigation/ProductNavbar';
import SurveysDashboard from './components/dashboard/SurveysDashboard';
import { useSurveyEngine } from './useSurveyEngine';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export default function App() {
  const {
    answers,
    updateAnswer,
    currentStepIndex,
    currentStep,
    totalSteps,
    status,
    softPromptWarning,
    isSubmitting,
    submissionResult,
    handleNext,
    handlePrev,
    resetSurvey,
    flags
  } = useSurveyEngine();

  // Route / View Router State
  const getInitialView = () => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.startsWith('/s/')) {
      return { view: 'runtime', slug: path.split('/s/')[1], surveyId: null };
    }
    if (path === '/builder' || search.includes('builder')) {
      return { view: 'builder', slug: null, surveyId: null };
    }
    if (path === '/studio' || path === '/analytics' || search.includes('studio')) {
      return { view: 'studio', slug: null, surveyId: null };
    }
    if (path === '/admin' || search.includes('admin')) {
      return { view: 'admin', slug: null, surveyId: null };
    }
    if (path === '/benchmark' || search.includes('benchmark')) {
      return { view: 'benchmark', slug: null, surveyId: null };
    }
    return { view: 'dashboard', slug: null, surveyId: null };
  };

  const [viewState, setViewState] = useState(getInitialView);
  const [quotaStats, setQuotaStats] = useState(null);

  // Authenticated Researcher State
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('survey_portal_auth');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('survey_portal_auth');
    setAuthUser(null);
  };

  // Sync browser URL bar with view changes
  const navigateTo = (view, slug = null, surveyId = null) => {
    setViewState({ view, slug, surveyId });
    if (view === 'runtime' && slug) {
      window.history.pushState({}, '', `/s/${slug}`);
    } else if (view === 'builder') {
      window.history.pushState({}, '', '/builder');
    } else if (view === 'studio') {
      window.history.pushState({}, '', '/studio');
    } else if (view === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (view === 'benchmark') {
      window.history.pushState({}, '', '/benchmark');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  // Update document title according to current portal view
  useEffect(() => {
    if (viewState.view === 'builder') {
      document.title = 'Survey Builder | Survey Cloud';
    } else if (viewState.view === 'studio') {
      document.title = 'Analytics & Tabulation Studio | Survey Cloud';
    } else if (viewState.view === 'admin') {
      document.title = 'Admin & Fieldwork Exports | Survey Cloud';
    } else if (viewState.view === 'benchmark') {
      document.title = 'Benchmark Demo Study | Survey Cloud';
    } else if (viewState.view === 'dashboard') {
      document.title = 'Dashboard Hub | Survey Cloud';
    } else if (viewState.view !== 'runtime') {
      document.title = 'Survey Cloud | Enterprise Research & Survey Platform';
    }
  }, [viewState.view]);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const onPopState = () => {
      setViewState(getInitialView());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/responses');
      const data = await res.json();
      if (data.success) {
        setQuotaStats(data);
      }
    } catch (e) {
      // Backend not reached or offline
    }
  };

  useEffect(() => {
    fetchStats();
  }, [status, viewState.view]);

  // 1. PUBLIC DYNAMIC SURVEY RUNTIME (/s/:slug - NO LOGIN REQUIRED)
  if (viewState.view === 'runtime') {
    return (
      <DynamicSurveyRuntime
        surveySlug={viewState.slug}
        onNavigateToStudio={() => navigateTo('studio')}
        onNavigateToBuilder={() => navigateTo('builder')}
      />
    );
  }

  // 2. RESEARCHER AUTHENTICATION GATEWAY
  if (!authUser) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setAuthUser(user);
          navigateTo('dashboard');
        }}
      />
    );
  }

  // 3. RESEARCHER PORTAL APP WRAPPER
  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Compact Product Navbar */}
      <ProductNavbar
        currentView={viewState.view}
        onNavigate={(v) => navigateTo(v)}
        user={authUser}
        onLogout={handleLogout}
      />

      {/* Main View Switcher */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* VIEW: DASHBOARD HUB */}
        {viewState.view === 'dashboard' && (
          <SurveysDashboard
            onOpenBuilder={(surveyId) => navigateTo('builder', null, surveyId)}
            onOpenStudio={(surveyId) => navigateTo('studio', null, surveyId)}
            onOpenRuntime={(slug) => navigateTo('runtime', slug)}
          />
        )}

        {/* VIEW: SURVEY BUILDER */}
        {viewState.view === 'builder' && (
          <SurveyBuilder
            initialSurveyId={viewState.surveyId}
            onNavigateToStudio={(surveyId) => navigateTo('studio', null, surveyId)}
            onNavigateToRuntime={(slug) => navigateTo('runtime', slug)}
            onBackToApp={() => navigateTo('dashboard')}
          />
        )}

        {/* VIEW: TABULATION & ANALYTICS STUDIO */}
        {viewState.view === 'studio' && (
          <TabulationStudio
            initialSurveyId={viewState.surveyId}
            responses={quotaStats?.data || []}
            onClose={() => navigateTo('dashboard')}
            onBackToSurvey={() => navigateTo('dashboard')}
          />
        )}

        {/* VIEW: ADMIN & DATA EXPORT */}
        {viewState.view === 'admin' && (
          <AdminDashboard
            onClose={() => navigateTo('dashboard')}
            onBackToSurvey={() => navigateTo('dashboard')}
            onOpenStudio={() => navigateTo('studio')}
          />
        )}

        {/* VIEW: BENCHMARK DEMO SURVEY */}
        {viewState.view === 'benchmark' && (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Header with Progress Bar & Module Switchers */}
      <Header
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onOpenBuilder={() => navigateTo('builder')}
        onOpenStudio={() => navigateTo('studio')}
        onOpenAdmin={() => navigateTo('admin')}
      />

      {/* Main Questionnaire Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {status === 'TERMINATED' ? (
          <TerminationModal onRestart={resetSurvey} />
        ) : status === 'COMPLETED' ? (
          <SuccessScreen
            respondentId={submissionResult?.respondentId}
            onRestart={resetSurvey}
            onOpenAdmin={() => navigateTo('admin')}
          />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-8">
            {/* Step indicator */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 pb-2 border-b border-slate-100">
              <span>SECTION {currentStepIndex + 1} OF {totalSteps}</span>
              <span>{Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% COMPLETED</span>
            </div>

            {/* Question Body */}
            <QuestionRenderer
              step={currentStep}
              answers={answers}
              updateAnswer={updateAnswer}
              flags={flags}
              softPromptWarning={softPromptWarning}
            />

            {/* Navigation buttons */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                disabled={currentStepIndex === 0 || isSubmitting}
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : currentStepIndex === totalSteps - 1 ? (
                  <>
                    <span>Submit Survey</span>
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400 bg-white/50">
        <p>Singapore Student Tuition & Enrichment Survey • All responses are strictly confidential.</p>
      </footer>
    </div>
        )}
      </div>
    </div>
  );
}
