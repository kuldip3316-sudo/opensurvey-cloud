import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  Download,
  BookOpen,
  BarChart3,
  Layers,
  Sparkles,
  Info,
  Check,
  FileSpreadsheet,
  Copy,
  CheckCheck,
  Upload,
  Database,
  X,
  AlertCircle,
  FileUp,
  Trash2,
  UploadCloud,
  FolderPlus,
  FileText,
  PlusCircle,
  Printer,
  Plus,
  Edit2,
  PieChart,
  ClipboardPaste,
  FileCheck,
  HelpCircle,
  RefreshCw,
  Menu,
  ChevronDown,
  Save,
  Bookmark,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { STANDARD_BANNERS, SURVEY_QUESTIONS } from '../analytics/variablesCatalog';
import { computeCrosstab } from '../analytics/statsEngine';
import { exportSingleCrosstabToExcel, exportFullReportBookToExcel } from '../analytics/excelExporter';
import { parseUploadedSurveyFile, buildDynamicBannerFromQuestion, parseRawCsvOrTsvText, parseSupabaseSurveyDataset } from '../analytics/dynamicDatasetParser';

export default function TabulationStudio({ responses, onClose, onBackToSurvey, initialSurveyId }) {
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [selectedBannerId, setSelectedBannerId] = useState("");
  const [customBannerQuestionId, setCustomBannerQuestionId] = useState("");
  const [metricMode, setMetricMode] = useState("colPct"); // colPct | count | rowPct
  const [showSignificance, setShowSignificance] = useState(true);
  const [filterQualifiedOnly, setFilterQualifiedOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("single"); // single | deck | book
  const [copied, setCopied] = useState(false);

  // Column Deletion State
  const [deletedQuestionIds, setDeletedQuestionIds] = useState(new Set());
  
  // Column Renaming State (In-place Label Editing)
  const [renamedTitles, setRenamedTitles] = useState({});
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingTitleText, setEditingTitleText] = useState("");

  // Visualization Mode: 'table' vs 'chart'
  const [displayType, setDisplayType] = useState('table'); // table | chart

  // Direct Text / Paste Data Modal State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState("");

  // Studio Header Menu Dropdown State
  const [showMenu, setShowMenu] = useState(false);

  // Multi-Table Report Deck State
  const [reportDeck, setReportDeck] = useState([]);
  const [deckQuestionId, setDeckQuestionId] = useState("");
  const [deckBannerId, setDeckBannerId] = useState("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [deckNotification, setDeckNotification] = useState(null);

  // External Imported Dataset State - DEFAULT IS 'none' (Fresh Workspace / Blank on Refresh!)
  const [importedData, setImportedData] = useState(null); // { records, questions, banners, filename, totalRows }
  const [activeSource, setActiveSource] = useState('none'); // Starts 100% blank like fresh login!
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  // Supabase Cloud Ingestion & Saved Reports State
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supabaseSurveys, setSupabaseSurveys] = useState([]);
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(false);
  const [selectedSupabaseSurveyId, setSelectedSupabaseSurveyId] = useState(initialSurveyId || '');
  const [savedReports, setSavedReports] = useState([]);
  const [isSavedReportsOpen, setIsSavedReportsOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [reportTitleInput, setReportTitleInput] = useState('');
  const [reportDescInput, setReportDescInput] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [studioToast, setStudioToast] = useState(null);

  const isImported = activeSource === 'imported' && importedData !== null;
  const isBlank = activeSource === 'none';

  // Available Questions (filtered by deletedQuestionIds & with renamed titles)
  const availableQuestions = useMemo(() => {
    if (isBlank) return [];
    const base = isImported ? (importedData.questions || []) : SURVEY_QUESTIONS;
    return base
      .filter(q => !deletedQuestionIds.has(q.id))
      .map(q => ({
        ...q,
        title: renamedTitles[q.id] || q.title
      }));
  }, [isBlank, isImported, importedData, deletedQuestionIds, renamedTitles]);

  // Available Preset Banners (filtered by deletedQuestionIds)
  const availableBanners = useMemo(() => {
    if (isBlank) return [];
    const base = isImported ? (importedData.banners || []) : STANDARD_BANNERS;
    return base.filter(b => !deletedQuestionIds.has(b.id.replace('banner_', '')));
  }, [isBlank, isImported, importedData, deletedQuestionIds]);

  // Filter dataset: Qualified only vs All
  const dataset = useMemo(() => {
    if (isBlank) return [];
    if (isImported) {
      if (!importedData?.records) return [];
      if (filterQualifiedOnly) {
        const filtered = importedData.records.filter(r => {
          const s = String(r.status || r.Status || r.STATUS || '').toUpperCase();
          return s === 'QUALIFIED' || s === 'COMPLETE' || s === '1' || s === 'QUALIFIED_RESPONDENT';
        });
        return filtered.length > 0 ? filtered : importedData.records;
      }
      return importedData.records;
    }

    if (!responses) return [];
    if (filterQualifiedOnly) {
      return responses.filter(r => r.status === 'QUALIFIED');
    }
    return responses;
  }, [isBlank, isImported, importedData, responses, filterQualifiedOnly]);

  // Active Banner: Preset OR Dynamic Ad-hoc Question Banner
  const activeBanner = useMemo(() => {
    if (isBlank) return null;
    if (selectedBannerId === 'custom' && customBannerQuestionId) {
      const customQ = availableQuestions.find(q => q.id === customBannerQuestionId);
      if (customQ) {
        return buildDynamicBannerFromQuestion(customQ, dataset);
      }
    }
    const found = availableBanners.find(b => b.id === selectedBannerId);
    if (found) return found;
    if (availableBanners.length > 0) return availableBanners[0];
    return {
      id: 'total_only',
      name: 'Total',
      description: 'Overall Sample Total',
      columns: [{ id: 'total', label: 'Total', filterFn: () => true }]
    };
  }, [isBlank, selectedBannerId, customBannerQuestionId, availableQuestions, availableBanners, dataset]);

  // Active Question
  const activeQuestion = useMemo(() => {
    if (isBlank || availableQuestions.length === 0) return null;
    return availableQuestions.find(q => q.id === selectedQuestionId) || availableQuestions[0];
  }, [isBlank, availableQuestions, selectedQuestionId]);

  // Compute current single crosstab
  const crosstabResult = useMemo(() => {
    if (!activeQuestion || !activeBanner) return null;
    return computeCrosstab({
      data: dataset,
      rowExtractor: activeQuestion.extractor,
      rowCategories: activeQuestion.categories,
      bannerCols: activeBanner.columns,
      testSignificance: showSignificance
    });
  }, [dataset, activeQuestion, activeBanner, showSignificance]);

  // Multi-Table Report Deck Computed
  const reportDeckComputed = useMemo(() => {
    if (viewMode !== 'deck' || reportDeck.length === 0) return [];
    return reportDeck.map(item => {
      const q = availableQuestions.find(x => x.id === item.questionId) || item.question;
      let b = availableBanners.find(x => x.id === item.bannerId) || item.banner;
      if (!b) {
        const qAsBanner = availableQuestions.find(x => x.id === item.bannerId);
        if (qAsBanner) {
          b = buildDynamicBannerFromQuestion(qAsBanner, dataset);
        } else {
          b = activeBanner;
        }
      }
      const res = computeCrosstab({
        data: dataset,
        rowExtractor: q.extractor,
        rowCategories: q.categories,
        bannerCols: b?.columns || [{ id: 'total', label: 'Total', filterFn: () => true }],
        testSignificance: showSignificance
      });
      return {
        id: item.id,
        question: q,
        banner: b,
        metricMode: item.metricMode || 'colPct',
        displayType: item.displayType || 'table',
        crosstabResult: res
      };
    });
  }, [viewMode, reportDeck, availableQuestions, availableBanners, dataset, activeBanner, showSignificance]);

  // Compute all crosstabs for Full Report Book mode
  const allTablesResult = useMemo(() => {
    if (viewMode !== 'book' || !activeBanner) return [];
    return availableQuestions.map(q => {
      const res = computeCrosstab({
        data: dataset,
        rowExtractor: q.extractor,
        rowCategories: q.categories,
        bannerCols: activeBanner.columns,
        testSignificance: showSignificance
      });
      return { question: q, crosstabResult: res };
    });
  }, [viewMode, availableQuestions, dataset, activeBanner, showSignificance]);

  // Filter questions by search
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return availableQuestions;
    const q = searchQuery.toLowerCase();
    return availableQuestions.filter(item => 
      item.title.toLowerCase().includes(q) || (item.section && item.section.toLowerCase().includes(q))
    );
  }, [searchQuery, availableQuestions]);

  // Group questions by section
  const groupedQuestions = useMemo(() => {
    const groups = {};
    filteredQuestions.forEach(item => {
      const sec = item.section || 'General Variables';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(item);
    });
    return groups;
  }, [filteredQuestions]);

  // Process uploaded File (common for file picker & drag/drop)
  const processFile = async (file) => {
    if (!file) return;
    setIsLoadingFile(true);
    setUploadError(null);
    try {
      const parsed = await parseUploadedSurveyFile(file);
      setImportedData(parsed);
      setActiveSource('imported');
      if (parsed.questions?.length > 0) {
        setSelectedQuestionId(parsed.questions[0].id);
      }
      if (parsed.banners?.length > 0) {
        setSelectedBannerId(parsed.banners[0].id);
        setCustomBannerQuestionId('');
      } else if (parsed.questions?.length > 1) {
        setSelectedBannerId('custom');
        setCustomBannerQuestionId(parsed.questions[1].id);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setUploadError(err.message || 'Failed to parse survey file');
    } finally {
      setIsLoadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleClearDataset = () => {
    setActiveSource('none');
    setImportedData(null);
    setSelectedQuestionId('');
    setSelectedBannerId('');
    setCustomBannerQuestionId('');
  };

  const handleLoadDemoDataset = () => {
    setActiveSource('survey');
    setSelectedQuestionId('q16_zenith_csat');
    setSelectedBannerId('banner_gender');
    setCustomBannerQuestionId('');
  };

  // Variable In-place Renaming
  const handleStartRename = (q, e) => {
    if (e) e.stopPropagation();
    setEditingQuestionId(q.id);
    setEditingTitleText(q.title);
  };

  const handleSaveRename = (qId) => {
    if (editingTitleText.trim()) {
      setRenamedTitles(prev => ({
        ...prev,
        [qId]: editingTitleText.trim()
      }));
    }
    setEditingQuestionId(null);
    setEditingTitleText('');
  };

  const handleCancelRename = () => {
    setEditingQuestionId(null);
    setEditingTitleText('');
  };

  // Paste Data Handlers
  const handlePasteDataSubmit = () => {
    if (!pasteText.trim()) return;
    setIsLoadingFile(true);
    setUploadError(null);
    try {
      const parsed = parseRawCsvOrTsvText(pasteText, 'Pasted_Data.csv');
      setImportedData(parsed);
      setActiveSource('imported');
      if (parsed.questions?.length > 0) {
        setSelectedQuestionId(parsed.questions[0].id);
      }
      if (parsed.banners?.length > 0) {
        setSelectedBannerId(parsed.banners[0].id);
        setCustomBannerQuestionId('');
      } else if (parsed.questions?.length > 1) {
        setSelectedBannerId('custom');
        setCustomBannerQuestionId(parsed.questions[1].id);
      }
      setShowPasteModal(false);
      setPasteText('');
    } catch (err) {
      console.error('Paste parsing error:', err);
      setUploadError(err.message || 'Failed to parse pasted data.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Load Survey by ID & Parse Dataset
  const loadSurveyById = async (surveyId, list = supabaseSurveys) => {
    if (!surveyId) return;
    setIsLoadingSupabase(true);
    try {
      let surveysList = list;
      if (!surveysList || surveysList.length === 0) {
        const sRes = await fetch('/api/surveys');
        const sData = await sRes.json();
        if (sData.success && sData.surveys) {
          surveysList = sData.surveys;
          setSupabaseSurveys(sData.surveys);
        }
      }
      setSelectedSupabaseSurveyId(surveyId);
      const targetSurvey = surveysList.find(s => s.id === surveyId || s.slug === surveyId);
      if (!targetSurvey) return;

      const res = await fetch(`/api/supabase/responses?surveyId=${targetSurvey.id}`);
      const data = await res.json();
      const rawList = data.success ? data.responses : [];

      const parsed = parseSupabaseSurveyDataset(targetSurvey, rawList);
      setImportedData(parsed);
      setActiveSource('imported');
      if (parsed.questions?.length > 0) {
        setSelectedQuestionId(parsed.questions[0].id);
      }
      if (parsed.banners?.length > 0) {
        setSelectedBannerId(parsed.banners[0].id);
        setCustomBannerQuestionId('');
      } else if (parsed.questions?.length > 1) {
        setSelectedBannerId('custom');
        setCustomBannerQuestionId(parsed.questions[1].id);
      }
      // Also fetch saved reports for this survey
      fetchSavedReports(targetSurvey.id);
    } catch (err) {
      console.error('Error loading survey responses:', err);
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  const fetchSavedReports = async (surveyId) => {
    try {
      const sId = surveyId || selectedSupabaseSurveyId;
      const res = await fetch(`/api/reports${sId ? `?surveyId=${sId}` : ''}`);
      const data = await res.json();
      if (data.success && data.reports) {
        setSavedReports(data.reports);
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  };

  // Initial load effect for surveys and reports
  useEffect(() => {
    const initSurveys = async () => {
      try {
        const res = await fetch('/api/surveys');
        const data = await res.json();
        if (data.success && data.surveys) {
          setSupabaseSurveys(data.surveys);
          const target = initialSurveyId || (data.surveys.length > 0 ? data.surveys[0].id : null);
          if (target) {
            loadSurveyById(target, data.surveys);
          }
        }
      } catch (e) {
        console.error('Error fetching survey list:', e);
      }
    };
    initSurveys();
  }, [initialSurveyId]);

  // Save Current Table as a Saved Report
  const handleSaveReportTable = async (e) => {
    if (e) e.preventDefault();
    if (!reportTitleInput.trim()) return;
    setIsSubmittingReport(true);
    try {
      const config = {
        selectedQuestionId,
        selectedBannerId,
        customBannerQuestionId,
        metricMode,
        showSignificance,
        displayType,
        filterQualifiedOnly
      };
      const payload = {
        survey_id: selectedSupabaseSurveyId || (supabaseSurveys[0]?.id || null),
        title: reportTitleInput.trim(),
        description: reportDescInput.trim(),
        banner_question: activeBanner?.name || 'Standard Banner',
        table_config: config
      };
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setIsSaveModalOpen(false);
        setReportTitleInput('');
        setReportDescInput('');
        setStudioToast('Report table saved successfully!');
        setTimeout(() => setStudioToast(null), 3000);
        if (selectedSupabaseSurveyId) {
          fetchSavedReports(selectedSupabaseSurveyId);
        }
      } else {
        alert('Failed to save report: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Apply Saved Report to Workspace
  const handleApplySavedReport = (report) => {
    if (!report?.table_config) return;
    const cfg = report.table_config;
    if (cfg.selectedQuestionId) setSelectedQuestionId(cfg.selectedQuestionId);
    if (cfg.selectedBannerId) setSelectedBannerId(cfg.selectedBannerId);
    if (cfg.customBannerQuestionId !== undefined) setCustomBannerQuestionId(cfg.customBannerQuestionId);
    if (cfg.metricMode) setMetricMode(cfg.metricMode);
    if (cfg.showSignificance !== undefined) setShowSignificance(cfg.showSignificance);
    if (cfg.displayType) setDisplayType(cfg.displayType);
    if (cfg.filterQualifiedOnly !== undefined) setFilterQualifiedOnly(cfg.filterQualifiedOnly);
    setViewMode('single');
    setIsSavedReportsOpen(false);
    setStudioToast(`Restored saved table: "${report.title}"`);
    setTimeout(() => setStudioToast(null), 3000);
  };

  // Delete Saved Report
  const handleDeleteSavedReport = async (reportId, title) => {
    if (!window.confirm(`Delete saved report "${title}"?`)) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedReports(prev => prev.filter(r => r.id !== reportId));
        setStudioToast('Report table removed');
        setTimeout(() => setStudioToast(null), 2500);
      } else {
        alert('Failed to delete report: ' + data.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Supabase Cloud Dataset Modal Handlers
  const handleOpenSupabaseModal = async () => {
    setShowMenu(false);
    setShowSupabaseModal(true);
    setIsLoadingSupabase(true);
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      if (data.success && data.surveys) {
        setSupabaseSurveys(data.surveys);
        if (data.surveys.length > 0) {
          setSelectedSupabaseSurveyId(data.surveys[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching Supabase surveys:', err);
    } finally {
      setIsLoadingSupabase(false);
    }
  };

  const handleLoadSelectedSupabaseSurvey = async () => {
    if (!selectedSupabaseSurveyId) return;
    setShowSupabaseModal(false);
    loadSurveyById(selectedSupabaseSurveyId);
  };

  // Sample Template Download Helpers
  const downloadSampleQualtricsCsv = () => {
    const csv = `ResponseId,q1_age,q2_gender,q3_education,q4_satisfaction,q5_nps
Response ID,How old are you?,What is your gender?,Highest education level?,Overall satisfaction with service?,Likely to recommend?
{"ImportId":"_recordId"},{"ImportId":"QID1"},{"ImportId":"QID2"},{"ImportId":"QID3"},{"ImportId":"QID4"},{"ImportId":"QID5"}
RESP_001,16,Female,Secondary,Very satisfied,10
RESP_002,17,Male,Junior College,Satisfied,9
RESP_003,15,Male,Secondary,Neutral,7
RESP_004,18,Female,Junior College,Very satisfied,10
RESP_005,16,Female,Secondary,Dissatisfied,4
RESP_006,17,Female,Secondary,Very satisfied,10
RESP_007,18,Male,Junior College,Satisfied,8`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Qualtrics_3Row_Header_Template.csv';
    a.click();
  };

  const downloadSampleStandardCsv = () => {
    const csv = `respondent_id,age_group,gender,education_level,satisfaction_rating,nps_score
RESP_001,13-15,Female,Secondary,Very satisfied,9
RESP_002,16-17,Male,Junior College,Satisfied,8
RESP_003,18-19,Female,Junior College,Very satisfied,10
RESP_004,16-17,Male,Secondary,Neutral,6
RESP_005,13-15,Female,Secondary,Dissatisfied,4
RESP_006,16-17,Female,Junior College,Very satisfied,10
RESP_007,18-19,Male,Secondary,Satisfied,8`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Standard_Survey_Data_Template.csv';
    a.click();
  };

  const handleCopyClipboard = () => {
    if (!crosstabResult) return;
    let tsv = `Question: ${activeQuestion.title}\nBanner: ${activeBanner.name}\n\n`;
    tsv += `Categories\t` + crosstabResult.bannerCols.map(c => `[${c.letter}] ${c.label}`).join('\t') + '\n';
    tsv += `Base (N)\t` + crosstabResult.bannerCols.map(c => c.base).join('\t') + '\n';
    crosstabResult.rows.forEach(r => {
      const vals = r.colStats.map(s => {
        if (metricMode === 'count') return s.count;
        if (metricMode === 'rowPct') return `${s.rowPct.toFixed(1)}%`;
        const sig = s.sigLetters?.length ? ` (${s.sigLetters.map(l => l.letter).join('')})` : '';
        return `${s.colPct.toFixed(1)}%${sig}`;
      });
      tsv += `${r.label}\t` + vals.join('\t') + '\n';
    });
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportSingleExcel = () => {
    if (!crosstabResult) return;
    exportSingleCrosstabToExcel({
      crosstabResult,
      question: activeQuestion,
      bannerName: activeBanner.name,
      metricMode
    });
  };

  const handleExportFullBookExcel = () => {
    const tables = availableQuestions.map(q => ({
      question: q,
      crosstabResult: computeCrosstab({
        data: dataset,
        rowExtractor: q.extractor,
        rowCategories: q.categories,
        bannerCols: activeBanner.columns,
        testSignificance: showSignificance
      })
    }));
    exportFullReportBookToExcel({
      allTables: tables,
      bannerName: activeBanner.name,
      metricMode
    });
  };

  // Column Deletion Handlers
  const handleDeleteQuestion = (questionId, e) => {
    if (e) e.stopPropagation();
    setDeletedQuestionIds(prev => {
      const next = new Set(prev);
      next.add(questionId);
      return next;
    });

    // If deleted question was active, switch to another available question
    if (selectedQuestionId === questionId) {
      const remaining = availableQuestions.filter(q => q.id !== questionId);
      if (remaining.length > 0) {
        setSelectedQuestionId(remaining[0].id);
      }
    }
  };

  const handleRestoreAllQuestions = () => {
    setDeletedQuestionIds(new Set());
  };

  // Report Deck Handlers (Multi-table Stacked Report)
  const handleAddCurrentToDeck = () => {
    if (!activeQuestion || !activeBanner) return;
    const item = {
      id: `table_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionId: activeQuestion.id,
      question: activeQuestion,
      bannerId: selectedBannerId === 'custom' ? customBannerQuestionId : selectedBannerId,
      banner: activeBanner,
      metricMode: metricMode || 'colPct',
      displayType: displayType || 'table'
    };
    setReportDeck(prev => [...prev, item]);
    setDeckNotification(`Table added to Custom Report! Total: ${reportDeck.length + 1} tables`);
    setTimeout(() => setDeckNotification(null), 2500);
  };

  const handleAddQuickToDeck = (qId, bId) => {
    const q = availableQuestions.find(x => x.id === qId);
    if (!q) return;
    let b = availableBanners.find(x => x.id === bId);
    if (!b) {
      const qBanner = availableQuestions.find(x => x.id === bId);
      if (qBanner) b = buildDynamicBannerFromQuestion(qBanner, dataset);
      else b = activeBanner;
    }
    const item = {
      id: `table_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      questionId: q.id,
      question: q,
      bannerId: bId,
      banner: b,
      metricMode: metricMode || 'colPct',
      displayType: 'table'
    };
    setReportDeck(prev => [...prev, item]);
  };

  const handleUpdateDeckItemMetric = (itemId, newMetric) => {
    setReportDeck(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, metricMode: newMetric };
      }
      return item;
    }));
  };

  const handleUpdateDeckItemDisplayType = (itemId, newType) => {
    setReportDeck(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, displayType: newType };
      }
      return item;
    }));
  };

  const handleRemoveFromDeck = (tableId) => {
    setReportDeck(prev => prev.filter(item => item.id !== tableId));
  };

  const handleClearDeck = () => {
    setReportDeck([]);
  };

  // PDF Export Handler
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default || html2pdfModule;

      let targetId = 'single-crosstab-printable';
      if (viewMode === 'deck') targetId = 'report-deck-printable';
      if (viewMode === 'book') targetId = 'full-book-printable';

      let element = document.getElementById(targetId);
      if (!element) element = document.querySelector('main');

      const opt = {
        margin: [0.3, 0.3, 0.3, 0.3],
        filename: `Survey_Tabulation_${viewMode}_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error('PDF export error:', err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col text-xs">
      
      {/* Hidden File Input for Custom Survey Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
      />

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Could not parse data: {uploadError}</span>
          </div>
          <button onClick={() => setUploadError(null)} className="cursor-pointer text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* UNIFIED STUDIO TOOLBAR (No Duplicate Dark Header) */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-4 py-1.5 shadow-2xs sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2">
        
        {/* Left Section: Study Switcher + Banner Split Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Active Survey / Study Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg text-xs">
            <Database className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-slate-500 text-[10px] font-bold hidden sm:inline">Study:</span>
            <select
              value={selectedSupabaseSurveyId}
              onChange={(e) => loadSurveyById(e.target.value)}
              className="bg-transparent text-slate-800 font-bold text-xs focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[170px] truncate"
              title="Switch Active Survey Study"
            >
              <option value="" className="text-slate-400">Select Study...</option>
              {supabaseSurveys.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Banner Split Dropdown */}
          {!isBlank && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] hidden md:inline flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-600" />
                Banner:
              </span>
              <select
                value={selectedBannerId === 'custom' ? `q_${customBannerQuestionId}` : `b_${selectedBannerId}`}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith('b_')) {
                    setSelectedBannerId(val.replace('b_', ''));
                    setCustomBannerQuestionId('');
                  } else if (val.startsWith('q_')) {
                    setSelectedBannerId('custom');
                    setCustomBannerQuestionId(val.replace('q_', ''));
                  }
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 font-bold text-xs shadow-2xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden cursor-pointer max-w-[180px] sm:max-w-[260px] truncate"
                title="Cross-Tabulation Column Splits (Banner)"
              >
                <optgroup label="Standard Banners (Demographics & Key Metrics)">
                  <option value="b_total_only">📊 Total Sample Only (1 col)</option>
                  {availableBanners.map(banner => (
                    <option key={`b_${banner.id}`} value={`b_${banner.id}`}>
                      📊 {banner.name} ({banner.columns?.length || 1} cols)
                    </option>
                  ))}
                </optgroup>
                {availableQuestions.length > 0 && (
                  <optgroup label="Dynamic Question Banners">
                    {availableQuestions.map(q => (
                      <option key={`q_${q.id}`} value={`q_${q.id}`}>
                        ⚡ By: {q.title ? q.title.substring(0, 35) : q.id}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {/* Active Dataset Pill (If file uploaded) */}
          {isBlank ? null : isImported ? (
            <div className="hidden xl:flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-lg text-[11px]">
              <Database className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="font-bold truncate max-w-[100px]" title={importedData.filename}>
                {importedData.filename}
              </span>
              <button
                onClick={handleClearDataset}
                className="ml-1 px-1 py-0.2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-[10px] font-bold cursor-pointer"
                title="Clear dataset and reset"
              >
                ✕
              </button>
            </div>
          ) : null}

        </div>

        {/* Right Section: Display / Metric Toggles + Save Table + Reports + Options Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* Table vs Chart Mode Switcher */}
          {!isBlank && (
            <div className="hidden sm:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs">
              <button
                onClick={() => setDisplayType('table')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all ${
                  displayType === 'table' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
                title="Statistical cross-tabulation table"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setDisplayType('chart')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-all ${
                  displayType === 'chart' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
                title="Visual comparative bar chart"
              >
                <BarChart3 className="w-3 h-3" />
                <span>Chart</span>
              </button>
            </div>
          )}

          {/* Metric mode % vs Count */}
          {!isBlank && (
            <div className="hidden md:flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs">
              <button
                onClick={() => setMetricMode('colPct')}
                className={`px-2 py-0.5 rounded cursor-pointer ${metricMode === 'colPct' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
              >
                Col %
              </button>
              <button
                onClick={() => setMetricMode('count')}
                className={`px-2 py-0.5 rounded cursor-pointer ${metricMode === 'count' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
              >
                Count
              </button>
              <button
                onClick={() => setMetricMode('rowPct')}
                className={`px-2 py-0.5 rounded cursor-pointer ${metricMode === 'rowPct' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'hover:text-slate-900'}`}
              >
                Row %
              </button>
            </div>
          )}

          {/* Significance toggle */}
          {!isBlank && (
            <label className="hidden lg:flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer text-slate-700 select-none text-[11px]">
              <input
                type="checkbox"
                checked={showSignificance}
                onChange={e => setShowSignificance(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3"
              />
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Sig (p&lt;0.05)
              </span>
            </label>
          )}

          {/* View Mode Selector (Single Table / Deck / Book) */}
          <div className="hidden xl:flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('single')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${viewMode === 'single' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Single
            </button>
            <button
              onClick={() => setViewMode('deck')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${viewMode === 'deck' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Deck ({reportDeck.length})
            </button>
            <button
              onClick={() => setViewMode('book')}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${viewMode === 'book' ? 'bg-white shadow-2xs text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Full Book
            </button>
          </div>

          {/* Save Table Action Button */}
          <button
            onClick={() => {
              setReportTitleInput(activeQuestion ? `${activeQuestion.title.substring(0, 35)} by ${activeBanner?.name || 'Banner'}` : 'Custom Crosstab');
              setIsSaveModalOpen(true);
            }}
            disabled={isBlank || !activeQuestion}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-bold rounded-lg text-xs transition cursor-pointer disabled:opacity-40"
            title="Save this table view to your survey reports"
          >
            <Save className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Save Table</span>
          </button>

          {/* Saved Reports Drawer Trigger */}
          <button
            onClick={() => {
              fetchSavedReports(selectedSupabaseSurveyId);
              setIsSavedReportsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-lg text-xs transition cursor-pointer"
            title="View and restore saved report tables"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Reports</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px] font-mono">
              {savedReports.length}
            </span>
          </button>

          {/* Studio Options Dropdown (Data Ingestion + Exports) */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-xs"
              title="Studio Data Ingestion & Export Options"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Studio Menu</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Backdrop */}
            {showMenu && (
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity cursor-pointer"
                onClick={() => setShowMenu(false)}
              />
            )}

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="fixed right-2 sm:right-0 top-12 sm:top-full w-[90vw] sm:w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-3 space-y-3 animate-in fade-in duration-150 text-slate-200">
                
                {/* 1. DATA INGESTION */}
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1.5 flex items-center justify-between">
                    <span>Data Ingestion</span>
                    <span className="text-[10px] text-slate-500">{dataset.length} Rows</span>
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        fileInputRef.current?.click();
                      }}
                      disabled={isLoadingFile}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-transparent text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <FileUp className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-xs">📁 Import Survey File</span>
                      </div>
                      <span className="text-[10px] text-slate-400">.csv / .xlsx</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowPasteModal(true);
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 hover:border-indigo-500/40 border border-transparent text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ClipboardPaste className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-xs">📋 Paste Raw Data</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Clipboard</span>
                    </button>

                    <button
                      onClick={handleOpenSupabaseModal}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-600/20 hover:border-emerald-500/50 border border-emerald-800/50 text-emerald-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-xs">🌐 Load from Supabase Cloud</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">PostgreSQL</span>
                    </button>

                    {/* Base Filter Toggle */}
                    <button
                      onClick={() => {
                        setFilterQualifiedOnly(!filterQualifiedOnly);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer text-xs ${
                        filterQualifiedOnly
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Check className={`w-3.5 h-3.5 ${filterQualifiedOnly ? 'opacity-100' : 'opacity-0'}`} />
                        <span className="font-bold">Filter: Qualified Only</span>
                      </div>
                      <span className="text-[10px] font-bold">
                        {filterQualifiedOnly ? `Qualified (${dataset.length})` : `All (${dataset.length})`}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                {/* 2. EXPORT & DOWNLOAD */}
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                    Export & Save
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDownloadPdf();
                      }}
                      disabled={isGeneratingPdf || isBlank}
                      className="w-full text-left px-2.5 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50 text-xs"
                    >
                      <div className="flex items-center gap-2 font-bold">
                        <Printer className="w-4 h-4 text-red-400" />
                        <span>{isGeneratingPdf ? 'Generating PDF...' : '📄 Save as PDF'}</span>
                      </div>
                      <span className="text-[10px] text-red-400/80">Print / PDF</span>
                    </button>

                    {viewMode === 'single' ? (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleExportSingleExcel();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>Export (.xlsx)</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80">Excel Sheet</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          handleExportFullBookExcel();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 hover:text-white flex items-center justify-between transition-colors cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <Download className="w-4 h-4 text-emerald-400" />
                          <span>Export Book (.xlsx)</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80">Multi-Sheet</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Dataset Clear Option if active */}
                {!isBlank && (
                  <>
                    <div className="h-px bg-slate-800" />
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleClearDataset();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Dataset & Start Fresh</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Variables Palette */}
        {!isBlank && viewMode === 'single' && (
          <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
            <div className="p-2.5 border-b border-slate-200 bg-slate-50/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search questions (e.g. NPS, Tutor, Math)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>
            </div>

            {/* Deleted Columns Notification / Restore Bar */}
            {deletedQuestionIds.size > 0 && (
              <div className="p-2 bg-red-50 border-b border-red-200 flex items-center justify-between text-red-700 text-[11px] shrink-0">
                <span className="font-semibold">
                  <strong>{deletedQuestionIds.size}</strong> column{deletedQuestionIds.size > 1 ? 's' : ''} deleted
                </span>
                <button
                  onClick={handleRestoreAllQuestions}
                  className="underline font-bold text-red-800 hover:text-red-950 cursor-pointer"
                  title="Restore all deleted columns"
                >
                  Restore All
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-3">
              {Object.entries(groupedQuestions).map(([section, questions]) => (
                <div key={section} className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
                    <span>{section}</span>
                    <span className="text-[9px] font-normal text-slate-400">({questions.length})</span>
                  </div>
                  <div className="space-y-0.5">
                    {questions.map(q => {
                      const isSel = q.id === selectedQuestionId;
                      const isEditing = editingQuestionId === q.id;

                      if (isEditing) {
                        return (
                          <div key={q.id} className="flex items-center gap-1 p-1 bg-blue-50 rounded-lg border border-blue-300 w-full">
                            <input
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(q.id);
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              autoFocus
                              className="flex-1 px-1.5 py-0.5 text-xs bg-white border border-blue-400 rounded outline-hidden text-slate-800"
                            />
                            <button
                              onClick={() => handleSaveRename(q.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 rounded cursor-pointer"
                              title="Save label"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-1 text-slate-400 hover:bg-slate-200 rounded cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={q.id} className="group relative flex items-center">
                          <button
                            onClick={() => setSelectedQuestionId(q.id)}
                            className={`w-full text-left pl-2.5 pr-14 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSel
                                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span className="truncate mr-1" title={q.title}>{q.title}</span>
                            <span className={`text-[9px] px-1 py-0.2 rounded font-mono uppercase shrink-0 ${
                              isSel ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {(q.type || 'variable').replace('_', ' ')}
                            </span>
                          </button>
                          
                          <div className="absolute right-1 flex items-center gap-0.5">
                            {/* Rename Button */}
                            <button
                              onClick={(e) => handleStartRename(q, e)}
                              className={`p-1 rounded transition-all cursor-pointer ${
                                isSel
                                  ? 'text-blue-200 hover:text-white hover:bg-blue-700'
                                  : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                              }`}
                              title="Rename this variable label"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Column Delete Button */}
                            <button
                              onClick={(e) => handleDeleteQuestion(q.id, e)}
                              className={`p-1 rounded transition-all cursor-pointer ${
                                isSel
                                  ? 'text-blue-200 hover:text-white hover:bg-red-600'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                              }`}
                              title={`Delete '${q.title}' column from survey`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Center Stage: Interactive Crosstab Grid */}
        <main className="flex-1 p-4 overflow-y-auto bg-slate-100/70">
          {isBlank ? (
            /* Blank Canvas / Enterprise Workspace Launchpad */
            <div className="max-w-4xl mx-auto my-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fresh Analysis Workspace</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Welcome to Q-Tabulation Studio
                </h1>
                <p className="text-slate-500 text-xs max-w-lg mx-auto leading-relaxed">
                  Start fresh by adding your survey data. Upload a file (.csv / .xlsx) or paste tabular rows directly from clipboard to run statistical cross-tabs and export PDF decks.
                </p>
              </div>

              {/* Main Ingestion Gateways */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {/* Gateway 1: Upload File */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all cursor-pointer text-center flex flex-col items-center justify-between space-y-4 shadow-xs group hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-7 h-7 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900">Upload Survey File</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Drag & drop or browse <code>.csv</code> or <code>.xlsx</code> with 1-row or Qualtrics 3-row headers.
                    </p>
                  </div>
                  <button
                    disabled={isLoadingFile}
                    className="w-full py-2 bg-blue-600 group-hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>{isLoadingFile ? 'Parsing...' : 'Browse File (.csv / .xlsx)'}</span>
                  </button>
                </div>

                {/* Gateway 2: Direct Paste Clipboard Data */}
                <div
                  onClick={() => setShowPasteModal(true)}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all cursor-pointer text-center flex flex-col items-center justify-between space-y-4 shadow-xs group hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <ClipboardPaste className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-slate-900">Paste Data Directly</h3>
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      Copy tabular cells from Excel or Google Sheets and paste here directly without saving a file.
                    </p>
                  </div>
                  <button
                    className="w-full py-2 bg-indigo-600 group-hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>Paste Raw Text / TSV</span>
                  </button>
                </div>
              </div>

              {/* Sample Templates & Download Links */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700 font-bold text-xs">Need an example dataset format?</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={downloadSampleQualtricsCsv}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Download Qualtrics 3-row header template CSV"
                  >
                    <Download className="w-3 h-3 text-blue-600" />
                    <span>Qualtrics 3-Row Header (.csv)</span>
                  </button>
                  <button
                    onClick={downloadSampleStandardCsv}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    title="Download clean standard survey template CSV"
                  >
                    <Download className="w-3 h-3 text-emerald-600" />
                    <span>Standard 1-Row CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left text-xs">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-blue-600 font-black flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>Auto Detection</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Auto-detects Qualtrics 3-row headers or single-row CSV/Excel, categorizing variables, rating scales, and NPS metrics.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-indigo-600 font-black flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Any Row × Any Column</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Pick ANY question as the column banner with 95% confidence Z-test significance lettering ([A], [B], [C]...).
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-emerald-600 font-black flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excel & PDF Report Export</span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    Export individual crosstabs, stacked custom multi-table PDF decks, or complete multi-sheet Excel books.
                  </p>
                </div>
              </div>
            </div>
          ) : viewMode === 'single' ? (
            crosstabResult && activeQuestion && activeBanner ? (
              <div id="single-crosstab-printable" className="max-w-6xl mx-auto space-y-4">
                
                {/* Notification Toast when a table is added to deck */}
                {deckNotification && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl flex items-center justify-between font-bold text-xs shadow-xs">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-indigo-600" />
                      <span>{deckNotification}</span>
                    </div>
                    <button
                      onClick={() => setViewMode('deck')}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                    >
                      View Custom Report ({reportDeck.length}) →
                    </button>
                  </div>
                )}

                {/* Table Header Card */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-bold text-[10px] uppercase">
                          {activeQuestion.section || 'Variable'}
                        </span>
                        <span className="text-slate-400 text-xs">•</span>
                        <span className="text-slate-500 font-semibold text-xs">
                          Banner: <strong>{activeBanner.name}</strong>
                        </span>
                      </div>
                      <h2 className="text-base font-black text-slate-900 leading-tight">
                        {activeQuestion.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Add to Custom Report Deck Button */}
                      <button
                        onClick={handleAddCurrentToDeck}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs text-xs"
                        title="Add this cross-tabulation table to your multi-table custom report"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>➕ Add Table to Report</span>
                      </button>

                      <button
                        onClick={handleCopyClipboard}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Copy table formatted as TSV for Excel"
                      >
                        {copied ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy Table</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Executive Insight Chips */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 text-xs">
                    {crosstabResult.summary.hasNps && crosstabResult.summary.npsByCol && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-full font-bold text-[11px]">
                        <span>🚀 Net Promoter Score:</span>
                        <span className="font-mono font-black text-indigo-700">
                          {crosstabResult.summary.npsByCol[0] > 0 ? `+${crosstabResult.summary.npsByCol[0]}` : crosstabResult.summary.npsByCol[0]}
                        </span>
                      </div>
                    )}
                    {crosstabResult.summary.hasMean && crosstabResult.summary.meanByCol && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-full font-bold text-[11px]">
                        <span>⭐ Overall Mean:</span>
                        <span className="font-mono font-black text-amber-700">
                          {crosstabResult.summary.meanByCol[0]?.toFixed(2)} / 5.0
                        </span>
                      </div>
                    )}
                    {crosstabResult.rows.length >= 3 && crosstabResult.rows.some(r => r.label.toLowerCase().includes('satisfied') || r.label.toLowerCase().includes('agree') || r.label.toLowerCase().includes('likely')) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-full font-bold text-[11px]">
                        <span>👍 Top 2 Box (Favourable):</span>
                        <span className="font-mono font-black text-emerald-700">
                          {((crosstabResult.rows[0]?.colStats[0]?.colPct || 0) + (crosstabResult.rows[1]?.colStats[0]?.colPct || 0)).toFixed(1)}%
                        </span>
                      </div>
                    )}
                    <span className="text-[10px] text-slate-400 ml-auto">
                      Base N = {crosstabResult.bannerCols[0]?.base || 0}
                    </span>
                  </div>
                </div>

                {/* Conditional Rendering: Visual Chart vs Statistical Table */}
                {displayType === 'chart' ? (
                  /* Interactive Comparative Visual Bar Chart */
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-xs">Visual Category Breakdown across Banner Columns</span>
                      </div>
                      {/* Color Legend */}
                      <div className="flex items-center gap-3 flex-wrap text-[11px] font-semibold">
                        {crosstabResult.bannerCols.map((col, cIdx) => {
                          const colors = ['#2563eb', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea'];
                          const color = colors[cIdx % colors.length];
                          return (
                            <div key={col.id} className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-xs" style={{ backgroundColor: color }} />
                              <span className="text-slate-700 font-bold">{col.label}</span>
                              <span className="text-slate-400 text-[10px]">({col.base})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {crosstabResult.rows.map((row) => (
                        <div key={row.id} className="space-y-2 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span>{row.label}</span>
                            <span className="text-slate-500 font-normal text-[11px]">
                              Total N: <strong>{row.colStats[0]?.count || 0}</strong>
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-0.5">
                            {row.colStats.map((stat, cIdx) => {
                              const col = crosstabResult.bannerCols[cIdx];
                              const colors = ['#2563eb', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea'];
                              const color = colors[cIdx % colors.length];
                              const pct = stat.colPct;
                              return (
                                <div key={cIdx} className="flex items-center gap-2 text-xs">
                                  <span className="w-24 text-[11px] text-slate-500 truncate font-semibold" title={col.label}>
                                    {col.label}:
                                  </span>
                                  <div className="flex-1 bg-slate-200/80 rounded-full h-4 overflow-hidden relative">
                                    <div
                                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                                      style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: color }}
                                    >
                                      {pct > 10 && (
                                        <span className="text-[10px] font-black text-white leading-none">
                                          {pct.toFixed(1)}%
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="w-12 text-right font-mono font-bold text-slate-700 text-xs">
                                    {pct.toFixed(1)}%
                                  </span>
                                  {stat.sigLetters?.length > 0 && showSignificance && (
                                    <span className="px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                                      {stat.sigLetters.map(s => s.letter).join('')}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* The Cross-Tab Table */
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs">
                        
                        {/* Banner Header: Columns & Letters */}
                        <thead>
                          <tr className="bg-slate-800 text-white font-bold">
                            <th className="py-2.5 px-4 w-2/5 border-r border-slate-700">
                              Response Options / Categories
                            </th>
                            {crosstabResult.bannerCols.map((col, idx) => (
                              <th key={col.id} className="py-2.5 px-3 text-center border-r border-slate-700 last:border-r-0">
                                <div className="text-[10px] text-blue-300 font-mono font-normal">
                                  [{col.letter}]
                                </div>
                                <div className="truncate font-black">{col.label}</div>
                              </th>
                            ))}
                          </tr>

                          {/* Base Row (Total Respondents) */}
                          <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <td className="py-2 px-4 border-r border-slate-200 flex items-center gap-1.5">
                              <Info className="w-3 h-3 text-slate-400" />
                              <span>Base (Total N)</span>
                            </td>
                            {crosstabResult.bannerCols.map(col => (
                              <td key={col.id} className="py-2 px-3 text-center font-mono font-bold text-slate-900 border-r border-slate-200 last:border-r-0">
                                {col.base}
                              </td>
                            ))}
                          </tr>
                        </thead>

                        {/* Question Response Rows */}
                        <tbody className="divide-y divide-slate-100">
                          {crosstabResult.rows.map((r, rIdx) => {
                            const maxColPct = Math.max(...r.colStats.map(s => s.colPct));

                            return (
                              <tr
                                key={r.id}
                                className={`hover:bg-slate-50/80 transition-colors ${
                                  rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                }`}
                              >
                                <td className="py-2.5 px-4 font-semibold text-slate-800 border-r border-slate-100">
                                  {r.label}
                                </td>

                                {r.colStats.map((stat, cIdx) => {
                                  const hasSig = stat.sigLetters && stat.sigLetters.length > 0;
                                  const isTopValue = stat.colPct === maxColPct && stat.colPct > 0;

                                  return (
                                    <td
                                      key={cIdx}
                                      className={`py-2 px-3 text-center font-mono border-r border-slate-100 last:border-r-0 relative transition-colors ${
                                        isTopValue && metricMode === 'colPct' ? 'bg-blue-50/50' : ''
                                      }`}
                                    >
                                      <div className="flex items-center justify-center gap-1">
                                        <span className={`font-bold ${isTopValue ? 'text-blue-900' : 'text-slate-800'}`}>
                                          {metricMode === 'count'
                                            ? stat.count
                                            : metricMode === 'rowPct'
                                            ? `${stat.rowPct.toFixed(1)}%`
                                            : `${stat.colPct.toFixed(1)}%`}
                                        </span>

                                        {/* Statistical Significance Letter Tags */}
                                        {showSignificance && metricMode === 'colPct' && hasSig && (
                                          <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black text-[10px] tracking-tight">
                                            {stat.sigLetters.map(s => s.letter).join('')}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>

                        {/* Summary Metrics Footer: Mean Rating or Net NPS */}
                        {(crosstabResult.summary.hasMean || crosstabResult.summary.hasNps) && (
                          <tfoot>
                            {crosstabResult.summary.hasMean && crosstabResult.summary.meanByCol && (
                              <tr className="bg-amber-50/70 border-t-2 border-amber-200 font-bold text-amber-900">
                                <td className="py-2 px-4 border-r border-amber-200">
                                  ⭐ Mean Rating (Scale 1–5)
                                </td>
                                {crosstabResult.summary.meanByCol.map((m, idx) => (
                                  <td key={idx} className="py-2 px-3 text-center font-mono text-xs font-black border-r border-amber-200 last:border-r-0">
                                    {m !== null ? m.toFixed(2) : '-'}
                                  </td>
                                ))}
                              </tr>
                            )}

                            {crosstabResult.summary.hasNps && crosstabResult.summary.npsByCol && (
                              <tr className="bg-indigo-50/70 border-t-2 border-indigo-200 font-bold text-indigo-900">
                                <td className="py-2 px-4 border-r border-indigo-200">
                                  🚀 Net Promoter Score (NPS)
                                </td>
                                {crosstabResult.summary.npsByCol.map((n, idx) => (
                                  <td key={idx} className="py-2 px-3 text-center font-mono text-xs font-black border-r border-indigo-200 last:border-r-0">
                                    {n !== null ? `${n > 0 ? '+' : ''}${n}` : '-'}
                                  </td>
                                ))}
                              </tr>
                            )}
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* Significance Legend Note */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      <strong>Statistical Significance:</strong> Letters in brackets (e.g. <code>b</code>, <code>C</code>) indicate that the column percentage is significantly higher than the corresponding lettered column at 95% confidence level (two-tailed pooled proportion Z-test, <i>p &lt; 0.05</i>).
                    </span>
                  </div>
                  <span className="font-mono text-slate-400">Tested: Q-Engine v1.0</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-slate-400 bg-white rounded-xl border border-slate-200 shadow-2xs">
                <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">No cross-tabulation table available</p>
                <p className="text-xs text-slate-400 mt-1">Please select a question from the left sidebar or import a dataset.</p>
              </div>
            )
          ) : viewMode === 'deck' ? (
            /* Custom Stacked Multi-Table Report View: Scrollable Deck */
            <div id="report-deck-printable" className="max-w-6xl mx-auto space-y-6">
              {/* Deck Control Bar */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[10px] uppercase">
                      Custom Stacked Report
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-500 font-semibold text-xs">
                      {reportDeck.length} {reportDeck.length === 1 ? 'Table' : 'Tables'} in Deck
                    </span>
                  </div>
                  <h2 className="text-base font-black text-slate-900 leading-tight">
                    Multi-Table Tabulation Report
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Scroll below to view all stacked tables. Click "Save as PDF" to download the complete report as a PDF file.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Save Report as PDF Button */}
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf || reportDeck.length === 0}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors text-xs"
                    title="Download this stacked multi-table report as a PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isGeneratingPdf ? 'Generating PDF...' : '📄 Save Report as PDF'}</span>
                  </button>

                  {reportDeck.length > 0 && (
                    <button
                      onClick={handleClearDeck}
                      className="px-2.5 py-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer text-xs flex items-center gap-1"
                      title="Clear all tables from this report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear Deck</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Add Table to Report Bar */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-indigo-950 text-xs">Add Another Table to Report:</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-1 max-w-2xl justify-end">
                  {/* Select Question */}
                  <select
                    value={deckQuestionId}
                    onChange={(e) => setDeckQuestionId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-slate-800 text-xs font-semibold max-w-[260px] truncate cursor-pointer"
                  >
                    <option value="">Choose Question / Row...</option>
                    {availableQuestions.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.title.length > 45 ? q.title.substring(0, 42) + '...' : q.title}
                      </option>
                    ))}
                  </select>

                  {/* Select Banner */}
                  <select
                    value={deckBannerId}
                    onChange={(e) => setDeckBannerId(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-slate-800 text-xs font-semibold max-w-[220px] truncate cursor-pointer"
                  >
                    <option value="">Choose Banner / Columns...</option>
                    <optgroup label="Standard Banners">
                      {availableBanners.map(b => (
                        <option key={b.id} value={b.id}>
                          📊 {b.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Survey Questions">
                      {availableQuestions.map(q => (
                        <option key={q.id} value={q.id}>
                          🔀 {q.title.length > 35 ? q.title.substring(0, 32) + '...' : q.title}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  <button
                    onClick={() => {
                      if (deckQuestionId && deckBannerId) {
                        handleAddQuickToDeck(deckQuestionId, deckBannerId);
                        setDeckQuestionId('');
                        setDeckBannerId('');
                      }
                    }}
                    disabled={!deckQuestionId || !deckBannerId}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Table</span>
                  </button>
                </div>
              </div>

              {/* Empty Deck State */}
              {reportDeck.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-300 space-y-4 shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
                    <Layers className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-md mx-auto">
                    <h3 className="font-black text-base text-slate-800">Your Custom Report Deck is Empty</h3>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      You can stack multiple tables one below another to create a complete custom report and scroll through them all. Add tables using the bar above, or go to the <strong>Interactive Table</strong> tab and click <strong>"➕ Add Table to Report"</strong>.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleAddCurrentToDeck();
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Current Table ({activeQuestion?.title?.substring(0, 25)}...)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Stacked Tables Rendered Vertically in Sequence */
                <div className="space-y-6">
                  {reportDeckComputed.map((deckItem, idx) => {
                    const { id: itemId, question: q, banner: b, crosstabResult: tableRes } = deckItem;
                    if (!tableRes || !q || !b) return null;

                    return (
                      <div
                        key={itemId}
                        className="table-report-card bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
                      >
                        {/* Table Card Header */}
                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                                  {q.section || 'Variable'}
                                </span>
                                <span className="text-slate-400 text-xs">•</span>
                                <span className="text-slate-500 font-semibold text-xs">
                                  Banner: <strong>{b.name}</strong>
                                </span>
                              </div>
                              <h3 className="text-sm font-black text-slate-900 leading-snug">
                                {q.title}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Per-Table Metric Switcher: Column %, Count (N), Row % */}
                            <div className="flex bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
                              <button
                                onClick={() => handleUpdateDeckItemMetric(itemId, 'colPct')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  deckItem.metricMode === 'colPct'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                                title="Show Column Percentages for this table"
                              >
                                Column %
                              </button>
                              <button
                                onClick={() => handleUpdateDeckItemMetric(itemId, 'count')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  deckItem.metricMode === 'count'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                                title="Show Counts (N) for this table"
                              >
                                Count (N)
                              </button>
                              <button
                                onClick={() => handleUpdateDeckItemMetric(itemId, 'rowPct')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                                  deckItem.metricMode === 'rowPct'
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                                title="Show Row Percentages for this table"
                              >
                                Row %
                              </button>
                            </div>

                            {/* Per-Table View Toggle: Table vs Visual Bar Chart */}
                            <div className="flex bg-white rounded-lg p-0.5 border border-slate-300 shadow-2xs">
                              <button
                                onClick={() => handleUpdateDeckItemDisplayType(itemId, 'table')}
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  deckItem.displayType === 'table' ? 'bg-slate-800 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                }`}
                                title="Standard Crosstab Table View"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateDeckItemDisplayType(itemId, 'chart')}
                                className={`p-1 rounded-md transition-all cursor-pointer ${
                                  deckItem.displayType === 'chart' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                }`}
                                title="Visual Comparative Bar Chart View"
                              >
                                <PieChart className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Remove from report */}
                            <button
                              onClick={() => handleRemoveFromDeck(itemId)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove this table from the report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Card Content: Visual Chart or Crosstab Table */}
                        {deckItem.displayType === 'chart' ? (
                          <div className="p-4 space-y-4 bg-white">
                            <div className="space-y-3">
                              {tableRes.rows.map((row) => (
                                <div key={row.id} className="space-y-1.5 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                                    <span>{row.label}</span>
                                    <span className="text-slate-500 font-normal text-[11px]">
                                      Total N: <strong>{row.colStats[0]?.count || 0}</strong>
                                    </span>
                                  </div>
                                  <div className="space-y-1 pt-0.5">
                                    {row.colStats.map((stat, cIdx) => {
                                      const col = tableRes.bannerCols[cIdx];
                                      const colors = ['#2563eb', '#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#9333ea'];
                                      const color = colors[cIdx % colors.length];
                                      const val = deckItem.metricMode === 'count' ? stat.count : stat.colPct;
                                      const maxVal = deckItem.metricMode === 'count' ? Math.max(...row.colStats.map(s => s.count), 1) : 100;
                                      const widthPct = Math.max((val / maxVal) * 100, 3);
                                      return (
                                        <div key={cIdx} className="flex items-center gap-2 text-xs">
                                          <span className="w-20 text-[10px] text-slate-500 truncate font-semibold" title={col.label}>
                                            {col.label}:
                                          </span>
                                          <div className="flex-1 bg-slate-200/80 rounded-full h-3.5 overflow-hidden relative">
                                            <div
                                              className="h-full rounded-full transition-all duration-300 flex items-center justify-end pr-1.5"
                                              style={{ width: `${widthPct}%`, backgroundColor: color }}
                                            >
                                              {widthPct > 15 && (
                                                <span className="text-[9px] font-black text-white leading-none">
                                                  {deckItem.metricMode === 'count' ? val : `${val.toFixed(1)}%`}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <span className="w-12 text-right font-mono font-bold text-slate-700 text-xs">
                                            {deckItem.metricMode === 'count' ? val : `${val.toFixed(1)}%`}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          /* Crosstab Grid */
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-xs">
                              <thead>
                                <tr className="bg-slate-800 text-white font-bold">
                                  <th className="py-2 px-4 w-2/5 border-r border-slate-700">Options / Categories</th>
                                  {tableRes.bannerCols.map(col => (
                                    <th key={col.id} className="py-2 px-3 text-center border-r border-slate-700 last:border-r-0">
                                      <span className="text-blue-300 font-mono text-[10px]">[{col.letter}]</span> {col.label}
                                    </th>
                                  ))}
                                </tr>
                                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                  <td className="py-1.5 px-4 border-r border-slate-200">Base (Total N)</td>
                                  {tableRes.bannerCols.map(col => (
                                    <td key={col.id} className="py-1.5 px-3 text-center font-mono text-slate-900 border-r border-slate-200 last:border-r-0">
                                      {col.base}
                                    </td>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {tableRes.rows.map((r, rIdx) => (
                                  <tr key={r.id} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                                    <td className="py-1.5 px-4 font-semibold text-slate-800 border-r border-slate-100">
                                      {r.label}
                                    </td>
                                    {r.colStats.map((stat, cIdx) => (
                                      <td key={cIdx} className="py-1.5 px-3 text-center font-mono border-r border-slate-100 last:border-r-0">
                                        <span className="font-bold text-slate-900">
                                          {deckItem.metricMode === 'count'
                                            ? stat.count
                                            : deckItem.metricMode === 'rowPct'
                                            ? `${stat.rowPct.toFixed(1)}%`
                                            : `${stat.colPct.toFixed(1)}%`}
                                        </span>
                                        {showSignificance && deckItem.metricMode === 'colPct' && stat.sigLetters?.length > 0 && (
                                          <span className="ml-1 px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                                            {stat.sigLetters.map(s => s.letter).join('')}
                                          </span>
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                              {tableRes.summary.hasMean && tableRes.summary.meanByCol && (
                                <tfoot>
                                  <tr className="bg-amber-50 font-bold text-amber-900 border-t border-amber-200">
                                    <td className="py-1.5 px-4 border-r border-amber-200">Mean Rating (1–5)</td>
                                    {tableRes.summary.meanByCol.map((m, mIdx) => (
                                      <td key={mIdx} className="py-1.5 px-3 text-center font-mono text-xs border-r border-amber-200 last:border-r-0">
                                        {m !== null ? m.toFixed(2) : '-'}
                                      </td>
                                    ))}
                                  </tr>
                                </tfoot>
                              )}
                              {tableRes.summary.hasNps && tableRes.summary.npsByCol && (
                                <tfoot>
                                  <tr className="bg-indigo-50 font-bold text-indigo-900 border-t border-indigo-200">
                                    <td className="py-1.5 px-4 border-r border-indigo-200">Net Promoter Score (NPS)</td>
                                    {tableRes.summary.npsByCol.map((n, nIdx) => (
                                      <td key={nIdx} className="py-1.5 px-3 text-center font-mono text-xs border-r border-indigo-200 last:border-r-0">
                                        {n !== null ? `${n > 0 ? '+' : ''}${n}` : '-'}
                                      </td>
                                    ))}
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Full Report Book View: Scrollable Deck of All 18+ Tables */
            <div id="full-book-printable" className="max-w-6xl mx-auto space-y-8">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {isImported ? importedData.filename : 'Singapore Student Survey'} — Full Crosstab Report Book
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Tabulated across banner: <strong>{activeBanner.name}</strong> • Base: {dataset.length} respondents
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors text-xs"
                    title="Download full book as PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isGeneratingPdf ? 'Generating PDF...' : '📄 Save as PDF'}</span>
                  </button>
                  <button
                    onClick={handleExportFullBookExcel}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              {allTablesResult.map(({ question, crosstabResult: tableRes }) => {
                if (!tableRes) return null;
                return (
                <div key={question.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                        {question.section}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {question.title}
                      </h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-800 text-white font-bold">
                          <th className="py-2 px-4 w-2/5 border-r border-slate-700">Options</th>
                          {tableRes.bannerCols.map(col => (
                            <th key={col.id} className="py-2 px-3 text-center border-r border-slate-700 last:border-r-0">
                              <span className="text-blue-300 font-mono text-[10px]">[{col.letter}]</span> {col.label}
                            </th>
                          ))}
                        </tr>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <td className="py-1.5 px-4 border-r border-slate-200">Base (N)</td>
                          {tableRes.bannerCols.map(col => (
                            <td key={col.id} className="py-1.5 px-3 text-center font-mono text-slate-900 border-r border-slate-200 last:border-r-0">
                              {col.base}
                            </td>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {tableRes.rows.map((r, rIdx) => (
                          <tr key={r.id} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                            <td className="py-1.5 px-4 font-semibold text-slate-800 border-r border-slate-100">
                              {r.label}
                            </td>
                            {r.colStats.map((stat, cIdx) => (
                              <td key={cIdx} className="py-1.5 px-3 text-center font-mono border-r border-slate-100 last:border-r-0">
                                <span className="font-bold text-slate-900">
                                  {metricMode === 'count' ? stat.count : `${stat.colPct.toFixed(1)}%`}
                                </span>
                                {showSignificance && metricMode === 'colPct' && stat.sigLetters?.length > 0 && (
                                  <span className="ml-1 px-1 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">
                                    {stat.sigLetters.map(s => s.letter).join('')}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      {tableRes.summary.hasMean && tableRes.summary.meanByCol && (
                        <tfoot>
                          <tr className="bg-amber-50 font-bold text-amber-900 border-t border-amber-200">
                            <td className="py-1.5 px-4 border-r border-amber-200">Mean (1-5)</td>
                            {tableRes.summary.meanByCol.map((m, idx) => (
                              <td key={idx} className="py-1.5 px-3 text-center font-mono text-xs border-r border-amber-200 last:border-r-0">
                                {m !== null ? m.toFixed(2) : '-'}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </main>
      </div>

      {/* Paste Data Direct Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardPaste className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Paste Survey Data Directly</h3>
                  <p className="text-[11px] text-slate-500">Copy cells directly from Excel or Google Sheets and paste here</p>
                </div>
              </div>
              <button
                onClick={() => { setShowPasteModal(false); setPasteText(''); }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <textarea
                rows={9}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`Paste your CSV or tab-delimited Excel rows here...\n\nExample:\nrespondent_id\tage_group\tgender\tsatisfaction\nRESP_001\t16-17\tFemale\tVery satisfied\nRESP_002\t13-15\tMale\tSatisfied\nRESP_003\t18-19\tFemale\tNeutral`}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden resize-none bg-slate-50/50 text-slate-800"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  {pasteText.trim() ? `✓ ${pasteText.trim().split('\n').length} row(s) ready to parse` : 'Waiting for pasted content...'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setShowPasteModal(false); setPasteText(''); }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasteDataSubmit}
                    disabled={!pasteText.trim() || isLoadingFile}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-lg cursor-pointer text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLoadingFile ? 'Parsing...' : 'Analyze & Cross-Tabulate'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Cloud Live Survey Ingestion Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Load Live Survey from Supabase</h3>
                  <p className="text-[11px] text-slate-500">Connect to PostgreSQL database and fetch real-time respondent data</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {isLoadingSupabase ? (
                <div className="py-8 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Connecting to Cloud Database...</p>
                </div>
              ) : supabaseSurveys.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed rounded-xl bg-slate-50">
                  No active surveys found in Supabase database.
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Select Survey to Tabulate:</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {supabaseSurveys.map((s) => {
                      const isChosen = selectedSupabaseSurveyId === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => setSelectedSupabaseSurveyId(s.id)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isChosen 
                              ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs text-slate-900">{s.title}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-emerald-700">/{s.slug}</span>
                              <span>•</span>
                              <span>{s.questions?.length || 0} questions</span>
                              <span>•</span>
                              <span className="uppercase font-bold text-[10px] text-emerald-600">{s.status}</span>
                            </div>
                          </div>
                          {isChosen && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  ⚡ Automatically pulls question variables, answers, and creates banner splits.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSupabaseModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLoadSelectedSupabaseSurvey}
                    disabled={!selectedSupabaseSurveyId || isLoadingSupabase}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold rounded-lg cursor-pointer text-xs shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>Load & Cross-Tabulate</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAVE REPORT TABLE MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-800">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">Save Report Table</h3>
                  <p className="text-[11px] text-slate-500">Store current cross-tabulation in cloud database</p>
                </div>
              </div>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReportTable} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Report Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reportTitleInput}
                  onChange={(e) => setReportTitleInput(e.target.value)}
                  placeholder="e.g. Brand Awareness by Age & Gender"
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notes & Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reportDescInput}
                  onChange={(e) => setReportDescInput(e.target.value)}
                  placeholder="Key executive takeaway, statistical significance notes, or subgroup focus..."
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-900"
                />
              </div>

              {/* Table snapshot details */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-700">Snapshot Configuration:</div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Question:</span>
                  <span className="font-semibold text-slate-800 truncate">{activeQuestion?.title || 'None'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Banner:</span>
                  <span className="font-semibold text-slate-800">{activeBanner?.name || 'Total Only'}</span>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-indigo-600 font-bold">
                  <span>Metric: {metricMode.toUpperCase()}</span>
                  <span>•</span>
                  <span>Sig Testing: {showSignificance ? 'ON' : 'OFF'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport || !reportTitleInput.trim()}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer text-xs shadow-xs transition flex items-center gap-1.5"
                >
                  {isSubmittingReport ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Report Table</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVED REPORTS SLIDE-OVER DRAWER */}
      {isSavedReportsOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsSavedReportsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col text-slate-800 animate-in slide-in-from-right duration-200">
              
              {/* Drawer Header */}
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                    <Bookmark className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-2">
                      Saved Reports & Tables
                      <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-mono">
                        {savedReports.length}
                      </span>
                    </h2>
                    <p className="text-[10px] text-slate-400">1-Click restore any cross-tabulation table</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSavedReportsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reports List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-50">
                {savedReports.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-2 text-xs text-slate-400">
                    <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-600">No Saved Reports Yet</p>
                    <p className="text-[11px]">Configure any cross-tabulation and click "Save Table" in the top bar to save it here.</p>
                  </div>
                ) : (
                  savedReports.map((rep) => (
                    <div
                      key={rep.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-indigo-300 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 leading-snug">{rep.title}</h4>
                          {rep.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{rep.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteSavedReport(rep.id, rep.title)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                          title="Delete Report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Snapshot Meta */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {rep.banner_question || 'Standard Banner'}
                        </span>
                        <span>•</span>
                        <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Apply button */}
                      <button
                        onClick={() => handleApplySavedReport(rep)}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Apply & View Table</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between text-[11px] text-slate-500">
                <span>{savedReports.length} saved reports</span>
                <button
                  onClick={() => setIsSavedReportsOpen(false)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {studioToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-xl border border-slate-800 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{studioToast}</span>
        </div>
      )}
    </div>
  );
}
