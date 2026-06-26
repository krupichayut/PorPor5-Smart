const UTF8_BOM = '\uFEFF';

export function downloadTextFile(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function escapeCsvValue(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows, headers) {
  const headerLine = headers.map(header => escapeCsvValue(header.label)).join(',');
  const dataLines = rows.map(row =>
    headers.map(header => escapeCsvValue(row[header.key])).join(',')
  );
  return [headerLine, ...dataLines].join('\r\n');
}

export function downloadCsv(filename, rows, headers) {
  downloadTextFile(filename, UTF8_BOM + toCsv(rows, headers), 'text/csv;charset=utf-8');
}

export function downloadJson(filename, value) {
  downloadTextFile(filename, JSON.stringify(value, null, 2), 'application/json;charset=utf-8');
}

export function parseDelimitedText(text) {
  const delimiter = text.includes('\t') ? '\t' : ',';
  return text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(row => row.trim())
    .map(row => row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')));
}
