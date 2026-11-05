import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { buildQualtricsCsv } from './qualtricsExport.js';
import { supabase } from './supabase.js';
import multer from 'multer';
import { parseSurveyWithAI, parseSurveyWithOpenAI, parseSurveyWithGemini, extractTextFromBuffer } from './aiSurveyIngestion.js';
import { runSurveySimulation } from './surveySimulator.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');
const csvFilePath = path.join(dataDir, 'survey_responses.csv');
const qualtricsCsvFilePath = path.join(dataDir, 'survey_responses_qualtrics.csv');
const jsonFilePath = path.join(dataDir, 'survey_responses.json');

const app = express();
const PORT = process.env.PORT || 5055;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure JSON db exists
if (!fs.existsSync(jsonFilePath)) {
  fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2), 'utf8');
}

// Helpers for CSV encoding
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    val = JSON.stringify(val);
  }
  const str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str}"`;
  }
  return str;
}

// Convert a flat or structured response object into standardized CSV row
function flattenResponseForCsv(r) {
  const q6 = r.answers?.q6_matrix || {};
  const getQ6 = (term) => {
    for (const [k, v] of Object.entries(q6)) {
      if (k.toLowerCase().includes(term.toLowerCase())) return v;
    }
    return '';
  };

  const evals = r.answers?.brand_evaluations || {};
  const zenithEval = evals['Zenith tuition group'] || {};
  const primaryProv = r.answers?.primary_provider || '';
  const primaryEval = evals[primaryProv] || {};

  return {
    respondent_id: r.id || '',
    timestamp: r.timestamp || new Date().toISOString(),
    status: r.status || 'QUALIFIED',
    duration_seconds: r.duration_seconds || 0,
    ip_address: r.ip_address || '',
    location: r.location || '',
    
    // Demographics & Screening
    q1_age: r.answers?.q1_age ?? '',
    q2_country: r.answers?.q2_country ?? '',
    q2a_status: r.answers?.q2a_status ?? '',
    q2b_citizenship: r.answers?.q2b_citizenship ?? '',
    is_international: (r.flags?.isInternational || r.flags?.is_international) ? 'YES' : 'NO',
    q3_gender: r.answers?.q3_gender ?? '',
    q4_schooling: r.answers?.q4_schooling ?? '',
    q5_current_level: r.answers?.q5_level ?? '',
    
    // Q6 Matrix (Tuition categories)
    q6_academic_tuition: getQ6('Academic subject tuition'),
    q6_exam_prep: getQ6('Examination or test-prep'),
    q6_academic_enrichment: getQ6('Academic-based enrichment'),
    q6_hobby_enrichment: getQ6('Hobby or skill-based enrichment'),
    
    // Q6 Deep dives
    q6a_considered_types: Array.isArray(r.answers?.q6a_types) ? r.answers.q6a_types.join('; ') : (r.answers?.q6a_types ?? ''),
    q6b_used_types: Array.isArray(r.answers?.q6b_types) ? r.answers.q6b_types.join('; ') : (r.answers?.q6b_types ?? ''),
    q6c_stopping_reasons: Array.isArray(r.answers?.q6c_reasons) ? r.answers.q6c_reasons.join('; ') : (r.answers?.q6c_reasons ?? ''),
    
    // Frequency & Decision
    q7_weekly_hours: r.answers?.q7_hours ?? '',
    q8_decision_role: r.answers?.q8_decision_role ?? '',
    
    // Provider Awareness & Relationship
    q9_unaided_brand_1: r.answers?.q9_unaided?.[0] ?? '',
    q9_unaided_brand_2: r.answers?.q9_unaided?.[1] ?? '',
    q9_unaided_brand_3: r.answers?.q9_unaided?.[2] ?? '',
    q10_provider_relationships: r.answers?.q10_grid ? JSON.stringify(r.answers.q10_grid) : '',
    q11_reasons_not_choosing: r.answers?.q11_reasons ? JSON.stringify(r.answers.q11_reasons) : '',
    
    // Primary & Loops
    primary_provider: primaryProv,
    brand_loop_providers: Array.isArray(r.brand_loop) ? r.brand_loop.join('; ') : '',
    
    // Unnested Evaluation fields for Cross-Tabulation
    zenith_relationship: r.answers?.q10_grid?.['Zenith tuition group'] ?? '',
    zenith_csat: zenithEval.q16_csat ?? '',
    zenith_nps: zenithEval.q17_nps ?? '',
    zenith_reason: zenithEval.q18_reason ?? '',
    
    primary_csat: primaryEval.q16_csat ?? '',
    primary_nps: primaryEval.q17_nps ?? '',
    primary_reason: primaryEval.q18_reason ?? '',
    
    brand_evaluations_json: r.answers?.brand_evaluations ? JSON.stringify(r.answers.brand_evaluations) : '',
    
    // Choice Criteria & Rankings
    q14_top_5_kpcs: Array.isArray(r.answers?.q14_ranked_kpcs) ? r.answers.q14_ranked_kpcs.join('; ') : '',
    
    // Retention & Switching
    q19_likelihood_to_continue: r.answers?.q19_continue ? JSON.stringify(r.answers.q19_continue) : '',
    q20_continuation_reasons: r.answers?.q20_reasons ? (typeof r.answers.q20_reasons === 'object' ? JSON.stringify(r.answers.q20_reasons) : r.answers.q20_reasons) : '',
    q21_discontinuation_reasons: r.answers?.q21_reasons ? (typeof r.answers.q21_reasons === 'object' ? JSON.stringify(r.answers.q21_reasons) : r.answers.q21_reasons) : '',
    q22_switched_12m: r.answers?.q22_switched ?? '',
    q23_switched_from: r.answers?.q23_switched_from ?? '',
    q24_switching_reasons: Array.isArray(r.answers?.q24_reasons) ? r.answers.q24_reasons.join('; ') : '',
    q25_switching_barriers: Array.isArray(r.answers?.q25_barriers) ? r.answers.q25_barriers.join('; ') : '',
    
    // Tutor vs Brand & Premium
    q26_tutor_vs_brand: r.answers?.q26_tutor_vs_brand ?? '',
    q27_tutor_characteristics: Array.isArray(r.answers?.q27_tutor_traits) ? r.answers.q27_tutor_traits.join('; ') : '',
    q28_premium_justifications: Array.isArray(r.answers?.q28_premium) ? r.answers.q28_premium.join('; ') : '',
    
    // Future Programmes (Q29, Q30)
    q29_new_programmes_interested: Array.isArray(r.answers?.q29_programmes) ? r.answers.q29_programmes.join('; ') : '',
    q30_enrolment_likelihood: r.answers?.q30_enrolment ? JSON.stringify(r.answers.q30_enrolment) : '',
    
    raw_payload: JSON.stringify(r.answers || {})
  };
}

