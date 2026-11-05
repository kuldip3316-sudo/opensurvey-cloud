// Market Research Statistical Significance & Crosstab Calculation Engine

/**
 * Perform two-sample pooled proportion Z-test (Standard MR formula used in Q / SPSS)
 * @param {number} x1 - Count in column 1
 * @param {number} n1 - Base in column 1
 * @param {number} x2 - Count in column 2
 * @param {number} n2 - Base in column 2
 * @returns {number} Z-score
 */
export function calculateZScore(x1, n1, x2, n2) {
  if (n1 < 5 || n2 < 5) return 0;
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pooledP = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));
  if (se === 0) return 0;
  return (p1 - p2) / se;
}

/**
 * Compare a column with all other banner columns to find statistically significant differences
 * @param {number} colIdx - Index of the target column
 * @param {Array<{count: number, base: number, colLetter: string}>} colsData
 * @param {number} minConfidence - 0.95 (Z >= 1.96) or 0.90 (Z >= 1.645)
 * @returns {Array<{letter: string, isUpper: boolean}>} Significant letters to display
 */
export function getColumnSignificance(colIdx, colsData, minConfidence = 0.95) {
  const current = colsData[colIdx];
  if (!current || current.base < 10) return [];

  const threshold = minConfidence === 0.90 ? 1.645 : 1.96;
  const highThreshold = 2.58; // 99% confidence
  const letters = [];

  colsData.forEach((other, oIdx) => {
    if (oIdx === colIdx || other.base < 10) return;
    // Do not compare against Total column (usually index 0)
    if (oIdx === 0 || colIdx === 0) return;

    const z = calculateZScore(current.count, current.base, other.count, other.base);
    if (z >= threshold) {
      const isUpper = z >= highThreshold;
      letters.push({
        letter: isUpper ? other.colLetter.toUpperCase() : other.colLetter.toLowerCase(),
        otherLetter: other.colLetter,
        isUpper
      });
    }
  });

  return letters;
}

/**
 * Generate alphabet column letters: A, B, C, ... Z, AA, AB...
 */
export function getColumnLetter(index) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < 26) return alphabet[index];
  return alphabet[Math.floor(index / 26) - 1] + alphabet[index % 26];
}

/**
 * Core Crosstab Aggregation Function
 * Computes frequency counts, Column %, Row %, Total %, and significance testing
 */
export function computeCrosstab({ data, rowExtractor, rowCategories, bannerCols, testSignificance = true }) {
  // 1. Calculate Base for each banner column
  const colBases = bannerCols.map(col => {
    return data.filter(col.filterFn).length;
  });

  const totalRespondents = data.length;

  // 2. Build rows data
  const rows = rowCategories.map(cat => {
    const colStats = bannerCols.map((col, cIdx) => {
      const colSubset = data.filter(col.filterFn);
      const base = colSubset.length;
      
      // Count matching respondents in this cell
      let count = 0;
      for (const item of colSubset) {
        if (rowExtractor(item, cat.id, cat.label)) {
          count++;
        }
      }

      const colPct = base > 0 ? (count / base) * 100 : 0;
      return {
        count,
        base,
        colPct,
        colLetter: getColumnLetter(cIdx)
      };
    });

    // Row total count across all respondents
    const rowTotalCount = colStats[0]?.count ?? 0;

    // Row percentages
    colStats.forEach(stat => {
      stat.rowPct = rowTotalCount > 0 ? (stat.count / rowTotalCount) * 100 : 0;
    });

    // Run significance testing across columns (for Col %)
    if (testSignificance) {
      colStats.forEach((stat, cIdx) => {
        stat.sigLetters = getColumnSignificance(cIdx, colStats);
      });
    }

    return {
      id: cat.id,
      label: cat.label,
      scoreValue: cat.scoreValue, // For Mean / NPS calculation
      colStats
    };
  });

  // 3. Optional Summary Metrics: Mean Rating / Net NPS / Top 2 Box
  const summary = {
    colBases,
    hasMean: rowCategories.some(c => typeof c.scoreValue === 'number'),
    hasNps: rowCategories.some(c => c.npsType)
  };

  if (summary.hasMean) {
    summary.meanByCol = bannerCols.map((col, cIdx) => {
      let sum = 0;
      let ratedBase = 0;
      rows.forEach(r => {
        if (typeof r.scoreValue === 'number') {
          const count = r.colStats[cIdx].count;
          sum += count * r.scoreValue;
          ratedBase += count;
        }
      });
      return ratedBase > 0 ? (sum / ratedBase) : null;
    });
  }

  if (summary.hasNps) {
    summary.npsByCol = bannerCols.map((col, cIdx) => {
      const base = colBases[cIdx];
      if (base === 0) return null;
      let promoters = 0;
      let detractors = 0;
      rows.forEach(r => {
        const cat = rowCategories.find(c => c.id === r.id);
        const count = r.colStats[cIdx].count;
        if (cat?.npsType === 'promoter') promoters += count;
        if (cat?.npsType === 'detractor') detractors += count;
      });
      const pctPromoters = (promoters / base) * 100;
      const pctDetractors = (detractors / base) * 100;
      return Math.round(pctPromoters - pctDetractors);
    });
  }

  return {
    rows,
    colBases,
    bannerCols: bannerCols.map((c, idx) => ({
      ...c,
      letter: getColumnLetter(idx),
      base: colBases[idx]
    })),
    summary,
    totalRespondents
  };
}
