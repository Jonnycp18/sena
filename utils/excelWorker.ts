// Web Worker para parsear archivos Excel sin bloquear la UI
// Usa XLSX para convertir a matriz de filas (sheet_to_json con header:1)

import * as XLSX from 'xlsx';

self.onmessage = (e: MessageEvent) => {
  try {
    const { buffer } = e.data as { buffer: ArrayBuffer };
    if (!buffer) {
      (self as any).postMessage({ type: 'error', message: 'Buffer vacío' });
      return;
    }
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    (self as any).postMessage({ type: 'complete', rows });
  } catch (err: any) {
    (self as any).postMessage({ type: 'error', message: err?.message || 'Error desconocido parseando Excel' });
  }
};