// Helper to rebuild or sync CSV file
function syncCsvFromResponses(responses) {
  if (!responses || responses.length === 0) {
    const defaultHeaders = [
      'respondent_id', 'timestamp', 'status', 'duration_seconds',
      'q1_age', 'q2_country', 'q2a_status', 'q2b_citizenship', 'is_international', 'q3_gender', 'q4_schooling', 'q5_current_level',
      'q6_academic_tuition', 'q6_exam_prep', 'q6_academic_enrichment', 'q6_hobby_enrichment',
      'q6a_considered_types', 'q6b_used_types', 'q6c_stopping_reasons',
      'q7_weekly_hours', 'q8_decision_role',
      'q9_unaided_brand_1', 'q9_unaided_brand_2', 'q9_unaided_brand_3',
      'q10_provider_relationships', 'q11_reasons_not_choosing', 'primary_provider', 'brand_loop_providers',
      'brand_evaluations_json', 'q14_top_5_kpcs', 'q19_likelihood_to_continue',
      'q20_continuation_reasons', 'q21_discontinuation_reasons',
      'q22_switched_12m', 'q23_switched_from', 'q24_switching_reasons', 'q25_switching_barriers',
      'q26_tutor_vs_brand', 'q27_tutor_characteristics', 'q28_premium_justifications',
      'q29_new_programmes_interested', 'q30_enrolment_likelihood', 'raw_payload'
    ];
    fs.writeFileSync(csvFilePath, defaultHeaders.join(',') + '\n', 'utf8');
    return;
  }

  const flattenedList = responses.map(flattenResponseForCsv);
  const headers = Object.keys(flattenedList[0]);
  const rows = [headers.join(',')];

  for (const item of flattenedList) {
    const line = headers.map(h => escapeCsvCell(item[h])).join(',');
    rows.push(line);
  }

  fs.writeFileSync(csvFilePath, rows.join('\n') + '\n', 'utf8');

  // Also build and save Qualtrics / Q Research Software 3-Header CSV
  try {
    const qualtricsCsv = buildQualtricsCsv(responses);
    fs.writeFileSync(qualtricsCsvFilePath, qualtricsCsv, 'utf8');
  } catch (err) {
    console.error('Error generating Qualtrics CSV:', err);
  }
}

