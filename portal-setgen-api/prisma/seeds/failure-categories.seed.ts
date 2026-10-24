import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categorias de falha em ordem alfabética
const FAILURE_CATEGORIES = [
  'Falha de partida',
  'Falha elétrica',
  'Outro',
  'Ruído anormal',
  'Superaquecimento',
  'Vazamento de combustível',
  'Vazamento de óleo',
];

export async function seedFailureCategories() {
  const sortedCategories = [...FAILURE_CATEGORIES].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const name of sortedCategories) {
    await prisma.failureCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ ${sortedCategories.length} categorias de falha criadas/atualizadas em ordem alfabética`);
}
