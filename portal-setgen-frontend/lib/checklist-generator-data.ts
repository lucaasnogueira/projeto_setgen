export interface GeneratorChecklistItem {
  id: number;
  section: string;
  field: string;
  type: 'Texto' | 'Data' | 'Número' | 'Seleção única' | 'Seleção múltipla' | 'Checklist (OK/NÃO/N/A)' | 'Calculado';
  options?: string[];
  unit?: string;
  appliesTo: string;
  answer: string;
  notes?: string;
}

export const DEFAULT_GENERATOR_CHECKLIST: GeneratorChecklistItem[] = [
  // 1. Cliente e visita
  {
    id: 1,
    section: "1. Cliente e visita",
    field: "Visita Nº",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 2,
    section: "1. Cliente e visita",
    field: "Data da visita",
    type: "Data",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 3,
    section: "1. Cliente e visita",
    field: "Cliente",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 4,
    section: "1. Cliente e visita",
    field: "Tipo de cliente",
    type: "Seleção única",
    options: ["Industrial", "Shopping center", "Condomínio de luxo", "Comercial", "Residencial", "Outro"],
    appliesTo: "Todos",
    answer: "Comercial",
    notes: ""
  },
  {
    id: 5,
    section: "1. Cliente e visita",
    field: "CNPJ / CPF",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 6,
    section: "1. Cliente e visita",
    field: "Contato responsável",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 7,
    section: "1. Cliente e visita",
    field: "Cargo / função do contato",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 8,
    section: "1. Cliente e visita",
    field: "Telefone",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 9,
    section: "1. Cliente e visita",
    field: "E-mail",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 10,
    section: "1. Cliente e visita",
    field: "Endereço da instalação",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 11,
    section: "1. Cliente e visita",
    field: "Cidade/UF",
    type: "Texto",
    appliesTo: "Todos",
    answer: "Manaus/AM",
    notes: ""
  },
  {
    id: 12,
    section: "1. Cliente e visita",
    field: "Ponto de referência",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 13,
    section: "1. Cliente e visita",
    field: "Técnico",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 14,
    section: "1. Cliente e visita",
    field: "Objetivo da visita",
    type: "Seleção única",
    options: ["Novo gerador", "Ampliação / paralelismo", "Substituição", "Manutenção / revisão", "Avaliação de problema", "Laudo / conferência"],
    appliesTo: "Todos",
    answer: "Novo gerador",
    notes: ""
  },

  // 2. Edificação e operação
  {
    id: 15,
    section: "2. Edificação e operação",
    field: "Tipo de edificação",
    type: "Seleção única",
    options: ["Fábrica / planta industrial", "Shopping center", "Condomínio residencial de luxo", "Edifício comercial", "Hospital / clínica", "Data center", "Outro"],
    appliesTo: "Todos",
    answer: "Edifício comercial",
    notes: ""
  },
  {
    id: 16,
    section: "2. Edificação e operação",
    field: "Regime de operação previsto",
    type: "Seleção única",
    options: ["Emergência (stand-by)", "Contínuo (prime)", "Horário de ponta", "Cogeração / paralelismo com a rede"],
    appliesTo: "Todos",
    answer: "Emergência (stand-by)",
    notes: ""
  },
  {
    id: 17,
    section: "2. Edificação e operação",
    field: "Pavimentos / blocos",
    type: "Número",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 18,
    section: "2. Edificação e operação",
    field: "Área construída",
    type: "Número",
    unit: "m²",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 19,
    section: "2. Edificação e operação",
    field: "Já existe gerador?",
    type: "Seleção única",
    options: ["Sim", "Não"],
    appliesTo: "Todos",
    answer: "Não",
    notes: ""
  },
  {
    id: 20,
    section: "2. Edificação e operação",
    field: "Marca / potência do gerador existente",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 21,
    section: "2. Edificação e operação",
    field: "Quedas de energia por mês",
    type: "Número",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 22,
    section: "2. Edificação e operação",
    field: "Duração média das quedas",
    type: "Número",
    unit: "min",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },

  // 3. Cargas e demanda
  {
    id: 23,
    section: "3. Cargas e demanda",
    field: "Demanda máxima",
    type: "Número",
    unit: "kVA",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 24,
    section: "3. Cargas e demanda",
    field: "Potência instalada",
    type: "Número",
    unit: "kVA",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 25,
    section: "3. Cargas e demanda",
    field: "Cargas a atender",
    type: "Seleção única",
    options: ["Toda a instalação", "Somente cargas essenciais"],
    appliesTo: "Todos",
    answer: "Toda a instalação",
    notes: ""
  },
  {
    id: 26,
    section: "3. Cargas e demanda",
    field: "Cargas críticas",
    type: "Seleção múltipla",
    options: ["Elevadores", "Bombas de recalque / incêndio", "Chillers / ar-condicionado central", "Iluminação de emergência", "Linhas de produção", "CPD / nobreaks", "CFTV e controle de acesso", "Câmaras frias", "Portões / cancelas"],
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 27,
    section: "3. Cargas e demanda",
    field: "Maior motor a partir",
    type: "Número",
    unit: "cv",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 28,
    section: "3. Cargas e demanda",
    field: "Tipo de partida do maior motor",
    type: "Seleção única",
    options: ["Direta", "Estrela-triângulo", "Soft-starter", "Inversor de frequência"],
    appliesTo: "Todos",
    answer: "Soft-starter",
    notes: ""
  },
  {
    id: 29,
    section: "3. Cargas e demanda",
    field: "Fator de potência médio",
    type: "Número",
    appliesTo: "Todos",
    answer: "0.85",
    notes: ""
  },
  {
    id: 30,
    section: "3. Cargas e demanda",
    field: "Cargas não lineares (nobreaks, inversores, retificadores)",
    type: "Seleção única",
    options: ["Sim", "Não", "Não sei"],
    appliesTo: "Todos",
    answer: "Não",
    notes: ""
  },
  {
    id: 31,
    section: "3. Cargas e demanda",
    field: "Autonomia desejada",
    type: "Número",
    unit: "h",
    appliesTo: "Todos",
    answer: "8",
    notes: ""
  },

  // 4. Instalação elétrica existente
  {
    id: 32,
    section: "4. Instalação elétrica existente",
    field: "Tensão",
    type: "Seleção única",
    options: ["127/220 V", "220/380 V", "380/660 V", "13,8 kV (média tensão)", "Outra"],
    appliesTo: "Todos",
    answer: "220/380 V",
    notes: ""
  },
  {
    id: 33,
    section: "4. Instalação elétrica existente",
    field: "Ligação",
    type: "Seleção única",
    options: ["Trifásica com neutro", "Trifásica sem neutro", "Bifásica"],
    appliesTo: "Todos",
    answer: "Trifásica com neutro",
    notes: ""
  },
  {
    id: 34,
    section: "4. Instalação elétrica existente",
    field: "Origem da alimentação",
    type: "Seleção única",
    options: ["Rede em baixa tensão", "Cabine primária / subestação", "Transformador próprio"],
    appliesTo: "Todos",
    answer: "Cabine primária / subestação",
    notes: ""
  },
  {
    id: 35,
    section: "4. Instalação elétrica existente",
    field: "Potência do transformador",
    type: "Número",
    unit: "kVA",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 36,
    section: "4. Instalação elétrica existente",
    field: "Disjuntor geral",
    type: "Número",
    unit: "A",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 37,
    section: "4. Instalação elétrica existente",
    field: "Seção dos cabos do QGBT",
    type: "Número",
    unit: "mm²",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 38,
    section: "4. Instalação elétrica existente",
    field: "Quadro de transferência (ATS/QTA)",
    type: "Seleção única",
    options: ["Inexistente", "Manual", "Automático"],
    appliesTo: "Todos",
    answer: "Automático",
    notes: ""
  },
  {
    id: 39,
    section: "4. Instalação elétrica existente",
    field: "Distância gerador → QGBT",
    type: "Número",
    unit: "m",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 40,
    section: "4. Instalação elétrica existente",
    field: "Local previsto do quadro de transferência",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 41,
    section: "4. Instalação elétrica existente",
    field: "QGBT em bom estado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 42,
    section: "4. Instalação elétrica existente",
    field: "Espaço no QGBT para chave de transferência",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 43,
    section: "4. Instalação elétrica existente",
    field: "Aterramento existente e medido",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 44,
    section: "4. Instalação elétrica existente",
    field: "Circuitos de emergência identificados / segregados",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 45,
    section: "4. Instalação elétrica existente",
    field: "DPS existente",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 46,
    section: "4. Instalação elétrica existente",
    field: "Intertravamento rede-gerador possível (sem risco de retorno de energia)",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 47,
    section: "4. Instalação elétrica existente",
    field: "Adequações elétricas necessárias",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },

  // 5. Local do gerador
  {
    id: 48,
    section: "5. Local do gerador",
    field: "Local previsto",
    type: "Seleção única",
    options: ["Área externa descoberta", "Abrigo / casa de máquinas", "Cobertura / laje", "Subsolo", "Contêiner", "Outro"],
    appliesTo: "Todos",
    answer: "Área externa descoberta",
    notes: ""
  },
  {
    id: 49,
    section: "5. Local do gerador",
    field: "Dimensões disponíveis (C × L × A)",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 50,
    section: "5. Local do gerador",
    field: "Distância até paredes / divisas",
    type: "Número",
    unit: "m",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 51,
    section: "5. Local do gerador",
    field: "Capacidade de carga do piso / laje",
    type: "Número",
    unit: "kg/m²",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 52,
    section: "5. Local do gerador",
    field: "Limite de ruído no local",
    type: "Número",
    unit: "dB(A)",
    appliesTo: "Todos",
    answer: "75",
    notes: ""
  },
  {
    id: 53,
    section: "5. Local do gerador",
    field: "Cabine acústica necessária",
    type: "Seleção única",
    options: ["Sim", "Não", "A definir"],
    appliesTo: "Todos",
    answer: "Sim",
    notes: ""
  },
  {
    id: 54,
    section: "5. Local do gerador",
    field: "Acesso para entrega e içamento",
    type: "Seleção única",
    options: ["Livre", "Com restrição", "Requer guindaste", "Requer desmontagem"],
    appliesTo: "Todos",
    answer: "Livre",
    notes: ""
  },
  {
    id: 55,
    section: "5. Local do gerador",
    field: "Largura mínima da rota de acesso",
    type: "Número",
    unit: "m",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 56,
    section: "5. Local do gerador",
    field: "Base / laje nivelada e dimensionada para o peso",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 57,
    section: "5. Local do gerador",
    field: "Ventilação e entrada/saída de ar adequadas",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 58,
    section: "5. Local do gerador",
    field: "Exaustão de gases fora de áreas ocupadas",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 59,
    section: "5. Local do gerador",
    field: "Distância de segurança de material inflamável",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 60,
    section: "5. Local do gerador",
    field: "Espaço para manutenção ao redor",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 61,
    section: "5. Local do gerador",
    field: "Drenagem / bacia de contenção",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 62,
    section: "5. Local do gerador",
    field: "Extintor e sinalização de segurança",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 63,
    section: "5. Local do gerador",
    field: "Proteção contra chuva e alagamento",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 64,
    section: "5. Local do gerador",
    field: "Iluminação e tomada no local",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },

  // 6. Combustível
  {
    id: 65,
    section: "6. Combustível",
    field: "Tipo de combustível",
    type: "Seleção única",
    options: ["Diesel S10", "Diesel S500", "Gás natural", "GLP", "Outro"],
    appliesTo: "Todos",
    answer: "Diesel S10",
    notes: ""
  },
  {
    id: 66,
    section: "6. Combustível",
    field: "Tanque",
    type: "Seleção única",
    options: ["Integrado à base", "Externo aéreo", "Enterrado", "A definir"],
    appliesTo: "Todos",
    answer: "Integrado à base",
    notes: ""
  },
  {
    id: 67,
    section: "6. Combustível",
    field: "Capacidade do tanque",
    type: "Número",
    unit: "L",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 68,
    section: "6. Combustível",
    field: "Acesso do caminhão de abastecimento",
    type: "Seleção única",
    options: ["Livre", "Com restrição"],
    appliesTo: "Todos",
    answer: "Livre",
    notes: ""
  },
  {
    id: 69,
    section: "6. Combustível",
    field: "Distância tanque → gerador",
    type: "Número",
    unit: "m",
    appliesTo: "Todos",
    answer: "0",
    notes: ""
  },
  {
    id: 70,
    section: "6. Combustível",
    field: "Bacia de contenção prevista",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 71,
    section: "6. Combustível",
    field: "Armazenamento regularizado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 72,
    section: "6. Combustível",
    field: "Licença ambiental / autorização de armazenamento",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },

  // 7. Normas, licenças e autorizações
  {
    id: 73,
    section: "7. Normas, licenças e autorizações",
    field: "Distribuidora",
    type: "Texto",
    appliesTo: "Todos",
    answer: "Ambar Energia",
    notes: ""
  },
  {
    id: 74,
    section: "7. Normas, licenças e autorizações",
    field: "Comunicação / aprovação da distribuidora (se houver paralelismo)",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "N/A",
    notes: ""
  },
  {
    id: 75,
    section: "7. Normas, licenças e autorizações",
    field: "Projeto com ART do responsável técnico",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 76,
    section: "7. Normas, licenças e autorizações",
    field: "Licença ambiental (órgão estadual competente)",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 77,
    section: "7. Normas, licenças e autorizações",
    field: "Aprovação do Corpo de Bombeiros (quando exigida)",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 78,
    section: "7. Normas, licenças e autorizações",
    field: "Autorização para obra / içamento",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },
  {
    id: 79,
    section: "7. Normas, licenças e autorizações",
    field: "Plano de manutenção definido",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Todos",
    answer: "OK",
    notes: ""
  },

  // 8. Requisitos por tipo de cliente
  {
    id: 80,
    section: "8. Requisitos por tipo de cliente",
    field: "Integração / treinamento de SST dos terceiros (NR-10, NR-12, NR-35)",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Industrial",
    answer: "N/A",
    notes: ""
  },
  {
    id: 81,
    section: "8. Requisitos por tipo de cliente",
    field: "Janela de parada programada definida",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Industrial",
    answer: "N/A",
    notes: ""
  },
  {
    id: 82,
    section: "8. Requisitos por tipo de cliente",
    field: "Áreas classificadas / atmosfera explosiva no entorno avaliadas",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Industrial",
    answer: "N/A",
    notes: ""
  },
  {
    id: 83,
    section: "8. Requisitos por tipo de cliente",
    field: "Ambiente agressivo (poeira, corrosão, calor) considerado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Industrial",
    answer: "N/A",
    notes: ""
  },
  {
    id: 84,
    section: "8. Requisitos por tipo de cliente",
    field: "Paralelismo / sincronismo com rede ou outros geradores avaliado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Industrial",
    answer: "N/A",
    notes: ""
  },
  {
    id: 85,
    section: "8. Requisitos por tipo de cliente",
    field: "Serviços e testes somente fora do horário de funcionamento",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Shopping",
    answer: "N/A",
    notes: ""
  },
  {
    id: 86,
    section: "8. Requisitos por tipo de cliente",
    field: "Regulamento de obras do shopping recebido",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Shopping",
    answer: "N/A",
    notes: ""
  },
  {
    id: 87,
    section: "8. Requisitos por tipo de cliente",
    field: "Seguro RC e credenciamento da equipe",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Shopping",
    answer: "N/A",
    notes: ""
  },
  {
    id: 88,
    section: "8. Requisitos por tipo de cliente",
    field: "Rota de carga / elevador de serviço liberado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Shopping",
    answer: "N/A",
    notes: ""
  },
  {
    id: 89,
    section: "8. Requisitos por tipo de cliente",
    field: "Plano de contingência para teste de carga (sem interrupção às lojas)",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Shopping",
    answer: "N/A",
    notes: ""
  },
  {
    id: 90,
    section: "8. Requisitos por tipo de cliente",
    field: "Contato da gerência de operações registrado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Shopping",
    answer: "N/A",
    notes: ""
  },
  {
    id: 91,
    section: "8. Requisitos por tipo de cliente",
    field: "Aprovação do síndico / assembleia",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Condomínio de luxo",
    answer: "N/A",
    notes: ""
  },
  {
    id: 92,
    section: "8. Requisitos por tipo de cliente",
    field: "Regimento: horários e limite de ruído atendidos",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Condomínio de luxo",
    answer: "N/A",
    notes: ""
  },
  {
    id: 93,
    section: "8. Requisitos por tipo de cliente",
    field: "Cadastro de prestadores / controle de acesso",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Condomínio de luxo",
    answer: "N/A",
    notes: ""
  },
  {
    id: 94,
    section: "8. Requisitos por tipo de cliente",
    field: "Impacto estético e paisagístico aprovado",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Condomínio de luxo",
    answer: "N/A",
    notes: ""
  },
  {
    id: 95,
    section: "8. Requisitos por tipo de cliente",
    field: "Exaustão e ruído sem incômodo às unidades vizinhas",
    type: "Checklist (OK/NÃO/N/A)",
    options: ["OK", "NÃO", "N/A"],
    appliesTo: "Condomínio de luxo",
    answer: "N/A",
    notes: ""
  },

  // 9. Pré-dimensionamento
  {
    id: 96,
    section: "9. Pré-dimensionamento",
    field: "Margem de reserva para crescimento de carga (%)",
    type: "Número",
    unit: "%",
    appliesTo: "Todos",
    answer: "20",
    notes: "PREMISSA editável: 20% é um valor de partida. Ajustar conforme o cliente."
  },
  {
    id: 97,
    section: "9. Pré-dimensionamento",
    field: "Potência mínima estimada",
    type: "Calculado",
    unit: "kVA",
    appliesTo: "Todos",
    answer: "",
    notes: "Demanda máxima (seção 3) × (1 + margem/100). Estimativa inicial: validar partida de motores e cargas não lineares com engenheiro."
  },
  {
    id: 98,
    section: "9. Pré-dimensionamento",
    field: "Potência sugerida",
    type: "Número",
    unit: "kVA",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 99,
    section: "9. Pré-dimensionamento",
    field: "Regime de potência",
    type: "Seleção única",
    options: ["Stand-by", "Prime", "Contínuo"],
    appliesTo: "Todos",
    answer: "Stand-by",
    notes: ""
  },
  {
    id: 100,
    section: "9. Pré-dimensionamento",
    field: "Tipo de cabine",
    type: "Seleção única",
    options: ["Aberto", "Insonorizado", "Contêiner"],
    appliesTo: "Todos",
    answer: "Insonorizado",
    notes: ""
  },
  {
    id: 101,
    section: "9. Pré-dimensionamento",
    field: "Partida",
    type: "Seleção única",
    options: ["Automática (com QTA)", "Manual"],
    appliesTo: "Todos",
    answer: "Automática (com QTA)",
    notes: ""
  },
  {
    id: 102,
    section: "9. Pré-dimensionamento",
    field: "Quantidade de geradores / redundância",
    type: "Texto",
    appliesTo: "Todos",
    answer: "1",
    notes: ""
  },
  {
    id: 103,
    section: "9. Pré-dimensionamento",
    field: "Marca / modelo sugerido",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 104,
    section: "9. Pré-dimensionamento",
    field: "Autonomia do tanque",
    type: "Número",
    unit: "h",
    appliesTo: "Todos",
    answer: "8",
    notes: ""
  },
  {
    id: 105,
    section: "9. Pré-dimensionamento",
    field: "Peso estimado do conjunto",
    type: "Número",
    unit: "kg",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },

  // 10. Documentos do cliente
  {
    id: 106,
    section: "10. Documentos do cliente",
    field: "Recebidos",
    type: "Seleção múltipla",
    options: [
      "Conta de energia",
      "Documento do responsável (RG/CNH)",
      "CPF/CNPJ",
      "Comprovante de propriedade",
      "Procuração (se for terceiro)",
      "Diagrama unifilar",
      "Projeto elétrico",
      "Planta / layout do local",
      "Laudo de aterramento",
      "Fotos do QGBT e do local",
      "Autorização do condomínio / shopping"
    ],
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 107,
    section: "10. Documentos do cliente",
    field: "Pendentes",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },

  // 11. Conclusão da visita
  {
    id: 108,
    section: "11. Conclusão da visita",
    field: "Resultado",
    type: "Seleção única",
    options: ["Viável", "Viável com adequações", "Inviável"],
    appliesTo: "Todos",
    answer: "Viável",
    notes: ""
  },
  {
    id: 109,
    section: "11. Conclusão da visita",
    field: "Pendências / adequações antes da instalação",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 110,
    section: "11. Conclusão da visita",
    field: "Próximos passos",
    type: "Seleção múltipla",
    options: [
      "Elaborar orçamento",
      "Elaborar projeto",
      "Solicitar estudo de carga",
      "Enviar proposta",
      "Nova visita",
      "Agendar instalação"
    ],
    appliesTo: "Todos",
    answer: "Elaborar orçamento",
    notes: ""
  },
  {
    id: 111,
    section: "11. Conclusão da visita",
    field: "Observações",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 112,
    section: "11. Conclusão da visita",
    field: "Técnico responsável (nome, cargo e registro)",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  },
  {
    id: 113,
    section: "11. Conclusão da visita",
    field: "Cliente acompanhou a visita",
    type: "Seleção única",
    options: ["Sim", "Não"],
    appliesTo: "Todos",
    answer: "Sim",
    notes: ""
  },
  {
    id: 114,
    section: "11. Conclusão da visita",
    field: "Nome de quem acompanhou",
    type: "Texto",
    appliesTo: "Todos",
    answer: "",
    notes: ""
  }
];

