import { PrismaClient, ClientStatus, ClientTaxonomyKind, IcmsTaxpayerType } from '@prisma/client';

const prisma = new PrismaClient();

interface ClientSeedData {
  companyName: string;
  tradeName: string;
  cnpjCpf: string;
  externalCode: string;
  email: string;
  phone: string;
  billingEmail: string;
  onSiteContact: string;
  segmentName: string;
  groupName: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

// Lista de clientes em ordem alfabética rigorosa por Razão Social (companyName)
const CLIENTS: ClientSeedData[] = [
  {
    companyName: 'Agropecuária Vale Verde S.A.',
    tradeName: 'Fazendas Vale Verde',
    cnpjCpf: '14.852.369/0001-44',
    externalCode: 'CLI-0001',
    email: 'operacoes@fazendavaleverde.com.br',
    phone: '(19) 3521-8800',
    billingEmail: 'financeiro@fazendavaleverde.com.br',
    onSiteContact: 'Carlos Henrique (Gerente Agrícola)',
    segmentName: 'Agronegócio / Fazendas',
    groupName: 'Contrato Mensal Preventivo',
    address: {
      cep: '13500-001',
      street: 'Rodovia SP-310, KM 175',
      number: 'S/N',
      complement: 'Sede da Fazenda',
      neighborhood: 'Zona Rural',
      city: 'Rio Claro',
      state: 'SP',
    },
  },
  {
    companyName: 'Banco Capital Meridional S.A.',
    tradeName: 'Banco Capital',
    cnpjCpf: '01.555.789/0001-12',
    externalCode: 'CLI-0002',
    email: 'infraestrutura@bancocapital.com.br',
    phone: '(11) 3100-2200',
    billingEmail: 'contasapagar@bancocapital.com.br',
    onSiteContact: 'Renata Albuquerque (Facilities)',
    segmentName: 'Bancário / Instituições Financeiras',
    groupName: 'Contrato Anual 24/7',
    address: {
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '1200',
      complement: '15º andar',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
  },
  {
    companyName: 'Centro Logístico Anhanguera S.A.',
    tradeName: 'Anhanguera Logística',
    cnpjCpf: '22.333.444/0001-55',
    externalCode: 'CLI-0003',
    email: 'manutencao@anhangueralog.com.br',
    phone: '(11) 4589-7000',
    billingEmail: 'fiscal@anhangueralog.com.br',
    onSiteContact: 'Márcio Souza (Líder de Manutenção)',
    segmentName: 'Centros de Distribuição / Logística',
    groupName: 'Contrato Mensal Preventivo',
    address: {
      cep: '13214-000',
      street: 'Rodovia Anhanguera, KM 58',
      number: '1000',
      complement: 'Galpão 3',
      neighborhood: 'Distrito Industrial',
      city: 'Jundiaí',
      state: 'SP',
    },
  },
  {
    companyName: 'Condomínio Edifício Horizon Tower',
    tradeName: 'Edifício Horizon Tower',
    cnpjCpf: '08.999.111/0001-88',
    externalCode: 'CLI-0004',
    email: 'administracao@horizontower.com.br',
    phone: '(11) 3888-5500',
    billingEmail: 'sindico@horizontower.com.br',
    onSiteContact: 'Antônio Ferreira (Zelador Geral)',
    segmentName: 'Condomínios Residenciais e Comerciais',
    groupName: 'Contrato Bimestral Preventivo',
    address: {
      cep: '04538-133',
      street: 'Rua Funchal',
      number: '418',
      complement: 'Edifício Comercial',
      neighborhood: 'Vila Olímpia',
      city: 'São Paulo',
      state: 'SP',
    },
  },
  {
    companyName: 'Construtora Aliança Engenharia Ltda',
    tradeName: 'Aliança Engenharia',
    cnpjCpf: '33.444.555/0001-66',
    externalCode: 'CLI-0005',
    email: 'obras@aliancaengenharia.com.br',
    phone: '(19) 3744-1200',
    billingEmail: 'pagamentos@aliancaengenharia.com.br',
    onSiteContact: 'Engº Roberto Viana',
    segmentName: 'Construção Civil / Obras',
    groupName: 'Locação de Grupos Geradores',
    address: {
      cep: '13080-000',
      street: 'Avenida Engenheiro Antônio Francisco de Paula Souza',
      number: '2500',
      complement: 'Canteiro Central',
      neighborhood: 'Jardim Von Zuben',
      city: 'Campinas',
      state: 'SP',
    },
  },
  {
    companyName: 'DataCenter Prime Cloud Solutions Ltda',
    tradeName: 'Prime Cloud DataCenter',
    cnpjCpf: '45.678.901/0001-77',
    externalCode: 'CLI-0006',
    email: 'noc@primecloud.inf.br',
    phone: '(19) 3211-9900',
    billingEmail: 'financeiro@primecloud.inf.br',
    onSiteContact: 'Eduardo Silveira (Gerente de Operações Críticas)',
    segmentName: 'Data Centers / TI',
    groupName: 'Contrato Anual 24/7',
    address: {
      cep: '13086-902',
      street: 'Rua Giuseppe Máximo Scolfaro',
      number: '1000',
      complement: 'Módulo de Energia A',
      neighborhood: 'Pólo II de Alta Tecnologia',
      city: 'Campinas',
      state: 'SP',
    },
  },
  {
    companyName: 'Hospital Metropolitano Santa Clara S.A.',
    tradeName: 'Hospital Santa Clara',
    cnpjCpf: '56.789.012/0001-88',
    externalCode: 'CLI-0007',
    email: 'engenharia.clinica@santaclara.org.br',
    phone: '(11) 2176-5000',
    billingEmail: 'contasapagar@santaclara.org.br',
    onSiteContact: 'Dra. Patrícia Meirelles (Diretora Técnica)',
    segmentName: 'Hospitalar / Clínicas e Saúde',
    groupName: 'Contrato Anual 24/7',
    address: {
      cep: '04038-000',
      street: 'Rua Borges Lagoa',
      number: '780',
      complement: 'Subestação Central',
      neighborhood: 'Vila Clementino',
      city: 'São Paulo',
      state: 'SP',
    },
  },
  {
    companyName: 'Hotel Continental Resort & Spa Ltda',
    tradeName: 'Continental Resort',
    cnpjCpf: '67.890.123/0001-99',
    externalCode: 'CLI-0008',
    email: 'manutencao@continentalresort.com.br',
    phone: '(12) 3662-8000',
    billingEmail: 'controladoria@continentalresort.com.br',
    onSiteContact: 'Juliano Prado (Chefe de Manutenção)',
    segmentName: 'Hotelaria e Turismo',
    groupName: 'Contrato Semestral Preventivo',
    address: {
      cep: '12460-000',
      street: 'Avenida José de Oliveira Damas',
      number: '450',
      complement: 'Casa de Máquinas',
      neighborhood: 'Capivari',
      city: 'Campos do Jordão',
      state: 'SP',
    },
  },
  {
    companyName: 'Indústria Metalúrgica Progresso S.A.',
    tradeName: 'Metalúrgica Progresso',
    cnpjCpf: '78.901.234/0001-10',
    externalCode: 'CLI-0009',
    email: 'facilities@metalurgicaprogresso.com.br',
    phone: '(11) 4075-8000',
    billingEmail: 'financeiro@metalurgicaprogresso.com.br',
    onSiteContact: 'Valdir Ramos (Supervisor de Manutenção Elétrica)',
    segmentName: 'Indústria / Manufatura',
    groupName: 'Grandes Contas / Corporativo',
    address: {
      cep: '09950-000',
      street: 'Avenida Fagundes de Oliveira',
      number: '1900',
      complement: 'Portaria 2 - Setor Geradores',
      neighborhood: 'Piraporinha',
      city: 'Diadema',
      state: 'SP',
    },
  },
  {
    companyName: 'Rede de Supermercados Alvorada Ltda',
    tradeName: 'Supermercados Alvorada',
    cnpjCpf: '89.012.345/0001-21',
    externalCode: 'CLI-0010',
    email: 'engenharia@superalvorada.com.br',
    phone: '(19) 3805-4400',
    billingEmail: 'contabilidade@superalvorada.com.br',
    onSiteContact: 'Marcos Vinicius (Coord. Manutenção Lojas)',
    segmentName: 'Supermercados e Atacados',
    groupName: 'Contrato Mensal Preventivo',
    address: {
      cep: '13800-000',
      street: 'Rua Quinze de Novembro',
      number: '820',
      complement: 'Loja 01 - Matriz',
      neighborhood: 'Centro',
      city: 'Mogi Mirim',
      state: 'SP',
    },
  },
  {
    companyName: 'Shopping Center Boulevard Plaza',
    tradeName: 'Boulevard Plaza Shopping',
    cnpjCpf: '90.123.456/0001-32',
    externalCode: 'CLI-0011',
    email: 'operacoes@boulevardplaza.com.br',
    phone: '(11) 4798-9000',
    billingEmail: 'adm@boulevardplaza.com.br',
    onSiteContact: 'Felipe Camargo (Gerente de Operações Prediais)',
    segmentName: 'Comércio / Shopping Centers',
    groupName: 'Contrato Anual 24/7',
    address: {
      cep: '08780-000',
      street: 'Rodovia Henrique Eroles',
      number: '3000',
      complement: 'Docas de Serviço - Geradores',
      neighborhood: 'Vila Mogilar',
      city: 'Mogi das Cruzes',
      state: 'SP',
    },
  },
  {
    companyName: 'Telecom Conecta Brasil S.A.',
    tradeName: 'Conecta Telecom',
    cnpjCpf: '91.234.567/0001-43',
    externalCode: 'CLI-0012',
    email: 'infra.energia@conectatelecom.com.br',
    phone: '(11) 3040-5500',
    billingEmail: 'faturamento@conectatelecom.com.br',
    onSiteContact: 'Lucas Bertoli (Engenharia de Infraestrutura)',
    segmentName: 'Telecomunicações / Provedores',
    groupName: 'Grandes Contas / Corporativo',
    address: {
      cep: '04794-000',
      street: 'Avenida das Nações Unidas',
      number: '14171',
      complement: 'Torre B - Site Central',
      neighborhood: 'Vila Gertrudes',
      city: 'São Paulo',
      state: 'SP',
    },
  },
];

export async function seedClients() {
  // Ordena alfabeticamente por Razão Social
  const sortedClients = [...CLIENTS].sort((a, b) => a.companyName.localeCompare(b.companyName, 'pt-BR'));

  // Buscar taxonomias para mapear IDs
  const taxonomies = await prisma.clientTaxonomy.findMany();
  const taxMap = new Map<string, string>();
  for (const t of taxonomies) {
    taxMap.set(`${t.kind}_${t.name}`, t.id);
  }

  for (const item of sortedClients) {
    const segmentId = taxMap.get(`${ClientTaxonomyKind.SEGMENT}_${item.segmentName}`);
    const groupId = taxMap.get(`${ClientTaxonomyKind.GROUP}_${item.groupName}`);

    const existing = await prisma.client.findFirst({
      where: {
        OR: [
          { externalCode: item.externalCode },
          { cnpjCpf: item.cnpjCpf },
          { companyName: item.companyName },
        ],
      },
    });

    const clientData = {
      companyName: item.companyName,
      tradeName: item.tradeName,
      cnpjCpf: item.cnpjCpf,
      externalCode: item.externalCode,
      email: item.email,
      phone: item.phone,
      billingEmail: item.billingEmail,
      onSiteContact: item.onSiteContact,
      status: ClientStatus.ACTIVE,
      address: item.address,
      billingAddress: item.address,
      icmsTaxpayerType: IcmsTaxpayerType.CONTRIBUINTE,
      segmentId: segmentId || null,
      groupId: groupId || null,
    };

    if (existing) {
      await prisma.client.update({
        where: { id: existing.id },
        data: clientData,
      });
    } else {
      await prisma.client.create({
        data: clientData,
      });
    }
  }

  console.log(`✅ ${sortedClients.length} clientes criados/atualizados em ordem alfabética rigorosa`);
}

