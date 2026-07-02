import * as XLSX from 'xlsx';

/**
 * Exporta um array de objetos para um arquivo Excel (.xlsx)
 * @param data Array de objetos com os dados
 * @param fileName Nome do arquivo (sem extensão)
 * @param sheetName Nome da aba dentro do Excel
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Relatório') => {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Gera o buffer e faz o download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Exporta dados formatados para CSV
 */
export const exportToCsv = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;

  const replacer = (key: string, value: any) => value === null ? '' : value;
  const header = Object.keys(data[0]);
  const csv = [
    header.join(','),
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
