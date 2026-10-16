import { Prisma } from '@prisma/client';

interface ChecklistFieldDefinition {
  id: string;
  type: string;
  label: string;
  required: boolean;
  section?: string;
  unit?: string;
  options?: string[];
  appliesTo?: string;
  formula?: string;
}

// Copia os campos de um ChecklistTemplate pro array de checklist de uma
// OS/visita, preservando seção, tipo, unidade, opções e regras normativas.
export function snapshotChecklistFields(
  fields: unknown,
): Prisma.InputJsonValue[] {
  const typedFields = (fields || []) as ChecklistFieldDefinition[];

  return typedFields.map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    required: !!f.required,
    ...(f.section && { section: f.section }),
    ...(f.unit && { unit: f.unit }),
    ...(f.appliesTo && { appliesTo: f.appliesTo }),
    ...(f.formula && { formula: f.formula }),
    ...(f.options && { options: f.options }),
    answer: null,
    completed: false,
  })) as Prisma.InputJsonValue[];
}
