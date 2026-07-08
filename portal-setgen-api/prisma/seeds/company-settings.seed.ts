import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCompanySettings() {
  const existing = await prisma.companySettings.findFirst();

  if (existing) {
    console.log('✅ CompanySettings já existe, mantido');
    return;
  }

  await prisma.companySettings.create({
    data: {
      name: 'Setgen & Serviços',
      cnpj: '10.744.400/0001-65',
      phone: '92 98503-9187',
      email: 'comercial02@setgen.com.br',
      address: 'RUA SECUNDARIA 07 N°13 - CIDADE NOVA',
    },
  });

  console.log('✅ CompanySettings criado com dados padrão');
}
