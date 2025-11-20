const escapeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export interface CsvColumn {
  key: string;
  header: string;
  transform?: (value: unknown) => unknown;
}

export const buildCsv = (rows: Record<string, unknown>[], columns: CsvColumn[]): string => {
  const header = columns.map((col) => escapeValue(col.header));
  const data = rows.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key];
        const value = col.transform ? col.transform(raw) : raw;
        return escapeValue(value);
      })
      .join(',')
  );

  return [header.join(','), ...data].join('\n');
};
