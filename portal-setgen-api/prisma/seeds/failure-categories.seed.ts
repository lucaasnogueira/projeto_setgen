import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAILURE_CATEGORIES = [
  'Falha de partida',
  'Superaquecimento',
  'Vazamento de óleo',
  'Ruído anormal',
  'Falha elétrica',
  'Outro',
];

export async function seedFailureCategories() {
  for (const name of FAILURE_CATEGORIES) {
    await prisma.failureCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ ${FAILURE_CATEGORIES.length} categorias de falha criadas/atualizadas`);
}
