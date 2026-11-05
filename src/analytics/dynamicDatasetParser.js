import * as XLSX from 'xlsx';

/**
 * Parses an uploaded File (.xlsx or .csv) and returns JSON records + auto-detected schema
 * @param {File} file
 * @returns {Promise<{ records: Array<object>, questions: Array<object>, banners: Array<object>, filename: string }>}
 */
export async function parseUploadedSurveyFile(file) {
    return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Parse to JSON array of objects
        const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('Uploaded file is empty or could not be read.');
        }

        // Auto-detect question metadata & columns
        const { records: cleanedRecords, questions, banners } = analyzeDatasetSchema(rawJson);

        resolve({
          records: cleanedRecords,
          questions,
          banners,
          filename: file.name,
          totalRows: cleanedRecords.length
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parses raw CSV or TSV text (e.g. pasted directly from clipboard/Excel)
 * @param {string} rawText
 * @param {string} [filename]
 */
export function parseRawCsvOrTsvText(rawText, filename = 'Pasted_Data.csv') {
  if (!rawText || !rawText.trim()) {
    throw new Error('Pasted data is empty. Please paste CSV or TSV text.');
  }
  const workbook = XLSX.read(rawText.trim(), { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  const rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawJson || rawJson.length === 0) {
    throw new Error('Could not parse any rows from the pasted text. Ensure it has header columns and rows.');
  }

  const { records: cleanedRecords, questions, banners } = analyzeDatasetSchema(rawJson);

  return {
    records: cleanedRecords,
    questions,
    banners,
    filename,
    totalRows: cleanedRecords.length
  };
}

/**
 * Analyze a flat JSON dataset and auto-generate Questions & Banners for cross-tabulation
 */
export function analyzeDatasetSchema(rawJson) {
  if (!rawJson || rawJson.length === 0) return { records: [], questions: [], banners: [] };

  const firstRow = rawJson[0];
  const allKeys = Object.keys(firstRow);

  // Check for Qualtrics 3-row header (Row 1 = Variable, Row 2 = Question Text, Row 3 = ImportId)
  let records = rawJson;
  const questionTitleMap = {};

  if (rawJson.length >= 3) {
    const row0 = rawJson[0];
    const row1 = rawJson[1];
    const isQualtrics = Object.values(row1).some(v => typeof v === 'string' && (v.includes('ImportId') || v.includes('{"ImportId')));
    if (isQualtrics) {
      allKeys.forEach(k => {
        if (row0[k] && String(row0[k]).trim()) {
          questionTitleMap[k] = String(row0[k]).trim();
        }
      });
      records = rawJson.slice(2);
    }
  }

  const questions = [];
  const banners = [];

  allKeys.forEach((key, colIdx) => {
    // Collect distinct values across first 1000 rows
    const valueSet = new Set();
    records.slice(0, 1000).forEach(r => {
      const v = r[key];
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        valueSet.add(String(v).trim());
      }
    });

    const distinctValues = Array.from(valueSet);
    const distinctCount = distinctValues.length;

    // Skip ID columns or columns with too many unique values (e.g. open text, timestamps)
    const isId = key.toLowerCase().includes('id') || key.toLowerCase().includes('timestamp');
    if (distinctCount === 0 || (distinctCount > 40 && !isId)) return;

    // Check if numeric scale (e.g. 1-5, 0-10)
    const isNumericScale = distinctValues.every(v => !isNaN(Number(v))) && distinctCount >= 3 && distinctCount <= 11;
    const isLikert = distinctValues.some(v => ['satisfied', 'likely', 'agree', 'neutral'].some(w => v.toLowerCase().includes(w)));

    const categories = distinctValues.slice(0, 25).map(val => ({
      id: val,
      label: val,
      scoreValue: isNumericScale ? Number(val) : undefined
    }));

    // Create Question Definition
    const qTitle = questionTitleMap[key] ? `${key}: ${questionTitleMap[key]}` : key;
    const qObj = {
      id: key,
      section: 'Imported Dataset',
      title: qTitle,
      type: isNumericScale || isLikert ? 'rating_scale' : (distinctCount === 2 ? 'binary' : 'single_choice'),
      categories,
      extractor: (r, catId, label) => String(r[key] ?? '').trim() === label
    };

    questions.push(qObj);

    // If reasonable number of distinct values (2 to 8), create a dynamic Banner split
    if (distinctCount >= 2 && distinctCount <= 8) {
      banners.push({
        id: `banner_${key}`,
        name: key.length > 25 ? key.substring(0, 23) + '...' : key,
        description: `Split by ${key}`,
        columns: [
          { id: 'total', label: 'Total', filterFn: () => true },
          ...distinctValues.slice(0, 8).map(val => ({
            id: `col_${val}`,
            label: val.length > 20 ? val.substring(0, 18) + '...' : val,
            filterFn: (r) => String(r[key] ?? '').trim() === val
          }))
        ]
      });
    }
  });

  return { records, questions, banners };
}

/**
 * Build a dynamic Banner from ANY single question / column on the fly
 */
export function buildDynamicBannerFromQuestion(question, dataset) {
  // Extract distinct values
  const valMap = new Map();
  question.categories.forEach(cat => {
    valMap.set(cat.id, cat.label);
  });

  const columns = [
    { id: 'total', label: 'Total', filterFn: () => true }
  ];

  question.categories.slice(0, 10).forEach(cat => {
    columns.push({
      id: `dyn_${cat.id}`,
      label: cat.label.length > 24 ? cat.label.substring(0, 22) + '...' : cat.label,
      fullLabel: cat.label,
      filterFn: (r) => question.extractor(r, cat.id, cat.label)
    });
  });

  return {
    id: `dyn_banner_${question.id}`,
    name: question.title.length > 30 ? question.title.substring(0, 28) + '...' : question.title,
    description: `Dynamic Banner: ${question.title}`,
    columns
  };
}

/**
 * Parse Supabase Survey and Responses into Tabulation Studio dataset
 */
export function parseSupabaseSurveyDataset(survey, rawResponses) {
  let surveyQuestions = [];
  if (Array.isArray(survey?.questions)) {
    surveyQuestions = survey.questions;
  } else if (typeof survey?.questions === 'string' && survey.questions.trim().startsWith('[')) {
    try {
      surveyQuestions = JSON.parse(survey.questions);
    } catch (e) {}
  }

  if (!rawResponses || rawResponses.length === 0) {
    const questions = surveyQuestions.map(q => {
      const rawOptions = Array.isArray(q.options) ? q.options : [];
      const categories = rawOptions.map(opt => {
        const val = typeof opt === 'object' ? (opt.label || opt.text || opt.id) : String(opt);
        return {
          id: String(val),
          label: String(val),
          scoreValue: (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 10) ? Number(val) : undefined
        };
      });
      return {
        id: q.id,
        section: 'Survey Variables',
        title: `${q.id}: ${q.title || q.id}`,
        type: q.type || 'single_choice',
        categories,
        extractor: (r, catId, label) => String(r[q.id] ?? '').trim() === label
      };
    });

    return {
      records: [],
      questions,
      banners: [
        {
          id: 'banner_total',
          name: 'Total Sample',
          description: 'Overall Sample Total',
          columns: [{ id: 'total', label: 'Total', filterFn: () => true }]
        }
      ],
      filename: `Cloud DB: ${survey?.title || 'Survey'} (0 Responses)`,
      totalRows: 0
    };
  }

  // Flatten response answers
  const records = rawResponses.map((r, idx) => {
    const flat = {
      respondent_id: r.respondent_id || `RESP_${idx + 1}`,
      status: String(r.status || 'QUALIFIED').toUpperCase(),
      duration_seconds: r.duration_seconds || 0
    };

    const answers = r.answers || {};
    Object.entries(answers).forEach(([k, v]) => {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        Object.entries(v).forEach(([subK, subV]) => {
          flat[`${k}_${subK}`] = subV;
        });
      } else if (Array.isArray(v)) {
        flat[k] = v.join('; ');
      } else {
        flat[k] = v;
      }
    });

    return flat;
  });

  // Use analyzeDatasetSchema for deep robust column detection
  const analyzed = analyzeDatasetSchema(records);

  // If survey questions exist, enhance titles
  if (surveyQuestions.length > 0) {
    const qMap = new Map(surveyQuestions.map(q => [q.id, q]));
    analyzed.questions.forEach(q => {
      const baseId = q.id.split('__loop_')[0].split('_')[0] + '_' + (q.id.split('_')[1] || '');
      const original = qMap.get(q.id) || qMap.get(baseId);
      if (original?.title) {
        q.title = `${q.id}: ${original.title}`;
      }
    });
  }

  const banners = analyzed.banners.length > 0 ? analyzed.banners : [
    {
      id: 'banner_total',
      name: 'Total Sample',
      description: 'Overall Sample Total',
      columns: [{ id: 'total', label: 'Total', filterFn: () => true }]
    }
  ];

  return {
    records: analyzed.records,
    questions: analyzed.questions,
    banners,
    filename: `Cloud DB: ${survey?.title || 'Survey'} (${records.length} N)`,
    totalRows: records.length
  };
}

