export interface ProcessStage {
  id: string;
  name: string;
  shortName: string;
  status: 'completed' | 'in_progress' | 'pending' | 'optional';
  code?: string;
  detail?: string;
  hasAttachment?: boolean;
  attachmentName?: string;
  isOptional?: boolean;
  date?: string;
}

export interface ClientProcess {
  id: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  city: string;
  recordsCount: number;
  lastUpdate: string;
  serviceType: string;
  serviceCategory: 'eletrica' | 'subestacao' | 'gerador' | 'preventiva' | 'spda';
  isSuggested?: boolean;
  statusCategory: 'em_andamento' | 'aguardando_fechar' | 'concluidos' | 'perdidos';
  alert?: {
    message: string;
    actionText: string;
    variant: 'amber' | 'blue' | 'purple' | 'emerald' | 'orange';
    actionType: 'follow_up' | 'emit_art' | 'schedule_os' | 'final_check' | 'invoice' | 'survey';
  };
  totalAmount: number;
  paidAmount: number;
  currentStepIndex: number;
  materialStatus?: {
    status: 'SEPARADO' | 'PENDENTE';
    label: string;
  };
  executionStatus?: {
    status: 'NO_LOCAL' | 'EM_DESLOCAMENTO' | 'AGENDADO' | 'CONCLUIDO';
    label: string;
    time?: string;
  };
  stages: ProcessStage[];
}

export interface CalendarVisit {
  id: string;
  processId?: string;
  clientName: string;
  phone: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: string;
  visitType: 'LEVANTAMENTO' | 'PREVENTIVA' | 'CORRETIVA' | 'VISTORIA_FINAL' | 'COMISSIONAMENTO';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  technician: {
    id: string;
    name: string;
    team: string;
  };
  notes?: string;
}

