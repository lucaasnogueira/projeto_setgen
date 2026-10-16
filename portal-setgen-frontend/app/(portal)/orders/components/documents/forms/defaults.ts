import { DocumentType } from "@/types";

export interface ClientContractOption {
  id: string;
  number: string;
  label: string;
  source: "profile" | "document";
  data?: Record<string, any>;
}

export function extractClientContracts(client?: any, clientDocs: any[] = []): ClientContractOption[] {
  const result: ClientContractOption[] = [];
  const seenNumbers = new Set<string>();

  // 1. Contrato configurado na ficha cadastral do Cliente (internalNotes)
  if (client?.internalNotes) {
    const match = client.internalNotes.match(/<!--CONTRACT_DATA:(.*?)-->/);
    if (match) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.hasContract || parsed.contractNumber) {
          const num = (parsed.contractNumber || "Contrato Ativo").trim();
          if (!seenNumbers.has(num.toLowerCase())) {
            seenNumbers.add(num.toLowerCase());
            result.push({
              id: `profile-${num}`,
              number: num,
              label: `${parsed.contractNumber ? `Contrato nº ${parsed.contractNumber}` : "Contrato Ativo"}${
                parsed.contractRecurrence ? ` · ${parsed.contractRecurrence}` : ""
              }`,
              source: "profile",
              data: {
                objeto: parsed.contractScope,
                valorTotal: parsed.contractMonthlyValue,
                condicoesPagamento: parsed.contractMonthlyValue
                  ? `Valor mensal de R$ ${parsed.contractMonthlyValue} conforme contrato de manutenção.`
                  : undefined,
                prazoExecucaoDias: parsed.contractEndDate ? `Vigência até ${parsed.contractEndDate}` : undefined,
              },
            });
          }
        }
      } catch {}
    }

    // Fallback: texto padrão caso não tenha JSON
    if (result.length === 0) {
      const textMatch = client.internalNotes.match(/\[Contrato de Manuten[çc][ãa]o:\s*([^\|\]]+)/i);
      if (textMatch && textMatch[1].trim()) {
        const num = textMatch[1].trim();
        if (!seenNumbers.has(num.toLowerCase())) {
          seenNumbers.add(num.toLowerCase());
          result.push({
            id: `profile-text-${num}`,
            number: num,
            label: `Contrato nº ${num} (Cadastro do Cliente)`,
            source: "profile",
          });
        }
      }
    }
  }

  // 2. Documentos de CONTRATO anteriores já emitidos para este cliente
  if (Array.isArray(clientDocs)) {
    clientDocs
      .filter((d) => d && (d.type === DocumentType.CONTRACT || d.type === "CONTRACT"))
      .forEach((d) => {
        const num = (d.data?.contratoVinculado || d.code || d.title || "").trim();
        const key = (d.code || num).toLowerCase();
        if (key && !seenNumbers.has(key)) {
          seenNumbers.add(key);
          result.push({
            id: d.id,
            number: d.code || num,
            label: `${d.code ? `${d.code} · ` : ""}${d.title || "Contrato Técnico"}`,
            source: "document",
            data: d.data,
          });
        }
      });
  }

  return result;
}

