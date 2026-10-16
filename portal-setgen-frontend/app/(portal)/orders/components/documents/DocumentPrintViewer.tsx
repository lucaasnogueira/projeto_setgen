"use client";

import React, { useRef } from "react";
import { ServiceOrderDocument, DocumentType, isFinalInspectionDoc } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Printer,
  X,
  Users,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { formatDateBR } from "@/lib/date";
import { TechnicalReportView } from "./TechnicalReportView";
import { FinalInspectionView } from "./FinalInspectionView";

interface DocumentPrintViewerProps {
  document: ServiceOrderDocument | null;
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentPrintViewer({
  document,
  order,
  isOpen,
  onClose,
}: DocumentPrintViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!document || !order) return null;

  const data = document.data || {};
  const client = order.client || {};
  const clientName = client.companyName || client.tradeName || data.cliente || data.contratanteNome || "Cliente";
  const clientDoc = client.cnpjCpf || data.clientDoc || data.contratanteCnpj || "Não informado";
  const addr = client.address;
  const clientAddress = addr
    ? [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(", ")
    : (data.local || data.enderecoObra || data.contratanteEndereco || "Manaus/AM");
  const clientPhone = data.telefone || client.phone || (client as any)?.contactPhone || "Não informado";
  const clientLocal = data.local || addr?.neighborhood || addr?.street || clientAddress;
  const clientCityState = data.cidadeUf || (addr?.city && addr?.state ? `${addr.city}/${addr.state}` : "Manaus/AM");

  const techName = data.responsavelTecnico || data.contratadaRepresentante || order.assignedTo?.name || "Rogério Guilherme Vieira Bentes";
  const techRegistry = data.registroProfissional || data.registroNacional || order.assignedTo?.registration || "CREA-AM / CFT";
  const orderNumber = order?.orderNumber ? `#${order.orderNumber}` : (data.ordemServico ? `#${data.ordemServico}` : "S/N");
  const orderScope = data.servico || data.objeto || data.descricaoTarefa || data.atividadeTecnica || order?.scope || "Serviços Técnicos Especializados em Engenharia Elétrica";
  const formattedQuoteTotal = order?.quote?.total
    ? Number(order.quote.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    : (data.valorTotal || data.valorContrato || "A combinar");

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 rounded-xl bg-slate-100 border border-gray-200 shadow-xl">
        {/* Barra superior de ações */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-slate-900 text-white shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#E2661D] text-white">
              {document.code}
            </span>
            <span className="text-sm font-bold truncate max-w-md">{document.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              size="sm"
              className="bg-[#E2661D] hover:bg-[#d05a18] text-white font-bold gap-1.5 rounded-xl shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-300 hover:text-white hover:bg-slate-800 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Folha do Documento */}
        <div ref={printRef} className="p-4 sm:p-8 flex justify-center bg-slate-100">
          <div
            id="printable-report"
            className="w-full max-w-[860px] bg-white text-gray-900 shadow-md rounded-xl p-6 sm:p-10 space-y-6 text-xs sm:text-sm font-sans border border-gray-200 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-0"
          >

            {/* Cabeçalho Institucional SGQ */}
            {document.type !== DocumentType.TECHNICAL_REPORT && !isFinalInspectionDoc(document) && (
              <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <img
                    src="/images/setgen-logo.png"
                    alt="SETGEN"
                    className="h-10 sm:h-12 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h1 className="text-sm sm:text-base font-black tracking-tight text-gray-950 uppercase leading-none">
                      SETGEN & SERVIÇOS
                    </h1>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mt-0.5">
                      R G VIEIRA BENTES · CNPJ 10.744.400/0001-65
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-100 text-[#E2661D] border border-orange-200">
                    {document.code}
                  </span>
                  <p className="text-[11px] text-gray-500 font-medium mt-1">
                    Data: {formatDateBR(document.createdAt)}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    OS nº {order.orderNumber}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 1. DOCUMENTO: APR (SGQ-SEG-01)                             */}
            {/* ========================================================= */}
            {document.type === DocumentType.APR && (
              <div className="space-y-6">
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      NR-10 · NR-35 · SEGURANÇA DO TRABALHO
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide">
                      APR — ANÁLISE PRELIMINAR DE RISCO
                    </h2>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">
                      {order.scope || "Intervenção Técnica"} · {clientName}
                    </p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs font-mono">
                    <div className="font-bold text-slate-900 text-sm">
                      APR Nº {document.code}
                    </div>
                    <div className="text-gray-500 font-medium text-[11px]">
                      Data: {formatDateBR(data.dataServico || document.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 1. Dados do Serviço */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    1. DADOS DO SERVIÇO & LOCAL
                  </div>
                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Cliente:
                        </td>
                        <td className="w-2/6 p-2 font-bold text-gray-900 border-r border-gray-200">
                          {clientName}
                        </td>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Telefone:
                        </td>
                        <td className="w-2/6 p-2 text-gray-900">
                          {clientPhone}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Local do Serviço:
                        </td>
                        <td className="p-2 text-gray-900 border-r border-gray-200">
                          {data.local || clientAddress}
                        </td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          OS nº:
                        </td>
                        <td className="p-2 font-mono font-bold text-[#E2661D]">
                          {order.orderNumber}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200 align-top">
                          Descrição da Tarefa:
                        </td>
                        <td className="p-2 text-gray-800 leading-relaxed" colSpan={3}>
                          {data.descricaoTarefa || order.scope}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. Atividades Envolvidas */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    2. ATIVIDADES OPERACIONAIS ENVOLVIDAS
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 py-1 text-xs">
                    {(data.atividades && data.atividades.length > 0
                      ? data.atividades
                      : [
                          "Eletricidade (baixa tensão)",
                          "Média tensão / subestação",
                          "Trabalho em altura",
                          "Gerador / combustível",
                          "Ferramentas manuais e elétricas",
                        ]
                    ).map((atv: string) => (
                      <div key={atv} className="flex items-center gap-2 py-0.5">
                        <span className="w-3.5 h-3.5 border border-slate-900 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          ✓
                        </span>
                        <span className="font-bold text-gray-900 truncate">{atv}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Riscos e Medidas de Controle */}
                {data.riscos && data.riscos.length > 0 && (
                  <div className="space-y-2">
                    <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                      3. RISCOS E MEDIDAS PREVENTIVAS DE CONTROLE
                    </div>
                    <table className="w-full text-xs text-left border border-gray-300">
                      <thead className="bg-slate-900 text-white font-bold text-[11px]">
                        <tr>
                          <th className="p-2.5 w-1/4 border-r border-slate-700">Perigo / Risco</th>
                          <th className="p-2.5 w-1/4 border-r border-slate-700">Possíveis Consequências</th>
                          <th className="p-2.5 border-r border-slate-700">Medidas de Controle Obrigatórias</th>
                          <th className="p-2.5 w-28 text-center">Responsável</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.riscos.map((r: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            <td className="p-2.5 font-bold text-gray-900 border-r border-gray-200">{r.perigo}</td>
                            <td className="p-2.5 text-gray-800 font-medium border-r border-gray-200">{r.conseq}</td>
                            <td className="p-2.5 text-gray-700 leading-relaxed border-r border-gray-200">{r.controle}</td>
                            <td className="p-2.5 text-gray-800 font-medium text-center">{r.responsavel || techName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. EPIs e EPCs */}
                {((data.epis && data.epis.length > 0) || (data.epcs && data.epcs.length > 0)) && (
                  <div className="space-y-2">
                    <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                      4. EQUIPAMENTOS DE PROTEÇÃO (EPI E EPC)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.epis && data.epis.length > 0 && (
                        <div className="border border-gray-300 p-3 space-y-1.5">
                          <div className="text-[11px] font-bold uppercase text-gray-900 pb-1 border-b border-gray-200">
                            EPIs OBRIGATÓRIOS (NR-06)
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {data.epis.map((epi: string) => (
                              <div key={epi} className="flex items-center gap-1.5 py-0.5">
                                <span className="w-3.5 h-3.5 border border-slate-900 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                                <span className="text-[11px] text-gray-900 truncate">{epi}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {data.epcs && data.epcs.length > 0 && (
                        <div className="border border-gray-300 p-3 space-y-1.5">
                          <div className="text-[11px] font-bold uppercase text-gray-900 pb-1 border-b border-gray-200">
                            EPCs OBRIGATÓRIOS (PROTEÇÃO COLETIVA)
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {data.epcs.map((epc: string) => (
                              <div key={epc} className="flex items-center gap-1.5 py-0.5">
                                <span className="w-3.5 h-3.5 border border-slate-900 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                                <span className="text-[11px] text-gray-900 truncate">{epc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Emergência e Liberação */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    5. EMERGÊNCIA & LIBERAÇÃO DA ATIVIDADE
                  </div>
                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      {data.emergenciaHospital && (
                        <tr>
                          <td className="w-1/4 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                            Hospital / Emergência:
                          </td>
                          <td className="p-2 text-gray-900">
                            {data.emergenciaHospital}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="w-1/4 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Resultado da Liberação:
                        </td>
                        <td className="p-2 font-bold uppercase text-slate-900">
                          {data.liberacaoStatus || "LIBERADO"}
                        </td>
                      </tr>
                      {data.restricoes && (
                        <tr>
                          <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                            Restrições / Condições:
                          </td>
                          <td className="p-2 text-gray-800">
                            {data.restricoes}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900">
                  <div className="text-center flex flex-col items-center justify-end space-y-2">
                    <div className="h-16 flex items-center justify-center">
                      {document.signatures?.tech ? (
                        <img src={document.signatures.tech} alt="Assinatura Técnico" className="max-h-14 max-w-[180px] object-contain" />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>
                    <div className="w-56 border-t border-gray-900" />
                    <p className="font-bold text-xs text-gray-900">{techName}</p>
                    <p className="text-[11px] text-gray-500">{techRegistry} · SETGEN & SERVIÇOS</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-end space-y-2">
                    <div className="h-16 flex items-center justify-center">
                      {document.signatures?.client ? (
                        <img src={document.signatures.client} alt="Assinatura Cliente" className="max-h-14 max-w-[180px] object-contain" />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>
                    <div className="w-56 border-t border-gray-900" />
                    <p className="font-bold text-xs text-gray-900">{data.supervisorCliente || clientName}</p>
                    <p className="text-[11px] text-gray-500">Supervisor / Responsável do Cliente</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. DOCUMENTO: PERMISSÃO DE TRABALHO - PT (SGQ-SEG-02)     */}
            {/* ========================================================= */}
            {document.type === DocumentType.WORK_PERMIT && (
              <div className="space-y-5">
                {/* Cabeçalho do Documento PT */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
                  <div>
                    <h2 className="text-base sm:text-xl font-bold uppercase tracking-wide text-slate-950">
                      PERMISSÃO DE TRABALHO (PT)
                    </h2>
                    <p className="text-xs text-gray-700 font-semibold mt-0.5">
                      {data.servico || order?.scope || "Intervenção Técnica Especializada"} · {data.cliente || clientName}
                    </p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs">
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      PT Nº {document.code}
                    </div>
                    <div className="text-gray-500 font-medium text-[11px]">
                      Data: {formatDateBR(data.dataValidade || document.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 1. DADOS DO TRABALHO */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    1. DADOS DO TRABALHO
                  </div>

                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Cliente:
                        </td>
                        <td className="w-2/6 p-2 font-bold text-gray-900 border-r border-gray-200">
                          {data.cliente || clientName}
                        </td>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Telefone:
                        </td>
                        <td className="w-2/6 p-2 text-gray-900">
                          {data.telefone || "Não informado"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Local:
                        </td>
                        <td className="p-2 text-gray-900 border-r border-gray-200">
                          {data.local || clientAddress}
                        </td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Cidade/UF:
                        </td>
                        <td className="p-2 text-gray-900">
                          {data.cidadeUf || "Manaus/AM"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Serviço:
                        </td>
                        <td className="p-2 text-gray-900 border-r border-gray-200">
                          {data.servico || order?.scope}
                        </td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          OS nº:
                        </td>
                        <td className="p-2 font-mono font-bold text-[#E2661D]">
                          {data.ordemServico || order.orderNumber}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          APR nº:
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-800 border-r border-gray-200">
                          {data.aprVinculada || "—"}
                        </td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Equipamento:
                        </td>
                        <td className="p-2 text-gray-900">
                          {data.equipamento || "Conforme OS"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200 align-top">
                          Atividade Autorizada:
                        </td>
                        <td className="p-2 text-gray-800 leading-relaxed" colSpan={3}>
                          {data.atividadeAutorizada ||
                            order?.scope ||
                            "Intervenção autorizada estritamente sob os limites técnicos e de segurança descritos."}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. VALIDADE & 3. TIPO DE TRABALHO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 2. VALIDADE */}
                  <div className="space-y-1.5">
                    <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                      2. VALIDADE DA PERMISSÃO
                    </div>
                    <table className="w-full text-xs border border-gray-300">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="w-1/3 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                            Data:
                          </td>
                          <td className="p-2 font-mono font-bold text-gray-900">
                            {formatDateBR(data.dataValidade || document.createdAt)}
                          </td>
                        </tr>
                        <tr>
                          <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                            Horário:
                          </td>
                          <td className="p-2 font-mono text-gray-900">
                            Das <strong>{data.horaInicio || "08:00"}</strong> às <strong>{data.horaFim || "18:00"}</strong>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 3. TIPO DE TRABALHO */}
                  <div className="space-y-1.5">
                    <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                      3. CATEGORIA DE TRABALHO
                    </div>
                    <div className="border border-gray-300 p-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                      {[
                        "Elétrico — baixa tensão",
                        "Elétrico — média tensão (SEP)",
                        "Em altura",
                        "A quente / inflamáveis",
                        "Espaço confinado",
                        "Içamento de cargas",
                      ].map((t) => {
                        const isChecked = (data.tipoTrabalho || []).includes(t);
                        return (
                          <div key={t} className="flex items-center gap-1.5 py-0.5">
                            <span
                              className={`w-3.5 h-3.5 border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isChecked
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-gray-300 bg-white text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            <span className={isChecked ? "font-bold text-gray-900 truncate" : "text-gray-500 truncate"}>
                              {t}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. CONDIÇÕES PARA LIBERAÇÃO */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    4. CONDIÇÕES OBRIGATÓRIAS PARA LIBERAÇÃO
                  </div>

                  <div className="border border-gray-300 p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                      {/* Coluna 1 */}
                      <div className="divide-y divide-gray-100">
                        {[
                          "APR elaborada e lida com toda a equipe",
                          "EPIs inspecionados e em uso",
                          "Condições climáticas adequadas (sem chuva forte ou raios)",
                          "Desligamento confirmado com a concessionária (protocolo)",
                          "Bloqueio e etiquetagem aplicados",
                          "Aterramento temporário instalado",
                          "Circuito desenergizado e seccionado",
                          "Ausência de tensão testada com instrumento aferido",
                        ].map((item) => {
                          const st = data.condicoesLiberacao?.[item] || "OK";
                          return (
                            <div
                              key={item}
                              className="flex items-center justify-between gap-2 py-1"
                            >
                              <span className="text-[11px] text-gray-800 truncate">
                                {item}
                              </span>
                              <div className="inline-flex items-center gap-0.5 text-[8px] font-bold shrink-0">
                                <span
                                  className={`px-1 py-0.5 rounded ${
                                    st === "OK"
                                      ? "bg-slate-900 text-white"
                                      : "border border-gray-200 text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  OK
                                </span>
                                <span
                                  className={`px-1 py-0.5 rounded ${
                                    st === "NÃO"
                                      ? "bg-red-700 text-white"
                                      : "border border-gray-200 text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  NÃO
                                </span>
                                <span
                                  className={`px-1 py-0.5 rounded ${
                                    st === "N/A"
                                      ? "bg-gray-700 text-white"
                                      : "border border-gray-200 text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  N/A
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coluna 2 */}
                      <div className="divide-y divide-gray-100">
                        {[
                          "Equipe treinada e autorizada para a atividade",
                          "Área isolada e sinalizada",
                          "Responsável do local ciente do serviço",
                          "Seccionamento visível (chaves / disjuntor abertos)",
                          "Ausência de tensão testada com detector de MT",
                          "Gerador / outras fontes impedidos de energizar (modo manual)",
                          "Bloqueio e etiquetagem aplicados (cadeado e etiqueta)",
                        ].map((item) => {
                          const st = data.condicoesLiberacao?.[item] || "OK";
                          return (
                            <div
                              key={item}
                              className="flex items-center justify-between gap-2 py-1"
                            >
                              <span className="text-[11px] text-gray-800 truncate">
                                {item}
                              </span>
                              <div className="inline-flex items-center gap-0.5 text-[8px] font-bold shrink-0">
                                <span
                                  className={`px-1 py-0.5 rounded ${
                                    st === "OK"
                                      ? "bg-slate-900 text-white"
                                      : "border border-gray-200 text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  OK
                                </span>
                                <span
                                  className={`px-1 py-0.5 rounded ${
                                    st === "NÃO"
                                      ? "bg-red-700 text-white"
                                      : "border border-gray-200 text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  NÃO
                                </span>
                                <span
                                  className={`px-1 py-0.5 rounded ${
                                    st === "N/A"
                                      ? "bg-gray-700 text-white"
                                      : "border border-gray-200 text-gray-400 bg-gray-50"
                                  }`}
                                >
                                  N/A
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-gray-200 text-xs">
                      <span className="text-[10px] font-bold uppercase text-gray-600 block mb-0.5">
                        Riscos Adicionais / Medidas Suplementares:
                      </span>
                      <p className="text-gray-800">
                        {data.riscosAdicionais ||
                          "Nenhum risco adicional não contemplado na APR identificado no momento da liberação."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 5. EQUIPE AUTORIZADA */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    5. EQUIPE AUTORIZADA
                  </div>

                  <table className="w-full text-xs text-left border border-gray-300">
                    <thead className="bg-slate-900 text-white font-bold text-[11px]">
                      <tr>
                        <th className="p-2 w-1/2 border-r border-slate-700">NOME</th>
                        <th className="p-2 w-1/3 border-r border-slate-700">FUNÇÃO</th>
                        <th className="p-2 text-center">ASSINATURA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {((data.equipeAutorizada && data.equipeAutorizada.length > 0)
                        ? data.equipeAutorizada
                        : [
                            { nome: techName, funcao: "Encarregado / Eletrotécnico" },
                            { nome: "", funcao: "Eletricista Montador" },
                          ]
                      ).map((m: any, idx: number) => (
                        <tr key={idx} className="h-9">
                          <td className="p-2 font-bold text-gray-900 border-r border-gray-200">{m.nome || "—"}</td>
                          <td className="p-2 text-gray-700 border-r border-gray-200">{m.funcao || "—"}</td>
                          <td className="p-2 text-center">
                            <div className="border-b border-gray-400 w-32 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 6. ENCERRAMENTO DA PERMISSÃO */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    6. ENCERRAMENTO DA PERMISSÃO
                  </div>

                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/4 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Condições de Encerramento:
                        </td>
                        <td className="p-2 text-gray-800" colSpan={3}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                            {[
                              "Serviço concluído",
                              "Bloqueios e aterramentos retirados",
                              "Instalação liberada / reenergizada",
                              "Ferramentas e materiais recolhidos",
                              "Equipe fora da área de risco",
                              "Responsável do local comunicado",
                            ].map((item) => (
                              <div key={item} className="flex items-center gap-1.5 py-0.5">
                                <span className="text-slate-900 font-bold">✓</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Encerrada em:
                        </td>
                        <td className="p-2 font-mono text-gray-900 border-r border-gray-200">
                          {formatDateBR(data.encerramento?.encerradaEm || document.createdAt)} {data.encerramento?.hora ? `às ${data.encerramento.hora}` : ""}
                        </td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Encerrada por:
                        </td>
                        <td className="p-2 font-medium text-gray-900">
                          {data.encerramento?.encerradoPor || techName}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200 align-top">
                          Observações:
                        </td>
                        <td className="p-2 text-gray-800 leading-relaxed" colSpan={3}>
                          {data.encerramento?.observacoes ||
                            "Serviço concluído satisfatoriamente, sem incidentes. Área desmobilizada e reenergizada com segurança."}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 3 BOXES DE ASSINATURAS OFICIAIS */}
                <div className="pt-6 border-t-2 border-slate-900 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Box 1: Emitente da Permissão 1 */}
                    <div className="border border-gray-300 p-4 flex flex-col justify-between text-center space-y-3">
                      <div className="text-xs font-bold uppercase text-slate-900 border-b border-gray-200 pb-1.5">
                        EMITENTE DA PERMISSÃO
                      </div>

                      <div className="h-16 flex items-center justify-center">
                        {data.assinaturaTecnicoUrl ? (
                          <img
                            src={data.assinaturaTecnicoUrl}
                            alt="Assinatura Emitente 1"
                            className="max-h-14 max-w-[160px] object-contain"
                          />
                        ) : (
                          <div className="h-10" />
                        )}
                      </div>

                      <div className="border-t border-gray-900 pt-2 space-y-0.5">
                        <strong className="text-xs font-bold text-gray-900 block truncate">
                          {data.emitente1Nome || techName}
                        </strong>
                        <p className="text-[10px] text-gray-600">
                          {data.emitente1Funcao || "Responsável Técnico"}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {data.emitente1Registro || techRegistry || "CREA / CFT"}
                        </p>
                      </div>
                    </div>

                    {/* Box 2: Emitente da Permissão 2 */}
                    <div className="border border-gray-300 p-4 flex flex-col justify-between text-center space-y-3">
                      <div className="text-xs font-bold uppercase text-slate-900 border-b border-gray-200 pb-1.5">
                        EMITENTE DA PERMISSÃO
                      </div>

                      <div className="h-16 flex items-center justify-center">
                        <div className="h-10" />
                      </div>

                      <div className="border-t border-gray-900 pt-2 space-y-0.5">
                        <strong className="text-xs font-bold text-gray-900 block truncate">
                          {data.emitente2Nome || "Executor Técnico Habilitado"}
                        </strong>
                        <p className="text-[10px] text-gray-600">
                          {data.emitente2Funcao || "Técnico Eletrotécnico"}
                        </p>
                        <p className="text-[10px] font-mono text-gray-500">
                          {data.emitente2Registro || "CREA / CFT"}
                        </p>
                      </div>
                    </div>

                    {/* Box 3: Responsável pela Execução (Cliente) */}
                    <div className="border border-gray-300 p-4 flex flex-col justify-between text-center space-y-3">
                      <div className="text-xs font-bold uppercase text-slate-900 border-b border-gray-200 pb-1.5">
                        RESPONSÁVEL PELA EXECUÇÃO
                      </div>

                      <div className="h-16 flex items-center justify-center">
                        {data.assinaturaClienteUrl ? (
                          <img
                            src={data.assinaturaClienteUrl}
                            alt="Assinatura Responsável Execução"
                            className="max-h-14 max-w-[160px] object-contain"
                          />
                        ) : (
                          <div className="h-10" />
                        )}
                      </div>

                      <div className="border-t border-gray-900 pt-2 space-y-0.5">
                        <strong className="text-xs font-bold text-gray-900 block truncate">
                          {data.responsavelExecucaoNome || data.cliente || clientName}
                        </strong>
                        <p className="text-[10px] text-gray-600">
                          {data.responsavelExecucaoSubtitulo || "Recebeu a permissão e cumpre as condições"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé Institucional Simples */}
                  <div className="pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-0.5">
                    <div>SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ 10.744.400/0001-65 · Manaus/AM · SGQ-SEG-02 · Rev.00</div>
                    <div>contato@setgen.com.br · (92) 98112-0050 · setgen.com.br</div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3. DOCUMENTO: CONTRATO DE PRESTAÇÃO DE SERVIÇOS           */}
            {/* ========================================================= */}
            {document.type === DocumentType.CONTRACT && (
              <div className="space-y-5 text-justify leading-relaxed">
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      INSTRUMENTO JURÍDICO VINCULANTE
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase">
                      CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS
                    </h2>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">
                      {order.scope} · {clientName}
                    </p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs font-mono">
                    <div className="font-bold text-slate-900 text-sm">
                      CONTRATO Nº {document.code}
                    </div>
                    {data.contratoVinculado && (
                      <div className="text-[#E2661D] font-bold text-[10.5px]">
                        Ref. Contrato: {data.contratoVinculado}
                      </div>
                    )}
                    <div className="text-gray-500 font-medium text-[11px]">
                      Data: {formatDateBR(document.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs border-b border-gray-200 pb-4">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    QUALIFICAÇÃO DAS PARTES CONTRATANTES
                  </div>
                  <p><strong>CONTRATADA:</strong> {data.contratadaRazao || "SETGEN & SERVIÇOS (R G VIEIRA BENTES)"}, CNPJ {data.contratadaCnpj || "10.744.400/0001-65"}{data.contratadaEndereco ? `, com sede em ${data.contratadaEndereco}` : ", Manaus / AM"}.</p>
                  <p><strong>CONTRATANTE:</strong> {clientName}, CNPJ/CPF nº {clientDoc}, com sede em {clientAddress}.</p>
                </div>

                <div className="space-y-4 text-xs divide-y divide-gray-100">
                  <div className="pt-2">
                    <p><strong>CLÁUSULA 1ª — DO OBJETO:</strong> O presente contrato tem por objeto a prestação, pela CONTRATADA, dos seguintes serviços: <em>{data.objeto || order.scope}</em>.</p>
                  </div>
                  <div className="pt-2">
                    <p><strong>CLÁUSULA 2ª — DO VALOR E FORMA DE PAGAMENTO:</strong> Pela execução dos serviços descritos, o CONTRATANTE pagará o valor total de <strong>R$ {data.valorTotal || "A combinar"}</strong>.{data.condicoesPagamento ? ` Condições: ${data.condicoesPagamento}` : ""}</p>
                    {data.dadosBancarios && (
                      <div className="border-l-2 border-slate-900 pl-3 py-1 bg-gray-50 text-[11px] font-mono text-gray-700 mt-1">
                        <strong>Dados Bancários:</strong> {data.dadosBancarios}
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <p><strong>CLÁUSULA 3ª — DO PRAZO:</strong> O prazo estimado de execução será de <strong>{data.prazoExecucaoDias || "Conforme cronograma da OS"}</strong> a contar do início dos trabalhos.</p>
                  </div>
                  <div className="pt-2">
                    <p><strong>CLÁUSULA 4ª — DA GARANTIA:</strong> A CONTRATADA garante os serviços executados pelo prazo de <strong>{data.garantiaMeses ? `${data.garantiaMeses} meses` : "12 meses"}</strong> contados da entrega técnica.</p>
                  </div>
                  {data.foro && (
                    <div className="pt-2">
                      <p><strong>CLÁUSULA 5ª — DO FORO:</strong> As partes elegem a Comarca de <strong>{data.foro}</strong> para dirimir quaisquer litígios oriundos deste instrumento.</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900 text-center text-xs">
                  <div className="flex flex-col items-center justify-end space-y-1">
                    <div className="w-56 border-t border-gray-900 pt-2" />
                    <p className="font-bold text-gray-900">{techName}</p>
                    <p className="text-gray-500 text-[11px]">CONTRATADA (SETGEN & SERVIÇOS)</p>
                  </div>
                  <div className="flex flex-col items-center justify-end space-y-1">
                    <div className="w-56 border-t border-gray-900 pt-2" />
                    <p className="font-bold text-gray-900">{clientName}</p>
                    <p className="text-gray-500 text-[11px]">CONTRATANTE</p>
                  </div>
                </div>

                {(data.testemunha1Nome || data.testemunha2Nome) && (
                  <div className="grid grid-cols-2 gap-8 pt-4 text-center text-xs text-gray-500">
                    {data.testemunha1Nome && <div>Testemunha 1: {data.testemunha1Nome} {data.testemunha1Cpf ? `· CPF: ${data.testemunha1Cpf}` : ""}</div>}
                    {data.testemunha2Nome && <div>Testemunha 2: {data.testemunha2Nome} {data.testemunha2Cpf ? `· CPF: ${data.testemunha2Cpf}` : ""}</div>}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* 4. DOCUMENTO: TERMO DE ACEITE + GARANTIA + REVISÕES       */}
            {/* ========================================================= */}
            {document.type === DocumentType.ACCEPTANCE_TERM && (
              <div className="space-y-6">
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      CONCLUSÃO TÉCNICA & HOMOLOGAÇÃO
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase">
                      TERMO DE ENTREGA, ACEITE E CERTIFICADO DE GARANTIA
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">{clientName} · OS nº {order.orderNumber}</p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs font-mono">
                    <div className="font-bold text-slate-900 text-sm">
                      TERMO Nº {document.code}
                    </div>
                  </div>
                </div>

                {/* 1. Identificação */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    1. IDENTIFICAÇÃO DO SERVIÇO & CLIENTE
                  </div>
                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">Contratante:</td>
                        <td className="w-2/6 p-2 font-bold text-gray-900 border-r border-gray-200">{clientName}</td>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">Local:</td>
                        <td className="w-2/6 p-2 text-gray-900">{clientAddress}</td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">Serviço:</td>
                        <td className="p-2 text-gray-900 border-r border-gray-200">{order.scope}</td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">OS nº:</td>
                        <td className="p-2 font-mono font-bold text-[#E2661D]">{order.orderNumber}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Equipamentos Instalados */}
                {data.equipamentos && data.equipamentos.length > 0 && (
                  <div className="space-y-2">
                    <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                      2. EQUIPAMENTOS INSTALADOS
                    </div>
                    <table className="w-full text-xs text-left border border-gray-300">
                      <thead className="bg-slate-900 text-white font-bold text-[11px]">
                        <tr>
                          <th className="p-2 border-r border-slate-700">Equipamento</th>
                          <th className="p-2 border-r border-slate-700">Marca / Modelo</th>
                          <th className="p-2 font-mono border-r border-slate-700">Nº de Série</th>
                          <th className="p-2 text-center border-r border-slate-700">Qtd</th>
                          <th className="p-2 text-center">Garantia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.equipamentos.map((eq: any, i: number) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-2 font-bold text-gray-900 border-r border-gray-200">{eq.equipamento}</td>
                            <td className="p-2 text-gray-700 border-r border-gray-200">{eq.marca}</td>
                            <td className="p-2 font-mono text-gray-600 border-r border-gray-200">{eq.serie}</td>
                            <td className="p-2 text-center border-r border-gray-200">{eq.qtd}</td>
                            <td className="p-2 text-center font-bold text-gray-900">{eq.garantia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Verificações na Entrega */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    3. VERIFICAÇÕES NA ENTREGA
                  </div>
                  <div className="border border-gray-300 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(data.verificacoes || {}).map(([v, checked]: any, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className="w-3.5 h-3.5 border border-slate-900 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                        <span className="text-gray-800 text-[11px] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pendências */}
                <div className="space-y-1 text-xs">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    4. PENDÊNCIAS TÉCNICAS
                  </div>
                  <p className="p-2 border border-gray-300 text-gray-800">
                    {data.pendencias || "Não há pendências: o serviço foi concluído e entregue em perfeito funcionamento."}
                  </p>
                </div>

                {/* Certificado de Garantia */}
                <div className="space-y-2 text-xs">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    5. CERTIFICADO OFICIAL DE GARANTIA ({data.garantiaMeses || 12} MESES)
                  </div>
                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/4 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">Cobertura:</td>
                        <td className="p-2 text-gray-800">A SETGEN certifica garantia de <strong>{data.garantiaMeses || 12} meses</strong>{data.garantiaAte ? ` (válida até ${data.garantiaAte})` : ""}.</td>
                      </tr>
                      {data.canaisGarantia && (
                        <tr>
                          <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">Canais:</td>
                          <td className="p-2 text-gray-800">{data.canaisGarantia}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t-2 border-slate-900">
                  <div className="text-center flex flex-col items-center justify-end space-y-2">
                    <div className="h-16 flex items-center justify-center">
                      {document.signatures?.tech ? (
                        <img src={document.signatures.tech} alt="Assinatura Técnico" className="max-h-14 max-w-[180px] object-contain" />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>
                    <div className="w-56 border-t border-gray-900" />
                    <p className="font-bold text-xs text-gray-900">{techName}</p>
                    <p className="text-[11px] text-gray-500">Responsável Técnico · SETGEN & SERVIÇOS</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-end space-y-2">
                    <div className="h-16 flex items-center justify-center">
                      {document.signatures?.client ? (
                        <img src={document.signatures.client} alt="Assinatura Cliente" className="max-h-14 max-w-[180px] object-contain" />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>
                    <div className="w-56 border-t border-gray-900" />
                    <p className="font-bold text-xs text-gray-900">{clientName}</p>
                    <p className="text-[11px] text-gray-500">Recebi e Aceito sem Pendências</p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. DOCUMENTO: RELATÓRIO TÉCNICO (DOSSIÊ 21 SEÇÕES SPDA)  */}
            {/* ========================================================= */}
            {document.type === DocumentType.TECHNICAL_REPORT && (
              <TechnicalReportView
                document={document}
                client={client}
                order={order}
                clientName={clientName}
                clientDoc={clientDoc}
                clientAddress={clientAddress}
                techName={techName}
                techRegistry={techRegistry}
                techSigImg={document.signatures?.tech || null}
                clientSigImg={document.signatures?.client || null}
                formatDateBR={formatDateBR}
              />
            )}

            {/* ========================================================= */}
            {/* 6. DOCUMENTO: ART (CREA / CFT)                            */}
            {/* ========================================================= */}
            {document.type === DocumentType.ART && (
              <div className="space-y-6">
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      REGISTRO PROFISSIONAL DE ENGENHARIA
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide">
                      Anotação de Responsabilidade Técnica (ART)
                    </h2>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">
                      {data.conselho || "CREA-AM"} Nº {data.numeroArt || document.code}
                    </p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs font-mono">
                    <div className="font-bold text-[#E2661D] text-sm">
                      {data.conselho || "CREA"}
                    </div>
                    <div className="text-gray-500 font-medium text-[11px]">
                      Emissão: {formatDateBR(document.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="border border-gray-300 divide-y divide-gray-300 text-xs">
                  <div className="p-3 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase text-gray-900">1. DADOS DO PROFISSIONAL</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-900">
                      <div><span className="text-gray-500">Profissional:</span> <strong>{techName}</strong></div>
                      <div><span className="text-gray-500">Registro / RNP:</span> <strong className="font-mono text-[#E2661D]">{techRegistry}</strong></div>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 bg-gray-50/50">
                    <div className="text-[11px] font-bold uppercase text-gray-900">2. EMPRESA VINCULADA</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-900">
                      <div><span className="text-gray-500">Nome Fantasia:</span> <strong>SETGEN & SERVIÇOS</strong></div>
                      <div><span className="text-gray-500">Razão Social:</span> <strong>R G VIEIRA BENTES (CNPJ 10.744.400/0001-65)</strong></div>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <div className="text-[11px] font-bold uppercase text-gray-900">3. CONTRATANTE E OBRA</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-900">
                      <div><span className="text-gray-500">Contratante:</span> <strong>{clientName}</strong></div>
                      <div><span className="text-gray-500">CNPJ/CPF:</span> <strong className="font-mono">{clientDoc}</strong></div>
                      <div className="sm:col-span-2"><span className="text-gray-500">Endereço da Obra:</span> <strong>{clientAddress}</strong></div>
                    </div>
                  </div>

                  <div className="p-3 space-y-1.5 bg-gray-50/50">
                    <div className="text-[11px] font-bold uppercase text-gray-900">4. CONTRATO & ATIVIDADE TÉCNICA</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-900">
                      <div><span className="text-gray-500">Tipo de ART:</span> <strong>{data.tipoArt || "Obra ou Serviço"}</strong></div>
                      <div><span className="text-gray-500">Valor Contrato:</span> <strong>R$ {data.valorContrato || "0,00"}</strong></div>
                      <div className="sm:col-span-2"><span className="text-gray-500">Atividade Técnica:</span> <p className="font-medium text-gray-800">{data.atividadeTecnica || order.scope}</p></div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-6 border-t-2 border-slate-900 flex flex-col items-center justify-end space-y-2">
                  <div className="h-16 flex items-center justify-center">
                    {document.signatures?.tech ? (
                      <img src={document.signatures.tech} alt="Assinatura do Profissional" className="max-h-14 max-w-[180px] object-contain" />
                    ) : (
                      <div className="h-12" />
                    )}
                  </div>
                  <div className="w-56 border-t border-gray-900" />
                  <p className="font-bold text-sm text-gray-900">{techName}</p>
                  <p className="text-xs text-gray-500">{data.conselho || "CREA / CFT"} · SETGEN & SERVIÇOS</p>
                </div>
              </div>
            )}

            {/* 7. DOCUMENTO: VISTORIA FINAL (SGQ-OPE-04)                         */}
            {/* ========================================================= */}
            {isFinalInspectionDoc(document) && (
              <FinalInspectionView
                document={document}
                client={client}
                order={order}
                clientName={clientName}
                clientDoc={clientDoc}
                clientAddress={clientAddress}
                techName={techName}
                techRegistry={techRegistry}
                formatDateBR={formatDateBR}
              />
            )}

            {/* Rodapé Padronizado */}
            {document.type !== DocumentType.TECHNICAL_REPORT && !isFinalInspectionDoc(document) && (
              <div className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-400 gap-2">
                <span>SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ 10.744.400/0001-65 · Manaus/AM</span>
                <span className="font-mono font-bold text-gray-500">{document.code} · Gestão Documental</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
