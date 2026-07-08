import { Prisma } from '@prisma/client';

interface ChecklistFieldDefinition {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

// Copia os campos de um ChecklistTemplate pro array de checklist de uma
// OS/visita, com resposta em branco — mesmo snapshot usado em
// service-orders.service.ts e visits.service.ts, extraído aqui pra não
// duplicar a montagem do item de resposta nos dois lugares.
export function snapshotChecklistFields(
  fields: unknown,
): Prisma.InputJsonValue[] {
  const typedFields = fields as ChecklistFieldDefinition[];

  return typedFields.map((f) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    required: f.required,
    ...(f.options && { options: f.options }),
    answer: null,
    completed: false,
  })) as Prisma.InputJsonValue[];
}