// Initial load of responses into memory cache
let cachedResponses = [];
try {
  if (fs.existsSync(jsonFilePath)) {
    cachedResponses = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8') || '[]');
  }
} catch (e) {
  cachedResponses = [];
}

if (!fs.existsSync(csvFilePath) || !fs.existsSync(qualtricsCsvFilePath)) {
  syncCsvFromResponses(cachedResponses);
}

// High-Performance In-Memory Quota Status Cache (15s TTL)
const quotaCache = new Map();
const QUOTA_CACHE_TTL_MS = 15000;

// ----------------------------------------------------------------------
// HIGH-CONCURRENCY SUBMISSION INGESTION QUEUE (Zero-Loss Micro-Batching)
// ----------------------------------------------------------------------
const submissionQueue = [];
let isFlushingQueue = false;
let isJsonDirty = false;
const BATCH_SIZE = 25;
const FLUSH_INTERVAL_MS = 1200;

// Periodic background JSON file persistence (Debounced to prevent event-loop freezing)
setInterval(() => {
  if (isJsonDirty && cachedResponses) {
    isJsonDirty = false;
    fs.writeFile(jsonFilePath, JSON.stringify(cachedResponses, null, 2), 'utf8', (err) => {
      if (err) console.error('[JSON Background Sync Error]', err.message);
    });
  }
}, 4000);

// Flushes micro-batches to Supabase and appends to CSV asynchronously
async function flushSubmissionQueue() {
  if (isFlushingQueue || submissionQueue.length === 0) return;
  isFlushingQueue = true;
  const batch = submissionQueue.splice(0, BATCH_SIZE);

  try {
    // 1. Bulk insert to Supabase (1 single network roundtrip for up to 25 responses)
    const targetSurveyId = batch[0]?.survey_id || 'a0000000-0000-0000-0000-000000000001';
    const supabaseRows = batch.map(r => {
      const rawStatus = (r.status || '').toLowerCase();
      const isQuotaFull = rawStatus === 'quota_full';
      const isTerm = rawStatus.includes('terminat') || rawStatus === 'screenout';
      
      let normalizedStatus = 'qualified';
      if (isQuotaFull) normalizedStatus = 'quota_full';
      else if (isTerm) normalizedStatus = 'screenout';

      return {
        survey_id: r.survey_id || targetSurveyId,
        respondent_id: r.id,
        status: normalizedStatus,
        screenout_reason: isQuotaFull ? 'Quota capacity reached' : (isTerm ? (r.screenout_reason || r.status) : null),
        answers: r.answers || {},
        duration_seconds: r.duration_seconds || 0,
        user_agent: r.user_agent || ''
      };
    });

    const { error: supaErr } = await supabase.from('survey_responses').insert(supabaseRows);
    if (supaErr) {
      console.warn('[Batch Queue Note] Supabase batch insert note:', supaErr.message);
    } else {
      console.log(`[Batch Queue] Flushed ${batch.length} responses to Cloud DB in one batch.`);
    }

    // 2. Non-blocking asynchronous CSV append
    const lines = [];
    for (const item of batch) {
      const flattened = flattenResponseForCsv(item);
      const headers = Object.keys(flattened);
      const csvRow = headers.map(h => escapeCsvCell(flattened[h])).join(',');
      lines.push(csvRow);
    }

    if (lines.length > 0) {
      fs.appendFile(csvFilePath, lines.join('\n') + '\n', 'utf8', (err) => {
        if (err) console.error('[CSV Stream] Append error:', err.message);
      });
    }

    // Invalidate quota cache on new completes
    quotaCache.clear();
  } catch (err) {
    console.error('[Batch Queue Exception]', err);
  } finally {
    isFlushingQueue = false;
    if (submissionQueue.length > 0) {
      setImmediate(flushSubmissionQueue);
    }
  }
}

// Background timer to flush any pending records in queue
setInterval(flushSubmissionQueue, FLUSH_INTERVAL_MS);

