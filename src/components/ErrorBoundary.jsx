import React from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Survey UI Error Caught by Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-5">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
              <p className="text-xs text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 font-mono font-medium">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload Survey</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* Expandable Debug Info */}
            <div className="pt-3 border-t border-slate-100 text-left">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium mx-auto cursor-pointer"
              >
                <span>{this.state.showDetails ? 'Hide error stack' : 'Show technical error details'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] font-mono overflow-x-auto max-h-48 space-y-1">
                  <p className="text-rose-400 font-bold">{this.state.error?.toString()}</p>
                  <pre className="text-slate-400 whitespace-pre-wrap">{this.state.error?.stack}</pre>
                  {this.state.errorInfo && (
                    <pre className="text-slate-500 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
