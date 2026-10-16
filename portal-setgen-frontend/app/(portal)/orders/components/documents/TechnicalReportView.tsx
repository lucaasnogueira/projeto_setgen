"use client";

import React from "react";

export interface TechnicalReportViewProps {
  document: any;
  client?: any;
  order?: any;
  clientName: string;
  clientDoc: string;
  clientAddress: string;
  techName: string;
  techRegistry: string;
  techSigImg?: string | null;
  clientSigImg?: string | null;
  formatDateBR: (dateStr?: string) => string;
}

export function TechnicalReportView({
  document,
  client,
  order,
  clientName,
  clientDoc,
  clientAddress,
  techName,
  techRegistry,
  techSigImg,
  clientSigImg,
  formatDateBR,
}: TechnicalReportViewProps) {
  const data = document.data || {};

  // Estatísticas calculadas em tempo real a partir das medições ôhmicas
  const medicoes: any[] = Array.isArray(data.medicoes) ? data.medicoes : [];
  const totalMedicoes = medicoes.length;
  const countOk = medicoes.filter(
    (m) =>
      m.status === "OK" ||
      m.status === "Conforme" ||
      m.status === "CONFORME"
  ).length;
  const countNc = medicoes.filter(
    (m) =>
      m.status === "NC" ||
      m.status === "Não Conforme" ||
      m.status === "NÃO CONFORME"
  ).length;
  const countRessalva = medicoes.filter(
    (m) =>
      m.status === "RESSALVA" ||
      m.status === "AVALIAR" ||
      m.status === "Atencao" ||
      m.status === "ATENÇÃO"
  ).length;

  const statusFinal = (data.statusFinal || "APROVADO").toUpperCase();
  const classificacaoSistema =
    data.classificacaoFinalSistema ||
    (statusFinal === "REPROVADO" || countNc > 0
      ? "NECESSITA ADEQUAÇÃO"
      : statusFinal.includes("RESSALVA") || countRessalva > 0
      ? "CONFORME COM RESSALVAS"
      : "CONFORME");

  // Normas aplicáveis
  const normas =
    Array.isArray(data.normasTabela) && data.normasTabela.length > 0
      ? data.normasTabela
      : [
          {
            norma: "ABNT NBR 5419",
            ano: "2015",
            titulo:
              "Proteção contra descargas atmosféricas, critérios de projeto, inspeção, manutenção, aterramento e equipotencialização.",
          },
          {
            norma: "ABNT NBR 5410",
            ano: "2004",
            titulo: "Instalações elétricas de baixa tensão, aterramento e proteção.",
          },
          {
            norma: "NR-10",
            ano: "MTE",
            titulo: "Segurança em instalações e serviços em eletricidade.",
          },
        ];

  const naoConformidades = Array.isArray(data.naoConformidades)
    ? data.naoConformidades
    : [];
  const recomendacoesGerais = Array.isArray(data.recomendacoesGerais)
    ? data.recomendacoesGerais
    : [];
  const evidencias = Array.isArray(data.evidencias) ? data.evidencias : [];

  const sumarioItems = [
    { num: "1", title: "Identificação do Documento", page: "03" },
    { num: "2", title: "Objetivo da Inspeção", page: "03" },
    { num: "3", title: "Referências Normativas", page: "03" },
    { num: "4", title: "Caracterização do Sistema SPDA Existente", page: "04" },
    { num: "5", title: "Avaliação do Sistema de Captação Superior", page: "04" },
    { num: "6", title: "Cobertura Metálica como Captor Natural", page: "05" },
    { num: "7", title: "Sistema de Descidas", page: "05" },
    { num: "8", title: "Aterramento e Malha Inferior", page: "05" },
    { num: "9", title: "Metodologia dos Ensaios", page: "06" },
    { num: "10", title: "Resultados dos Ensaios de Continuidade", page: "07" },
    { num: "11", title: "Avaliação das Estruturas Auxiliares", page: "08" },
    { num: "12", title: "Resumo dos Resultados", page: "08" },
    { num: "13", title: "Avaliação dos Riscos", page: "09" },
    { num: "14", title: "Classificação de Prioridades", page: "10" },
    { num: "15", title: "Registro das Não Conformidades", page: "10" },
    { num: "16", title: "Recomendações Gerais", page: "12" },
    { num: "17", title: "Conclusão Técnica", page: "12" },
    { num: "18", title: "Registro Fotográfico das Medições", page: "13" },
    { num: "19", title: "Croqui de Localização dos Pontos", page: "14" },
    { num: "20", title: "Certificado de Calibração do Instrumento", page: "15" },
    { num: "21", title: "Responsabilidade Técnica & Assinaturas", page: "15" },
  ];

  return (
    <div className="text-gray-900 font-sans text-xs leading-relaxed space-y-6 print:space-y-4">
      {/* =================================================================== */}
      {/* 1. CAPA DO RELATÓRIO TÉCNICO (PÁGINA 1)                             */}
      {/* =================================================================== */}
      <section className="space-y-6 pb-8 border-b-2 border-gray-400 print:break-after-page print:border-none print:pb-0">
        {/* Topo Institucional */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <img
              src="/images/setgen-logo.png"
              alt="SETGEN"
              className="h-12 w-auto object-contain"
            />
            <div>
              <div className="text-sm font-black text-slate-950 uppercase tracking-tight leading-tight">
                SETGEN & SERVIÇOS
              </div>
              <div className="text-[11px] font-bold text-gray-700 tracking-wide mt-0.5">
                R G VIEIRA BENTES
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                CNPJ: 10.744.400/0001-65 · Manaus / AM · setgen.com.br
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-gray-700">
            <div>Relatório Nº: <strong>{document.code}</strong></div>
            {order?.orderNumber && <div>OS Nº: {order.orderNumber}</div>}
          </div>
        </div>

        {/* Título Principal Formal */}
        <div className="text-center py-6 sm:py-10 space-y-2">
          <h1 className="text-base sm:text-xl font-bold text-gray-900 uppercase tracking-tight leading-snug">
            {data.tituloRelatorio ||
              "RELATÓRIO TÉCNICO DE INSPEÇÃO DO SISTEMA DE PROTEÇÃO CONTRA DESCARGAS ATMOSFÉRICAS (SPDA)"}
          </h1>
          <p className="text-xs text-gray-600 uppercase font-medium tracking-wide">
            {data.subtituloRelatorio ||
              "AVALIAÇÃO VISUAL, ENSAIOS DE CONTINUIDADE ELÉTRICA E DIAGNÓSTICO TÉCNICO"}
          </p>
        </div>

        {/* Tabela de Identificação da Capa */}
        <div className="space-y-3">
          <table className="w-full text-xs border border-gray-300">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="w-1/4 p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                  Cliente:
                </td>
                <td className="p-2.5 font-bold text-gray-900" colSpan={3}>
                  {clientName} {clientDoc && clientDoc !== "Não informado" ? `· CNPJ/CPF: ${clientDoc}` : ""}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                  Local da Instalação:
                </td>
                <td className="p-2.5 text-gray-900" colSpan={3}>
                  {data.local || clientAddress}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                  Data da Inspeção:
                </td>
                <td className="p-2.5 text-gray-900 border-r border-gray-200">
                  {data.dataInspecao || formatDateBR(document.createdAt)}
                </td>
                <td className="p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                  Data de Emissão:
                </td>
                <td className="p-2.5 text-gray-900">
                  {formatDateBR(document.createdAt)}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                  Responsável Técnico:
                </td>
                <td className="p-2.5 text-gray-900" colSpan={3}>
                  {data.responsavelTecnico || techName} · {data.responsavelTitulo || "Engenheiro Eletricista"} · {data.responsavelCrea || techRegistry || "CREA/AM"}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                  Parecer Técnico:
                </td>
                <td className="p-2.5 font-bold" colSpan={3}>
                  <span
                    className={
                      statusFinal === "APROVADO"
                        ? "text-emerald-700"
                        : statusFinal.includes("RESSALVA")
                        ? "text-amber-700"
                        : "text-red-700"
                    }
                  >
                    {statusFinal}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {data.descricaoSumaria && (
            <p className="text-gray-700 text-xs italic bg-gray-50 p-3 border border-gray-200">
              {data.descricaoSumaria}
            </p>
          )}
        </div>

        {/* Rodapé da Capa */}
        <div className="pt-4 text-center text-[10px] text-gray-500 border-t border-gray-200">
          SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ 10.744.400/0001-65 · Manaus/AM · Laudo Técnico SPDA
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. SUMÁRIO (PÁGINA DEDICADA & DESTACADA)                            */}
      {/* =================================================================== */}
      <section className="space-y-5 pb-8 border-b-2 border-gray-400 print:break-after-page print:border-none print:pb-0">
        {/* Cabeçalho do Sumário */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-300">
          <div className="flex items-center gap-2.5">
            <img
              src="/images/setgen-logo.png"
              alt="SETGEN"
              className="h-8 w-auto object-contain"
            />
            <span className="text-xs font-bold text-gray-800 uppercase">
              Relatório Técnico de Inspeção SPDA
            </span>
          </div>
          <span className="text-[11px] font-mono text-gray-500">
            {document.code}
          </span>
        </div>

        {/* Título de Destaque do Sumário */}
        <div className="border-b-2 border-gray-800 pb-2 pt-2">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest text-center">
            SUMÁRIO GERAL
          </h2>
        </div>

        {/* Lista com Guias Pontilhadas (Dot Leaders ABNT) */}
        <div className="grid grid-cols-1 gap-1.5 pt-2 text-xs text-gray-800 font-sans">
          {sumarioItems.map((item) => (
            <div
              key={item.num}
              className="flex items-baseline justify-between py-1 px-1 hover:bg-gray-50"
            >
              <span className="font-medium">
                <strong>{item.num}.</strong> {item.title}
              </span>
              <span className="grow mx-2 border-b border-dotted border-gray-400" />
              <span className="font-mono text-gray-600 font-bold text-[11px] shrink-0">
                {item.page}
              </span>
            </div>
          ))}
        </div>

        {/* Nota explicativa de rodapé do sumário */}
        <div className="pt-6 border-t border-gray-200 text-[10px] text-gray-500 text-center">
          Documento técnico composto por 21 seções estruturadas conforme preceitos da ABNT NBR 5419:2015.
        </div>
      </section>

      {/* =================================================================== */}
      {/* CORPO DO LAUDO TÉCNICO (SEÇÕES 1 A 21 COM FLUXO CONTÍNUO NATURAL)  */}
      {/* =================================================================== */}
      <div className="space-y-6 print:space-y-5">
        {/* Cabeçalho de Início do Conteúdo */}
        <div className="pb-2 border-b-2 border-gray-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
            DOSSIÊ TÉCNICO DE INSPEÇÃO & ENSAIOS
          </h2>
          <span className="text-[10px] font-mono text-gray-500">
            Página 03
          </span>
        </div>

        {/* SEÇÃO 1: IDENTIFICAÇÃO DO DOCUMENTO */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            1. Identificação do Documento
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="border border-gray-200 p-2 bg-gray-50/50">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Cliente:</span>
              <strong className="text-gray-900">{clientName}</strong>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50/50">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Sistema Avaliado:</span>
              <strong className="text-gray-900">{data.sistemaAvaliado || "SPDA"}</strong>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50/50">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Instrumento:</span>
              <strong className="text-gray-900">{data.instrumentoNome || "Miliohmímetro"}</strong>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50/50">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Tipo de Ensaio:</span>
              <strong className="text-gray-900">Continuidade elétrica</strong>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50/50">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Data da Vistoria:</span>
              <strong className="text-gray-900">{data.dataInspecao || formatDateBR(document.createdAt)}</strong>
            </div>
            <div className="border border-gray-200 p-2 bg-gray-50/50">
              <span className="text-[10px] text-gray-500 font-semibold block uppercase">Responsável Técnico:</span>
              <strong className="text-gray-900">{data.responsavelTecnico || techName}</strong>
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: OBJETIVO DA INSPEÇÃO */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            2. Objetivo da Inspeção
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.objetivoInspecao ||
              "O presente relatório tem como objetivo registrar as condições técnicas observadas durante a inspeção do Sistema de Proteção contra Descargas Atmosféricas (SPDA), incluindo avaliação visual dos componentes, verificação das condições construtivas e realização de ensaios de continuidade elétrica. Foram avaliados elementos de captação, descidas, malha inferior de aterramento, estruturas metálicas associadas e pontos de inspeção existentes."}
          </p>
        </div>

        {/* SEÇÃO 3: REFERÊNCIAS NORMATIVAS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            3. Referências Normativas
          </h3>
          <table className="w-full text-xs border border-gray-300">
            <thead className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-300">
              <tr>
                <th className="p-2 w-36 border-r border-gray-300 text-left">Norma</th>
                <th className="p-2 text-left">Aplicação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {normas.map((n: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="p-2 font-bold text-gray-900 border-r border-gray-200 font-mono">
                    {n.norma}
                  </td>
                  <td className="p-2 text-gray-700">
                    {n.titulo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 4: CARACTERIZAÇÃO DO SISTEMA SPDA EXISTENTE */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            4. Caracterização do Sistema SPDA Existente
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.caracterizacaoEdificio ||
              "Durante a inspeção técnica foi identificado sistema de proteção contra descargas atmosféricas composto por elementos de captação, condutores de descida, aterramento inferior e estruturas metálicas associadas."}
          </p>
        </div>

        {/* SEÇÃO 5: AVALIAÇÃO DO SISTEMA DE CAPTAÇÃO SUPERIOR */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            5. Avaliação do Sistema de Captação Superior
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.captacaoSuperior ||
              "Durante a inspeção visual da cobertura foram identificados elementos pertencentes ao sistema de captação superior, incluindo malha perimetral e captores aéreos instalados sobre a cobertura."}
          </p>
        </div>

        {/* SEÇÃO 6: COBERTURA METÁLICA COMO CAPTOR NATURAL */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            6. Cobertura Metálica como Elemento Natural de Captação
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.coberturaMetalica ||
              "A cobertura metálica existente apresenta características que podem permitir sua utilização como elemento natural de captação do SPDA, devendo ser confirmadas a espessura da chapa e a garantia de continuidade elétrica entre as terças e telhas (conforme ABNT NBR 5419-3)."}
          </p>
        </div>

        {/* SEÇÃO 7: SISTEMA DE DESCIDAS */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            7. Sistema de Descidas
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.sistemaDescidas ||
              "Foi identificado sistema de descidas executado através de condutores de cobre fixados na estrutura do edifício, interligando a captação à malha inferior de aterramento."}
          </p>
        </div>

        {/* SEÇÃO 8: ATERRAMENTO E MALHA INFERIOR */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            8. Aterramento e Malha Inferior
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.subsistemaAterramento ||
              "A malha inferior identificada durante a inspeção é composta por condutores de cobre nu e hastes de aterramento distribuídas no perímetro da instalação, com caixas de inspeção de solo."}
          </p>
        </div>

        {/* SEÇÃO 9: METODOLOGIA DOS ENSAIOS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            9. Metodologia dos Ensaios
          </h3>
          <table className="w-full text-xs border border-gray-300">
            <thead className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-300">
              <tr>
                <th className="p-2 w-44 border-r border-gray-300 text-left">Parâmetro</th>
                <th className="p-2 text-left">Descrição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="p-2 font-semibold text-gray-800 border-r border-gray-200 bg-gray-50/50">
                  Equipamento utilizado
                </td>
                <td className="p-2 text-gray-900">
                  {data.instrumentoNome || "Miliohmímetro digital (Ponte de Kelvin)"} {data.instrumentoModelo ? `· Modelo: ${data.instrumentoModelo}` : ""}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold text-gray-800 border-r border-gray-200 bg-gray-50/50">
                  Escala utilizada
                </td>
                <td className="p-2 text-gray-900 font-mono">
                  {data.metodologiaEscala || "200 mΩ"}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold text-gray-800 border-r border-gray-200 bg-gray-50/50">
                  Método
                </td>
                <td className="p-2 text-gray-900">
                  {data.metodologiaDescricao ||
                    "Ensaios de continuidade elétrica entre pontos acessíveis do sistema de aterramento, descidas e estruturas metálicas associadas."}
                </td>
              </tr>
              <tr>
                <td className="p-2 font-semibold text-gray-800 border-r border-gray-200 bg-gray-50/50">
                  Objetivo
                </td>
                <td className="p-2 text-gray-900">
                  Verificar a existência de caminho elétrico contínuo entre os pontos avaliados, identificando eventuais descontinuidades ou oxidações.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 10: RESULTADOS DOS ENSAIOS DE CONTINUIDADE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-gray-200 pb-1">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              10. Resultados dos Ensaios de Continuidade Elétrica
            </h3>
            <span className="text-[11px] text-gray-500 font-mono">
              Critério: R &lt; 0,200 Ω
            </span>
          </div>

          {totalMedicoes === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500 border border-dashed">
              Nenhuma medição cadastrada.
            </div>
          ) : (
            <table className="w-full text-xs border border-gray-300">
              <thead className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-300">
                <tr>
                  <th className="p-2 w-32 border-r border-gray-300 text-left">Pontos Avaliados</th>
                  <th className="p-2 w-24 text-center border-r border-gray-300">Resultado</th>
                  <th className="p-2 border-r border-gray-300 text-left">Condição Encontrada</th>
                  <th className="p-2 w-24 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {medicoes.map((m: any, idx: number) => {
                  const st = (m.status || "OK").toUpperCase();
                  const isOk = st === "OK" || st === "CONFORME";
                  const isNc = st === "NC" || st === "NÃO CONFORME";
                  const isRessalva = st === "RESSALVA" || st === "ATENÇÃO";

                  return (
                    <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"}>
                      <td className="p-2 font-bold text-gray-900 border-r border-gray-200 font-mono">
                        {m.ponto}
                      </td>
                      <td className="p-2 text-center font-mono font-bold text-gray-800 border-r border-gray-200">
                        {m.resistencia || "—"}
                      </td>
                      <td className="p-2 text-gray-700 border-r border-gray-200">
                        {m.condicao || "Continuidade elétrica confirmada."}
                      </td>
                      <td className="p-2 text-center font-bold">
                        <span
                          className={
                            isOk
                              ? "text-emerald-700"
                              : isNc
                              ? "text-red-700"
                              : isRessalva
                              ? "text-amber-700"
                              : "text-blue-700"
                          }
                        >
                          {st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* SEÇÃO 11: AVALIAÇÃO DAS ESTRUTURAS AUXILIARES */}
        {data.estruturasAuxiliares && (
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
              11. Avaliação das Estruturas Auxiliares
            </h3>
            <p className="text-gray-800 text-xs leading-relaxed">
              {data.estruturasAuxiliares}
            </p>
          </div>
        )}

        {/* SEÇÃO 12: RESUMO DOS RESULTADOS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            12. Resumo dos Resultados
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="border border-gray-300 p-3 bg-gray-50/50">
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {countOk < 10 ? `0${countOk}` : countOk}
              </div>
              <div className="text-[11px] font-bold text-gray-700 uppercase mt-0.5">
                Continuidade Confirmada
              </div>
              <div className="text-[10px] text-gray-500">pontos</div>
            </div>

            <div className="border border-gray-300 p-3 bg-gray-50/50">
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {countNc < 10 ? `0${countNc}` : countNc}
              </div>
              <div className="text-[11px] font-bold text-gray-700 uppercase mt-0.5">
                Circuito Aberto
              </div>
              <div className="text-[10px] text-gray-500">pontos</div>
            </div>

            <div className="border border-gray-300 p-3 bg-gray-50/50">
              <div className="text-2xl font-bold text-gray-900 font-mono">
                {countRessalva < 10 ? `0${countRessalva}` : countRessalva}
              </div>
              <div className="text-[11px] font-bold text-gray-700 uppercase mt-0.5">
                A Investigar / Ressalva
              </div>
              <div className="text-[10px] text-gray-500">pontos</div>
            </div>
          </div>
        </div>

        {/* SEÇÃO 13: AVALIAÇÃO DOS RISCOS DA CONDIÇÃO ATUAL */}
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            13. Avaliação dos Riscos da Condição Atual
          </h3>
          <p className="text-gray-800 text-xs leading-relaxed">
            {data.avaliacaoRiscos ||
              "Com base na inspeção visual e nos ensaios de continuidade executados, condições de descontinuidade ou circuito aberto podem comprometer a dispersão segura das correntes de descarga atmosférica, ocasionando elevação de potencial e riscos de centelhamento perigoso."}
          </p>
        </div>

        {/* SEÇÃO 14: CLASSIFICAÇÃO DAS PRIORIDADES DE CORREÇÃO */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            14. Classificação das Prioridades de Correção
          </h3>
          <table className="w-full text-xs border border-gray-300">
            <thead className="bg-gray-100 text-gray-800 font-semibold border-b border-gray-300">
              <tr>
                <th className="p-2 w-24 border-r border-gray-300 text-left">Prioridade</th>
                <th className="p-2 border-r border-gray-300 text-left">Critério</th>
                <th className="p-2 text-left">Ação Recomendada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="p-2 font-bold text-red-700 border-r border-gray-200">ALTA</td>
                <td className="p-2 text-gray-700 border-r border-gray-200">
                  Condições que podem comprometer diretamente a condução da corrente de descarga.
                </td>
                <td className="p-2 text-gray-700">
                  Correção prioritária e nova verificação após intervenção.
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-amber-700 border-r border-gray-200">MÉDIA</td>
                <td className="p-2 text-gray-700 border-r border-gray-200">
                  Condições que reduzem a confiabilidade ou dificultam manutenção.
                </td>
                <td className="p-2 text-gray-700">
                  Adequação programada.
                </td>
              </tr>
              <tr>
                <td className="p-2 font-bold text-gray-700 border-r border-gray-200">BAIXA</td>
                <td className="p-2 text-gray-700 border-r border-gray-200">
                  Melhorias preventivas e atualização documental.
                </td>
                <td className="p-2 text-gray-700">
                  Executar conforme planejamento de manutenção.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 15: REGISTRO DAS NÃO CONFORMIDADES */}
        {naoConformidades.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                15. Registro das Não Conformidades
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                {naoConformidades.length} item(ns)
              </span>
            </div>

            <div className="space-y-2">
              {naoConformidades.map((nc: any, idx: number) => (
                <div key={idx} className="border border-gray-300 p-2.5 space-y-1.5 text-xs bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                    <strong className="text-gray-900 uppercase">
                      {nc.codigo || `NC-${idx + 1 < 10 ? "0" + (idx + 1) : idx + 1}`} – {nc.titulo}
                    </strong>
                    <span className="font-bold text-[10px] uppercase font-mono px-2 py-0.5 border border-gray-300 bg-gray-50 text-gray-800">
                      {nc.criticidade || "ALTA"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-gray-700">
                    <div>
                      <span className="font-semibold text-gray-900">Local: </span>
                      {nc.local || "—"}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Evidência: </span>
                      {nc.evidencia || "—"}
                    </div>
                    {nc.risco && (
                      <div>
                        <span className="font-semibold text-gray-900">Risco: </span>
                        {nc.risco}
                      </div>
                    )}
                    {nc.recomendacao && (
                      <div>
                        <span className="font-semibold text-gray-900">Recomendação: </span>
                        {nc.recomendacao}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEÇÃO 16: RECOMENDAÇÕES GERAIS */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            16. Recomendações Gerais
          </h3>
          {recomendacoesGerais.length > 0 ? (
            <div className="space-y-1 text-xs text-gray-800">
              {recomendacoesGerais.map((rec: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-gray-600 font-mono w-5 shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-800 text-xs leading-relaxed">
              {data.recomendacoes ||
                "1. Realizar correção dos trechos identificados com ausência de continuidade elétrica. 2. Realizar inspeção detalhada das conexões internas das caixas de aterramento. 3. Instalar tampas adequadas nas caixas existentes. 4. Manter inspeções periódicas anuais conforme ABNT NBR 5419-3."}
            </p>
          )}
        </div>

        {/* SEÇÃO 17: CONCLUSÃO TÉCNICA */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            17. Conclusão Técnica
          </h3>

          <div className="p-2.5 border border-gray-300 bg-gray-50 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-700 uppercase">Classificação Final do Sistema:</span>
            <strong className="text-sm font-bold text-gray-900 uppercase">
              {classificacaoSistema}
            </strong>
          </div>

          <p className="text-gray-800 text-xs leading-relaxed">
            {data.conclusaoTecnica ||
              "O Sistema de Proteção contra Descargas Atmosféricas avaliado apresenta elementos compatíveis com a proteção da edificação. Recomenda-se a execução das adequações apontadas neste relatório para que todas as condições operacionais atendam integralmente às prescrições da ABNT NBR 5419:2015."}
          </p>
        </div>

        {/* SEÇÃO 18: REGISTRO FOTOGRÁFICO DAS MEDIÇÕES */}
        {evidencias.length > 0 && (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between border-b border-gray-200 pb-1">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                18. Registro Fotográfico das Medições
              </h3>
              <span className="text-[11px] font-mono text-gray-500">
                {evidencias.length} foto(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {evidencias.map((ev: any, idx: number) => (
                <div key={idx} className="border border-gray-300 p-2 space-y-1.5 bg-white break-inside-avoid">
                  {ev.fotoUrl ? (
                    <div className="aspect-4/3 w-full border border-gray-200 bg-gray-50 overflow-hidden">
                      <img
                        src={ev.fotoUrl}
                        alt={ev.titulo || `Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-4/3 w-full border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                      Sem imagem
                    </div>
                  )}
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-gray-900 uppercase text-[11px]">
                        {ev.titulo || `Foto ${idx + 1}`}
                      </strong>
                      {ev.status && (
                        <span className="text-[10px] font-semibold text-gray-600 font-mono">
                          {ev.status}
                        </span>
                      )}
                    </div>
                    {ev.descricao && (
                      <p className="text-[11px] text-gray-700 leading-snug">
                        {ev.descricao}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SEÇÃO 19: CROQUI DE LOCALIZAÇÃO (SEM QUEBRA FORÇADA DE PÁGINA) */}
        <div className="space-y-2 pt-3 break-inside-avoid">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            19. Croqui de Localização dos Pontos
          </h3>
          <p className="text-gray-700 text-xs">
            {data.croquiDescricao ||
              "O croqui abaixo apresenta a localização esquemática dos pontos de medição e descidas referenciados neste relatório."}
          </p>

          {data.croquiUrl ? (
            <div className="border border-gray-300 p-2 bg-gray-50 flex justify-center">
              <img
                src={data.croquiUrl}
                alt="Croqui de Localização"
                className="max-h-[460px] w-auto object-contain"
              />
            </div>
          ) : (
            <div className="p-4 text-center border border-dashed border-gray-300 text-xs text-gray-500">
              Croqui esquemático dos pontos anexado aos memoriais da OS.
            </div>
          )}
        </div>

        {/* SEÇÃO 20: CERTIFICADO DE CALIBRAÇÃO (SEM QUEBRA FORÇADA DE PÁGINA) */}
        <div className="space-y-2 pt-3 break-inside-avoid">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            20. Certificado de Calibração do Instrumento
          </h3>
          <p className="text-gray-700 text-xs">
            Certificado de calibração do miliohmímetro utilizado nos ensaios. Validade: {data.calibracaoValidade || "Vigente"}.
          </p>

          {data.certificadoCalibracaoUrl ? (
            <div className="border border-gray-300 p-2 bg-gray-50 flex justify-center">
              <img
                src={data.certificadoCalibracaoUrl}
                alt="Certificado de Calibração"
                className="max-h-[460px] w-auto object-contain"
              />
            </div>
          ) : (
            <div className="p-3 border border-gray-300 bg-gray-50 text-xs text-gray-700">
              Certificado de calibração RBC arquivado no SGQ da SETGEN. Instrumento: <strong>{data.instrumentoNome || "Miliohmímetro Digital"}</strong>, Nº de Série: <strong>{data.instrumentoSerie || "MB-2024-8841"}</strong>.
            </div>
          )}
        </div>

        {/* SEÇÃO 21: RESPONSABILIDADE TÉCNICA (ASSINATURAS CLÁSSICAS) */}
        <div className="space-y-5 pt-4 border-t-2 border-gray-300 break-inside-avoid">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-1">
            21. Responsabilidade Técnica
          </h3>

          <p className="text-xs text-gray-800 leading-relaxed italic">
            {data.declaracaoResponsabilidade ||
              "Declaro, para os devidos fins, que as informações contidas neste relatório correspondem às condições verificadas no local durante a inspeção técnica e aos resultados obtidos nos ensaios realizados, conforme metodologia e referências normativas descritas neste documento."}
          </p>

          <div className="text-xs text-gray-700">
            <strong>Local e Data:</strong> Manaus/AM, {data.dataInspecao || formatDateBR(document.createdAt)}
          </div>

          {/* Linhas de Assinatura Clássicas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4 text-center text-xs">
            {/* Responsável 1 */}
            <div className="flex flex-col items-center">
              <div className="h-14 flex items-end justify-center">
                {data.responsavelAssinaturaUrl || techSigImg ? (
                  <img
                    src={data.responsavelAssinaturaUrl || techSigImg}
                    alt="Assinatura"
                    className="max-h-12 max-w-[180px] object-contain"
                  />
                ) : (
                  <div className="h-12" />
                )}
              </div>
              <div className="w-64 border-t border-gray-800 pt-1.5 mt-1">
                <strong className="text-gray-900 block text-xs">
                  {data.responsavelTecnico || techName}
                </strong>
                <div className="text-gray-600 text-[11px] leading-tight">
                  {data.responsavelTitulo || "Engenheiro Eletricista"}
                </div>
                <div className="text-gray-500 text-[10px] font-mono">
                  {data.responsavelCrea || techRegistry || "CREA/AM"}
                </div>
                <div className="text-gray-500 text-[10px] mt-0.5">
                  Responsável Técnico · SETGEN
                </div>
              </div>
            </div>

            {/* Responsável 2 ou Aceite */}
            {data.responsavel2Nome ? (
              <div className="flex flex-col items-center">
                <div className="h-14 flex items-end justify-center">
                  {data.responsavel2AssinaturaUrl ? (
                    <img
                      src={data.responsavel2AssinaturaUrl}
                      alt="Assinatura 2"
                      className="max-h-12 max-w-[180px] object-contain"
                    />
                  ) : (
                    <div className="h-12" />
                  )}
                </div>
                <div className="w-64 border-t border-gray-800 pt-1.5 mt-1">
                  <strong className="text-gray-900 block text-xs">
                    {data.responsavel2Nome}
                  </strong>
                  <div className="text-gray-600 text-[11px] leading-tight">
                    {data.responsavel2Titulo || "Técnico Eletrotécnico"}
                  </div>
                  <div className="text-gray-500 text-[10px] font-mono">
                    {data.responsavel2Crea || "CREA/AM"}
                  </div>
                  <div className="text-gray-500 text-[10px] mt-0.5">
                    Responsável Técnico · SETGEN
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="h-14 flex items-end justify-center">
                  {clientSigImg ? (
                    <img
                      src={clientSigImg}
                      alt="Assinatura Cliente"
                      className="max-h-12 max-w-[180px] object-contain"
                    />
                  ) : (
                    <div className="h-12" />
                  )}
                </div>
                <div className="w-64 border-t border-gray-800 pt-1.5 mt-1">
                  <strong className="text-gray-900 block text-xs">
                    {data.supervisorCliente || clientName}
                  </strong>
                  <div className="text-gray-600 text-[11px] leading-tight">
                    Aceite do Contratante / Supervisor
                  </div>
                  {clientDoc && (
                    <div className="text-gray-500 text-[10px] font-mono">
                      CNPJ/CPF: {clientDoc}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RODAPÉ INSTITUCIONAL */}
        <footer className="pt-3 text-center text-[10px] text-gray-500 space-y-0.5 border-t border-gray-300">
          <div>
            SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ 10.744.400/0001-65 · Manaus/AM · setgen.com.br
          </div>
          <div className="font-mono text-gray-400">
            Relatório Técnico Nº {document.code} · SPDA
          </div>
        </footer>
      </div>
    </div>
  );
}
