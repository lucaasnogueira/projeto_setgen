import { PrismaClient, ClientTaxonomyKind } from '@prisma/client';

const prisma = new PrismaClient();

// Segmentos de mercado em ordem alfabética estrita
const SEGMENTS: { name: string; color?: string }[] = [
  { name: 'Agronegócio / Fazendas', color: '#16a34a' },
  { name: 'Bancário / Instituições Financeiras', color: '#0284c7' },
  { name: 'Centros de Distribuição / Logística', color: '#d97706' },
  { name: 'Comércio / Shopping Centers', color: '#f59e0b' },
  { name: 'Condomínios Residenciais e Comerciais', color: '#8b5cf6' },
  { name: 'Construção Civil / Obras', color: '#ea580c' },
  { name: 'Data Centers / TI', color: '#06b6d4' },
  { name: 'Educação / Universidades', color: '#3b82f6' },
  { name: 'Eventos / Entretenimento', color: '#ec4899' },
  { name: 'Hospitalar / Clínicas e Saúde', color: '#ef4444' },
  { name: 'Hotelaria e Turismo', color: '#10b981' },
  { name: 'Indústria / Manufatura', color: '#64748b' },
  { name: 'Mineração', color: '#78716c' },
  { name: 'Órgãos Públicos / Governamentais', color: '#6366f1' },
  { name: 'Postos de Combustíveis', color: '#f97316' },
  { name: 'Supermercados e Atacados', color: '#84cc16' },
  { name: 'Telecomunicações / Provedores', color: '#14b8a6' },
];

// Grupos de clientes em ordem alfabética estrita
const GROUPS: { name: string; color?: string }[] = [
  { name: 'Contrato Anual 24/7', color: '#dc2626' },
  { name: 'Contrato Bimestral Preventivo', color: '#f59e0b' },
  { name: 'Contrato Mensal Preventivo', color: '#16a34a' },
  { name: 'Contrato Semestral Preventivo', color: '#0ea5e9' },
  { name: 'Grandes Contas / Corporativo', color: '#8b5cf6' },
  { name: 'Locação de Grupos Geradores', color: '#d97706' },
  { name: 'Spot / Atendimento Avulso', color: '#64748b' },
];

export async function seedClientTaxonomies() {
  // Ordenação alfabética garantida
  const sortedSegments = [...SEGMENTS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  for (const seg of sortedSegments) {
    await prisma.clientTaxonomy.upsert({
      where: {
        kind_name: {
          kind: ClientTaxonomyKind.SEGMENT,
          name: seg.name,
        },
      },
      update: {
        color: seg.color,
        active: true,
      },
      create: {
        kind: ClientTaxonomyKind.SEGMENT,
        name: seg.name,
        color: seg.color,
        active: true,
      },
    });
  }

  const sortedGroups = [...GROUPS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  for (const grp of sortedGroups) {
    await prisma.clientTaxonomy.upsert({
      where: {
        kind_name: {
          kind: ClientTaxonomyKind.GROUP,
          name: grp.name,
        },
      },
      update: {
        color: grp.color,
        active: true,
      },
      create: {
        kind: ClientTaxonomyKind.GROUP,
        name: grp.name,
        color: grp.color,
        active: true,
      },
    });
  }

  console.log(`✅ ${sortedSegments.length} segmentos e ${sortedGroups.length} grupos de clientes criados/atualizados em ordem alfabética`);
}

