// src/utils/excelExport.js
import * as XLSX from 'xlsx';

export function exportToExcel(data, fileName, summary = {}) {
  // Crear hoja de cálculo
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Agregar resumen al principio (opcional)
  if (summary && Object.keys(summary).length > 0) {
    const summaryRows = Object.entries(summary).map(([key, value]) => ({ [key]: value }));
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows, { header: ['Clave', 'Valor'] });
    XLSX.utils.sheet_add_aoa(worksheet, [['Resumen']], { origin: 'A1' });
    XLSX.utils.sheet_add_json(worksheet, summaryRows, { origin: 'A2', skipHeader: true });
  }

  // Crear libro de trabajo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

  // Descargar archivo
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}