interface ExportSheet {
  name: string;
  rows: Record<string, string | number>[];
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function rowToXml(values: (string | number)[]): string {
  const cells = values
    .map((value) => {
      if (typeof value === 'number') {
        return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
      }
      return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
    })
    .join('');

  return `<Row>${cells}</Row>`;
}

function sheetToXml(sheet: ExportSheet): string {
  const headers = Object.keys(sheet.rows[0] ?? {});
  const headerRow = rowToXml(headers);
  const bodyRows = sheet.rows
    .map((row) => headers.map((header) => row[header] ?? ''))
    .map((values) => rowToXml(values))
    .join('');

  return `<Worksheet ss:Name="${escapeXml(sheet.name)}"><Table>${headerRow}${bodyRows}</Table></Worksheet>`;
}

export function exportSheetsAsExcelXml(sheets: ExportSheet[], fileName: string): void {
  const workbookBody = sheets.map((sheet) => sheetToXml(sheet)).join('');

  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${workbookBody}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
