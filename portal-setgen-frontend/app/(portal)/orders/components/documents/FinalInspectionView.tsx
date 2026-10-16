"use client";

import React from "react";
import { formatDateBR } from "@/lib/date";

export interface FinalInspectionViewProps {
  document: any;
  client?: any;
  order?: any;
  clientName?: string;
  clientDoc?: string;
  clientAddress?: string;
  techName?: string;
  techRegistry?: string;
  techSigImg?: string | null;
  clientSigImg?: string | null;
  formatDateBR?: (dateStr?: string) => string;
}

export function FinalInspectionView({
  document,
  client,
  order,
  clientName: propClientName,
  clientDoc: propClientDoc,
  clientAddress: propClientAddress,
  techName: propTechName,
  techRegistry: propTechRegistry,
  techSigImg,
  clientSigImg,
  formatDateBR: propFormatDateBR,
}: FinalInspectionViewProps) {
  const data = document?.data || {};

  const clientName =
    propClientName ||
    data.cliente ||
    client?.companyName ||
    client?.tradeName ||
    order?.client?.companyName ||
    "Cliente";

  const clientPhone =
    data.telefone ||
    client?.phone ||
    (client as any)?.contactPhone ||
    order?.client?.phone ||
    "—";

  const clientAddress =
    propClientAddress ||
    data.endereco ||
    (client?.address
      ? [
          client.address.street,
          client.address.number,
          client.address.neighborhood,
          client.address.city,
          client.address.state,
        ]
          .filter(Boolean)
          .join(", ")
      : "Manaus/AM");

  const cidadeUf = data.cidadeUf || "Manaus/AM";
  const servico = data.servico || order?.scope || "Instalações elétricas";
  const propostaOs =
    data.propostaOs ||
    order?.orderNumber ||
    (data.osConferidaNumero ? `OS ${data.osConferidaNumero}` : "POT-2610-005");

  const fmtDate = propFormatDateBR || formatDateBR;
  const dataVistoria = data.dataVistoria
    ? fmtDate(data.dataVistoria)
    : fmtDate(new Date().toISOString().slice(0, 10));

  const codigoDoc = data.codigoDoc || document?.code || "VF2026-001";
  const osNumero = data.osConferidaNumero || order?.orderNumber || propostaOs || "OS-001";
  const situacaoOs = data.situacaoNaOs || (order?.status === "COMPLETED" ? "Concluída em campo" : "Executada / Pronta para entrega");

  const etapas: string[] = Array.isArray(data.etapasExecutadas) ? data.etapasExecutadas : [];
  const materiais: any[] = Array.isArray(data.materiais) ? data.materiais : [];
  const checklist: Record<string, "OK" | "NÃO" | "N/A"> = data.checklist || {};
  const medicoes: any[] = Array.isArray(data.medicoes) ? data.medicoes : [];
  const instrumentos: Record<string, boolean> = data.instrumentosUsados || {};

  const resultadoVistoria = (data.resultado || "Aprovado").trim();
  const oQueFalta = data.oQueFaltaCorrigir || "Nenhuma pendência constatada.";
  const prazoFalta = data.prazoParaCorrigir || "Sem pendências";
  const observacoes = data.observacoes || "Instalações elétricas inspecionadas e liberadas para uso normal e operação contínua em conformidade com as normas ABNT NBR 5410 e NR-10.";
  const cidadeDataExtenso = data.cidadeData || `Manaus/AM, ${new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}.`;

  // Signatários (Página 2)
  const resp1Nome = data.responsavel1?.nome || "Peterson Froes da Silva";
  const resp1Reg = data.responsavel1?.registro || "Responsável técnico · CREA-RNP 042008581-5";

  const resp2Nome = data.responsavel2?.nome || propTechName || "Rogério Guilherme Vieira Bentes";
  const resp2Reg = data.responsavel2?.registro || propTechRegistry || "Técnico Eletrotécnico | Tecnólogo em Automação Industrial · CREA: 25168 | CREA AM: 35534-AM | Reg. Nacional: 042003321";

  const clienteSignatarioNome = data.clienteSignatario?.nome || clientName;
  const clienteSignatarioSub = data.clienteSignatario?.subtitulo || "Acompanhou a vistoria";

  return (
    <div className="vf-root w-full">
      {/* Estilos dedicados e isolados para impressão A4 e renderização fiel */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .vf-screen-container {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          .vf-page-card {
            width: 100% !important;
            min-height: 277mm !important;
            max-height: 279mm !important;
            box-sizing: border-box !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .vf-page-break {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 0 !important;
          }
        }
      `}} />

      <div className="vf-screen-container space-y-8 print:space-y-0">
        {/* ============================================================== */}
        {/* PÁGINA 1: RELATÓRIO TÉCNICO DE VISTORIA FINAL                 */}
        {/* ============================================================== */}
        <div className="vf-page-card bg-white text-slate-900 border border-gray-300 rounded-xl shadow-md p-6 sm:p-8 flex flex-col justify-between text-xs leading-tight print:p-0 print:border-none print:shadow-none print:rounded-none">
          <div className="space-y-3">
            {/* Topo com Logo e indicador de página */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/setgen-logo.png"
                  alt="SETGEN"
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <span className="font-black text-slate-900 tracking-wider text-xs uppercase block">
                    SETGEN & SERVIÇOS
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Engenharia Elétrica & Manutenção Especializada
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-500">Página 1 de 2</span>
              </div>
            </div>

            {/* Título Principal */}
            <div className="text-center space-y-1 pb-2 border-b-2 border-slate-900">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-950">
                VISTORIA FINAL
              </h1>
              <p className="text-xs font-semibold text-gray-700">
                {servico} — <span className="font-bold text-slate-950">{clientName}</span>
              </p>
              <div className="flex items-center justify-center gap-6 pt-1 text-xs">
                <span className="font-mono font-black text-[#E2661D] bg-orange-50 px-2.5 py-0.5 rounded border border-orange-200">
                  VF Nº {codigoDoc}
                </span>
                <span className="font-semibold text-gray-600">
                  Data: <strong className="text-slate-950">{dataVistoria}</strong>
                </span>
              </div>
            </div>

            {/* 1. DADOS */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white font-black text-[11px] uppercase px-2.5 py-0.5 rounded flex items-center justify-between">
                <span>1. DADOS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 p-2 rounded border border-gray-300 bg-gray-50/70 text-[11px]">
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Cliente:</span>
                  <span className="font-black text-slate-900">{clientName}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Telefone:</span>
                  <span className="font-semibold text-slate-800">{clientPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Endereço:</span>
                  <span className="font-medium text-slate-800">{clientAddress}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Cidade/UF:</span>
                  <span className="font-semibold text-slate-800">{cidadeUf}</span>
                </div>
                <div className="col-span-2">
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Serviço:</span>
                  <span className="font-semibold text-slate-800">{servico}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Proposta / OS:</span>
                  <span className="font-mono font-bold text-slate-900">{propostaOs}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block text-[9px] uppercase">Data da Vistoria:</span>
                  <span className="font-semibold text-slate-900">{dataVistoria}</span>
                </div>
              </div>
            </div>

            {/* 2. CONFERÊNCIA DA ORDEM DE SERVIÇO */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white font-black text-[11px] uppercase px-2.5 py-0.5 rounded">
                2. CONFERÊNCIA DA ORDEM DE SERVIÇO
              </div>

              <div className="flex flex-wrap items-center gap-6 px-2.5 py-1 bg-gray-100 rounded border border-gray-200 text-[11px] font-semibold">
                <span>
                  OS conferida nº: <strong className="font-mono text-slate-900">{osNumero}</strong>
                </span>
                <span>
                  Situação na OS: <strong className="text-emerald-700">{situacaoOs}</strong>
                </span>
              </div>

              {/* Etapas Executadas */}
              {etapas.length > 0 && (
                <div className="space-y-0.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 block">
                    ETAPAS DA OS EXECUTADAS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 px-2.5 py-1 border border-gray-200 rounded bg-gray-50/50 text-[10px]">
                    {etapas.map((et, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <span className="font-medium text-slate-800 truncate">{et}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Materiais da OS */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 block">
                  MATERIAIS DA OS
                </span>
                <div className="overflow-x-auto border border-gray-300 rounded">
                  <table className="w-full text-[10px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 text-[9px] uppercase">
                      <tr>
                        <th className="p-1 text-left">MATERIAL</th>
                        <th className="p-1 text-center w-20">PREVISTO</th>
                        <th className="p-1 text-center w-20">USADO</th>
                        <th className="p-1 text-left w-44">CONFERIDO / OBS.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-slate-800">
                      {materiais.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-1 text-center text-gray-400 italic">
                            Nenhum material registrado na OS.
                          </td>
                        </tr>
                      ) : (
                        materiais.slice(0, 5).map((m, i) => (
                          <tr key={i} className="hover:bg-gray-50/50">
                            <td className="p-1 font-medium">{m.material}</td>
                            <td className="p-1 text-center font-mono">{m.previsto}</td>
                            <td className="p-1 text-center font-mono font-bold text-slate-900">{m.usado}</td>
                            <td className="p-1 text-gray-600">{m.conferidoObs || "Conforme"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 3. CONFERÊNCIA DO SERVIÇO (11 ITENS EM 2 COLUNAS) */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white font-black text-[11px] uppercase px-2.5 py-0.5 rounded">
                3. CONFERÊNCIA DO SERVIÇO
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-0.5 border border-gray-300 rounded p-1.5 bg-gray-50/30 text-[10px]">
                {[
                  "Serviço executado conforme a proposta / OS",
                  "Materiais conforme o especificado",
                  "Quadro organizado e circuitos identificados",
                  "Conexões apertadas e sem sinais de aquecimento",
                  "Eletrodutos, caixas e tampas fixados",
                  "Aterramento conectado e verificado",
                  "DR / IDR testado pelo botão de teste",
                  "DPS instalado e conectado",
                  "Equipamentos funcionando em carga",
                  "Local limpo, sem sobras de material",
                  "Cliente orientado sobre o uso e os cuidados",
                ].map((item, idx) => {
                  const val = checklist[item] || "OK";
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-1.5 py-0.5 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-0.5 font-mono text-[8px] font-bold shrink-0">
                        <span
                          className={`w-6 text-center py-0.2 rounded border ${
                            val === "OK"
                              ? "bg-emerald-600 text-white border-emerald-700 font-black"
                              : "bg-white text-gray-400 border-gray-200"
                          }`}
                        >
                          OK
                        </span>
                        <span
                          className={`w-6 text-center py-0.2 rounded border ${
                            val === "NÃO"
                              ? "bg-red-600 text-white border-red-700 font-black"
                              : "bg-white text-gray-400 border-gray-200"
                          }`}
                        >
                          NÃO
                        </span>
                        <span
                          className={`w-6 text-center py-0.2 rounded border ${
                            val === "N/A"
                              ? "bg-gray-600 text-white border-gray-700 font-black"
                              : "bg-white text-gray-400 border-gray-200"
                          }`}
                        >
                          N/A
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-slate-800 text-left flex-1 pl-1 truncate">
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. MEDIÇÕES E TESTES */}
            <div className="space-y-1">
              <div className="bg-slate-900 text-white font-black text-[11px] uppercase px-2.5 py-0.5 rounded">
                4. MEDIÇÕES E TESTES
              </div>

              <div className="overflow-x-auto border border-gray-300 rounded">
                <table className="w-full text-[10px]">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-300 text-[9px] uppercase">
                    <tr>
                      <th className="p-1 text-left">CIRCUITO / PONTO</th>
                      <th className="p-1 text-left">MEDIÇÃO</th>
                      <th className="p-1 text-center w-28">VALOR</th>
                      <th className="p-1 text-center w-28">RESULTADO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-slate-800">
                    {medicoes.slice(0, 6).map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="p-1 font-medium">{m.circuitoPonto || "QGBT / Instalação"}</td>
                        <td className="p-1">{m.medicao}</td>
                        <td className="p-1 text-center font-mono font-bold text-slate-900">{m.valor}</td>
                        <td className="p-1 text-center">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {m.resultado || "Conforme"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instrumentos Usados */}
              <div className="pt-0.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-600 block mb-0.5">
                  INSTRUMENTOS USADOS
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] px-2 py-1 bg-gray-50 border border-gray-200 rounded">
                  {[
                    { key: "multimetro", label: "Multímetro" },
                    { key: "alicateAmperimetro", label: "Alicate amperímetro" },
                    { key: "megohmetro", label: "Megôhmetro" },
                    { key: "terrometro", label: "Terrômetro" },
                    { key: "testadorDr", label: "Testador de DR" },
                    { key: "cameraTermografica", label: "Câmera termográfica" },
                  ].map((inst) => {
                    const checked = !!instrumentos[inst.key];
                    return (
                      <div key={inst.key} className="flex items-center gap-1">
                        <div
                          className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] font-black ${
                            checked
                              ? "bg-[#E2661D] border-[#E2661D] text-white"
                              : "bg-white border-gray-300 text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                        <span
                          className={`text-[10px] ${
                            checked ? "font-bold text-slate-900" : "text-gray-400"
                          }`}
                        >
                          {inst.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. PENDÊNCIAS */}
            <div className="space-y-0.5">
              <div className="bg-slate-900 text-white font-black text-[11px] uppercase px-2.5 py-0.5 rounded">
                5. PENDÊNCIAS
              </div>
              <div className="p-2 border border-gray-300 rounded bg-gray-50/50 space-y-0.5 text-[10px]">
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-gray-500 uppercase text-[9px] shrink-0">O QUE FALTA CORRIGIR:</span>
                  <span className="font-semibold text-slate-800">{oQueFalta}</span>
                </div>
                <div className="flex items-baseline gap-2 pt-0.5 border-t border-gray-200">
                  <span className="font-bold text-gray-500 uppercase text-[9px] shrink-0">PRAZO PARA CORRIGIR:</span>
                  <span className="font-mono font-bold text-slate-900">{prazoFalta}</span>
                </div>
              </div>
            </div>

            {/* 6. RESULTADO */}
            <div className="space-y-0.5">
              <div className="bg-slate-900 text-white font-black text-[11px] uppercase px-2.5 py-0.5 rounded">
                6. RESULTADO
              </div>

              <div className="p-2 border border-gray-300 rounded bg-gray-50/40 space-y-1 text-[10px]">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-gray-600 uppercase text-[9px]">
                    RESULTADO DA VISTORIA:
                  </span>
                  <div className="flex items-center gap-4">
                    {[
                      { label: "Aprovado", value: "Aprovado" },
                      { label: "Aprovado com ressalvas", value: "Aprovado com ressalvas" },
                      { label: "Reprovado", value: "Reprovado" },
                    ].map((opt) => {
                      const isChecked = resultadoVistoria.toLowerCase() === opt.value.toLowerCase();
                      return (
                        <div key={opt.value} className="flex items-center gap-1.5">
                          <div
                            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[8px] font-black ${
                              isChecked
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-gray-300 text-transparent"
                            }`}
                          >
                            ✓
                          </div>
                          <span
                            className={`text-[10px] ${
                              isChecked ? "font-black text-slate-900" : "font-medium text-gray-500"
                            }`}
                          >
                            {opt.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-0.5 border-t border-gray-200">
                  <span className="font-bold text-gray-500 uppercase text-[9px] block">OBSERVAÇÕES:</span>
                  <p className="font-medium text-slate-800 text-[10px] mt-0.5 leading-snug">
                    {observacoes}
                  </p>
                </div>

                <div className="pt-1 text-right">
                  <span className="font-medium text-gray-600 text-[10px] italic">
                    {cidadeDataExtenso}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé da Página 1 */}
          <div className="pt-2 border-t border-gray-300 flex items-center justify-between text-[9px] text-gray-500">
            <span className="font-mono font-bold">SGQ-OPE-04 · Rev.00</span>
            <span>SETGEN & SERVIÇOS · Vistoria Final</span>
            <span>Página 1 de 2</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PÁGINA 2: RESPONSABILIDADE TÉCNICA E ASSINATURAS               */}
        {/* ============================================================== */}
        <div className="vf-page-card vf-page-break bg-white text-slate-900 border border-gray-300 rounded-xl shadow-md p-6 sm:p-8 flex flex-col justify-between text-xs leading-tight print:p-0 print:border-none print:shadow-none print:rounded-none">
          <div className="space-y-6">
            {/* Topo com Logo e indicador de página 2 */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/setgen-logo.png"
                  alt="SETGEN"
                  className="h-8 w-auto object-contain"
                />
                <div>
                  <span className="font-black text-slate-900 tracking-wider text-xs uppercase block">
                    SETGEN & SERVIÇOS
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Engenharia Elétrica & Manutenção Especializada
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-gray-500">Página 2 de 2</span>
              </div>
            </div>

            {/* Título de Assinaturas */}
            <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
              <h2 className="text-lg font-black uppercase tracking-wider text-slate-950">
                RESPONSABILIDADE TÉCNICA E TERMO DE VISTORIA
              </h2>
              <p className="text-xs text-gray-600">
                Referente à VF Nº <strong className="font-mono text-slate-900">{codigoDoc}</strong> · Proposta/OS: <strong className="font-mono">{propostaOs}</strong>
              </p>
            </div>

            {/* Declaração Formal Técnica */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-700 leading-relaxed text-justify">
              <p>
                Declaramos, para os devidos fins de direito e garantia técnica, que as instalações elétricas e/ou serviços vinculados à presente Ordem de Serviço foram minuciosamente inspecionados, testados sob carga e conferidos em campo, atendendo rigorosamente aos critérios de segurança, funcionalidade e normas técnicas vigentes (ABNT NBR 5410, NR-10 e NR-35).
              </p>
            </div>

            {/* 3 Blocos Oficiais de Assinatura conforme o PDF */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
              {/* 1. Responsável Técnico */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E2661D] mb-6">
                  RESPONSÁVEL TÉCNICO
                </span>

                <div className="h-16 flex items-center justify-center w-full">
                  {techSigImg ? (
                    <img
                      src={techSigImg}
                      alt="Assinatura"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-44 border-b-2 border-slate-800" />
                  )}
                </div>

                <div className="mt-2 space-y-0.5">
                  <span className="text-xs font-black uppercase text-slate-900 block">
                    {resp1Nome}
                  </span>
                  <p className="text-[10px] font-medium text-gray-600 whitespace-pre-line leading-tight">
                    {resp1Reg}
                  </p>
                </div>
              </div>

              {/* 2. Responsável Técnico / Executor */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E2661D] mb-6">
                  RESPONSÁVEL TÉCNICO
                </span>

                <div className="h-16 flex items-center justify-center w-full">
                  {techSigImg ? (
                    <img
                      src={techSigImg}
                      alt="Assinatura"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-44 border-b-2 border-slate-800" />
                  )}
                </div>

                <div className="mt-2 space-y-0.5">
                  <span className="text-xs font-black uppercase text-slate-900 block">
                    {resp2Nome}
                  </span>
                  <p className="text-[10px] font-medium text-gray-600 whitespace-pre-line leading-tight">
                    {resp2Reg}
                  </p>
                </div>
              </div>

              {/* 3. Cliente */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 mb-6">
                  CLIENTE
                </span>

                <div className="h-16 flex items-center justify-center w-full">
                  {clientSigImg ? (
                    <img
                      src={clientSigImg}
                      alt="Assinatura Cliente"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-44 border-b-2 border-slate-800" />
                  )}
                </div>

                <div className="mt-2 space-y-0.5">
                  <span className="text-xs font-black uppercase text-slate-900 block">
                    {clienteSignatarioNome}
                  </span>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                    {clienteSignatarioSub}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé Oficial SETGEN com código SGQ-OPE-04 */}
          <div className="pt-12 space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-600 border-t border-gray-300 pt-2">
              <div className="flex items-center gap-2">
                <span>contato@setgen.com.br</span>
                <span>·</span>
                <span>(92) 98112-0050 · (92) 99537-4933</span>
                <span>·</span>
                <span className="font-semibold text-slate-900">setgen.com.br</span>
              </div>
              <span className="font-mono font-black text-slate-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 mt-1 sm:mt-0">
                SGQ-OPE-04 · Rev.00
              </span>
            </div>

            <div className="text-center text-[9px] text-gray-500 font-medium">
              SETGEN & SERVIÇOS · R G VIEIRA BENTES · CNPJ: 10.744.400/0001-65 · Manaus / AM · Página 2 de 2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
