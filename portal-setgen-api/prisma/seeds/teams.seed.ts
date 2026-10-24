import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEAMS = [
  {
    name: 'Equipe Campo - Instalação & Projetos',
    description: 'Instalação de grupos geradores, subestações, quadros de transferência (QTA) e comissionamento.',
  },
  {
    name: 'Equipe Campo - Manutenção Preventiva',
    description: 'Rotinas periódicas, troca de filtros, fluidos, medição de grandezas elétricas e checklists.',
  },
  {
    name: 'Equipe Campo - Plantão Emergencial',
    description: 'Atendimento 24/7 a falhas críticas, paradas inesperadas e restabelecimento emergencial de energia.',
  },
  {
    name: 'Equipe Comercial & Novos Negócios',
    description: 'Vendas consultivas, orçamentos, contratos de manutenção e expansão de clientes.',
  },
  {
    name: 'Equipe Suporte Técnico & Diagnóstico',
    description: 'Análise de falhas complexas, telemetria, relatórios técnicos avançados e engenharia de aplicação.',
  },
];

export async function seedTeams() {
  const sortedTeams = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  for (const team of sortedTeams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: {
        description: team.description,
        active: true,
      },
      create: {
        name: team.name,
        description: team.description,
        active: true,
      },
    });
  }

  console.log(`✅ ${sortedTeams.length} equipes operacionais criadas/atualizadas em ordem alfabética`);
}

