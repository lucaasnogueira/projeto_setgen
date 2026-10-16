import * as XLSX from 'xlsx';
import { GeneratorChecklistItem, CHECKLIST_INSTRUCTIONS, DEFAULT_GENERATOR_CHECKLIST } from './checklist-generator-data';

export const CHECKLIST_COLUMNS = [
  'ID',
  'Seção',
  'Campo / Item',
  'Tipo (só consulta)',
  'Opções (só consulta)',
  'Unidade',
  'Aplica a (só consulta)',
  'Resposta',
  'Observações',
] as const;

/**
 * Exporta o checklist atual para um arquivo .xlsx fiel à planilha do cliente
 */
export function exportChecklistToExcel(items: GeneratorChecklistItem[], visitCode: string = 'GERADOR') {
  const rows: any[][] = [];

  // Cabeçalho das 9 colunas
  rows.push([...CHECKLIST_COLUMNS]);

  // Linhas de dados (IDs 1 a 114)
  items.forEach((item) => {
    // Se for calculado (item 97), calcula o valor na hora da exportação se ainda não estiver calculado
    let answer = item.answer || '';
    if (item.type === 'Calculado' && item.id === 97) {
      const demandaItem = items.find((i) => i.id === 23);
      const margemItem = items.find((i) => i.id === 96);
      const demanda = Number(demandaItem?.answer) || 0;
      const margem = Number(margemItem?.answer) || 20;
      if (demanda > 0) {
        answer = (demanda * (1 + margem / 100)).toFixed(1);
      }
    }

    rows.push([
      item.id,
      item.section,
      item.field,
      item.type,
      item.options ? item.options.join(' | ') : '',
      item.unit || '',
      item.appliesTo || 'Todos',
      answer,
      item.notes || '',
    ]);
  });

  // Linhas em branco antes das instruções
  rows.push([]);
  rows.push([]);

  // Instruções de preenchimento
  CHECKLIST_INSTRUCTIONS.forEach((line) => {
    rows.push([line]);
  });

  // Criar WorkBook
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Definir larguras de colunas
  ws['!cols'] = [
    { wch: 6 },   // ID
    { wch: 32 },  // Seção
    { wch: 45 },  // Campo / Item
    { wch: 22 },  // Tipo
    { wch: 50 },  // Opções
    { wch: 10 },  // Unidade
    { wch: 18 },  // Aplica a
    { wch: 35 },  // Resposta
    { wch: 40 },  // Observações
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Visita Técnica Gerador');

  const cleanCode = visitCode.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Visita_Tecnica_Grupo_Gerador_${cleanCode}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Importa um arquivo Excel ou CSV e atualiza o checklist
 */
export async function importChecklistFromExcel(
  file: File,
  currentItems: GeneratorChecklistItem[] = DEFAULT_GENERATOR_CHECKLIST
): Promise<{ items: GeneratorChecklistItem[]; updatedCount: number }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('A planilha está vazia');
  }

  // Localizar a linha do cabeçalho
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    const joined = row.map((c) => String(c).toLowerCase().trim()).join(' ');
    if (joined.includes('campo') || joined.includes('resposta') || (joined.includes('id') && joined.includes('seção'))) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0; // fallback para primeira linha
  }

  const headerRow = rawRows[headerRowIndex].map((c) => String(c).toLowerCase().trim());

  // Encontrar índices das colunas
  const idColIdx = headerRow.findIndex((c) => c === 'id');
  const fieldColIdx = headerRow.findIndex((c) => c.includes('campo') || c.includes('item'));
  const answerColIdx = headerRow.findIndex((c) => c.includes('resposta'));
  const notesColIdx = headerRow.findIndex((c) => c.includes('observa'));

  if (answerColIdx === -1 && fieldColIdx === -1) {
    throw new Error('Não foi possível identificar a coluna "Resposta" ou "Campo / Item" na planilha.');
  }

  // Mapear respostas por ID e por Nome do Campo
  const answersById = new Map<number, { answer: string; notes?: string }>();
  const answersByField = new Map<string, { answer: string; notes?: string }>();

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const firstCell = String(row[0] || '').trim();
    // Parar se atingir o rodapé de instruções
    if (firstCell.startsWith('VISITA TÉCNICA') || firstCell.startsWith('•')) {
      continue;
    }

    const idVal = idColIdx !== -1 ? Number(row[idColIdx]) : NaN;
    const fieldVal = fieldColIdx !== -1 ? String(row[fieldColIdx] || '').trim() : '';
    const answerVal = answerColIdx !== -1 ? String(row[answerColIdx] ?? '').trim() : '';
    const notesVal = notesColIdx !== -1 ? String(row[notesColIdx] ?? '').trim() : '';

    if (!isNaN(idVal) && idVal > 0) {
      answersById.set(idVal, { answer: answerVal, notes: notesVal });
    }
    if (fieldVal) {
      answersByField.set(fieldVal.toLowerCase(), { answer: answerVal, notes: notesVal });
    }
  }

  // Mesclar com os itens atuais do checklist
  let updatedCount = 0;
  const newItems = currentItems.map((item) => {
    const byId = answersById.get(item.id);
    const byField = answersByField.get(item.field.toLowerCase());

    const match = byId || byField;
    if (match !== undefined) {
      const hasAnswer = match.answer !== undefined && match.answer !== '';
      const hasNotes = match.notes !== undefined && match.notes !== '';
      if (hasAnswer || hasNotes) {
        updatedCount++;
        return {
          ...item,
          answer: hasAnswer ? match.answer : item.answer,
          notes: hasNotes ? match.notes : item.notes,
        };
      }
    }
    return item;
  });

  // Recalcular campo 97 se demanda (23) ou margem (96) tiverem mudado
  const item97 = newItems.find((i) => i.id === 97);
  if (item97) {
    const demanda = Number(newItems.find((i) => i.id === 23)?.answer) || 0;
    const margem = Number(newItems.find((i) => i.id === 96)?.answer) || 20;
    if (demanda > 0) {
      item97.answer = (demanda * (1 + margem / 100)).toFixed(1);
    }
  }

  return { items: newItems, updatedCount };
}

