import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TASK_TYPES = [
  'Visita Técnica Mensal',
  'Visita de Instalação',
  'Visita Emergencial',
  'Visita Comercial',
];

export async function seedVisitTaskTypes() {
  for (const name of TASK_TYPES) {
    await prisma.visitTaskType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ ${TASK_TYPES.length} tipos de tarefa de visita criados/atualizados`);
}
