import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  Layers, 
  FileText, 
  Sliders, 
  LogOut, 
  Compass, 
  Database,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  FlaskConical
} from 'lucide-react';

export default function ProductNavbar({ 
  currentView, 
  onNavigate, 
  user, 
  onLogout,
  activeSurvey 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Hub', desc: 'Surveys overview & live KPIs', icon: Compass },
    { id: 'builder', label: 'Survey Builder', desc: 'Questionnaire editor & skip logic', icon: FileText },
    { id: 'studio', label: 'Analytics Studio', desc: 'Cross-tabulation & statistical engine', icon: BarChart3 },
    { id: 'admin', label: 'Admin & CSV Exports', desc: 'Raw records & export management', icon: Database },
    { id: 'benchmark', label: 'Benchmark Demo Survey', desc: 'Interactive student study testbed', icon: FlaskConical }
  ];

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleItemClick = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    if (onLogout) onLogout();
  };

  // Get current view title
  const currentTitle = navItems.find(item => item.id === currentView)?.label || 'Dashboard Hub';

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-40 px-3 sm:px-5 py-2 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Brand Logo & Current Section Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 text-left cursor-pointer shrink-0 group"
            title="Go to Surveys Dashboard"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-600/30 transition">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black tracking-tight text-white leading-tight">
                SURVEY CLOUD
              </div>
              <div className="text-[10px] text-indigo-400 font-semibold leading-none">
                Research Portal
              </div>
            </div>
          </button>

          <span className="text-slate-800 hidden sm:inline">|</span>

          {/* Current Page Context Badge (Clean & Non-distracting) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            <span>{currentTitle}</span>
          </div>
        </div>

        {/* Right: User Avatar + 3-Line Hamburger Menu Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative" ref={menuRef}>
          
          {/* Active Survey Context Badge (If any selected) */}
          {activeSurvey && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400 text-[11px]">Active:</span>
              <span className="font-bold text-slate-200 truncate max-w-[140px]">
                {activeSurvey.title}
              </span>
            </div>
          )}

          {/* User Profile Pill (Compact) */}
          <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-800 text-right">
            <div>
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {user?.name || 'Researcher'}
              </div>
              <div className="text-[10px] text-slate-400 leading-none">
                Principal Analyst
              </div>
            </div>
          </div>

          {/* 3-LINE MENU BUTTON (Replaces Loose Logout Button) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
              isOpen 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30' 
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
            }`}
            title="Open Portal Menu & Navigation"
            aria-label="Navigation Menu"
          >
            {isOpen ? (
              <>
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </>
            ) : (
              <>
                <Menu className="w-4 h-4" />
                <span className="hidden sm:inline">Menu</span>
              </>
            )}
          </button>

          {/* BACKDROP OVERLAY */}
          {isOpen && (
            <div 
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* 3-LINE HAMBURGER MENU DROPDOWN / DRAWER */}
          {isOpen && (
            <div className="fixed sm:absolute top-12 right-2 sm:right-0 w-[95vw] sm:w-80 max-w-[340px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* Menu Header: User Identity */}
              <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'R'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {user?.name || 'Researcher'}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {user?.email || 'researcher@singaporesurveys.sg'}
                    </div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Admin
                </span>
              </div>

              {/* Navigation Options List */}
              <div className="p-2 space-y-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
                  Portal Navigation
                </div>

                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors cursor-pointer group ${
                        isActive
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-tight">{item.label}</div>
                          <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {item.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Active Survey Pill if present */}
              {activeSurvey && (
                <div className="px-3 py-2 bg-slate-950/60 border-t border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span className="truncate">Active: <strong className="text-slate-200">{activeSurvey.title}</strong></span>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">{activeSurvey.status}</span>
                </div>
              )}

              {/* Menu Footer: Sign Out / Logout Option */}
              <div className="p-2 bg-slate-950 border-t border-slate-800">
                <button
                  onClick={handleLogoutClick}
                  className="w-full text-left px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Sign Out / Logout</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-mono">End Session</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </header>
  );
}
