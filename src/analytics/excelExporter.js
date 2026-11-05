import * as XLSX from 'xlsx';

/**
 * Export a single crosstab table to Excel (.xlsx)
 */
export function exportSingleCrosstabToExcel({ crosstabResult, question, bannerName, metricMode = 'colPct' }) {
  const wb = XLSX.utils.book_new();

  const dataRows = [];
  // Title & Metadata
  dataRows.push([question.title]);
  dataRows.push([`Banner Split: ${bannerName}`]);
  dataRows.push([`Metric Displayed: ${metricMode === 'colPct' ? 'Column %' : metricMode === 'count' ? 'Frequency Count' : 'Row %'}`]);
  dataRows.push([]); // blank separator

  // Header Row 1: Column Letters & Labels
  const headerRow = ['Categories / Response Options'];
  crosstabResult.bannerCols.forEach(col => {
    headerRow.push(`[${col.letter}] ${col.label}`);
  });
  dataRows.push(headerRow);

  // Header Row 2: Base (N)
  const baseRow = ['Base (Total Respondents)'];
  crosstabResult.bannerCols.forEach(col => {
    baseRow.push(col.base);
  });
  dataRows.push(baseRow);

  // Question Rows
  crosstabResult.rows.forEach(r => {
    const row = [r.label];
    r.colStats.forEach(stat => {
      if (metricMode === 'count') {
        row.push(stat.count);
      } else if (metricMode === 'rowPct') {
        row.push(`${stat.rowPct.toFixed(1)}%`);
      } else {
        // Col % with significance letters
        const sig = stat.sigLetters && stat.sigLetters.length > 0
          ? ` (${stat.sigLetters.map(s => s.letter).join('')})`
          : '';
        row.push(`${stat.colPct.toFixed(1)}%${sig}`);
      }
    });
    dataRows.push(row);
  });

  // Summary Metrics (Mean / NPS if available)
  if (crosstabResult.summary.hasMean && crosstabResult.summary.meanByCol) {
    const meanRow = ['Mean Rating (Scale 1–5)'];
    crosstabResult.summary.meanByCol.forEach(m => {
      meanRow.push(m !== null ? m.toFixed(2) : '-');
    });
    dataRows.push(meanRow);
  }

  if (crosstabResult.summary.hasNps && crosstabResult.summary.npsByCol) {
    const npsRow = ['Net Promoter Score (NPS)'];
    crosstabResult.summary.npsByCol.forEach(n => {
      npsRow.push(n !== null ? n : '-');
    });
    dataRows.push(npsRow);
  }

  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  
  // Set column widths
  ws['!cols'] = [{ wch: 45 }, ...crosstabResult.bannerCols.map(() => ({ wch: 22 }))];

  const sheetName = question.id.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanFilename = `${question.id}_crosstab_${bannerName.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}

/**
 * Export ALL Survey Questions tabulated against the active banner into a comprehensive Multi-Sheet Excel Workbook
 */
export function exportFullReportBookToExcel({ allTables, bannerName, metricMode = 'colPct' }) {
  const wb = XLSX.utils.book_new();

  allTables.forEach(({ question, crosstabResult }) => {
    const dataRows = [];
    dataRows.push([question.title]);
    dataRows.push([`Banner Split: ${bannerName} | Metric: ${metricMode === 'colPct' ? 'Column %' : 'Count'}`]);
    dataRows.push([]);

    const headerRow = ['Categories / Response Options'];
    crosstabResult.bannerCols.forEach(col => {
      headerRow.push(`[${col.letter}] ${col.label}`);
    });
    dataRows.push(headerRow);

    const baseRow = ['Base (Total Respondents)'];
    crosstabResult.bannerCols.forEach(col => {
      baseRow.push(col.base);
    });
    dataRows.push(baseRow);

    crosstabResult.rows.forEach(r => {
      const row = [r.label];
      r.colStats.forEach(stat => {
        if (metricMode === 'count') {
          row.push(stat.count);
        } else {
          const sig = stat.sigLetters && stat.sigLetters.length > 0
            ? ` (${stat.sigLetters.map(s => s.letter).join('')})`
            : '';
          row.push(`${stat.colPct.toFixed(1)}%${sig}`);
        }
      });
      dataRows.push(row);
    });

    if (crosstabResult.summary.hasMean && crosstabResult.summary.meanByCol) {
      const meanRow = ['Mean Rating (Scale 1–5)'];
      crosstabResult.summary.meanByCol.forEach(m => {
        meanRow.push(m !== null ? m.toFixed(2) : '-');
      });
      dataRows.push(meanRow);
    }

    if (crosstabResult.summary.hasNps && crosstabResult.summary.npsByCol) {
      const npsRow = ['Net Promoter Score (NPS)'];
      crosstabResult.summary.npsByCol.forEach(n => {
        npsRow.push(n !== null ? n : '-');
      });
      dataRows.push(npsRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(dataRows);
    ws['!cols'] = [{ wch: 45 }, ...crosstabResult.bannerCols.map(() => ({ wch: 22 }))];

    const safeSheetName = question.id.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  });

  const cleanFilename = `Singapore_Tuition_Survey_Crosstab_Book_${bannerName.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}