export function getDefaultDocumentData(
  type: DocumentType,
  clientName: string,
  order: any,
  client?: any,
  matchedApr?: any
): Record<string, any> {
  const clientObj = client || order?.client;
  const addr = clientObj?.address || order?.client?.address;
  const clientAddress = addr
    ? [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(", ")
    : "";

  const todayStr = new Date().toISOString().slice(0, 10);
  const scope = order?.scope || "";
  const techName = order?.assignedTo?.name || "";
  const formattedTotal = order?.quote?.total
    ? Number(order.quote.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    : "";

  const clientPhone = clientObj?.phone || clientObj?.contactPhone || order?.client?.phone || "";
  const clientLocal = addr?.neighborhood || addr?.street || clientAddress;
  const clientCityState =
    addr?.city && addr?.state
      ? `${addr.city}/${addr.state}`
      : addr?.city || addr?.state || "";
  const orderNumStr = order?.orderNumber
    ? order.orderNumber.startsWith("OS")
      ? order.orderNumber
      : `OS${order.orderNumber}`
    : "";

  switch (type) {
    case DocumentType.APR:
      return {
        local: clientAddress,
        telefone: clientPhone,
        cidadeUf: clientCityState,
        ordemServico: orderNumStr,
        dataServico: todayStr,
        descricaoTarefa: scope || "Intervenção Técnica Especializada em Engenharia e Grupos Geradores",
        atividades: [
          "Eletricidade (baixa tensão)",
          "Média tensão / subestação",
          "Trabalho em altura",
          "Gerador / combustível",
          "Ferramentas manuais e elétricas",
        ],
        riscos: [
          {
            perigo: "Choque elétrico em MT ou retorno de energia",
            conseq: "Morte, queimaduras graves",
            controle: "Desligamento programado, bloqueio LOTO, detector MT, aterramento temporário, gerador em manual",
            responsavel: techName || "Equipe Técnica",
          },
          {
            perigo: "Arco elétrico em manobras",
            conseq: "Queimaduras graves, lesões nos olhos",
            controle: "Vestimenta antichama NR-10, protetor facial, luvas MT; manobra só por autorizado (SEP)",
            responsavel: techName || "Equipe Técnica",
          },
          {
            perigo: "Tensão induzida ou residual em capacitores e transformador",
            conseq: "Choque elétrico",
            controle: "Aterramento temporário antes do contato; descarregar capacitores com bastão",
            responsavel: techName || "Equipe Técnica",
          },
          {
            perigo: "Queda em altura (escada / telhado / andaime)",
            conseq: "Fraturas, morte",
            controle: "Cinto paraquedista talabarte duplo, ponto de ancoragem, linha de vida, equipe NR-35",
            responsavel: techName || "Equipe Técnica",
          },
          {
            perigo: "Queda de ferramentas e materiais",
            conseq: "Lesões em quem está abaixo",
            controle: "Isolar a área com fita zebrada e cones, ferramentas amarradas, capacete com jugular",
            responsavel: techName || "Equipe Técnica",
          },
          {
            perigo: "Choque por ferramenta elétrica ou extensão danificada",
            conseq: "Choque elétrico",
            controle: "Inspecionar ferramentas e extensões; tomadas com aterramento e dispositivo DR",
            responsavel: techName || "Equipe Técnica",
          },
        ],
        epis: [
          "Capacete com jugular",
          "Óculos de proteção",
          "Protetor facial",
          "Luvas de vaqueta",
          "Luvas isolantes (BT)",
          "Luvas isolantes (MT)",
          "Botina de segurança (sem metal)",
          "Vestimenta antichama NR-10",
          "Cinto paraquedista e talabarte duplo",
          "Protetor auricular",
          "Protetor solar",
          "Máscara / respirador",
        ],
        epcs: [
          "Cones e fita zebrada",
          "Placas de sinalização",
          "Cadeados e etiquetas de bloqueio",
          "Detector de tensão",
          "Aterramento temporário",
          "Vara de manobra",
          "Tapete isolante",
          "Linha de vida",
          "Extintor",
          "Kit de primeiros socorros",
        ],
        normas: ["NR-06 (EPI)", "NR-10 (Eletricidade)", "NR-35 (Altura)", "NR-12 (Máquinas)"],
        emergenciaHospital: "SAMU 192 · Bombeiros 193 · Pronto-Socorro 28 de Agosto (Manaus/AM)",
        planoResgate: "Em caso de choque ou incidente, desenergizar a fonte geral imediatamente. Para resgate em altura, aplicar procedimento assistido com cinto NR-35 e contatar SAMU 192.",
        equipe: techName
          ? [
              { nome: techName, funcao: "Encarregado / Responsável Técnico" },
              { nome: "Equipe Técnica Setgen", funcao: "Eletricista Montador" },
            ]
          : [],
        liberacaoStatus: "Liberado",
        restricoes: "",
        supervisorCliente: "",
        responsavelTecnico: techName,
        registroProfissional: "",
      };

    case DocumentType.WORK_PERMIT:
      return {
        // 1. DADOS DO TRABALHO
        cliente: clientName,
        telefone: clientPhone,
        local: clientLocal,
        cidadeUf: clientCityState,
        servico: scope || "Intervenção Técnica Especializada",
        ordemServico: orderNumStr,
        aprVinculada: matchedApr?.code || "",
        equipamento: order?.equipment?.name || matchedApr?.data?.equipamento || "Grupo Gerador de Energia / Subestação",
        atividadeAutorizada: matchedApr?.data?.descricaoTarefa || scope || "Intervenção técnica autorizada sob as normas de segurança NR-10 e NR-35.",

        // 2. VALIDADE
        dataValidade: todayStr,
        horaInicio: "08:00",
        horaFim: "18:00",

        // 3. TIPO DE TRABALHO
        tipoTrabalho: ["Elétrico — baixa tensão", "Elétrico — média tensão (SEP)"],

        // 4. CONDIÇÕES PARA LIBERAÇÃO (15 itens oficiais)
        condicoesLiberacao: {
          "APR elaborada e lida com toda a equipe": "OK",
          "Equipe treinada e autorizada para a atividade": "OK",
          "EPIs inspecionados e em uso": "OK",
          "Área isolada e sinalizada": "OK",
          "Condições climáticas adequadas (sem chuva forte ou raios)": "OK",
          "Responsável do local ciente do serviço": "OK",
          "Desligamento confirmado com a concessionária (protocolo)": "OK",
          "Seccionamento visível (chaves / disjuntor abertos)": "OK",
          "Bloqueio e etiquetagem aplicados": "OK",
          "Ausência de tensão testada com detector de MT": "OK",
          "Aterramento temporário instalado": "OK",
          "Gerador / outras fontes impedidos de energizar (modo manual)": "OK",
          "Circuito desenergizado e seccionado": "OK",
          "Bloqueio e etiquetagem aplicados (cadeado e etiqueta)": "OK",
          "Ausência de tensão testada com instrumento aferido": "OK",
        },
        riscosAdicionais:
          matchedApr?.data?.riscos && Array.isArray(matchedApr.data.riscos)
            ? matchedApr.data.riscos.map((r: any) => r.perigo).slice(0, 2).join("; ")
            : "",

        // 5. EQUIPE AUTORIZADA
        equipeAutorizada:
          matchedApr?.data?.equipe && Array.isArray(matchedApr.data.equipe) && matchedApr.data.equipe.length > 0
            ? matchedApr.data.equipe
            : techName
            ? [
                { nome: techName, funcao: "Encarregado / Eletrotécnico" },
                { nome: "", funcao: "Eletricista Montador" },
              ]
            : [
                { nome: "", funcao: "Encarregado / Eletrotécnico" },
                { nome: "", funcao: "Eletricista Montador" },
              ],

        // 6. ENCERRAMENTO DA PERMISSÃO (6 itens oficiais)
        encerramento: {
          condicoes: {
            "Serviço concluído": "OK",
            "Ferramentas e materiais retirados": "OK",
            "Bloqueios e aterramentos temporários retirados": "OK",
            "Equipe fora da área de risco": "OK",
            "Instalação liberada / reenergizada": "OK",
            "Responsável do local comunicado": "OK",
          },
          encerradaEm: todayStr,
          hora: "",
          encerradoPor: matchedApr?.data?.responsavelTecnico || techName || "",
          observacoes: "",
        },

        // Signatários da Permissão (Página 2)
        emitente1Nome: matchedApr?.data?.responsavelTecnico || techName || "",
        emitente1Funcao: "Responsável Técnico",
        emitente1Registro:
          matchedApr?.data?.registroProfissional || order?.assignedTo?.registration || "",
        emitente2Nome: "",
        emitente2Funcao: "Técnico Eletrotécnico / Executor",
        emitente2Registro: "",
        responsavelExecucaoNome: clientName,
        responsavelExecucaoSubtitulo: "Recebeu a permissão e cumpre as condições",
      };

    case DocumentType.ACCEPTANCE_TERM:
      return {
        tipoServico: scope || "Serviços Técnicos em Grupos Geradores e Engenharia Elétrica",
        dataConclusao: todayStr,
        local: clientAddress,
        equipamentos: order?.equipment
          ? [
              {
                equipamento: order.equipment.name || "Grupo Gerador de Energia",
                marca: order.equipment.brand || order.equipment.model || "Conforme fabricante",
                serie: order.equipment.serialNumber || "S/N",
                qtd: "1 un",
                garantia: "12 meses",
              },
            ]
          : [
              {
                equipamento: "Grupo Gerador de Energia / Subestação",
                marca: "Conforme proposta técnica",
                serie: "S/N",
                qtd: "1 un",
                garantia: "12 meses",
              },
            ],
        verificacoes: {
          "Serviço executado conforme proposta comercial e memorial": true,
          "Circuitos e equipamentos devidamente testados e energizados": true,
          "Quadro de distribuição identificado e anilhado": true,
          "Dispositivos de proteção (disjuntores, DR, DPS) testados": true,
          "Cliente e operadores orientados sobre a operação": true,
          "Local limpo e sobras de materiais recolhidas": true,
        },
        pendencias: "Não há pendências: o serviço foi concluído e entregue em perfeito funcionamento.",
        garantiaMeses: 12,
        garantiaAte: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        taxaVisitaPosGarantia: "R$ 250,00 por visita técnica após o prazo de garantia",
        canaisGarantia: "WhatsApp (92) 98112-0050 · contato@setgen.com.br",
        revisoes: [
          {
            numero: 1,
            prazo: "12 meses",
            dataPrevista: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
            descricao: "Revisão geral da instalação: reaperto de conexões, verificação de aquecimento e teste das proteções",
          },
          {
            numero: 2,
            prazo: "24 meses",
            dataPrevista: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 10),
            descricao: "Revisão periódica preventiva: reaperto, ensaios de isolamento e continuidade elétrica",
          },
        ],
      };

    case DocumentType.CONTRACT:
      return {
        contratoVinculado: "",
        contratadaRazao: "Setgen & Serviços (R G Vieira Bentes)",
        contratadaCnpj: "10.744.400/0001-65",
        contratadaEndereco: "Manaus / AM · setgen.com.br",
        contratadaRepresentante: techName,
        contratanteNome: clientName,
        contratanteCnpj: order?.client?.cnpjCpf || clientObj?.cnpjCpf || "",
        contratanteEndereco: clientAddress,
        contratanteRepresentante: clientObj?.contactName || "",
        objeto: scope || "Prestação de serviços técnicos especializados em grupos geradores e instalações elétricas de potência.",
        valorTotal: formattedTotal || "A combinar",
        condicoesPagamento: "Conforme proposta comercial aprovada. Pagamento à vista na conclusão ou conforme parcelamento acordado.",
        prazoExecucaoDias: "Conforme cronograma técnico acordado a partir da liberação da área de trabalho",
        garantiaMeses: 12,
        foro: "Manaus / AM",
        dadosBancarios: "Banco Cora SCFI (403) · Agência 0001 · Conta corrente 7284832-9 · Favorecido: R G Vieira Bentes · PIX: contato@setgen.com.br (CNPJ 10.744.400/0001-65)",
        testemunha1Nome: "",
        testemunha1Cpf: "",
        testemunha2Nome: "",
        testemunha2Cpf: "",
      };

    case DocumentType.TECHNICAL_REPORT:
      return {
        // Capa & Identificação Inicial
        tituloRelatorio:
          "RELATÓRIO TÉCNICO DE INSPEÇÃO DO SISTEMA DE PROTEÇÃO CONTRA DESCARGAS ATMOSFÉRICAS (SPDA)",
        subtituloRelatorio:
          "AVALIAÇÃO VISUAL, ENSAIOS DE CONTINUIDADE ELÉTRICA E DIAGNÓSTICO TÉCNICO",
        descricaoSumaria:
          "Inspeção técnica do Sistema de Proteção contra Descargas Atmosféricas (SPDA), com avaliação visual dos componentes, ensaios de continuidade elétrica e diagnóstico das condições construtivas.",
        cliente: clientName,
        local: clientLocal || clientAddress,
        dataInspecao: todayStr,
        dataEmissao: todayStr,
        sistemaAvaliado: "Sistema de Proteção contra Descargas Atmosféricas (SPDA)",
        tipoInspecao: "Inspeção técnica do SPDA existente",
        empresaExecutora: "Setgen & Serviços (R G Vieira Bentes)",

        // Seção 2: Objetivo da Inspeção
        objetivoInspecao:
          "O presente relatório tem como objetivo registrar as condições técnicas observadas durante a inspeção do Sistema de Proteção contra Descargas Atmosféricas (SPDA), incluindo avaliação visual dos componentes, verificação das condições construtivas e realização de ensaios de continuidade elétrica. Foram avaliados elementos de captação, descidas, malha inferior de aterramento, estruturas metálicas associadas e pontos de inspeção existentes.",

        // Seção 3: Referências Normativas
        referenciasNormativas: [
          {
            norma: "ABNT NBR 5419",
            aplicacao:
              "Proteção contra descargas atmosféricas, critérios de projeto, inspeção, manutenção, aterramento e equipotencialização.",
          },
          {
            norma: "ABNT NBR 5410",
            aplicacao: "Instalações elétricas de baixa tensão, aterramento e proteção.",
          },
          {
            norma: "NR-10",
            aplicacao: "Segurança em instalações e serviços em eletricidade.",
          },
        ],

        // Seção 4: Caracterização do Sistema SPDA Existente
        caracterizacaoTexto:
          "Durante a inspeção técnica foi identificado sistema de proteção contra descargas atmosféricas existente, composto por elementos de captação, condutores de descida, aterramento inferior e estruturas metálicas associadas. A instalação avaliada apresenta as seguintes características:",
        caracteristicas: [
          "Cobertura constituída por telhas metálicas apoiadas sobre estrutura metálica interna",
          "Sistema de captação superior instalado parcialmente no perímetro da cobertura",
          "Terminais aéreos instalados sobre a cobertura",
          "Condutores de descida em cabo de cobre 35 mm²",
          "Malha inferior de aterramento executada com cabo de cobre nu 50 mm²",
          "Pontos de aterramento distribuídos ao redor do perímetro",
          "Estrutura auxiliar avaliada: caixa d'água metálica",
        ],

        // Seção 5: Avaliação do Sistema de Captação Superior
        captacaoSuperiorTexto:
          "Durante a inspeção visual da cobertura metálica foram identificados elementos pertencentes ao sistema de captação superior. Foram observadas as seguintes condições:",
        captacaoItens: [
          "Existência de malha superior instalada acompanhando parte do perímetro do telhado",
          "Trechos da malha superior apresentando interrupções físicas",
          "Ausência de fechamento completo do anel de captação em determinados pontos",
          "Terminais aéreos instalados sobre a cobertura",
          "Suportes de fixação apresentando danos ou quebra em alguns pontos",
          "Necessidade de verificação da continuidade elétrica da malha superior",
        ],

        // Seção 6: Cobertura Metálica como Elemento Natural de Captação
        coberturaNaturalAlerta:
          "A cobertura metálica existente apresenta características que podem permitir sua utilização como elemento natural de captação do SPDA, porém esta condição não foi confirmada durante a inspeção.",
        coberturaNaturalItens: [
          "Espessura da chapa metálica da telha",
          "Continuidade elétrica entre os elementos metálicos",
          "Interligação da cobertura com os condutores de descida",
          "Existência de revestimentos ou materiais que prejudiquem a condução elétrica",
        ],
        coberturaNaturalConclusao:
          "Até a realização dessas verificações, a cobertura deve ser considerada como elemento metálico existente com necessidade de confirmação técnica.",

        // Seção 7: Sistema de Descidas
        descidasTexto:
          "Foi identificado sistema de descidas executado através de condutores de cobre com seção aproximada de 35 mm². Durante a inspeção foram observadas condições de acessibilidade reduzida, sendo necessário realizar abertura de caixas e pontos existentes para execução dos ensaios de continuidade.",
        descidasItens: [
          "Ausência de conectores de medição/seccionamento acessíveis",
          "Pontos de descida sem identificação individual",
          "Necessidade de confirmação da interligação entre descidas e malha inferior",
          "Trechos apresentando ausência de continuidade elétrica",
        ],

        // Seção 8: Sistema de Aterramento e Malha Inferior
        aterramentoTexto:
          "A malha inferior identificada durante a inspeção é composta por condutor de cobre nu com seção aproximada de 50 mm². Foram avaliados pontos distribuídos no perímetro através de ensaios de continuidade elétrica utilizando miliohmímetro.",
        aterramentoItens: [
          "Caixas de inspeção instaladas no piso",
          "Pontos contendo apenas abertura no solo com haste de aterramento",
          "Caixas sem tampa de proteção",
          "Ponto de inspeção com presença de água",
          "Trechos com continuidade elétrica confirmada",
          "Trechos indicando circuito aberto",
        ],

        // Seção 9: Metodologia dos Ensaios
        instrumentoNome: "Miliohmímetro",
        instrumentoModelo: "Digital Quatro Terminais",
        instrumentoSerie: "",
        escalaUtilizada: "200 mΩ",
        metodoEnsaio:
          "Ensaios de continuidade elétrica entre pontos acessíveis do sistema de aterramento, descidas e estruturas metálicas associadas.",
        objetivoEnsaio:
          "Verificar a existência de caminho elétrico entre os pontos avaliados, identificando possíveis interrupções ou degradação das conexões.",
        calibracaoValidade: "Válida",

        // Seção 10: Resultados dos Ensaios de Continuidade Elétrica
        medicoes: [
          {
            ponto: "P01 → P02",
            resistencia: "∞ (aberto)",
            condicao: "Ausência de continuidade elétrica entre os pontos avaliados.",
            status: "NC",
          },
          {
            ponto: "P02 → P03",
            resistencia: "17,0 mΩ",
            condicao: "Continuidade elétrica confirmada.",
            status: "OK",
          },
          {
            ponto: "P03 → P04",
            resistencia: "16,1 mΩ",
            condicao: "Continuidade confirmada. Caixa de inspeção sem tampa.",
            status: "RESSALVA",
          },
          {
            ponto: "P04 → P05",
            resistencia: "16,0 mΩ",
            condicao: "Continuidade confirmada. Ponto acessível somente por abertura no piso.",
            status: "RESSALVA",
          },
          {
            ponto: "P05 → P06",
            resistencia: "∞ (aberto)",
            condicao:
              "Ausência de continuidade identificada. Ponto 06 com haste sem caixa de inspeção.",
            status: "NC",
          },
          {
            ponto: "P06 → P07",
            resistencia: "Não aplicável",
            condicao: "Não foi identificada interligação física aparente entre os pontos.",
            status: "AVALIAR",
          },
          {
            ponto: "P07 → P08",
            resistencia: "12,2 mΩ",
            condicao: "Continuidade elétrica confirmada.",
            status: "OK",
          },
          {
            ponto: "P08 → P09",
            resistencia: "14,3 mΩ",
            condicao: "Continuidade confirmada. Acesso realizado por abertura no piso.",
            status: "RESSALVA",
          },
          {
            ponto: "P09 → P10",
            resistencia: "∞ (aberto)",
            condicao: "Caixa de inspeção sem tampa e com presença de água.",
            status: "NC",
          },
          {
            ponto: "P10 → P11",
            resistencia: "∞ (aberto)",
            condicao: "Ausência de continuidade entre os pontos avaliados.",
            status: "NC",
          },
        ],

        // Seção 11: Avaliação das Estruturas Auxiliares
        estruturasAuxiliares: [
          {
            elemento: "Caixa d'água metálica",
            descricao:
              "Foi identificado reservatório metálico protegido por captor tipo Franklin, com condutor de descida externo.",
            ensaio: "Caixa d'água → P01",
            resultado: "32,7 mΩ",
            status: "OK",
            parecer:
              "Continuidade elétrica confirmada entre a estrutura metálica da caixa d'água e o aterramento. Recomenda-se manter as conexões da descida no plano de manutenção periódica.",
          },
        ],

        // Seção 13: Avaliação dos Riscos da Condição Atual
        riscosCondicaoAtual: [
          {
            titulo: "Risco 01 – Interrupção do caminho da corrente de descarga",
            origem:
              "Foram identificados trechos apresentando circuito aberto durante os ensaios de continuidade elétrica da malha inferior.",
            consequencias: [
              "Distribuição inadequada da corrente da descarga atmosférica",
              "Elevação de potencial em estruturas metálicas",
              "Possibilidade de centelhamentos perigosos",
              "Danos em equipamentos elétricos e eletrônicos",
            ],
          },
          {
            titulo: "Risco 02 – Redução da eficiência do sistema de captação",
            origem:
              "A malha superior da cobertura apresenta descontinuidades físicas, suportes danificados e terminais aéreos que necessitam avaliação.",
            consequencias: [
              "Redução da área protegida pelo SPDA",
              "Condução inadequada da descarga atmosférica",
              "Danos aos elementos da cobertura",
              "Maior possibilidade de impactos em pontos não previstos",
            ],
          },
          {
            titulo: "Risco 03 – Degradação dos pontos de aterramento",
            origem:
              "Foram identificadas caixas de inspeção sem tampa e presença de água em pontos avaliados, condição que pode acelerar processos corrosivos.",
            consequencias: [
              "Aumento da resistência das conexões",
              "Perda gradual da continuidade elétrica",
              "Falhas futuras no sistema de aterramento",
            ],
          },
        ],

        // Seção 14: Classificação das Prioridades de Correção
        matrizPrioridades: [
          {
            prioridade: "ALTA",
            criterio:
              "Condições que podem comprometer diretamente a condução da corrente de descarga atmosférica.",
            acao: "Correção prioritária e nova verificação após intervenção.",
          },
          {
            prioridade: "MÉDIA",
            criterio: "Condições que reduzem a confiabilidade ou dificultam manutenção.",
            acao: "Adequação programada.",
          },
          {
            prioridade: "BAIXA",
            criterio: "Melhorias preventivas e atualização documental.",
            acao: "Executar conforme planejamento de manutenção.",
          },
        ],

        // Seção 15: Registro das Não Conformidades
        naoConformidadesList: [
          {
            codigo: "NC-01",
            titulo: "AUSÊNCIA DE CONTINUIDADE ELÉTRICA EM TRECHOS DA MALHA INFERIOR",
            criticidade: "ALTA",
            local: "Pontos P01-P02, P05-P06, P09-P10 e P10-P11",
            evidencia: "Ensaios utilizando miliohmímetro apresentaram indicação de circuito aberto.",
            risco:
              "Possível interrupção do caminho destinado à condução da corrente de descarga atmosférica.",
            recomendacao:
              "Realizar investigação dos trechos sem continuidade, verificando conexões, emendas e integridade dos condutores enterrados.",
          },
          {
            codigo: "NC-02",
            titulo: "CAIXAS DE INSPEÇÃO SEM TAMPA DE PROTEÇÃO",
            criticidade: "MÉDIA",
            local: "Diversos pontos do perímetro avaliado",
            evidencia: "Foram identificadas caixas de inspeção abertas, expostas ao ambiente.",
            risco: "Entrada de água, sujeira e deterioração das conexões.",
            recomendacao: "Instalar tampas adequadas e garantir proteção mecânica dos pontos.",
          },
          {
            codigo: "NC-03",
            titulo: "CAIXA DE INSPEÇÃO COM PRESENÇA DE ÁGUA",
            criticidade: "ALTA",
            local: "Ponto 10",
            evidencia:
              "Foi constatada presença de água acumulada no interior da caixa de inspeção.",
            risco: "Possível corrosão das conexões e perda futura de continuidade.",
            recomendacao:
              "Identificar origem da infiltração, realizar drenagem e inspecionar conexões internas.",
          },
          {
            codigo: "NC-04",
            titulo: "DESCONTINUIDADE DA MALHA SUPERIOR DA COBERTURA",
            criticidade: "ALTA",
            local: "Cobertura metálica do galpão",
            evidencia:
              "Foram observados trechos da malha superior sem fechamento completo, suportes danificados e terminais aéreos necessitando avaliação.",
            risco: "Redução da eficiência do sistema de captação.",
            recomendacao:
              "Realizar inspeção detalhada e intervenção na malha superior sobre a cobertura, com recomposição dos trechos interrompidos, substituição dos suportes danificados e novo ensaio de continuidade.",
          },
          {
            codigo: "NC-05",
            titulo: "AUSÊNCIA DE PONTOS ADEQUADOS DE INSPEÇÃO",
            criticidade: "MÉDIA",
            local: "Pontos com haste exposta e acessos por abertura no piso",
            evidencia:
              "Alguns pontos possuem apenas abertura no solo ou cabo exposto sem caixa de inspeção.",
            risco: "Dificuldade de manutenção e risco de rompimento mecânico.",
            recomendacao:
              "Instalar pontos de inspeção adequados para futuras medições e manutenção.",
          },
        ],

        // Seção 16: Recomendações Gerais
        recomendacoesGerais: [
          "Realizar correção dos trechos identificados com ausência de continuidade elétrica.",
          "Realizar inspeção detalhada das conexões internas das caixas de aterramento.",
          "Corrigir pontos com entrada de água nas caixas de inspeção.",
          "Instalar tampas adequadas nas caixas existentes.",
          "Instalar caixas de inspeção nos pontos onde existe apenas haste ou abertura no solo.",
          "Realizar inspeção e intervenção na malha superior sobre a cobertura do galpão, recompondo os trechos interrompidos.",
          "Substituir suportes e componentes danificados da captação superior.",
          "Realizar ensaio de continuidade da estrutura metálica da cobertura caso seja considerada como captor natural.",
          "Manter inspeções e ensaios periódicos do SPDA conforme ABNT NBR 5419-3, com registro dos resultados.",
          "Elaborar documentação técnica atualizada do sistema existente.",
        ],

        // Seção 17: Conclusão Técnica
        classificacaoFinal: "NECESSITA ADEQUAÇÃO",
        conclusaoTexto:
          "O Sistema de Proteção contra Descargas Atmosféricas avaliado apresenta elementos físicos instalados compatíveis com um sistema de proteção, incluindo malha superior, descidas em cobre, malha inferior de aterramento, estruturas metálicas associadas e proteção da caixa d'água por captor Franklin.\n\nEntretanto, durante a inspeção foram identificadas condições que reduzem a confiabilidade do sistema, principalmente:\n• Trechos da malha inferior apresentando circuito aberto;\n• Ausência de confirmação de interligação entre determinadas estruturas;\n• Caixas de inspeção sem proteção adequada;\n• Presença de água em ponto de aterramento;\n• Descontinuidade física da malha superior;\n• Necessidade de avaliação dos terminais aéreos e suportes;\n• Ausência de documentação original do SPDA.\n\nDestaca-se a necessidade de inspeção detalhada e intervenção na malha superior da cobertura do galpão. Recomenda-se a execução das adequações indicadas neste relatório e, posteriormente, a realização de nova inspeção e ensaios elétricos para validação das condições finais do sistema.",

        // Seção 18: Registro Fotográfico
        evidencias: [],

        // Seção 19 & 20: Anexos
        croquiUrl: "",
        croquiObservacoes:
          "Pontos de medição identificados conforme relatório técnico. Malha de aterramento representada de forma ilustrativa. Conferir posições em campo.",
        certificadoCalibracaoUrl: "",

        // Seção 21: Responsabilidade Técnica
        declaracaoTexto:
          "Declaro, para os devidos fins, que as informações contidas neste relatório correspondem às condições verificadas no local durante a inspeção técnica e aos resultados obtidos nos ensaios realizados, conforme metodologia e referências normativas descritas neste documento.",
        comarcaLocal: "Manaus/AM",
        comarcaData: todayStr,
        responsavelTecnico: techName || "",
        responsavelTitulo: "Engenheiro Eletricista / Responsável Técnico",
        responsavelRegistro: order?.assignedTo?.registration || "",
        responsavel2Nome: "",
        responsavel2Titulo: "Técnico Eletrotécnico / Executor",
        responsavel2Registro: "",
      };

    case DocumentType.ART:
      return {
        conselho: "CREA-AM",
        numeroArt: "",
        tipoArt: "Obra ou Serviço Técnico",
        registroNacional: order?.assignedTo?.registration || "042008581-5",
        responsavelTecnico: techName || "Rogério Guilherme Vieira Bentes",
        tituloProfissional: "Engenheiro Eletricista / Responsável Técnico",
        empresaContratada: "Setgen & Serviços (R G Vieira Bentes)",
        cnpjEmpresa: "10.744.400/0001-65",
        registroEmpresa: "CREA-AM nº 35534-AM",
        contratanteNome: clientName,
        contratanteCnpj: order?.client?.cnpjCpf || "",
        enderecoObra: clientAddress,
        atividadeTecnica: scope || "Prestação de serviços de engenharia elétrica em grupos geradores e subestação.",
        valorContrato: formattedTotal || "0,00",
        observacoes: order?.orderNumber ? `Referente à Ordem de Serviço nº ${order.orderNumber}` : "Serviço executado sob responsabilidade técnica Setgen & Serviços.",
      };

    case DocumentType.OTHER:
      return {
        subType: "FINAL_INSPECTION",
        codigoSgq: "SGQ-OPE-04 · Rev.00",
        codigoDoc: orderNumStr ? `VF2026-${orderNumStr.replace(/\D/g, "").slice(-3) || "001"}` : "VF2026-001",
        dataVistoria: todayStr,
        cliente: clientName,
        telefone: clientPhone,
        endereco: clientAddress,
        cidadeUf: clientCityState || "Manaus/AM",
        servico: scope || "Instalações elétricas e adequações normativas",
        propostaOs: orderNumStr || "POT-2610-005",

        // 2. Conferência da Ordem de Serviço
        osConferidaNumero: orderNumStr || "OS-001",
        situacaoNaOs: order?.status === "COMPLETED" ? "Concluída em campo" : "Executada / Pronta para entrega",
        etapasExecutadas: [
          "Instalação e fixação de eletrodutos, caixas e tampas",
          "Passagem de cabeamento e circuitos elétricos",
          "Montagem de quadro de distribuição e identificação",
          "Instalação e conexão de dispositivos DR e DPS",
          "Aterramento elétrico conectado e verificado",
          "Limpeza geral do local e orientações de uso ao cliente",
        ],
        materiais: [
          { material: "Disjuntor Bipolar 32A DIN", previsto: "1 un", usado: "1 un", conferidoObs: "Conforme instalado" },
          { material: "Cabo Flexível de Cobre 6mm² 750V", previsto: "50 m", usado: "48 m", conferidoObs: "Conforme instalado" },
          { material: "Dispositivo DR Bipolar 40A / 30mA", previsto: "1 un", usado: "1 un", conferidoObs: "Testado e aprovado" },
          { material: "DPS Classe II 20kA 275V", previsto: "2 un", usado: "2 un", conferidoObs: "Conforme instalado" },
          { material: "Eletroduto Corrugado Reforçado 3/4\"", previsto: "30 m", usado: "30 m", conferidoObs: "Conforme instalado" },
        ],

        // 3. Conferência do Serviço (11 itens normativos com OK / NÃO / N/A)
        checklist: {
          "Serviço executado conforme a proposta / OS": "OK",
          "Materiais conforme o especificado": "OK",
          "Quadro organizado e circuitos identificados": "OK",
          "Conexões apertadas e sem sinais de aquecimento": "OK",
          "Eletrodutos, caixas e tampas fixados": "OK",
          "Aterramento conectado e verificado": "OK",
          "DR / IDR testado pelo botão de teste": "OK",
          "DPS instalado e conectado": "OK",
          "Equipamentos funcionando em carga": "OK",
          "Local limpo, sem sobras de material": "OK",
          "Cliente orientado sobre o uso e os cuidados": "OK",
        },

        // 4. Medições e Testes
        medicoes: [
          { circuitoPonto: "QGBT - Entrada Geral", medicao: "Tensão fase-neutro", valor: "127 V / 128 V", resultado: "Conforme" },
          { circuitoPonto: "Barramento Principal", medicao: "Tensão fase-fase", valor: "220 V", resultado: "Conforme" },
          { circuitoPonto: "Malha de Aterramento", medicao: "Resistência de aterramento", valor: "4,8 Ω", resultado: "Conforme NBR 5410" },
          { circuitoPonto: "Circuitos Terminais", medicao: "Resistência de isolamento", valor: "> 100 MΩ", resultado: "Conforme" },
          { circuitoPonto: "Alimentador Geral", medicao: "Corrente em carga", valor: "28 A", resultado: "Equilibrada" },
          { circuitoPonto: "Módulo DR / Proteção", medicao: "Disparo do DR (mA / ms)", valor: "22 mA / 18 ms", resultado: "Aprovado" },
        ],
        instrumentosUsados: {
          multimetro: true,
          alicateAmperimetro: true,
          megohmetro: false,
          terrometro: true,
          testadorDr: true,
          cameraTermografica: false,
        },

        // 5. Pendências
        oQueFaltaCorrigir: "Nenhuma pendência constatada. Todas as etapas operacionais e testes elétricos foram concluídos com pleno êxito e conformidade técnica.",
        prazoParaCorrigir: "Sem pendências",

        // 6. Resultado da Vistoria
        resultado: "Aprovado",
        observacoes: "Instalações elétricas inspecionadas e liberadas para uso normal e operação contínua em conformidade com as normas ABNT NBR 5410 e NR-10.",
        cidadeData: "Manaus/AM, 14 de outubro de 2026.",

        // Página 2: Responsabilidade Técnica
        responsavel1: {
          funcao: "RESPONSÁVEL TÉCNICO",
          nome: "Peterson Froes da Silva",
          registro: "Responsável técnico · CREA-RNP 042008581-5",
          assinatura: "",
        },
        responsavel2: {
          funcao: "RESPONSÁVEL TÉCNICO / EXECUTOR",
          nome: techName || "Rogério Guilherme Vieira Bentes",
          registro: "Técnico Eletrotécnico | Tecnólogo em Automação Industrial · CREA: 25168 | CREA AM: 35534-AM | Reg. Nacional: 042003321",
          assinatura: "",
        },
        clienteSignatario: {
          funcao: "CLIENTE",
          nome: clientName,
          subtitulo: "Acompanhou a vistoria",
          assinatura: "",
        },
      };

    default:
      return {};
  }
}
