import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { runSurveySimulation } from './surveySimulator.js';

/**
 * Extracts plain text from an uploaded document buffer (DOCX, PDF, or Plain Text)
 */
export async function extractTextFromBuffer(buffer, mimetype, originalname = '') {
  const filename = originalname.toLowerCase();

  // 1. DOCX file
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }

  // 2. PDF file
  if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    try {
      const parsedPdf = await pdfParse(buffer);
      return parsedPdf.text || '';
    } catch (e) {
      console.warn('PDF parsing error, falling back:', e.message);
    }
  }

  // 3. Plain Text / Markdown / CSV
  if (
    mimetype.startsWith('text/') ||
    filename.endsWith('.txt') ||
    filename.endsWith('.md') ||
    filename.endsWith('.csv')
  ) {
    return buffer.toString('utf8');
  }

  // 4. Fallback: Stringify buffer (For simple text-based streams)
  return buffer.toString('utf8');
}
const SYSTEM_INSTRUCTION = `
You are an expert Survey Architect, Research Methodologist, and Questionnaire Logic Compiler.
Your job is to read a market research questionnaire document (brief / codebook) and translate 100% of its questions, options, screening rules, jump logic, and matrices into a structured JSON survey schema.

CRITICAL LOGIC & JUMP EXTRACTION RULES:
1. SCREENOUTS / TERMINATIONS:
   - Whenever the brief says "Terminate if...", "Screen out if...", "Disqualify if...", or indicates an ineligible answer, create a rule:
     {
       "triggerQuestionId": "q1_age",
       "operator": "equals",
       "value": "Under 18",
       "action": "screenout",
       "screenoutReason": "Ineligible: Respondent does not meet target profile"
     }
2. JUMP & SKIP LOGIC (MANDATORY EXTRACTION):
   - Whenever the brief has notes like [SKIP TO Q...], [JUMP TO Q...], [GO TO Q...], [IF NO, SKIP TO...], or conditional branching:
     YOU MUST create an action: "jump_to" rule.
   - Example: If an option in Q2 is "No [SKIP TO Q4]", add to rules:
     {
       "triggerQuestionId": "q2",
       "operator": "equals",
       "value": "No",
       "action": "jump_to",
       "targetQuestionId": "q4"
     }
   - NEVER drop or ignore bracketed skip instructions! Always extract them.
3. QUESTION TYPES:
   - Must be one of: "single_choice", "multiple_choice", "rating_scale", "nps", "numeric", "text", "matrix", "ranking".
4. MATRIX QUESTIONS:
   - If a question has rows and columns, specify rows (array of statements) and columns (array of scale choices).
5. RANKING QUESTIONS:
   - If a question asks to rank top items, set type to "ranking" and list all rankable items in options.
6. NO DATA LOSS:
   - Include ALL options, questions, logic instructions, and routing notes from the document without truncating.

Return ONLY a valid JSON object matching this schema:
{
  "title": "Survey Title",
  "description": "Survey Description / Target Audience",
  "targetN": 400,
  "logic_rules": [
    {
      "triggerQuestionId": "q1_age",
      "operator": "equals",
      "value": "Under 18",
      "action": "screenout",
      "screenoutReason": "Under 18 ineligible"
    },
    {
      "triggerQuestionId": "q2_tuition",
      "operator": "equals",
      "value": "No",
      "action": "jump_to",
      "targetQuestionId": "q4_study"
    }
  ],
  "questions": [
    {
      "id": "q1_age",
      "title": "What is your current age bracket?",
      "subtitle": "Select one option",
      "type": "single_choice",
      "options": ["Under 18", "18-24", "25-34", "35-54", "55+"],
      "rules": [
        {
          "operator": "equals",
          "value": "Under 18",
          "action": "screenout",
          "screenoutReason": "Under 18 ineligible"
        }
      ]
    },
    {
      "id": "q2_tuition",
      "title": "Do you currently take private tuition?",
      "subtitle": "Select one option",
      "type": "single_choice",
      "options": ["Yes", "No"],
      "rules": [
        {
          "operator": "equals",
          "value": "No",
          "action": "jump_to",
          "targetQuestionId": "q4_study"
        }
      ]
    }
  ]
}
`;

