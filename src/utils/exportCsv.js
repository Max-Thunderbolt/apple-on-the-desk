function escapeCsvCell(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * @param {string} filename
 * @param {Array<Record<string, unknown>>} rows
 * @param {Array<{ key: string, label: string }>} columns
 */
export function downloadCsv(filename, rows, columns) {
  if (!rows?.length || !columns?.length) return;

  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.key])).join(',')
  );
  const csv = `\uFEFF${header}\n${body.join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function computeMean(values) {
  if (!values?.length) return null;
  return values.reduce((s, x) => s + x, 0) / values.length;
}

export function formatDelta(value, avg, suffix = '') {
  if (value == null || avg == null) return '—';
  const delta = value - avg;
  const sign = delta > 0 ? '+' : '';
  if (suffix === '%' && avg !== 0) {
    const pct = ((value - avg) / avg) * 100;
    return `${sign}${pct.toFixed(1)}%`;
  }
  return `${sign}${delta.toFixed(1)}${suffix}`;
}
