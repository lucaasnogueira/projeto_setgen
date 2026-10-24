import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos de tarefa de visita em ordem alfabética
const TASK_TYPES = [
  'Visita Comercial',
  'Visita de Instalação',
  'Visita Emergencial',
  'Visita Técnica Mensal',
  'Visita Técnica Preventiva',
];

export async function seedVisitTaskTypes() {
  const sortedTypes = [...TASK_TYPES].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const name of sortedTypes) {
    await prisma.visitTaskType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ ${sortedTypes.length} tipos de tarefa de visita criados/atualizados em ordem alfabética`);
}