export const CHECKLIST_INSTRUCTIONS = [
  "VISITA TÉCNICA GRUPO GERADOR · COMO PREENCHER E SUBIR DE VOLTA",
  "• Cada linha é um campo da visita. Preencha só a coluna \"Resposta\" (e \"Observações\", se precisar).",
  "• Não mude a coluna ID dos campos que já existem. Campo novo: deixe o ID em branco.",
  "• Colunas marcadas com \"(só consulta)\" descrevem o campo e são ignoradas ao subir.",
  "• Seleção única e Checklist: escolha na lista (Checklist: OK, NÃO ou N/A). Seleção múltipla: digite as opções separadas por ponto e vírgula (;).",
  "• Percentuais: digite o número inteiro (20 = 20%), como na margem do catálogo. Data no formato dd/mm/aaaa.",
  "• Linhas do tipo Calculado têm fórmula: não digite nelas. Elas só aparecem preenchidas quando os campos de origem estiverem preenchidos.",
  "• Coluna \"Aplica a\": Todos vale para qualquer cliente. Itens de Industrial, Shopping ou Condomínio de luxo: preencha só os do tipo do cliente e marque os demais como N/A.",
  "• Para ver as pendências do checklist, filtre a coluna \"Resposta\" por NÃO.",
  "• Valores pré-preenchidos, como no PDF original: Cidade/UF (Manaus/AM) e Distribuidora (Ambar Energia). Podem ser alterados.",
  "• Margens de reserva ou contingência (20% e 10%) são premissas de partida, marcadas em \"Observações\". Ajuste conforme o cliente.",
  "• Os pré-dimensionamentos são estimativas iniciais e devem ser validados por responsável técnico habilitado.",
  "• Os itens de \"Requisitos por tipo de cliente\" são sugestões de checklist; ajuste às exigências de cada contrato.",
  "• Salve como Excel (.xlsx)."
];

export const GENERATOR_SECTIONS = [
  "1. Cliente e visita",
  "2. Edificação e operação",
  "3. Cargas e demanda",
  "4. Instalação elétrica existente",
  "5. Local do gerador",
  "6. Combustível",
  "7. Normas, licenças e autorizações",
  "8. Requisitos por tipo de cliente",
  "9. Pré-dimensionamento",
  "10. Documentos do cliente",
  "11. Conclusão da visita"
] as const;
