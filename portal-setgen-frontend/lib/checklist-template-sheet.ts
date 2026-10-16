import * as XLSX from 'xlsx';
import { ChecklistFieldDefinition, ChecklistFieldType } from '@/types';
import { GeneratorChecklistItem } from './checklist-generator-data';

export const TEMPLATE_COLUMNS = [
  'ID',
  'Seção',
  'Campo / Item',
  'Tipo',
  'Opções',
  'Unidade',
  'Aplica a',
  'Obrigatório',
] as const;

export const TYPE_LABEL_MAP: Record<ChecklistFieldType, string> = {
  [ChecklistFieldType.CHECKLIST_TRI_STATE]: 'Checklist (OK/NÃO/N/A)',
  [ChecklistFieldType.SINGLE_CHOICE]: 'Seleção única',
  [ChecklistFieldType.MULTIPLE_CHOICE]: 'Seleção múltipla',
  [ChecklistFieldType.NUMBER]: 'Número',
  [ChecklistFieldType.TEXT]: 'Texto',
  [ChecklistFieldType.DATE]: 'Data',
  [ChecklistFieldType.CALCULATED]: 'Calculado',
  [ChecklistFieldType.PHOTO]: 'Foto',
  [ChecklistFieldType.SIGNATURE]: 'Assinatura',
  [ChecklistFieldType.BOOLEAN]: 'Sim/Não',
};

/**
 * Converte o texto da planilha em um ChecklistFieldType válido
 */
export function parseFieldType(typeStr: string = ''): ChecklistFieldType {
  const norm = typeStr.trim().toLowerCase();
  if (norm.includes('ok/não') || norm.includes('ok/nao') || norm.includes('tri') || norm === 'checklist') {
    return ChecklistFieldType.CHECKLIST_TRI_STATE;
  }
  if (norm.includes('única') || norm.includes('unica') || norm === 'select') {
    return ChecklistFieldType.SINGLE_CHOICE;
  }
  if (norm.includes('múltipla') || norm.includes('multipla') || norm.includes('multi')) {
    return ChecklistFieldType.MULTIPLE_CHOICE;
  }
  if (norm.includes('número') || norm.includes('numero') || norm === 'number') {
    return ChecklistFieldType.NUMBER;
  }
  if (norm.includes('data') || norm === 'date') {
    return ChecklistFieldType.DATE;
  }
  if (norm.includes('calculado') || norm.includes('formula')) {
    return ChecklistFieldType.CALCULATED;
  }
  if (norm.includes('foto') || norm === 'photo') {
    return ChecklistFieldType.PHOTO;
  }
  if (norm.includes('assinatura') || norm === 'signature') {
    return ChecklistFieldType.SIGNATURE;
  }
  if (norm.includes('sim/não') || norm.includes('sim/nao') || norm === 'boolean') {
    return ChecklistFieldType.BOOLEAN;
  }
  return ChecklistFieldType.TEXT;
}

/**
 * Exporta uma lista de campos para uma planilha Excel .xlsx
 */
export function exportChecklistTemplateToExcel(
  templateName: string = 'Template_Checklist',
  fields: ChecklistFieldDefinition[]
) {
  const rows: any[][] = [];

  // Cabeçalho
  rows.push([...TEMPLATE_COLUMNS]);

  // Linhas
  fields.forEach((field, index) => {
    const typeLabel = TYPE_LABEL_MAP[field.type] || 'Texto';
    const optionsStr = Array.isArray(field.options) ? field.options.join(' | ') : '';
    rows.push([
      index + 1,
      field.section || 'Geral',
      field.label,
      typeLabel,
      optionsStr,
      field.unit || '',
      field.appliesTo || 'Todos',
      field.required ? 'Sim' : 'Não',
    ]);
  });

  // Instruções de preenchimento
  rows.push([]);
  rows.push(['INSTRUÇÕES PARA CADASTRO DE CHECKLIST VIA PLANILHA']);
  rows.push(['• Seção: Nome do bloco de perguntas (ex: 1. Edificação, 2. Cargas e demanda).']);
  rows.push(['• Campo / Item: Pergunta ou título da verificação.']);
  rows.push(['• Tipo: "Checklist (OK/NÃO/N/A)", "Seleção única", "Seleção múltipla", "Número", "Texto", "Data", "Foto".']);
  rows.push(['• Opções: Para "Seleção única" ou "Seleção múltipla", separe as opções por barra vertical | (ex: 220V | 380V).']);
  rows.push(['• Unidade: kVA, V, A, m, %, etc. (opcional, para campos numéricos).']);
  rows.push(['• Obrigatório: Digite "Sim" ou "Não".']);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Larguras de coluna
  ws['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 45 },
    { wch: 25 },
    { wch: 45 },
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Campos do Checklist');

  const cleanName = templateName.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `${cleanName}.xlsx`);
}

/**
 * Baixa uma planilha modelo limpa com exemplos prontos
 */