/**
 * Core AI Ingestion: Calls Gemini API to parse the questionnaire document
 */
export async function parseSurveyWithGemini({
  documentText,
  pdfBase64 = null,
  apiKey = process.env.GEMINI_API_KEY
}) {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please provide a GEMINI_API_KEY in your .env file or enter it in the AI Import modal.');
  }

  const systemInstruction = SYSTEM_INSTRUCTION;

  // Construct request payload for Gemini API
  const contents = [];

  if (pdfBase64) {
    contents.push({
      parts: [
        {
          inline_data: {
            mime_type: 'application/pdf',
            data: pdfBase64
          }
        },
        {
          text: 'Please parse this entire questionnaire document and convert it into the strict SurveyBuilder JSON format described in your instructions.'
        }
      ]
    });
  } else {
    contents.push({
      parts: [
        {
          text: `Here is the survey questionnaire brief:\n\n${documentText}\n\nPlease parse this entire questionnaire document and convert it into the strict SurveyBuilder JSON format described in your instructions.`
        }
      ]
    });
  }

  const candidateModels = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash'
  ];

  let lastError = null;
  let response = null;
  let data = null;

  for (const modelName of candidateModels) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      // Try with retry for transient 503s
      for (let attempt = 1; attempt <= 2; attempt++) {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          })
        });

        if (response.ok) {
          data = await response.json();
          break;
        } else if (response.status === 503 && attempt === 1) {
          // Wait 1s and retry
          await new Promise(r => setTimeout(r, 1000));
        } else {
          const errBody = await response.json().catch(() => ({}));
          lastError = new Error(errBody.error?.message || `HTTP ${response.status}`);
          break;
        }
      }

      if (data && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        break; // Successfully got output!
      }
    } catch (fetchErr) {
      lastError = fetchErr;
    }
  }

  if (!data || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error(lastError?.message || 'Gemini API could not generate survey structure. Please verify your API key and connection.');
  }
  const rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawJsonText) {
    throw new Error('Gemini did not return any content in the response.');
  }

  const parsedSurvey = JSON.parse(rawJsonText);

  // Automatically execute Layer 4: Virtual Bot Simulator
  const simulationReport = runSurveySimulation(parsedSurvey);

  return {
    survey: parsedSurvey,
    simulationReport
  };
}

/**
 * Cleans raw document text, strips binary garbage, repeated headers, page numbers, and excess whitespace
 */