// Graceful process exit to guarantee 0% data loss on server restart
async function gracefulShutdown(signal) {
  console.log(`[Server] Received ${signal}. Flushing pending submissions before exit...`);
  while (submissionQueue.length > 0) {
    await flushSubmissionQueue();
  }
  if (isJsonDirty && cachedResponses) {
    fs.writeFileSync(jsonFilePath, JSON.stringify(cachedResponses, null, 2), 'utf8');
  }
  console.log('[Server] Cleanly flushed all queues. Exiting safely.');
  process.exit(0);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// In-memory store for background AI ingestion jobs (prevents Cloudflare 524 timeouts)
const aiJobs = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of aiJobs.entries()) {
    if (now - job.createdAt > 1800000) { // 30 min expiration
      aiJobs.delete(id);
    }
  }
}, 60000);

// AI Survey Ingestion Endpoint (Word DOCX / PDF / Raw Text Brief)
// Returns immediately (<200ms) with a jobId to eliminate Cloudflare 524 (100s timeout)
app.post('/api/ai/import-document', upload.single('document'), async (req, res) => {
  try {
    const file = req.file;
    const rawText = req.body.text || '';
    const userApiKey = req.body.apiKey || req.headers['x-openai-key'] || req.headers['x-gemini-key'] || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    let documentContent = '';
    let pdfBase64 = null;

    if (file) {
      if (file.mimetype === 'application/pdf') {
        pdfBase64 = file.buffer.toString('base64');
      }
      documentContent = await extractTextFromBuffer(file.buffer, file.mimetype, file.originalname);
    } else if (rawText) {
      documentContent = rawText;
    } else {
      return res.status(400).json({ success: false, error: 'No document file or text provided.' });
    }

    if (!documentContent && !pdfBase64) {
      return res.status(400).json({ success: false, error: 'Could not extract any readable content from document.' });
    }

    const requestedModel = req.body.model || 'gpt-4o-mini';
    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Register active job in memory
    aiJobs.set(jobId, {
      id: jobId,
      status: 'processing',
      stepIndex: 1,
      percent: 15,
      progress: 'Reading & cleaning document text...',
      createdAt: Date.now()
    });

    // Send immediate response (<200ms) so Cloudflare never hits 524
    res.json({
      success: true,
      jobId,
      message: 'AI ingestion task launched successfully in background.'
    });

    // Execute ingestion in the background with real-time status reporting
    setImmediate(async () => {
      try {
        const updateJob = (stepIndex, percent, progress) => {
          const current = aiJobs.get(jobId);
          if (current) {
            aiJobs.set(jobId, { ...current, stepIndex, percent, progress });
          }
        };

        const { survey, simulationReport } = await parseSurveyWithAI({
          documentText: documentContent,
          pdfBase64,
          apiKey: userApiKey,
          model: requestedModel,
          onProgress: updateJob
        });

        updateJob(4, 92, 'Saving survey schema to Supabase Cloud...');

        // Save survey into Supabase surveys table
        const slug = 'ai-' + (survey.title || 'survey')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 30) + '-' + Math.random().toString(36).substring(2, 7);

        const newSurveyRecord = {
          title: survey.title || 'AI Imported Survey',
          description: survey.description || 'Imported via AI Survey Brief Parser',
          slug,
          status: 'draft',
          settings: {
            targetN: survey.targetN || 400,
            quota_limits: {},
            isWhiteLabeled: false
          },
          questions: survey.questions || [],
          logic_rules: survey.logic_rules || []
        };

        const { data: createdSurvey, error: dbError } = await supabase
          .from('surveys')
          .insert([newSurveyRecord])
          .select()
          .single();

        if (dbError) {
          console.warn('Supabase survey insert note:', dbError.message);
        }

        // Mark job as completed with full payload
        aiJobs.set(jobId, {
          id: jobId,
          status: 'completed',
          stepIndex: 5,
          percent: 100,
          progress: 'Survey compilation & bot verification complete!',
          survey: createdSurvey || { ...newSurveyRecord, id: 'temp-' + Date.now() },
          savedSurveyId: createdSurvey?.id || null,
          simulationReport,
          completedAt: Date.now()
        });

        console.log(`[AI Ingestion] Job ${jobId} completed successfully! Questions: ${survey.questions?.length}`);
      } catch (jobErr) {
        console.error(`[AI Ingestion] Job ${jobId} failed:`, jobErr);
        aiJobs.set(jobId, {
          id: jobId,
          status: 'error',
          error: jobErr.message || 'An error occurred during AI parsing.',
          stepIndex: 0,
          percent: 0,
          failedAt: Date.now()
        });
      }
    });

  } catch (err) {
    console.error('AI Ingestion Initiation Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An error occurred while initiating document analysis.'
    });
  }
});

