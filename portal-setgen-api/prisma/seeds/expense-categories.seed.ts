import { PrismaClient, ExpenseCategoryType, ExpenseGroup } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedExpenseCategories() {
  const categories = [
    // Despesas em Serviço
    {
      name: 'Combustível',
      code: 'COMB',
      type: ExpenseCategoryType.OPERATIONAL,
      group: ExpenseGroup.SERVICE_EXPENSES,
      description: 'Gasolina, diesel, etanol',
      color: '#ef4444',
      icon: 'Fuel',
    },
    {
      name: 'Alimentação',
      code: 'ALIM',
      type: ExpenseCategoryType.OPERATIONAL,
      group: ExpenseGroup.SERVICE_EXPENSES,
      description: 'Almoço, jantar, lanches',
      color: '#f97316',
      icon: 'UtensilsCrossed',
    },
    {
      name: 'Transporte',
      code: 'TRANS',
      type: ExpenseCategoryType.OPERATIONAL,
      group: ExpenseGroup.SERVICE_EXPENSES,
      description: 'Uber, táxi, aplicativos',
      color: '#eab308',
      icon: 'Car',
    },
    {
      name: 'Pedágio',
      code: 'PED',
      type: ExpenseCategoryType.OPERATIONAL,
      group: ExpenseGroup.SERVICE_EXPENSES,
      description: 'Pedágios em viagens',
      color: '#84cc16',
      icon: 'Ticket',
    },
    {
      name: 'Estacionamento',
      code: 'EST',
      type: ExpenseCategoryType.OPERATIONAL,
      group: ExpenseGroup.SERVICE_EXPENSES,
      description: 'Estacionamentos',
      color: '#22c55e',
      icon: 'ParkingCircle',
    },
    {
      name: 'Hospedagem',
      code: 'HOSP',
      type: ExpenseCategoryType.OPERATIONAL,
      group: ExpenseGroup.SERVICE_EXPENSES,
      description: 'Hotéis, pousadas',
      color: '#10b981',
      icon: 'Hotel',
    },

    // Despesas Administrativas
    {
      name: 'Água',
      code: 'AGUA',
      type: ExpenseCategoryType.ADMINISTRATIVE,
      group: ExpenseGroup.MONTHLY_EXPENSES,
      description: 'Conta de água',
      color: '#06b6d4',
      icon: 'Droplet',
    },
    {
      name: 'Energia Elétrica',
      code: 'ENER',
      type: ExpenseCategoryType.ADMINISTRATIVE,
      group: ExpenseGroup.MONTHLY_EXPENSES,
      description: 'Conta de luz',
      color: '#0ea5e9',
      icon: 'Zap',
    },
    {
      name: 'Telefone/Internet',
      code: 'TEL',
      type: ExpenseCategoryType.ADMINISTRATIVE,
      group: ExpenseGroup.MONTHLY_EXPENSES,
      description: 'Telefonia e internet',
      color: '#3b82f6',
      icon: 'Phone',
    },
    {
      name: 'Aluguel',
      code: 'ALU',
      type: ExpenseCategoryType.ADMINISTRATIVE,
      group: ExpenseGroup.MONTHLY_EXPENSES,
      description: 'Aluguel de imóvel',
      color: '#6366f1',
      icon: 'Home',
    },
    {
      name: 'IPTU',
      code: 'IPTU',
      type: ExpenseCategoryType.TAX,
      group: ExpenseGroup.TAXES,
      description: 'Imposto Predial',
      color: '#8b5cf6',
      icon: 'Building',
    },
    {
      name: 'Assistência Jurídica',
      code: 'JUR',
      type: ExpenseCategoryType.ADMINISTRATIVE,
      group: ExpenseGroup.MONTHLY_EXPENSES,
      description: 'Honorários advocatícios',
      color: '#a855f7',
      icon: 'Scale',
    },
    {
      name: 'Licenças de Software',
      code: 'LIC',
      type: ExpenseCategoryType.ADMINISTRATIVE,
      group: ExpenseGroup.MONTHLY_EXPENSES,
      description: 'Microsoft, Hiper, Auvo, etc.',
      color: '#d946ef',
      icon: 'Key',
    },

    // Pró-labore
    {
      name: 'Pró-labore',
      code: 'PRO',
      type: ExpenseCategoryType.PAYROLL,
      group: ExpenseGroup.PRO_LABORE,
      description: 'Retirada dos sócios',
      color: '#ec4899',
      icon: 'Wallet',
    },

    // Financeiras
    {
      name: 'Consórcios',
      code: 'CONS',
      type: ExpenseCategoryType.FINANCIAL,
      group: ExpenseGroup.FINANCIAL_COMMITMENTS,
      description: 'Parcelas de consórcios',
      color: '#f43f5e',
      icon: 'CreditCard',
    },
    {
      name: 'Parcelas de Veículos',
      code: 'VEIC',
      type: ExpenseCategoryType.FINANCIAL,
      group: ExpenseGroup.FINANCIAL_COMMITMENTS,
      description: 'Financiamento de veículos',
      color: '#e11d48',
      icon: 'Car',
    },

    // Tributárias
    {
      name: 'FGTS',
      code: 'FGTS',
      type: ExpenseCategoryType.TAX,
      group: ExpenseGroup.TAXES,
      description: 'Fundo de Garantia',
      color: '#dc2626',
      icon: 'Landmark',
    },
    {
      name: 'INSS',
      code: 'INSS',
      type: ExpenseCategoryType.TAX,
      group: ExpenseGroup.TAXES,
      description: 'Previdência Social',
      color: '#b91c1c',
      icon: 'Shield',
    },
    {
      name: 'Simples Nacional',
      code: 'SN',
      type: ExpenseCategoryType.TAX,
      group: ExpenseGroup.TAXES,
      description: 'DAS Simples Nacional',
      color: '#991b1b',
      icon: 'FileText',
    },
    {
      name: 'Receita Federal',
      code: 'RF',
      type: ExpenseCategoryType.TAX,
      group: ExpenseGroup.TAXES,
      description: 'Impostos federais',
      color: '#7f1d1d',
      icon: 'Building2',
    },
    {
      name: 'Arrecadação Municipal',
      code: 'MUN',
      type: ExpenseCategoryType.TAX,
      group: ExpenseGroup.TAXES,
      description: 'ISS e outros impostos municipais',
      color: '#78716c',
      icon: 'MapPin',
    },

    // Bancárias
    {
      name: 'Tarifas Bancárias',
      code: 'TAR',
      type: ExpenseCategoryType.FINANCIAL,
      group: ExpenseGroup.BANK_DISBURSEMENTS,
      description: 'Tarifas e taxas bancárias',
      color: '#57534e',
      icon: 'Banknote',
    },
  ];

  console.log('Seeding expense categories...');

  for (const category of categories) {
    await prisma.expenseCategory.upsert({
      where: { code: category.code },
      update: category,
      create: category,
    });
  }

  console.log(`✅ ${categories.length} categorias criadas/atualizadas`);
}