export function downloadBlankChecklistTemplateExcel() {
  const exampleFields: ChecklistFieldDefinition[] = [
    {
      id: '1',
      section: '1. Identificação e Ambiente',
      label: 'Local de instalação limpo e desobstruído?',
      type: ChecklistFieldType.CHECKLIST_TRI_STATE,
      required: true,
      appliesTo: 'Todos',
    },
    {
      id: '2',
      section: '1. Identificação e Ambiente',
      label: 'Tipo de Carenagem do Equipamento',
      type: ChecklistFieldType.SINGLE_CHOICE,
      options: ['Carenado / Silenciado', 'Aberto em sala acústica', 'Container marítimo'],
      required: true,
      appliesTo: 'Todos',
    },
    {
      id: '3',
      section: '2. Parâmetros Elétricos',
      label: 'Demanda Máxima Medida',
      type: ChecklistFieldType.NUMBER,
      unit: 'kVA',
      required: true,
      appliesTo: 'Todos',
    },
    {
      id: '4',
      section: '2. Parâmetros Elétricos',
      label: 'Cargas Críticas Alimentadas',
      type: ChecklistFieldType.MULTIPLE_CHOICE,
      options: ['CPD / Servidores', 'Bombas de incêndio', 'Elevadores', 'Iluminação de emergência'],
      required: false,
      appliesTo: 'Todos',
    },
    {
      id: '5',
      section: '3. Evidências',
      label: 'Foto do Quadro Geral de Força (QGF)',
      type: ChecklistFieldType.PHOTO,
      required: false,
      appliesTo: 'Todos',
    },
  ];

  exportChecklistTemplateToExcel('Modelo_Importacao_Checklist_Setgen', exampleFields);
}

/**
 * Importa um arquivo Excel (.xlsx ou .csv) e devolve a lista de campos configurados
 */
export async function importChecklistTemplateFromExcel(
  file: File
): Promise<{ fields: ChecklistFieldDefinition[]; detectedSections: string[] }> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];

  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('A planilha está vazia');
  }

  // Encontrar cabeçalho
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    const joined = row.map((cell: any) => String(cell).toLowerCase().trim()).join(' ');
    if (joined.includes('campo') || joined.includes('item') || joined.includes('seção') || joined.includes('secao')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Cabeçalho com "Campo / Item" ou "Seção" não encontrado na planilha');
  }

  const header = rawRows[headerRowIndex].map((c: any) => String(c).trim().toLowerCase());

  // Mapear índices das colunas
  const colIndex = {
    id: header.findIndex((h) => h === 'id'),
    section: header.findIndex((h) => h.includes('seção') || h.includes('secao')),
    field: header.findIndex((h) => h.includes('campo') || h.includes('item') || h.includes('pergunta')),
    type: header.findIndex((h) => h.includes('tipo')),
    options: header.findIndex((h) => h.includes('opções') || h.includes('opcoes') || h.includes('alternativas')),
    unit: header.findIndex((h) => h.includes('unidade')),
    appliesTo: header.findIndex((h) => h.includes('aplica')),
    required: header.findIndex((h) => h.includes('obrigat')),
  };

  if (colIndex.field === -1) {
    throw new Error('Coluna "Campo / Item" obrigatória não foi encontrada');
  }

  const fields: ChecklistFieldDefinition[] = [];
  const sectionsSet = new Set<string>();

  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const fieldLabel = String(row[colIndex.field] || '').trim();
    if (!fieldLabel) continue;

    // Se a linha for instrução, ignora
    if (fieldLabel.toLowerCase().includes('instruç') || fieldLabel.toLowerCase().includes('como preencher')) {
      continue;
    }

    const section = colIndex.section !== -1 && row[colIndex.section]
      ? String(row[colIndex.section]).trim()
      : 'Geral';

    sectionsSet.add(section);

    const typeStr = colIndex.type !== -1 ? String(row[colIndex.type] || '') : '';
    const fieldType = parseFieldType(typeStr);

    // Opções
    let options: string[] | undefined = undefined;
    if (colIndex.options !== -1 && row[colIndex.options]) {
      const rawOptions = String(row[colIndex.options]);
      options = rawOptions
        .split(/[|;]/)
        .map((o) => o.trim())
        .filter(Boolean);
    }

    // Unidade
    const unit = colIndex.unit !== -1 && row[colIndex.unit] ? String(row[colIndex.unit]).trim() : undefined;

    // Aplica a
    const appliesTo = colIndex.appliesTo !== -1 && row[colIndex.appliesTo]
      ? String(row[colIndex.appliesTo]).trim()
      : undefined;

    // Obrigatório
    const reqStr = colIndex.required !== -1 ? String(row[colIndex.required]).trim().toLowerCase() : '';
    const required = reqStr === 'sim' || reqStr === 'true' || reqStr === 's';

    fields.push({
      id: crypto.randomUUID(),
      section,
      label: fieldLabel,
      type: fieldType,
      options: options && options.length > 0 ? options : undefined,
      unit: unit || undefined,
      appliesTo: appliesTo || undefined,
      required,
    });
  }

  if (fields.length === 0) {
    throw new Error('Nenhum campo válido foi encontrado para importação na planilha');
  }

    return {
      fields,
      detectedSections: Array.from(sectionsSet),
    };
  }

  /**
   * Converte os campos de um template customizado para o formato do editor de checklist
   */
  export function convertTemplateFieldsToChecklistItems(
    fields: ChecklistFieldDefinition[]
  ): GeneratorChecklistItem[] {
    return fields.map((f, idx) => {
      let itemType: GeneratorChecklistItem['type'] = 'Texto';
      if (f.type === ChecklistFieldType.CHECKLIST_TRI_STATE) itemType = 'Checklist (OK/NÃO/N/A)';
      else if (f.type === ChecklistFieldType.SINGLE_CHOICE) itemType = 'Seleção única';
      else if (f.type === ChecklistFieldType.MULTIPLE_CHOICE) itemType = 'Seleção múltipla';
      else if (f.type === ChecklistFieldType.NUMBER) itemType = 'Número';
      else if (f.type === ChecklistFieldType.DATE) itemType = 'Data';
      else if (f.type === ChecklistFieldType.CALCULATED) itemType = 'Calculado';

      return {
        id: idx + 1,
        section: f.section || '1. Geral',
        field: f.label,
        type: itemType,
        options: f.options,
        unit: f.unit,
        appliesTo: f.appliesTo || 'Todos',
        answer: '',
        notes: '',
      };
    });
  }