// Job Status Polling Endpoint (Fast sub-millisecond in-memory response)
app.get('/api/ai/job-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = aiJobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      status: 'not_found',
      error: 'Job not found or expired. Please re-upload your document.'
    });
  }

  return res.json({
    success: true,
    ...job
  });
});

// Standalone endpoint to run the Virtual Bot Simulator on any survey schema
app.post('/api/ai/verify-survey', (req, res) => {
  try {
    const survey = req.body;
    if (!survey || !survey.questions) {
      return res.status(400).json({ success: false, error: 'Invalid survey schema' });
    }
    const report = runSurveySimulation(survey);
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Submit a survey response (Ultra-fast < 10ms Ingestion with Zero-Loss Queue)
app.post('/api/submit', (req, res) => {
  try {
    const submission = req.body;
    if (!submission) {
      return res.status(400).json({ success: false, error: 'Empty payload' });
    }

    // Extract client IP and Geolocation from Cloudflare / Proxy headers
    const clientIp = req.headers['cf-connecting-ip'] || 
                     req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                     req.socket.remoteAddress || '';

    const cfCountry = req.headers['cf-ipcountry'] || '';
    const cfCity = req.headers['cf-ipcity'] || '';

    let locationStr = '';
    if (cfCity && cfCountry) {
      locationStr = `${cfCity}, ${cfCountry}`;
    } else if (cfCountry) {
      locationStr = cfCountry;
    } else {
      locationStr = 'Local / Direct';
    }

    const respondentId = submission.id || 'RESP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const completeRecord = {
      id: respondentId,
      timestamp: new Date().toISOString(),
      ip_address: clientIp,
      location: locationStr,
      user_agent: req.headers['user-agent'] || '',
      ...submission
    };

    // Fast in-memory cache update
    cachedResponses.push(completeRecord);
    isJsonDirty = true;

    // Push into Micro-Batch Ingestion Queue
    submissionQueue.push(completeRecord);
    if (submissionQueue.length >= BATCH_SIZE) {
      setImmediate(flushSubmissionQueue);
    }

    console.log(`[Survey API] Queued respondent ${respondentId} (Status: ${completeRecord.status || 'QUALIFIED'}, Queue: ${submissionQueue.length})`);

    // Immediate acknowledgment in < 10ms
    return res.json({
      success: true,
      respondentId,
      status: completeRecord.status || 'QUALIFIED',
      message: 'Survey response acknowledged and queued with zero latency.'
    });
  } catch (error) {
    console.error('[Survey API] Error saving response:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Real-Time Question-by-Question Draft Auto-Save (Drop-Off & Abandonment Capture)
app.post('/api/submit/draft', (req, res) => {
  try {
    const { survey_id, session_id, current_step, answers, is_completed } = req.body || {};
    if (!session_id) {
      return res.status(400).json({ success: false, error: 'Missing session_id' });
    }

    const targetSurveyId = survey_id || 'a0000000-0000-0000-0000-000000000001';

    // Asynchronously upsert draft to Supabase without blocking HTTP response
    supabase
      .from('survey_drafts')
      .upsert({
        survey_id: targetSurveyId,
        session_id,
        current_step: current_step || 0,
        answers: answers || {},
        is_completed: !!is_completed,
        updated_at: new Date().toISOString()
      }, { onConflict: 'survey_id,session_id' })
      .then(({ error }) => {
        if (error) console.warn('[Draft Auto-Save Note]:', error.message);
      })
      .catch(() => {});

    return res.json({ success: true, message: 'Draft saved' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Check Supabase Connection & Table Status
app.get('/api/supabase/status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('id, title, slug, status')
      .limit(5);

    if (error) {
      return res.json({
        connected: false,
        message: 'Connected to Supabase endpoint, but tables not found yet.',
        error: error.message,
        hint: 'Run supabase_schema.sql in your Supabase SQL Editor.'
      });
    }

    return res.json({
      connected: true,
      message: 'Supabase PostgreSQL database is online and connected!',
      surveysCount: data?.length || 0,
      surveys: data
    });
  } catch (err) {
    return res.status(500).json({ connected: false, error: err.message });
  }
});

// Fetch responses directly from Supabase for live cross-tabulation
app.get('/api/supabase/responses', async (req, res) => {
  try {
    const surveyId = req.query.surveyId;
    let query = supabase
      .from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false });

    if (surveyId) {
      query = query.eq('survey_id', surveyId);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.json({
      success: true,
      count: data.length,
      responses: data
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SURVEY BUILDER CRUD ENDPOINTS
// ==========================================

// List all surveys
app.get('/api/surveys', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    return res.json({ success: true, surveys: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single survey by slug or ID
app.get('/api/surveys/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    let { data, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('slug', slugOrId)
      .maybeSingle();

    if (!data && !error) {
      // Try ID if not found by slug
      const idRes = await supabase
        .from('surveys')
        .select('*')
        .eq('id', slugOrId)
        .maybeSingle();
      data = idRes.data;
      error = idRes.error;
    }

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    if (!data) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }

    return res.json({ success: true, survey: data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Real-time Quota Status Checker (Cached with 15s TTL to eliminate DB spikes)
app.get('/api/surveys/:slugOrId/quota-status', async (req, res) => {
  try {
    const { slugOrId } = req.params;

    // 1. Check TTL Cache first (Instant sub-millisecond response)
    const cached = quotaCache.get(slugOrId);
    if (cached && (Date.now() - cached.timestamp < QUOTA_CACHE_TTL_MS)) {
      return res.json(cached.data);
    }

    let { data: survey, error } = await supabase
      .from('surveys')
      .select('*')
      .eq('slug', slugOrId)
      .maybeSingle();

    if (!survey && !error) {
      const idRes = await supabase.from('surveys').select('*').eq('id', slugOrId).maybeSingle();
      survey = idRes.data;
      error = idRes.error;
    }

    if (!survey) return res.status(404).json({ success: false, error: 'Survey not found' });

    const quotas = survey.settings?.quotas || [];

    // Fetch qualified responses for this survey
    const { data: responses } = await supabase
      .from('survey_responses')
      .select('answers, status')
      .eq('survey_id', survey.id)
      .eq('status', 'qualified');

    const qualifiedList = responses || [];
    const quotaResults = quotas.map(q => {
      const count = qualifiedList.filter(r => {
        const val = r.answers?.[q.question_id];
        if (Array.isArray(val)) return val.includes(q.target_value);
        return String(val) === String(q.target_value);
      }).length;

      return {
        ...q,
        current_count: count,
        is_full: count >= q.target_limit
      };
    });

    const maxCap = Number(survey.settings?.max_responses_cap) || survey.target_responses || 400;
    const isOverMaxCap = qualifiedList.length >= maxCap;

    const responsePayload = {
      success: true,
      quotas: quotaResults,
      totalQualified: qualifiedList.length,
      maxCap,
      isOverMaxCap
    };

    // Store in memory cache
    quotaCache.set(slugOrId, {
      timestamp: Date.now(),
      data: responsePayload
    });

    return res.json(responsePayload);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Create or Update a Survey
app.post('/api/surveys', async (req, res) => {
  try {
    const { id, title, slug, description, status, theme, questions, logic_rules, target_responses, settings } = req.body;
    if (!title || !slug) {
      return res.status(400).json({ success: false, error: 'Title and URL slug are required' });
    }

    const payload = {
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      description: description || '',
      status: status || 'draft',
      theme: theme || { primaryColor: '#4f46e5', font: 'Inter' },
      questions: questions || [],
      logic_rules: logic_rules || [],
      settings: settings || {},
      target_responses: Number(target_responses) || 400,
      updated_at: new Date().toISOString()
    };

    if (id) {
      // Update
      const { data, error } = await supabase
        .from('surveys')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.json({ success: true, survey: data, message: 'Survey updated successfully!' });
    } else {
      // Insert
      const { data, error } = await supabase
        .from('surveys')
        .insert(payload)
        .select()
        .single();

      if (error) return res.status(400).json({ success: false, error: error.message });
      return res.json({ success: true, survey: data, message: 'Survey created successfully!' });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Clone / Duplicate a Survey
app.post('/api/surveys/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: original, error: fetchErr } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !original) {
      return res.status(404).json({ success: false, error: 'Original survey not found' });
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${randomSuffix}`;

    const { data: cloned, error: insertErr } = await supabase
      .from('surveys')
      .insert({
        title: newTitle,
        slug: newSlug,
        description: original.description,
        status: 'draft',
        theme: original.theme,
        questions: original.questions,
        logic_rules: original.logic_rules,
        settings: original.settings || {},
        target_responses: original.target_responses || 400
      })
      .select()
      .single();

    if (insertErr) {
      return res.status(400).json({ success: false, error: insertErr.message });
    }

    return res.json({ success: true, survey: cloned, message: 'Survey duplicated successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a Survey
app.delete('/api/surveys/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Survey deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SAVED REPORTS CRUD ENDPOINTS
// ==========================================

// Get saved reports for a survey
app.get('/api/reports', async (req, res) => {
  try {
    const { surveyId } = req.query;
    let query = supabase.from('survey_reports').select('*').order('created_at', { ascending: false });
    if (surveyId) {
      query = query.eq('survey_id', surveyId);
    }
    const { data, error } = await query;
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, reports: data || [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Save a report table configuration
app.post('/api/reports', async (req, res) => {
  try {
    const { survey_id, title, description, banner_question, table_config } = req.body;
    if (!title || !survey_id) {
      return res.status(400).json({ success: false, error: 'Title and Survey ID are required' });
    }
    const { data, error } = await supabase
      .from('survey_reports')
      .insert({
        survey_id,
        title,
        description: description || '',
        banner_question: banner_question || '',
        table_config: table_config || {}
      })
      .select()
      .single();

    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, report: data, message: 'Report table saved successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a saved report
app.delete('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('survey_reports').delete().eq('id', id);
    if (error) return res.status(400).json({ success: false, error: error.message });
    return res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// DASHBOARD PORTAL KPI SUMMARY
// ==========================================
app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const { data: surveys, error: survErr } = await supabase
      .from('surveys')
      .select('id, title, slug, status, target_responses, settings, created_at')
      .order('created_at', { ascending: false });

    if (survErr) return res.status(400).json({ success: false, error: survErr.message });

    const { data: responses, error: respErr } = await supabase
      .from('survey_responses')
      .select('id, survey_id, status, duration_seconds, created_at');

    const allResponses = responses || [];
    const allSurveys = (surveys || []).map(s => {
      const surveyResps = allResponses.filter(r => r.survey_id === s.id);
      const qualified = surveyResps.filter(r => r.status === 'qualified').length;
      const screenout = surveyResps.filter(r => r.status === 'screenout').length;
      const quotaFull = surveyResps.filter(r => r.status === 'quota_full').length;
      return {
        ...s,
        total_responses: surveyResps.length,
        qualified_count: qualified,
        screenout_count: screenout,
        quota_full_count: quotaFull,
        completion_rate: surveyResps.length > 0 ? Math.round((qualified / surveyResps.length) * 100) : 0
      };
    });

    const totalSurveys = allSurveys.length;
    const liveSurveys = allSurveys.filter(s => s.status === 'live').length;
    const totalQualified = allResponses.filter(r => r.status === 'qualified').length;
    const avgCompletionRate = allResponses.length > 0 
      ? Math.round((totalQualified / allResponses.length) * 100) 
      : 0;

    return res.json({
      success: true,
      stats: {
        totalSurveys,
        liveSurveys,
        totalQualified,
        totalSubmitted: allResponses.length,
        avgCompletionRate
      },
      surveys: allSurveys
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Retrieve all responses & stats
app.get('/api/responses', (req, res) => {
  try {
    const responses = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8') || '[]');
    const totalTarget = 400;
    const qualifiedCount = responses.filter(r => r.status === 'QUALIFIED').length;
    const terminatedCount = responses.filter(r => r.status && r.status.startsWith('TERMINATED')).length;

    res.json({
      success: true,
      totalTarget,
      qualifiedCount,
      terminatedCount,
      totalSubmitted: responses.length,
      data: responses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear / Reset all survey responses (auto-backups existing data)
app.post('/api/clear-responses', (req, res) => {
  try {
    const backupDir = path.join(dataDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const existingJson = fs.existsSync(jsonFilePath) ? fs.readFileSync(jsonFilePath, 'utf8') : '[]';
    
    // Create timestamped backup
    const backupJsonPath = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(backupJsonPath, existingJson, 'utf8');

    if (fs.existsSync(csvFilePath)) {
      fs.copyFileSync(csvFilePath, path.join(backupDir, `backup_${timestamp}.csv`));
    }

    // Reset database to empty array
    fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2), 'utf8');
    syncCsvFromResponses([]);

    console.log(`[Survey API] Responses database cleared. Backup saved at ${backupJsonPath}`);
    res.json({
      success: true,
      message: 'All responses successfully cleared. Fresh dataset ready for new entries.',
      backupCreated: `backup_${timestamp}.json`
    });
  } catch (error) {
    console.error('[Survey API] Error clearing responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore sample dataset (400 responses)
app.post('/api/restore-sample-data', (req, res) => {
  try {
    const samplePath = path.join(dataDir, 'sample_responses_400.json');
    if (!fs.existsSync(samplePath)) {
      return res.status(404).json({ success: false, error: 'Sample dataset not found' });
    }

    const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    fs.writeFileSync(jsonFilePath, JSON.stringify(sampleData, null, 2), 'utf8');
    syncCsvFromResponses(sampleData);

    console.log(`[Survey API] Restored 400 sample responses.`);
    res.json({
      success: true,
      count: sampleData.length,
      message: 'Restored 400 sample respondents successfully.'
    });
  } catch (error) {
    console.error('[Survey API] Error restoring sample data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import external responses into server database
app.post('/api/import-responses', (req, res) => {
  try {
    const { responses: importedList, overwrite } = req.body;
    if (!Array.isArray(importedList) || importedList.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected non-empty array of responses' });
    }

    let currentJson = [];
    if (!overwrite && fs.existsSync(jsonFilePath)) {
      currentJson = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8') || '[]');
    }

    const updated = [...currentJson, ...importedList];
    fs.writeFileSync(jsonFilePath, JSON.stringify(updated, null, 2), 'utf8');
    syncCsvFromResponses(updated);

    console.log(`[Survey API] Imported ${importedList.length} responses. Total: ${updated.length}`);
    res.json({
      success: true,
      importedCount: importedList.length,
      totalCount: updated.length,
      message: `Successfully imported ${importedList.length} responses.`
    });
  } catch (error) {
    console.error('[Survey API] Error importing responses:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download Standard CSV (1-Header Row for Excel/PowerBI)
app.get('/api/export-csv', (req, res) => {
  try {
    if (!fs.existsSync(csvFilePath)) {
      const responses = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8') || '[]');
      syncCsvFromResponses(responses);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="singapore_student_survey_responses.csv"');
    const fileStream = fs.createReadStream(csvFilePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download Qualtrics & Q Research Software Enterprise CSV (3-Header Rows with Binary 0/1 Dummies)
app.get('/api/export-qualtrics-csv', (req, res) => {
  try {
    if (!fs.existsSync(qualtricsCsvFilePath)) {
      const responses = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8') || '[]');
      syncCsvFromResponses(responses);
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="singapore_student_survey_qualtrics_q_format.csv"');
    const fileStream = fs.createReadStream(qualtricsCsvFilePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// Serve static built files from dist
const distPath = path.join(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
  const indexHtmlPath = path.join(distPath, 'index.html');

  const getLatestIndexHtml = () => {
    try {
      return fs.readFileSync(indexHtmlPath, 'utf8');
    } catch (e) {
      return '';
    }
  };

  app.use(express.static(distPath));

  app.get(['/study-spec', '/survey-spec'], (req, res) => {
    const specPath = path.join(distPath, 'singapore-study-spec.html');
    if (fs.existsSync(specPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(specPath);
    }
    res.status(404).send('Study specification document not found');
  });

  app.get('*', async (req, res, next) => {
    if (req.path.startsWith('/api')) return next();

    // Prevent returning index.html for missing static assets (e.g. JS/CSS files)
    if (req.path.startsWith('/assets/')) {
      return res.status(404).send('Asset not found');
    }

    const rawIndexHtml = getLatestIndexHtml();

    // If accessing a specific survey link (/s/:slug), dynamically customize OpenGraph preview for that specific survey
    if (req.path.startsWith('/s/') && req.path.length > 3) {
      const slug = req.path.split('/s/')[1].split('/')[0].split('?')[0];
      try {
        const { data: s } = await supabase
          .from('surveys')
          .select('title, description')
          .eq('slug', slug)
          .maybeSingle();

        if (s && s.title && rawIndexHtml) {
          const customTitle = `${s.title} | Survey Cloud`;
          const customDesc = s.description || 'Participate in this official research questionnaire on Survey Cloud.';
          const modifiedHtml = rawIndexHtml
            .replace(/<title>.*?<\/title>/gi, `<title>${customTitle}</title>`)
            .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${customTitle}" />`)
            .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${customDesc}" />`)
            .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${customDesc}" />`);
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          return res.send(modifiedHtml);
        }
      } catch (err) {
        // Fallback to default index.html
      }
    }

    // Default: Always serve the clean Survey Cloud Portal metadata
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(indexHtmlPath);
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Survey Backend running at http://localhost:${PORT}`);
  console.log(`📁 CSV file stored at: ${csvFilePath}`);
});
