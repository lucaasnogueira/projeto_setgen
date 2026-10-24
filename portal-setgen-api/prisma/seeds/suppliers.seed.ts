import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPPLIERS = [
  {
    name: 'Caterpillar Distribuidora Brasil',
    cnpj: '61.064.923/0001-30',
    contact: 'Vendas de Peças Cat',
    email: 'pecas@catdistribuidora.com.br',
    phone: '(11) 4004-1234',
  },
  {
    name: 'Cummins Motores e Geradores Brasil',
    cnpj: '61.065.151/0001-05',
    contact: 'Departamento de Peças e Filtros Fleetguard',
    email: 'contato@cumminsbrasil.com.br',
    phone: '(11) 2186-4000',
  },
  {
    name: 'Filtros Mann & Hummel do Brasil Ltda',
    cnpj: '60.701.190/0001-08',
    contact: 'Distribuição Técnica de Filtros',
    email: 'vendas@mann-hummel.com.br',
    phone: '(19) 3894-9000',
  },
  {
    name: 'Moura Baterias Industriais',
    cnpj: '10.970.627/0001-08',
    contact: 'Linha Geradores e Estacionárias',
    email: 'atendimento@moura.com.br',
    phone: '(81) 3726-1000',
  },
  {
    name: 'Shell Lubrificantes Industriais',
    cnpj: '33.584.924/0001-49',
    contact: 'Distribuidor Autorizado Rimula',
    email: 'oleos@lubrificantes-dist.com.br',
    phone: '(11) 3003-7435',
  },
  {
    name: 'WEG Motores e Automação S.A.',
    cnpj: '84.429.695/0001-11',
    contact: 'Linha Alternadores e Automação QTA',
    email: 'vendas@weg.net',
    phone: '(47) 3276-4000',
  },
];

export async function seedSuppliers() {
  const sortedSuppliers = [...SUPPLIERS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  for (const sup of sortedSuppliers) {
    if (sup.cnpj) {
      await prisma.supplier.upsert({
        where: { cnpj: sup.cnpj },
        update: {
          name: sup.name,
          contact: sup.contact,
          email: sup.email,
          phone: sup.phone,
          active: true,
        },
        create: {
          name: sup.name,
          cnpj: sup.cnpj,
          contact: sup.contact,
          email: sup.email,
          phone: sup.phone,
          active: true,
        },
      });
    }
  }

  console.log(`✅ ${sortedSuppliers.length} fornecedores criados/atualizados em ordem alfabética`);
}

