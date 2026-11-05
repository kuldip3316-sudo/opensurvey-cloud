import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  Eye,
  MapPin,
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  GraduationCap,
  BarChart3,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard({ onClose, onBackToSurvey, onOpenStudio }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all | qualified | terminated
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/responses');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClearResponses = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/clear-responses', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setShowClearModal(false);
        setToastMsg('All responses cleared successfully. Fresh dataset ready!');
        setTimeout(() => setToastMsg(null), 4000);
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to clear responses:', err);
      alert('Error clearing data: ' + err.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleRestoreSample = async () => {
    setIsRestoring(true);
    try {
      const res = await fetch('/api/restore-sample-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setToastMsg(`Restored ${data.count} sample respondents successfully.`);
        setTimeout(() => setToastMsg(null), 4000);
        await fetchStats();
      }
    } catch (err) {
      console.error('Failed to restore sample data:', err);
      alert('Error restoring demo data: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDownloadStandardCsv = () => {
    window.open('/api/export-csv', '_blank');
  };

  const handleDownloadQualtricsCsv = () => {
    window.open('/api/export-qualtrics-csv', '_blank');
  };

  const filteredResponses = (stats?.data || []).filter(item => {
    if (activeTab === 'qualified' && item.status !== 'QUALIFIED') return false;
    if (activeTab === 'terminated' && (!item.status || !item.status.startsWith('TERMINATED'))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (item.id || '').toLowerCase().includes(q);
      const matchIp = (item.ip_address || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      const matchSchool = (item.answers?.q4_schooling || '').toLowerCase().includes(q);
      const matchProvider = (item.answers?.primary_provider || item.answers?.q12_1_primary || '').toLowerCase().includes(q);
      if (!matchId && !matchIp && !matchLoc && !matchSchool && !matchProvider) return false;
    }

    return true;
  });

  const percentQuota = stats?.totalTarget
    ? Math.min(100, Math.round(((stats.qualifiedCount || 0) / stats.totalTarget) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-2 sm:p-4 text-xs">
      <div className="max-w-[1600px] mx-auto space-y-2.5">
        
        {/* Compact Header Bar */}
        <header className="bg-white rounded-xl px-3 py-2 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToSurvey || onClose}
              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Survey</span>
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">
                Singapore Tuition Survey Admin
              </h1>
              <span className="text-[10px] text-slate-400 font-mono">
                Storage: data/survey_responses.csv
              </span>
            </div>
          </div>

          {/* Inline Quick Stats Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <Users className="w-3 h-3 text-blue-600" />
              <span className="text-[11px] font-semibold text-blue-900">
                Quota: <strong className="font-bold">{stats?.qualifiedCount || 0}</strong>/{stats?.totalTarget || 400} ({percentQuota}%)
              </span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-semibold text-[11px]">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Qualified: <strong>{stats?.qualifiedCount || 0}</strong></span>
            </div>

            <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 font-semibold text-[11px]">
              <AlertCircle className="w-3 h-3 text-amber-600" />
              <span>Terminated: <strong>{stats?.terminatedCount || 0}</strong></span>
            </div>

            <button
              onClick={handleDownloadStandardCsv}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
              title="Standard flat CSV format for Excel, Google Sheets, PowerBI"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Standard CSV</span>
            </button>

            <button
              onClick={handleDownloadQualtricsCsv}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
              title="Qualtrics & Q Research Software format with 3-header rows (Variable, Question, ImportId) and binary 0/1 dummies"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>Q / Qualtrics / SPSS CSV</span>
            </button>

            <button
              onClick={onOpenStudio}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-xs cursor-pointer text-xs transition-all ring-1 ring-blue-400/50"
              title="Open Q-Light Statistical Tabulation Studio"
            >
              <BarChart3 className="w-3.5 h-3.5 text-blue-200" />
              <span>Q-Tabulation Studio</span>
            </button>

            {/* Clear All Responses Button */}
            <button
              onClick={() => setShowClearModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-600/90 hover:bg-red-600 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
              title="Clear all responses to start collecting new data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear / Reset Data</span>
            </button>

            {/* Restore Sample Data Button (if count is 0) */}
            {stats?.data?.length === 0 && (
              <button
                onClick={handleRestoreSample}
                disabled={isRestoring}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
                title="Restore 400 sample respondents"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring...' : 'Restore Sample (400 N)'}</span>
              </button>
            )}

            <button
              onClick={fetchStats}
              className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{toastMsg}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Confirmation Modal for Clearing Data */}
        {showClearModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  Clear All Survey Responses?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will wipe all {stats?.data?.length || 0} responses from the server database and CSV file so you can start fresh with brand new data.
                </p>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Safe & Reversible:</strong> An automatic timestamped backup will be saved in <code>data/backups/</code> before clearing. You can also click "Restore Sample Data" at any time.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowClearModal(false)}
                  disabled={isClearing}
                  className="flex-1 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearResponses}
                  disabled={isClearing}
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer text-xs shadow-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isClearing ? 'Clearing...' : 'Yes, Clear All Data'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State Banner when 0 records */}
        {stats?.data?.length === 0 && (
          <div className="bg-white rounded-xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Survey Database is Ready for New Data
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The database has 0 responses. Any survey filled out via the survey link will automatically append here in real-time.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestoreSample}
                disabled={isRestoring}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>Restore Sample Dataset (400 N)</span>
              </button>
              <button
                onClick={onBackToSurvey}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
              >
                <span>Open Survey App</span>
              </button>
            </div>
          </div>
        )}

        {/* Compact Toolbar: Filter Tabs + Search Box */}
        <div className="bg-white rounded-xl px-3 py-1.5 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All ({stats?.data?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('qualified')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                activeTab === 'qualified'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Qualified ({stats?.qualifiedCount || 0})
            </button>
            <button
              onClick={() => setActiveTab('terminated')}
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] transition-colors cursor-pointer ${
                activeTab === 'terminated'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Terminated ({stats?.terminatedCount || 0})
            </button>
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ID, IP, School, Provider, Location..."
              className="w-full pl-8 pr-2 py-1 rounded-md border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 outline-hidden bg-slate-50"
            />
          </div>
        </div>

        {/* High-Density Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5">IP & Location</th>
                  <th className="py-2 px-2.5">Age / Gender</th>
                  <th className="py-2 px-2.5">Schooling & Level</th>
                  <th className="py-2 px-2.5">Primary Provider</th>
                  <th className="py-2 px-2.5">CSAT / NPS</th>
                  <th className="py-2 px-2.5">Duration</th>
                  <th className="py-2 px-2.5">Time</th>
                  <th className="py-2 px-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredResponses.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredResponses.map((r, idx) => {
                    const primary = r.answers?.primary_provider || r.answers?.q12_1_primary || '-';
                    const ev = primary !== '-' && r.answers?.brand_evaluations?.[primary];
                    const csat = ev?.q16_csat || '-';
                    const nps = ev?.q17_nps !== undefined ? `${ev.q17_nps}/10` : '-';

                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {r.id}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                              r.status === 'QUALIFIED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-800">
                            <span>{r.ip_address || '127.0.0.1'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{r.location || 'Local / Network'}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          <strong className="text-slate-800">{r.answers?.q1_age ? `${r.answers.q1_age}y` : '-'}</strong>
                          <span className="text-slate-400 ml-1">({r.answers?.q3_gender || '-'})</span>
                        </td>
                        <td className="py-1.5 px-2.5 max-w-[180px]">
                          <div className="font-semibold text-slate-800 truncate" title={r.answers?.q4_schooling}>
                            {r.answers?.q4_schooling || '-'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {r.answers?.q5_level || '-'}
                          </div>
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap font-medium text-slate-900">
                          {primary}
                        </td>
                        <td className="py-1.5 px-2.5 whitespace-nowrap">
                          {primary !== '-' && ev ? (
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                              <span>{csat}</span>
                              <span className="font-bold text-emerald-600">NPS:{nps}</span>
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-400 font-mono whitespace-nowrap">
                          {r.duration_seconds ? `${r.duration_seconds}s` : '-'}
                        </td>
                        <td className="py-1.5 px-2.5 text-slate-400 whitespace-nowrap">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedResponse(r)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-colors cursor-pointer text-[10px]"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dense Full-Answers Inspector Modal */}
        {selectedResponse && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
              
              {/* Modal Header */}
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-sm text-slate-900">{selectedResponse.id}</span>
                  <span
                    className={`inline-flex px-2 py-0.2 rounded text-[10px] font-bold ${
                      selectedResponse.status === 'QUALIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selectedResponse.status}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-600">IP: {selectedResponse.ip_address || '127.0.0.1'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 font-semibold">{selectedResponse.location || 'Unknown'}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400 font-mono">
                    {new Date(selectedResponse.timestamp).toLocaleString()} ({selectedResponse.duration_seconds || 0}s)
                  </span>
                </div>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: Compact 2-Column Dense Grid */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                
                {/* 1. Demographics Bar */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>Demographics & Schooling (Q1–Q5)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Age</span>
                      <strong className="text-slate-800">{selectedResponse.answers?.q1_age || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Country</span>
                      <strong className="text-slate-800">{selectedResponse.answers?.q2_country || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Status</span>
                      <strong className="text-slate-800">{selectedResponse.answers?.q2a_status || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Gender</span>
                      <strong className="text-slate-800">{selectedResponse.answers?.q3_gender || '-'}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px]">Schooling & Grade</span>
                      <strong className="text-slate-800">
                        {selectedResponse.answers?.q4_schooling || '-'} — {selectedResponse.answers?.q5_level || '-'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. Services Grid (Q6) & Usage (Q7, Q8, Q9) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                      Paid Services Usage (Q6)
                    </span>
                    <div className="space-y-1">
                      {selectedResponse.answers?.q6_matrix ? (
                        Object.entries(selectedResponse.answers.q6_matrix).map(([svc, ans]) => (
                          <div key={svc} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-100 text-[11px]">
                            <span className="text-slate-700 truncate max-w-[200px]" title={svc}>{svc}</span>
                            <span className="font-bold text-blue-700 shrink-0">{ans}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">No service answers recorded.</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                      Hours, Decision & Recall (Q7, Q8, Q9)
                    </span>
                    <div className="space-y-1.5 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Q7. Weekly Hours Spent</span>
                        <strong className="text-slate-800">{selectedResponse.answers?.q7_hours || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Q8. Decision Maker</span>
                        <strong className="text-slate-800">{selectedResponse.answers?.q8_decision_role || '-'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Q9. Unaided Brand Recall</span>
                        <strong className="text-slate-800">
                          {Array.isArray(selectedResponse.answers?.q9_unaided)
                            ? selectedResponse.answers.q9_unaided.filter(Boolean).join(', ')
                            : '-'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Provider Relationships (Q10) */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block mb-1.5">
                    Provider Relationship Grid (Q10)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {selectedResponse.answers?.q10_grid ? (
                      Object.entries(selectedResponse.answers.q10_grid).map(([prov, rel]) => (
                        <div key={prov} className="bg-white px-2 py-1 rounded border border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="font-medium text-slate-700 truncate mr-1" title={prov}>{prov}</span>
                          <span className="font-bold text-slate-900 shrink-0">{rel}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400">No provider grid recorded.</span>
                    )}
                  </div>
                </div>

                {/* 4. Brand Deep-Dives (Q12–Q18) */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                    Brand Deep-Dives & CSAT / NPS (Q12–Q18)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedResponse.answers?.brand_evaluations ? (
                      Object.entries(selectedResponse.answers.brand_evaluations).map(([brand, ev]) => (
                        <div key={brand} className="bg-white p-2.5 rounded border border-slate-200 space-y-1 text-[11px]">
                          <div className="flex items-center justify-between border-b pb-1">
                            <strong className="font-black text-slate-900">{brand}</strong>
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded text-[10px]">
                              NPS: {ev.q17_nps ?? '-'}/10
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">CSAT: <strong>{ev.q16_csat || '-'}</strong></span>
                            <span className="text-slate-400">Source: {Array.isArray(ev.q12_sources) ? ev.q12_sources.join(', ') : '-'}</span>
                          </div>
                          {ev.q18_reason && (
                            <div className="text-[10px] bg-slate-50 p-1.5 rounded text-slate-600 italic">
                              "{ev.q18_reason}"
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400">No brand evaluations recorded.</span>
                    )}
                  </div>
                </div>

                {/* 5. KPC Ranking & Switching */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block mb-1">
                      Top 5 KPC Ranking (Q14)
                    </span>
                    <div className="space-y-1">
                      {Array.isArray(selectedResponse.answers?.q14_ranked_kpcs) && selectedResponse.answers.q14_ranked_kpcs.length > 0 ? (
                        selectedResponse.answers.q14_ranked_kpcs.map((kpc, i) => (
                          <div key={kpc} className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded border border-slate-100 text-[10px]">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                              #{i + 1}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">{kpc}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-400">No ranking data recorded.</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                    <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block">
                      Switching & Future Interest (Q22, Q26, Q29)
                    </span>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Switched in past 12m:</span>
                      <strong>{selectedResponse.answers?.q22_switched || 'No'}</strong>
                      {selectedResponse.answers?.q23_switched_from && (
                        <span className="text-slate-500 ml-1">from {selectedResponse.answers.q23_switched_from}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tutor vs Provider Brand Preference:</span>
                      <strong>{selectedResponse.answers?.q26_tutor_vs_brand || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">New Programmes of Interest:</span>
                      <div className="text-[10px] font-medium text-slate-700">
                        {Array.isArray(selectedResponse.answers?.q29_programmes)
                          ? selectedResponse.answers.q29_programmes.join('; ')
                          : '-'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-4 py-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-mono">Synced with local CSV</span>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="px-3 py-1 rounded-md bg-slate-900 text-white font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