export const INITIAL_PROCESSES: ClientProcess[] = [
  {
    id: 'proc-1',
    clientName: 'UNIASSELVI',
    contactPerson: 'Nilton Santos',
    phone: '(44) 99121-0130',
    city: 'Maringá - PR',
    recordsCount: 1,
    lastUpdate: '09/10/2026 09:20',
    serviceType: 'Instalações elétricas',
    serviceCategory: 'eletrica',
    isSuggested: true,
    statusCategory: 'aguardando_fechar',
    totalAmount: 43700,
    paidAmount: 15000,
    currentStepIndex: 1, // Orçamento
    alert: {
      message: 'Aguardando o cliente fechar (fazer follow-up)',
      actionText: '+ Follow-up',
      variant: 'amber',
      actionType: 'follow_up',
    },
    stages: [
      {
        id: 'visita',
        name: 'Visita / levantamento',
        shortName: 'Visita',
        status: 'completed',
        code: 'VIS-2026-042',
        detail: 'Realizada 07/10',
        hasAttachment: true,
        attachmentName: 'Relatorio_Levantamento_Uniasselvi.pdf',
        date: '07/10/2026',
      },
      {
        id: 'orcamento',
        name: 'Orçamento',
        shortName: 'Orçamento',
        status: 'in_progress',
        code: 'POT-2610-007',
        detail: 'Enviado - R$ 43.700,00',
        hasAttachment: true,
        attachmentName: 'Proposta_Comercial_POT2610-007.pdf',
        date: '09/10/2026',
      },
      {
        id: 'contrato',
        name: 'Contrato (opcional)',
        shortName: 'Contrato',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
      {
        id: 'art',
        name: 'ART (opcional)',
        shortName: 'ART',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
      {
        id: 'ordem_servico',
        name: 'Ordem de serviço',
        shortName: 'OS',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'vistoria_final',
        name: 'Vistoria final',
        shortName: 'Vistoria',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'termo_aceite',
        name: 'Termo de aceite',
        shortName: 'Aceite',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'recibo_nf',
        name: 'Recibo / nota fiscal',
        shortName: 'NF/Recibo',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'pos_venda',
        name: 'Pós-venda (opcional)',
        shortName: 'Pós-Venda',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
    ],
  },
  {
    id: 'proc-2',
    clientName: 'Hospital São Lucas',
    contactPerson: 'Eng. Marcelo Albuquerque',
    phone: '(44) 99872-3341',
    city: 'Cascavel - PR',
    recordsCount: 3,
    lastUpdate: '13/10/2026 14:15',
    serviceType: 'Subestações & Cabine Primária',
    serviceCategory: 'subestacao',
    isSuggested: false,
    statusCategory: 'em_andamento',
    totalAmount: 68400,
    paidAmount: 34200,
    currentStepIndex: 4, // OS em Execução
    alert: {
      message: 'Serviço em execução - Equipe Técnica em campo (Etapa 2/3)',
      actionText: 'Ver Painel da OS',
      variant: 'blue',
      actionType: 'schedule_os',
    },
    stages: [
      {
        id: 'visita',
        name: 'Visita / levantamento',
        shortName: 'Visita',
        status: 'completed',
        code: 'VIS-2026-038',
        detail: 'Aprovada 28/09',
        hasAttachment: true,
        attachmentName: 'Laudo_Subestacao_Hospital.pdf',
        date: '28/09/2026',
      },
      {
        id: 'orcamento',
        name: 'Orçamento',
        shortName: 'Orçamento',
        status: 'completed',
        code: 'POT-2609-092',
        detail: 'Aprovado - R$ 68.400,00',
        hasAttachment: true,
        attachmentName: 'Proposta_Hospital_Aprovada.pdf',
        date: '02/10/2026',
      },
      {
        id: 'contrato',
        name: 'Contrato (opcional)',
        shortName: 'Contrato',
        status: 'completed',
        code: 'CTR-2026-019',
        detail: 'Assinado Digitalmente',
        isOptional: true,
        hasAttachment: true,
        attachmentName: 'Contrato_Assinado_Hospital.pdf',
        date: '04/10/2026',
      },
      {
        id: 'art',
        name: 'ART (opcional)',
        shortName: 'ART',
        status: 'completed',
        code: 'ART-CREA-88192',
        detail: 'ART Registrada CREA-PR',
        isOptional: true,
        hasAttachment: true,
        attachmentName: 'ART_CREA_Hospital.pdf',
        date: '05/10/2026',
      },
      {
        id: 'ordem_servico',
        name: 'Ordem de serviço',
        shortName: 'OS',
        status: 'in_progress',
        code: 'OS-2026-114',
        detail: 'Em Andamento (65%)',
        hasAttachment: true,
        attachmentName: 'OS_114_Hospital.pdf',
        date: '08/10/2026',
      },
      {
        id: 'vistoria_final',
        name: 'Vistoria final',
        shortName: 'Vistoria',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'termo_aceite',
        name: 'Termo de aceite',
        shortName: 'Aceite',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'recibo_nf',
        name: 'Recibo / nota fiscal',
        shortName: 'NF/Recibo',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'pos_venda',
        name: 'Pós-venda (opcional)',
        shortName: 'Pós-Venda',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
    ],
  },
  {
    id: 'proc-3',
    clientName: 'Supermercados Cidade Canção',
    contactPerson: 'Roberto Carlos Faria',
    phone: '(44) 99182-7722',
    city: 'Maringá - PR',
    recordsCount: 2,
    lastUpdate: '14/10/2026 08:45',
    serviceType: 'Geradores de Energia (Preventiva)',
    serviceCategory: 'gerador',
    isSuggested: false,
    statusCategory: 'em_andamento',
    totalAmount: 18900,
    paidAmount: 18900,
    currentStepIndex: 5, // Vistoria Final
    alert: {
      message: 'Execução concluída! Agendar vistoria final e teste de carga',
      actionText: '+ Agendar Vistoria',
      variant: 'purple',
      actionType: 'final_check',
    },
    stages: [
      {
        id: 'visita',
        name: 'Visita / levantamento',
        shortName: 'Visita',
        status: 'completed',
        code: 'VIS-2026-049',
        detail: '01/10/2026',
        hasAttachment: true,
      },
      {
        id: 'orcamento',
        name: 'Orçamento',
        shortName: 'Orçamento',
        status: 'completed',
        code: 'POT-2610-012',
        detail: 'R$ 18.900,00',
        hasAttachment: true,
      },
      {
        id: 'contrato',
        name: 'Contrato (opcional)',
        shortName: 'Contrato',
        status: 'completed',
        detail: 'Anexo ao pedido',
        isOptional: true,
        hasAttachment: true,
      },
      {
        id: 'art',
        name: 'ART (opcional)',
        shortName: 'ART',
        status: 'completed',
        code: 'ART-CFT-11029',
        isOptional: true,
        hasAttachment: true,
      },
      {
        id: 'ordem_servico',
        name: 'Ordem de serviço',
        shortName: 'OS',
        status: 'completed',
        code: 'OS-2026-108',
        detail: 'Serviço finalizado',
        hasAttachment: true,
      },
      {
        id: 'vistoria_final',
        name: 'Vistoria final',
        shortName: 'Vistoria',
        status: 'in_progress',
        detail: 'Agendada p/ amanhã',
        hasAttachment: false,
      },
      {
        id: 'termo_aceite',
        name: 'Termo de aceite',
        shortName: 'Aceite',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'recibo_nf',
        name: 'Recibo / nota fiscal',
        shortName: 'NF/Recibo',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'pos_venda',
        name: 'Pós-venda (opcional)',
        shortName: 'Pós-Venda',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
    ],
  },
  {
    id: 'proc-4',
    clientName: 'Cooperativa Agrária Agroindustrial',
    contactPerson: 'Carlos Menezes',
    phone: '(42) 98845-1200',
    city: 'Guarapuava - PR',
    recordsCount: 4,
    lastUpdate: '11/10/2026 16:30',
    serviceType: 'Laudo SPDA / Para-raios & Malha',
    serviceCategory: 'spda',
    isSuggested: true,
    statusCategory: 'aguardando_fechar',
    totalAmount: 24500,
    paidAmount: 0,
    currentStepIndex: 1, // Orçamento
    alert: {
      message: 'Orçamento entregue há 4 dias. Cliente solicitou revisão de prazo.',
      actionText: '+ Ajustar Proposta',
      variant: 'amber',
      actionType: 'follow_up',
    },
    stages: [
      {
        id: 'visita',
        name: 'Visita / levantamento',
        shortName: 'Visita',
        status: 'completed',
        code: 'VIS-2026-044',
        detail: '05/10/2026',
        hasAttachment: true,
      },
      {
        id: 'orcamento',
        name: 'Orçamento',
        shortName: 'Orçamento',
        status: 'in_progress',
        code: 'POT-2610-025',
        detail: 'Enviado R$ 24.500,00',
        hasAttachment: true,
      },
      {
        id: 'contrato',
        name: 'Contrato (opcional)',
        shortName: 'Contrato',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
      {
        id: 'art',
        name: 'ART (opcional)',
        shortName: 'ART',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
      {
        id: 'ordem_servico',
        name: 'Ordem de serviço',
        shortName: 'OS',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'vistoria_final',
        name: 'Vistoria final',
        shortName: 'Vistoria',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'termo_aceite',
        name: 'Termo de aceite',
        shortName: 'Aceite',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'recibo_nf',
        name: 'Recibo / nota fiscal',
        shortName: 'NF/Recibo',
        status: 'pending',
        hasAttachment: false,
      },
      {
        id: 'pos_venda',
        name: 'Pós-venda (opcional)',
        shortName: 'Pós-Venda',
        status: 'pending',
        isOptional: true,
        hasAttachment: false,
      },
    ],
  },
  {
    id: 'proc-5',
    clientName: 'Condomínio Residencial Royal Park',
    contactPerson: 'Dra. Vanessa Lins (Síndica)',
    phone: '(44) 99933-2190',
    city: 'Maringá - PR',
    recordsCount: 1,
    lastUpdate: '14/10/2026 10:10',
    serviceType: 'Manutenção Preventiva de Geradores',
    serviceCategory: 'preventiva',
    isSuggested: false,
    statusCategory: 'concluidos',
    totalAmount: 12800,
    paidAmount: 12800,
    currentStepIndex: 8, // Concluído / Pós Venda
    alert: {
      message: 'Processo concluído com êxito! Nota fiscal emitida e aceite assinado.',
      actionText: '★ Ver Avaliação NPS',
      variant: 'emerald',
      actionType: 'survey',
    },
    stages: [
      { id: 'visita', name: 'Visita / levantamento', shortName: 'Visita', status: 'completed', code: 'VIS-031', hasAttachment: true },
      { id: 'orcamento', name: 'Orçamento', shortName: 'Orçamento', status: 'completed', code: 'POT-2609-041', hasAttachment: true },
      { id: 'contrato', name: 'Contrato (opcional)', shortName: 'Contrato', status: 'completed', code: 'CTR-081', isOptional: true, hasAttachment: true },
      { id: 'art', name: 'ART (opcional)', shortName: 'ART', status: 'completed', code: 'ART-9921', isOptional: true, hasAttachment: true },
      { id: 'ordem_servico', name: 'Ordem de serviço', shortName: 'OS', status: 'completed', code: 'OS-099', hasAttachment: true },
      { id: 'vistoria_final', name: 'Vistoria final', shortName: 'Vistoria', status: 'completed', code: 'VIST-099', hasAttachment: true },
      { id: 'termo_aceite', name: 'Termo de aceite', shortName: 'Aceite', status: 'completed', code: 'TAC-099', hasAttachment: true },
      { id: 'recibo_nf', name: 'Recibo / nota fiscal', shortName: 'NF/Recibo', status: 'completed', code: 'NF-1492', hasAttachment: true },
      { id: 'pos_venda', name: 'Pós-venda (opcional)', shortName: 'Pós-Venda', status: 'completed', detail: 'NPS 10/10', isOptional: true, hasAttachment: false },
    ],
  },
];

export const INITIAL_CALENDAR_VISITS: CalendarVisit[] = [
  {
    id: 'vis-1',
    processId: 'proc-1',
    clientName: 'UNIASSELVI',
    phone: '(44) 99121-0130',
    location: 'Av. Bento Munhoz da Rocha Neto, 1021 - Maringá',
    date: '2026-10-14',
    time: '09:00',
    duration: '2h',
    visitType: 'LEVANTAMENTO',
    status: 'IN_PROGRESS',
    technician: {
      id: 'tech-1',
      name: 'Carlos Eduardo',
      team: 'Equipe Elétrica Alpha',
    },
    notes: 'Verificar quadro geral de distribuição (QGD) e capacidade do transformador.',
  },
  {
    id: 'vis-2',
    processId: 'proc-2',
    clientName: 'Hospital São Lucas',
    phone: '(44) 99872-3341',
    location: 'Rua Paraná, 450 - Centro - Cascavel',
    date: '2026-10-14',
    time: '14:00',
    duration: '3h30',
    visitType: 'PREVENTIVA',
    status: 'SCHEDULED',
    technician: {
      id: 'tech-2',
      name: 'Marcos Vinicius',
      team: 'Equipe Alta Tensão',
    },
    notes: 'Substituição de óleo isolante e teste de relés de proteção da cabine primária.',
  },
  {
    id: 'vis-3',
    processId: 'proc-3',
    clientName: 'Supermercados Cidade Canção',
    phone: '(44) 99182-7722',
    location: 'Av. Brasil, 3200 - Maringá',
    date: '2026-10-15',
    time: '08:30',
    duration: '2h',
    visitType: 'VISTORIA_FINAL',
    status: 'SCHEDULED',
    technician: {
      id: 'tech-1',
      name: 'Carlos Eduardo',
      team: 'Equipe Elétrica Alpha',
    },
    notes: 'Comissionamento final com banco de carga resistivo (250 kVA).',
  },
  {
    id: 'vis-4',
    processId: 'proc-4',
    clientName: 'Cooperativa Agrária Agroindustrial',
    phone: '(42) 98845-1200',
    location: 'Rodovia PR-170, Km 12 - Guarapuava',
    date: '2026-10-16',
    time: '10:00',
    duration: '4h',
    visitType: 'LEVANTAMENTO',
    status: 'SCHEDULED',
    technician: {
      id: 'tech-3',
      name: 'Lucas Ferreira (Eng. Eletricista)',
      team: 'Engenharia & Projetos',
    },
    notes: 'Medição ôhmica de aterramento e projeto SPDA para silos industriais.',
  },
  {
    id: 'vis-5',
    processId: 'proc-5',
    clientName: 'Condomínio Residencial Royal Park',
    phone: '(44) 99933-2190',
    location: 'Av. Mandacaru, 890 - Maringá',
    date: '2026-10-12',
    time: '15:00',
    duration: '1h30',
    visitType: 'PREVENTIVA',
    status: 'COMPLETED',
    technician: {
      id: 'tech-2',
      name: 'Marcos Vinicius',
      team: 'Equipe Alta Tensão',
    },
    notes: 'Troca de filtros de combustível e óleo do motor Scania 150 kVA.',
  },
  {
    id: 'vis-6',
    clientName: 'Frigorífico Frimesa',
    phone: '(45) 3254-8800',
    location: 'Av. Independência, 1200 - Marechal Cândido Rondon',
    date: '2026-10-19',
    time: '09:00',
    duration: '3h',
    visitType: 'CORRETIVA',
    status: 'SCHEDULED',
    technician: {
      id: 'tech-2',
      name: 'Marcos Vinicius',
      team: 'Equipe Alta Tensão',
    },
    notes: 'Falha no módulo de sincronismo automático de geradores.',
  },
  {
    id: 'vis-7',
    clientName: 'Shopping Catuaí Maringá',
    phone: '(44) 3123-5000',
    location: 'Av. Colombo, 9161 - Maringá',
    date: '2026-10-21',
    time: '08:00',
    duration: '4h',
    visitType: 'PREVENTIVA',
    status: 'SCHEDULED',
    technician: {
      id: 'tech-1',
      name: 'Carlos Eduardo',
      team: 'Equipe Elétrica Alpha',
    },
    notes: 'Inspeção termográfica dos barramentos blindados e painéis elétricos.',
  },
];