export function cleanSurveyText(text) {
  if (!text) return '';
  return text
    // Remove repeated page numbers e.g. Page 12 of 45, Page 12
    .replace(/(?:Page\s+\d+\s+of\s+\d+|\bPage\s+\d+\b)/gi, '')
    // Remove common repeated confidentiality headers and footers
    .replace(/(?:CONFIDENTIAL|STRICTLY CONFIDENTIAL|DO NOT DISTRIBUTE|PROPRIETARY AND CONFIDENTIAL)/gi, '')
    // Remove null bytes and non-printable control characters
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse excess tabs and spaces
    .replace(/[ \t]+/g, ' ')
    // Collapse excess newlines
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Splits large document text into natural survey sections/questions to respect TPM and latency limits
 */
export function chunkSurveyText(text, maxChars = 10000) {
  if (!text || text.length <= maxChars) return [text || ''];

  // 1. Try splitting by Question (Q1, S1, Question 1) or Section boundaries
  const regex = /(?=(?:\r?\n)+(?:Q\d+|S\d+|SECTION\s+[A-Z0-9]+|PART\s+[A-Z0-9]+|Question\s+\d+)[:.\s])/i;
  let sections = text.split(regex).map(s => s.trim()).filter(Boolean);

  // 2. If regex didn't find clear section boundaries, split by paragraphs
  if (sections.length <= 1) {
    sections = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  }

  // 3. If still single huge block, split by lines
  if (sections.length <= 1) {
    sections = text.split(/\n/).map(s => s.trim()).filter(Boolean);
  }

  const chunks = [];
  let currentChunk = '';
  for (const s of sections) {
    if ((currentChunk + '\n\n' + s).length > maxChars && currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = s;
    } else {
      currentChunk = currentChunk ? (currentChunk + '\n\n' + s) : s;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  return chunks.length > 0 ? chunks : [text];
}

/**
 * Guarantees that survey schema is 100% compliant, options are valid string arrays,
 * and logic_rules (skip, jump, screenout) are properly extracted and linked for SurveyBuilder & Runtime.
 */
export function normalizeSurveySchema(survey) {
  if (!survey) return { title: 'Untitled Survey', questions: [], logic_rules: [] };

  const rawQuestions = Array.isArray(survey.questions) ? survey.questions : [];

  // Phase 1: Normalize basic question structure & IDs
  const normalizedQuestions = rawQuestions.map((q, idx) => {
    let options = [];
    if (Array.isArray(q.options)) {
      options = q.options.map(opt => {
        if (typeof opt === 'string') return opt.trim();
        if (typeof opt === 'object' && opt !== null) {
          return (opt.label || opt.text || opt.value || opt.name || JSON.stringify(opt)).trim();
        }
        return String(opt).trim();
      }).filter(Boolean);
    } else if (typeof q.options === 'object' && q.options !== null) {
      options = Object.values(q.options).map(v => {
        if (typeof v === 'string') return v.trim();
        if (typeof v === 'object' && v !== null) return (v.label || v.text || JSON.stringify(v)).trim();
        return String(v).trim();
      }).filter(Boolean);
    } else if (typeof q.options === 'string') {
      options = q.options.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    }

    const normType = String(q.type || 'single_choice').toLowerCase().replace(/[-]/g, '_');
    let finalType = normType;
    if (normType === 'multiple_choice' || normType === 'multiselect' || normType === 'checkbox') {
      finalType = 'multiple_choice';
    } else if (normType === 'single_choice' || normType === 'radio') {
      finalType = 'single_choice';
    } else if (normType === 'rating' || normType === 'scale') {
      finalType = 'rating_scale';
    }

    if ((finalType === 'single_choice' || finalType === 'multiple_choice') && options.length === 0) {
      options = ['Yes', 'No'];
    }

    let rows = [];
    if (Array.isArray(q.rows)) rows = q.rows;
    else if (Array.isArray(q.matrixRows)) rows = q.matrixRows;
    else if (finalType === 'matrix') rows = options.length > 0 ? options : ['Item 1', 'Item 2'];

    let columns = [];
    if (Array.isArray(q.columns)) columns = q.columns;
    else if (Array.isArray(q.matrixCols)) columns = q.matrixCols;
    else if (Array.isArray(q.matrix_columns)) columns = q.matrix_columns;

    return {
      id: q.id || `q_${idx + 1}`,
      title: q.title || `Question ${idx + 1}`,
      subtitle: q.subtitle || '',
      type: finalType,
      options,
      rows,
      columns,
      rules: Array.isArray(q.rules) ? q.rules : (q.rules ? [q.rules] : [])
    };
  });

  // Phase 2: Build target question ID resolver dictionary
  // Handles targets like "Q5", "q5", "Question 5", "q_5", or exact ID "q5_tuition_type"
  const questionResolver = new Map();
  normalizedQuestions.forEach((q, idx) => {
    const qNum = idx + 1;
    questionResolver.set(q.id.toLowerCase(), q.id);
    questionResolver.set(`q${qNum}`.toLowerCase(), q.id);
    questionResolver.set(`q_${qNum}`.toLowerCase(), q.id);
    questionResolver.set(`question${qNum}`.toLowerCase(), q.id);
    questionResolver.set(`question_${qNum}`.toLowerCase(), q.id);
    questionResolver.set(String(qNum), q.id);
  });

  const resolveTargetId = (rawTarget) => {
    if (!rawTarget) return null;
    const str = String(rawTarget).trim();
    if (['end', 'end_survey', 'complete', 'terminate', 'survey_complete'].includes(str.toLowerCase())) {
      return 'END_SURVEY';
    }
    const cleanKey = str.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (questionResolver.has(cleanKey)) {
      return questionResolver.get(cleanKey);
    }
    // Check if contains a number like "jump to q7"
    const match = str.match(/(?:q|question)?\s*(\d+)/i);
    if (match && questionResolver.has(match[1])) {
      return questionResolver.get(match[1]);
    }
    return str;
  };

  // Phase 3: Compile and standardize all logic_rules (screenout & jump_to)
  const compiledRules = [];
  const seenRuleKeys = new Set();

  const addStandardRule = (rawRule, fallbackTriggerId) => {
    if (!rawRule || typeof rawRule !== 'object') return;

    const triggerId = rawRule.triggerQuestionId || fallbackTriggerId;
    if (!triggerId) return;

    const actionRaw = String(rawRule.action || '').toLowerCase();
    const isScreenout = actionRaw === 'terminate' || actionRaw === 'screenout' || rawRule.screenoutReason || rawRule.reason;
    const action = isScreenout ? 'screenout' : 'jump_to';

    const rawTarget = rawRule.targetQuestionId || rawRule.target || rawRule.jumpTarget;
    const targetQuestionId = isScreenout ? null : (resolveTargetId(rawTarget) || 'END_SURVEY');
    const screenoutReason = isScreenout 
      ? (rawRule.screenoutReason || rawRule.reason || 'Screenout: Qualification criteria not met')
      : null;

    const operator = rawRule.operator || rawRule.condition || 'equals';
    const val = rawRule.value !== undefined ? String(rawRule.value).trim() : '';

    const ruleKey = `${triggerId}_${operator}_${val}_${action}_${targetQuestionId}`;
    if (seenRuleKeys.has(ruleKey)) return;
    seenRuleKeys.add(ruleKey);

    compiledRules.push({
      id: rawRule.id || `rule_${triggerId}_${compiledRules.length + 1}`,
      triggerQuestionId: triggerId,
      operator,
      value: val,
      action,
      targetQuestionId,
      screenoutReason,
      createdAt: rawRule.createdAt || new Date().toISOString()
    });
  };

  // 1. Process top-level survey.logic_rules if present
  if (Array.isArray(survey.logic_rules)) {
    survey.logic_rules.forEach(r => addStandardRule(r));
  }

  // 2. Process question-level rules
  normalizedQuestions.forEach(q => {
    (q.rules || []).forEach(r => addStandardRule(r, q.id));
  });

  // 3. Attach matching standardized rules back onto each question
  normalizedQuestions.forEach(q => {
    q.rules = compiledRules.filter(r => r.triggerQuestionId === q.id);
  });

  return {
    ...survey,
    title: survey.title || 'AI Generated Survey',
    description: survey.description || '',
    targetN: Number(survey.targetN || survey.target_responses) || 400,
    questions: normalizedQuestions,
    logic_rules: compiledRules
  };
}

/**
 * Core AI Ingestion: Calls OpenAI API with Smart Chunking, Progress Telemetry & Noise Filtering
 */
export async function parseSurveyWithOpenAI({
  documentText,
  apiKey = process.env.OPENAI_API_KEY,
  model = 'gpt-4o-mini',
  onProgress = null
}) {
  const activeKey = apiKey || process.env.OPENAI_API_KEY;
  if (!activeKey) {
    throw new Error('OpenAI API Key is missing. Please provide OPENAI_API_KEY in your .env file or enter it in the AI Import modal.');
  }

  onProgress?.(1, 15, 'Cleaning and normalizing document text...');

  // 1. Clean and normalize document text to strip 50-70% unnecessary token bloat
  const cleanedText = cleanSurveyText(documentText);

  // 2. Bound chunk size so each request completes rapidly in 10-20 seconds
  const maxChunkChars = (model === 'gpt-4o') ? 8000 : 11000;
  const chunks = chunkSurveyText(cleanedText, maxChunkChars);

  console.log(`[OpenAI Ingestion] Document length: ${documentText.length} chars -> Cleaned: ${cleanedText.length} chars. Chunks: ${chunks.length}. Model: ${model}`);

  let combinedSurvey = null;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const isFirstChunk = i === 0;

    const currentPercent = Math.round(20 + ((i) / chunks.length) * 55);
    onProgress?.(2, currentPercent, `Parsing questionnaire logic (Section ${i + 1} of ${chunks.length})...`);

    const chunkInstruction = isFirstChunk
      ? SYSTEM_INSTRUCTION
      : `You are continuing the extraction of a questionnaire. 
Extract ONLY the questions and rules present in this section.
Return a valid JSON object matching:
{
  "questions": [
    {
      "id": "qX_name",
      "title": "Question prompt text",
      "subtitle": "Helper subtitle if present",
      "type": "single_choice",
      "options": ["Option 1", "Option 2"],
      "rules": [
        { "operator": "equals", "value": "Val", "action": "screenout", "screenoutReason": "Reason" },
        { "operator": "equals", "value": "Val", "action": "jump_to", "targetQuestionId": "target_id" }
      ]
    }
  ]
}`;

    const prompt = isFirstChunk
      ? `Here is Part 1 of the survey questionnaire brief:\n\n${chunk}\n\nPlease parse this into the strict SurveyBuilder JSON format.`
      : `Here is Part ${i + 1} of ${chunks.length} of the survey questionnaire:\n\n${chunk}\n\nPlease extract all questions and logic in this part into the questions array.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${activeKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: chunkInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const rawJsonText = data.choices?.[0]?.message?.content;
    if (!rawJsonText) {
      throw new Error(`OpenAI did not return content for Chunk ${i + 1}`);
    }

    const parsedChunk = JSON.parse(rawJsonText);

    if (isFirstChunk) {
      combinedSurvey = {
        title: parsedChunk.title || 'AI Generated Survey',
        description: parsedChunk.description || '',
        targetN: parsedChunk.targetN || 400,
        questions: parsedChunk.questions || []
      };
    } else {
      if (Array.isArray(parsedChunk.questions)) {
        combinedSurvey.questions.push(...parsedChunk.questions);
      }
    }

    // Small breathing delay between chunks
    if (chunks.length > 1 && i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 800));
    }
  }

  if (!combinedSurvey || !combinedSurvey.questions || combinedSurvey.questions.length === 0) {
    throw new Error('Failed to extract any valid questions from the document.');
  }

  onProgress?.(3, 80, 'Mapping cross-question jump conditions and screeners...');

  // Deduplicate question IDs and normalize schema
  const seenIds = new Set();
  combinedSurvey.questions.forEach((q, idx) => {
    if (!q.id || seenIds.has(q.id)) {
      q.id = `q_${idx + 1}_${(q.id || 'item').replace(/[^a-z0-9_]/gi, '')}`;
    }
    seenIds.add(q.id);
  });

  const finalNormalizedSurvey = normalizeSurveySchema(combinedSurvey);

  onProgress?.(4, 90, '🤖 Running Virtual Bot Simulator (Screenout & jump verification)...');

  // Run Virtual Bot Simulator on the complete compiled survey
  const simulationReport = runSurveySimulation(finalNormalizedSurvey);

  onProgress?.(5, 100, 'Survey verified & compiled successfully!');

  return {
    survey: finalNormalizedSurvey,
    simulationReport
  };
}

/**
 * Unified Parser: Prioritizes OpenAI with automatic resilient fallback
 */
export async function parseSurveyWithAI({
  documentText,
  pdfBase64 = null,
  apiKey = null,
  model = 'gpt-4o-mini',
  onProgress = null
}) {
  const activeOpenAiKey = apiKey?.startsWith('sk-') ? apiKey : process.env.OPENAI_API_KEY;
  if (activeOpenAiKey) {
    // For large documents over 20,000 chars, always enforce gpt-4o-mini to avoid TPM 30k limit
    const chosenModel = (documentText && documentText.length > 20000) ? 'gpt-4o-mini' : (model || 'gpt-4o-mini');
    return await parseSurveyWithOpenAI({ documentText, apiKey: activeOpenAiKey, model: chosenModel, onProgress });
  }

  onProgress?.(2, 40, 'Parsing questionnaire with Gemini AI...');
  const geminiRes = await parseSurveyWithGemini({ documentText, pdfBase64, apiKey });
  onProgress?.(5, 100, 'Gemini compilation complete!');
  return {
    survey: normalizeSurveySchema(geminiRes.survey),
    simulationReport: geminiRes.simulationReport
  };
}

