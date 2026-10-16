"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { ordersApi } from "@/lib/api/orders";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import { Client, ServiceOrder, ServiceOrderDocument, DocumentType, isFinalInspectionDoc } from "@/types";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Printer,
  Edit,
  Loader2,
  FileText,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  Phone,
  Mail,
  MapPin,
  Check,
  Camera,
  QrCode,
  Award,
  Zap,
  Activity,
  Layers,
  Wrench,
  Copy,
  CheckSquare,
  BadgeCheck,
  Users,
  UserCheck,
} from "lucide-react";
import { formatDateBR } from "@/lib/date";
import { toast } from "sonner";
import { TechnicalReportView } from "@/app/(portal)/orders/components/documents/TechnicalReportView";
import { FinalInspectionView } from "@/app/(portal)/orders/components/documents/FinalInspectionView";

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const clientId = params?.clientId as string;
  const docId = params?.docId as string;

  const [document, setDocument] = useState<ServiceOrderDocument | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!docId || !clientId) return;
    setLoading(true);
    try {
      const [docData, clientData] = await Promise.all([
        orderDocumentsApi.getById(docId),
        clientsApi.getOne(clientId),
      ]);
      setDocument(docData);
      setClient(clientData);

      if (docData.serviceOrderId) {
        try {
          const orderData = await ordersApi.getById(docData.serviceOrderId);
          setOrder(orderData);
        } catch {
          setOrder(docData.serviceOrder || null);
        }
      } else if (docData.serviceOrder) {
        setOrder(docData.serviceOrder);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar o documento para visualização.");
    } finally {
      setLoading(false);
    }
  }, [docId, clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link do documento copiado para a área de transferência!");
    }
  };

  if (loading || !document) {
    return (
      <div className="py-28 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#E2661D]" />
        <span className="text-sm font-medium">Carregando relatório técnico em padrão executivo...</span>
      </div>
    );
  }

  const data = document.data || {};
  const clientName = client?.companyName || client?.tradeName || data.cliente || data.contratanteNome || "Cliente";
  const clientDoc = client?.cnpjCpf || data.clientDoc || data.contratanteCnpj || "Não informado";
  const addr = client?.address;
  const clientAddress = addr
    ? [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(", ")
    : (data.local || data.enderecoObra || data.contratanteEndereco || "Manaus/AM");
  const clientPhone = data.telefone || client?.phone || (client as any)?.contactPhone || order?.client?.phone || "Não informado";
  const clientLocal = data.local || addr?.neighborhood || addr?.street || clientAddress;
  const clientCityState = data.cidadeUf || (addr?.city && addr?.state ? `${addr.city}/${addr.state}` : "Manaus/AM");

  const techName = data.responsavelTecnico || data.contratadaRepresentante || order?.assignedTo?.name || "Rogério Guilherme Vieira Bentes";
  const techRegistry = data.registroProfissional || data.registroNacional || order?.assignedTo?.registration || "CREA-AM / CFT";
  const orderNumber = order?.orderNumber ? `#${order.orderNumber}` : (data.ordemServico ? `#${data.ordemServico}` : "S/N");
  const orderScope = data.servico || data.objeto || data.descricaoTarefa || data.atividadeTecnica || order?.scope || "Serviços Técnicos Especializados em Engenharia Elétrica";
  const orderEquipment = data.equipamento || order?.equipment?.name || (order?.equipment ? `${order.equipment.type || 'Equipamento'} ${order.equipment.brand || ''}`.trim() : "Grupo Gerador de Energia / Subestação");
  const orderEquipmentModel = order?.equipment?.model || "Conforme fabricante";
  const orderEquipmentSerial = order?.equipment?.serialNumber || "S/N";
  const formattedQuoteTotal = order?.quote?.total
    ? Number(order.quote.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
    : (data.valorTotal || data.valorContrato || "A combinar");

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case DocumentType.APR:
        return { label: "ANÁLISE PRELIMINAR DE RISCO", code: "SGQ-SEG-01 · Rev. 02", color: "text-amber-500" };
      case DocumentType.WORK_PERMIT:
        return { label: "PERMISSÃO DE TRABALHO", code: "SGQ-SEG-02 · Rev. 02", color: "text-rose-500" };
      case DocumentType.ACCEPTANCE_TERM:
        return { label: "TERMO DE ACEITE & GARANTIA", code: "SGQ-OPE-05 · Rev. 03", color: "text-emerald-500" };
      case DocumentType.CONTRACT:
        return { label: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS", code: "SGQ-COM-07 · Rev. 02", color: "text-blue-500" };
      case DocumentType.TECHNICAL_REPORT:
        return { label: "RELATÓRIO TÉCNICO DE INSPEÇÃO", code: "SGQ-TEC-01 · Rev. 04", color: "text-purple-500" };
      case DocumentType.ART:
        return { label: "ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA", code: "ART-ENG · Rev. 01", color: "text-[#E2661D]" };
      case DocumentType.OTHER:
        return { label: "VISTORIA FINAL", code: "SGQ-OPE-04 · Rev. 00", color: "text-teal-600" };
      default:
        return { label: "DOCUMENTO TÉCNICO", code: "SGQ-GERAL · Rev. 01", color: "text-gray-500" };
    }
  };

  const docTypeInfo = getDocTypeBadge(document.type);
  const techSigImg = data.assinaturaTecnicoUrl;
  const clientSigImg = data.assinaturaClienteUrl;

  // =========================================================================
  // BLOCO PROFISSIONAL E SIMPLES DE ASSINATURAS (IMAGEM ANEXADA OU EM BRANCO)
  // =========================================================================
  const renderSignatureBlock = () => {
    return (
      <div className="pt-8 border-t-2 border-slate-900 space-y-6 print:pt-6 break-inside-avoid">
        {/* Assinaturas em duas colunas: Técnico e Cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
          {/* Lado Esquerdo: Responsável Técnico (SETGEN) */}
          <div className="flex flex-col items-center justify-end space-y-2">
            <div className="h-20 w-full flex items-center justify-center">
              {techSigImg ? (
                <img
                  src={techSigImg}
                  alt="Assinatura do Responsável Técnico"
                  className="max-h-16 max-w-[200px] object-contain"
                />
              ) : (
                /* Espaço em branco para assinatura manual com caneta */
                <div className="h-16" />
              )}
            </div>

            <div className="w-64 border-t border-gray-900" />

            <div className="space-y-0.5 text-xs text-gray-800">
              <p className="font-bold text-gray-900">{techName}</p>
              <p className="text-[11px] text-gray-500">
                {techRegistry ? `${techRegistry} · ` : ""}SETGEN & SERVIÇOS (R G VIEIRA BENTES)
              </p>
              {data.numeroArt && (
                <p className="text-[10px] font-mono text-gray-500 font-medium">
                  ART nº {data.numeroArt}
                </p>
              )}
            </div>
          </div>

          {/* Lado Direito: Contratante (Cliente) */}
          <div className="flex flex-col items-center justify-end space-y-2">
            <div className="h-20 w-full flex items-center justify-center">
              {clientSigImg ? (
                <img
                  src={clientSigImg}
                  alt="Assinatura do Cliente"
                  className="max-h-16 max-w-[200px] object-contain"
                />
              ) : (
                /* Espaço em branco para assinatura manual com caneta */
                <div className="h-16" />
              )}
            </div>

            <div className="w-64 border-t border-gray-900" />

            <div className="space-y-0.5 text-xs text-gray-800">
              <p className="font-bold text-gray-900">{data.supervisorCliente || clientName}</p>
              <p className="text-[11px] text-gray-500">
                Contratante / Aceite do Cliente
              </p>
              {clientDoc && clientDoc !== "Não informado" && (
                <p className="text-[10px] font-mono text-gray-500">
                  CNPJ/CPF: {clientDoc}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Datação e Comarca Simples e Direta */}
        <div className="text-center text-[11px] text-gray-500 pt-2">
          Manaus / AM, {formatDateBR(document.createdAt)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 max-w-[860px] mx-auto print:max-w-none print:m-0 print:p-0">
      {/* =================================================================== */}
      {/* BARRA SUPERIOR DE AÇÕES E PRODUTIVIDADE (OCULTA NA IMPRESSÃO)      */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs print:hidden">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/documents/${clientId}`)}
            className="text-gray-500 hover:text-gray-900 gap-1.5 text-xs font-semibold shrink-0 max-w-[240px] sm:max-w-[360px] h-9"
            title={`Voltar para ${clientName}`}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Voltar para {clientName}</span>
          </Button>
          <div className="h-4 w-px bg-gray-200 hidden sm:block shrink-0" />
          <span className="text-xs font-mono font-bold text-gray-500 hidden sm:inline whitespace-nowrap shrink-0">
            Código: <strong className="text-gray-900">{document.code}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 border-gray-300 hover:bg-gray-50 shrink-0"
            title="Copiar link deste relatório"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar Link
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push(`/documents/${clientId}/${docId}/edit`)}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 border-gray-300 hover:bg-gray-50 shrink-0"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar Documento
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="rounded-lg h-9 text-xs font-semibold gap-1.5 bg-[#E2661D] hover:bg-[#d05a18] text-white shadow-2xs shrink-0"
          >
            <Printer className="w-4 h-4" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* FOLHA OFICIAL A4 DE ENGENHARIA — ALTA RESOLUÇÃO                     */}
      {/* =================================================================== */}
      <div className="w-full print:p-0 print:m-0">
        <div
          id="printable-report"
          ref={printRef}
          className={
            isFinalInspectionDoc(document)
              ? "w-full text-slate-900 font-sans print:p-0 print:m-0 print:border-none print:shadow-none print:bg-transparent"
              : "w-full bg-white text-gray-900 shadow-xl rounded-xl p-8 sm:p-12 space-y-6 text-xs sm:text-sm font-sans border border-gray-200 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:space-y-0"
          }
          style={isFinalInspectionDoc(document) ? undefined : { minHeight: "297mm" }}
        >
          {/* =============================================================== */}
          {/* CABEÇALHO OFICIAL SETGEN (COM LOGO REAL E RAZÃO SOCIAL CORRETA)  */}
          {/* =============================================================== */}
          {document.type !== DocumentType.TECHNICAL_REPORT && !isFinalInspectionDoc(document) && (
            <div className="border-b-2 border-slate-900 pb-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                {/* Lado Esquerdo: Logo Oficial e Razão Social Real */}
                <div className="flex items-center gap-4">
                  <img
                    src="/images/setgen-logo.png"
                    alt="SETGEN - Serviços Técnicos em Geradores de Energia & Serviços"
                    className="h-12 sm:h-14 w-auto object-contain shrink-0"
                  />
                  <div>
                    <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 leading-tight uppercase">
                      SETGEN & SERVIÇOS
                    </h1>
                    <p className="text-[11px] font-bold text-gray-700 tracking-wide mt-0.5">
                      R G VIEIRA BENTES
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                      CNPJ: 10.744.400/0001-65 · Manaus / AM · setgen.com.br
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Caixa do Documento e Identificação Oficial */}
                <div className="text-right shrink-0 space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-black shadow-2xs">
                    <Award className="w-3.5 h-3.5 text-[#E2661D]" />
                    <span>{document.code}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold">
                    {docTypeInfo.code}
                  </div>
                  <div className="text-[11px] font-bold text-gray-800">
                    Emissão: {formatDateBR(document.createdAt)}
                  </div>
                  {order && (
                    <div className="text-[10px] font-mono font-bold text-[#E2661D]">
                      VINCULADO À OS {orderNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Subfaixa de Homologação Integrada (sem card flutuante) */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-medium">
                <span className="font-bold text-gray-700 uppercase tracking-wide">
                  {docTypeInfo.label}
                </span>
                <span className="font-mono text-gray-400">
                  Padrão Normativo ABNT / NBR / NR
                </span>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODELO 1: RELATÓRIO TÉCNICO DE INSPEÇÃO SPDA (DOSSIÊ 21 SEÇÕES)  */}
          {/* =============================================================== */}
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
              techSigImg={techSigImg}
              clientSigImg={clientSigImg}
              formatDateBR={formatDateBR}
            />
          )}

          {/* =============================================================== */}
          {/* MODELO 2: APR — ANÁLISE PRELIMINAR DE RISCO                      */}
          {/* =============================================================== */}
          {document.type === DocumentType.APR && (
            <div className="space-y-6">
              {/* Cabeçalho Formal Executivo da APR */}
              <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    NR-10 · NR-35 · SEGURANÇA DO TRABALHO
                  </div>
                  <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
                    APR — ANÁLISE PRELIMINAR DE RISCO
                  </h2>
                  <p className="text-xs text-gray-700 font-semibold mt-0.5">
                    {orderScope} · {clientName}
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

              {/* 1. DADOS DO SERVIÇO & LOCAL */}
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
                        {clientLocal}
                      </td>
                      <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                        Cidade/UF:
                      </td>
                      <td className="p-2 text-gray-900">
                        {clientCityState}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                        Serviço:
                      </td>
                      <td className="p-2 text-gray-900 border-r border-gray-200">
                        {orderScope}
                      </td>
                      <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                        OS nº:
                      </td>
                      <td className="p-2 font-mono font-bold text-[#E2661D]">
                        {orderNumber}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200 align-top">
                        Descrição da Tarefa:
                      </td>
                      <td className="p-2 text-gray-800 leading-relaxed" colSpan={3}>
                        {data.descricaoTarefa || orderScope}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. ATIVIDADES OPERACIONAIS ENVOLVIDAS */}
              <div className="space-y-2">
                <div className="border-b border-gray-800 pb-1 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900 uppercase">
                    2. ATIVIDADES OPERACIONAIS ENVOLVIDAS
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    Riscos aplicáveis associados à matriz
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 py-1 text-xs">
                  {[
                    "Eletricidade (baixa tensão)",
                    "Média tensão / subestação",
                    "Trabalho em altura",
                    "Gerador / combustível",
                    "Içamento / movimentação de cargas",
                    "Ferramentas manuais e elétricas",
                    "Exposição ao sol e calor",
                    "Animais peçonhentos e insetos",
                    "Trabalho perto de vias / trânsito",
                  ].map((atv) => {
                    const isChecked = (data.atividades || [
                      "Eletricidade (baixa tensão)",
                      "Média tensão / subestação",
                      "Trabalho em altura",
                      "Gerador / combustível",
                      "Ferramentas manuais e elétricas",
                    ]).includes(atv);
                    return (
                      <div key={atv} className="flex items-center gap-2 py-0.5">
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
                          {atv}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. MATRIZ DE RISCOS E MEDIDAS PREVENTIVAS */}
              <div className="space-y-2">
                <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                  3. MATRIZ DE RISCOS E MEDIDAS PREVENTIVAS DE CONTROLE
                </div>

                <table className="w-full text-xs text-left border border-gray-300">
                  <thead className="bg-slate-900 text-white font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5 w-1/4 border-r border-slate-700">PERIGO / RISCO</th>
                      <th className="p-2.5 w-1/4 border-r border-slate-700">POSSÍVEIS CONSEQUÊNCIAS</th>
                      <th className="p-2.5 border-r border-slate-700">MEDIDAS DE CONTROLE OBRIGATÓRIAS</th>
                      <th className="p-2.5 w-28 text-center">RESPONSÁVEL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(data.riscos || []).map((r: any, idx: number) => (
                      <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="p-2.5 font-bold text-gray-900 align-top border-r border-gray-200">{r.perigo}</td>
                        <td className="p-2.5 text-gray-800 font-medium align-top border-r border-gray-200">{r.conseq}</td>
                        <td className="p-2.5 text-gray-700 leading-relaxed align-top border-r border-gray-200">{r.controle}</td>
                        <td className="p-2.5 text-gray-800 font-medium text-center align-top whitespace-nowrap">
                          {r.responsavel || techName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ============================================================= */}
              {/* PÁGINA 2 DA APR (EPIs, EPCs, EMERGÊNCIA, EQUIPE E LIBERAÇÃO)   */}
              {/* ============================================================= */}
              <div className="pt-6 border-t-2 border-dashed border-gray-300 print:break-before-page space-y-5">
                <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-mono tracking-wider border-b border-gray-200 pb-2">
                  <span>Análise Preliminar de Risco — Página 2 de 2</span>
                  <span>{document.code} · NR-10 / NR-35</span>
                </div>

                {/* 4. EPIS E EPCS OBRIGATÓRIOS */}
                <div className="space-y-3">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    4. EQUIPAMENTOS DE PROTEÇÃO (EPI E EPC)
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* EPIs */}
                    <div className="border border-gray-300 p-3 space-y-2">
                      <div className="text-[11px] font-bold uppercase text-gray-900 pb-1 border-b border-gray-200">
                        EPIs OBRIGATÓRIOS (NR-06)
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {[
                          "Capacete com jugular",
                          "Óculos de proteção",
                          "Protetor facial",
                          "Luvas de vaqueta",
                          "Luvas isolantes (BT)",
                          "Luvas isolantes (MT)",
                          "Botina de segurança (sem metal)",
                          "Vestimenta antichama NR-10",
                          "Cinto paraquedista e talabarte",
                          "Protetor auricular",
                          "Protetor solar",
                          "Máscara / respirador",
                        ].map((epi) => {
                          const isChecked = (data.epis && data.epis.length > 0)
                            ? data.epis.includes(epi)
                            : true;
                          return (
                            <div key={epi} className="flex items-center gap-1.5 py-0.5">
                              <span
                                className={`w-3.5 h-3.5 border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isChecked ? "border-slate-900 bg-slate-900 text-white" : "border-gray-300 bg-white text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                              <span className={`text-[11px] truncate ${isChecked ? "font-medium text-gray-900" : "text-gray-400"}`}>
                                {epi}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* EPCs */}
                    <div className="border border-gray-300 p-3 space-y-2">
                      <div className="text-[11px] font-bold uppercase text-gray-900 pb-1 border-b border-gray-200">
                        EPCs OBRIGATÓRIOS (PROTEÇÃO COLETIVA)
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs">
                        {[
                          "Cones e fita zebrada",
                          "Placas de sinalização",
                          "Cadeados / etiquetas bloqueio",
                          "Detector de tensão",
                          "Aterramento temporário",
                          "Vara de manobra",
                          "Tapete isolante",
                          "Linha de vida",
                          "Extintor",
                          "Kit de primeiros socorros",
                        ].map((epc) => {
                          const isChecked = (data.epcs && data.epcs.length > 0)
                            ? data.epcs.includes(epc)
                            : true;
                          return (
                            <div key={epc} className="flex items-center gap-1.5 py-0.5">
                              <span
                                className={`w-3.5 h-3.5 border flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isChecked ? "border-slate-900 bg-slate-900 text-white" : "border-gray-300 bg-white text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                              <span className={`text-[11px] truncate ${isChecked ? "font-medium text-gray-900" : "text-gray-400"}`}>
                                {epc}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. NORMAS E SITUAÇÃO DE EMERGÊNCIA */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    5. NORMAS APLICÁVEIS & PROCEDIMENTO DE EMERGÊNCIA
                  </div>

                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/4 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Normas Técnicas Regulamentadoras:
                        </td>
                        <td className="p-2 text-gray-900 font-mono font-medium">
                          {(data.normas || ["NR-06 (EPI)", "NR-10 (Eletricidade)", "NR-35 (Altura)", "NR-12 (Máquinas)"]).join(" · ")}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Em Caso de Emergência / Hospital:
                        </td>
                        <td className="p-2 text-gray-900">
                          {data.emergenciaHospital || "SAMU 192 · Bombeiros 193 · Pronto-Socorro 28 de Agosto (Manaus/AM)"}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200 align-top">
                          Plano de Resgate (Altura / Choque):
                        </td>
                        <td className="p-2 text-gray-800 leading-relaxed">
                          {data.planoResgate ||
                            "Desenergização imediata da fonte. Resgate em altura assistido por equipe qualificada NR-35 e acionamento SAMU."}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 6. EQUIPE CIENTE */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    6. EQUIPE TÉCNICA CIENTE E AUTORIZADA
                  </div>

                  <table className="w-full text-xs text-left border border-gray-300">
                    <thead className="bg-slate-900 text-white font-bold text-[11px]">
                      <tr>
                        <th className="p-2 w-1/2 border-r border-slate-700">NOME</th>
                        <th className="p-2 w-1/3 border-r border-slate-700">FUNÇÃO</th>
                        <th className="p-2 text-center">ASSINATURA / VISTO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {((data.equipe && data.equipe.length > 0)
                        ? data.equipe
                        : [
                            { nome: techName, funcao: "Responsável Técnico / Encarregado" },
                            { nome: "Equipe Técnica Setgen", funcao: "Eletricista Montador" },
                          ]
                      ).map((m: any, idx: number) => (
                        <tr key={idx} className="h-9">
                          <td className="p-2 font-bold text-gray-900 border-r border-gray-200">{m.nome}</td>
                          <td className="p-2 text-gray-700 border-r border-gray-200">{m.funcao}</td>
                          <td className="p-2 text-center">
                            <div className="border-b border-gray-400 w-32 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 7. LIBERAÇÃO DA ATIVIDADE */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 uppercase">
                      7. RESULTADO DA LIBERAÇÃO FORMAL
                    </span>
                    <span className="font-bold text-xs uppercase tracking-wide text-gray-900">
                      STATUS: {data.liberacaoStatus || "LIBERADO"}
                    </span>
                  </div>

                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/4 p-2.5 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Condições de Liberação:
                        </td>
                        <td className="p-2.5 text-gray-800 leading-relaxed">
                          {data.restricoes ||
                            "Atividade liberada para execução rigorosamente sob as medidas de proteção e procedimentos técnicos descritos nesta APR."}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="text-right text-xs text-gray-500 pt-1 font-medium">
                    Manaus/AM, {formatDateBR(data.dataServico || document.createdAt)}.
                  </div>
                </div>

                {/* Assinatura do Responsável Técnico */}
                {renderSignatureBlock()}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODELO 3: PT — PERMISSÃO DE TRABALHO                             */}
          {/* =============================================================== */}
          {document.type === DocumentType.WORK_PERMIT && (
            <div className="space-y-5">
              {/* Cabeçalho do Documento PT */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="text-base sm:text-xl font-black uppercase tracking-wide text-slate-950">
                    PERMISSÃO DE TRABALHO (PT)
                  </h2>
                  <p className="text-xs text-gray-700 font-bold mt-0.5">
                    {data.servico || order?.scope || "Intervenção Técnica Especializada"} · {data.cliente || clientName}
                  </p>
                </div>
                <div className="text-right sm:shrink-0 text-xs">
                  <div className="font-mono font-black text-slate-900 text-sm">
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
                        {data.ordemServico || orderNumber}
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

              {/* Datação e Comarca */}
              <div className="text-right text-xs text-gray-600 pt-1">
                Manaus/AM, {formatDateBR(data.dataValidade || document.createdAt)}.
              </div>

              {/* ============================================================= */}
              {/* PÁGINA 2 DO MODELO: ASSINATURAS OFICIAIS                     */}
              {/* ============================================================= */}
              <div className="pt-8 border-t-2 border-dashed border-gray-300 print:break-before-page space-y-6">
                <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-mono tracking-wider border-b border-gray-200 pb-2">
                  <span>Permissão de Trabalho — Página 2 de 2</span>
                  <span>{document.code}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Box 1: Emitente da Permissão 1 */}
                  <div className="border border-gray-300 p-4 flex flex-col justify-between text-center space-y-3">
                    <div className="text-xs font-bold uppercase text-slate-900 border-b border-gray-200 pb-1.5">
                      EMITENTE DA PERMISSÃO
                    </div>

                    <div className="h-16 flex items-center justify-center">
                      {techSigImg ? (
                        <img
                          src={techSigImg}
                          alt="Assinatura Emitente 1"
                          className="max-h-14 max-w-[180px] object-contain"
                        />
                      ) : (
                        <div className="h-12" />
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
                      <div className="h-12" />
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
                      {clientSigImg ? (
                        <img
                          src={clientSigImg}
                          alt="Assinatura Responsável Execução"
                          className="max-h-16 max-w-[180px] object-contain"
                        />
                      ) : (
                        <div className="h-12" />
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

                {/* Rodapé Institucional Simples da PT */}
                <div className="pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-0.5">
                  <div>SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ 10.744.400/0001-65 · Manaus/AM · SGQ-SEG-02 · Rev.00</div>
                  <div>contato@setgen.com.br · (92) 98112-0050 · setgen.com.br</div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODELO 4: CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS             */}
          {/* =============================================================== */}
          {document.type === DocumentType.CONTRACT && (
            <div className="space-y-6 text-justify leading-relaxed">
              {/* Cabeçalho do Contrato */}
              <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    INSTRUMENTO JURÍDICO VINCULANTE
                  </div>
                  <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
                    CONTRATO DE PRESTAÇÃO DE SERVIÇOS TÉCNICOS
                  </h2>
                  <p className="text-xs text-gray-700 font-semibold mt-0.5">
                    {orderScope} · {clientName}
                  </p>
                </div>
                <div className="text-right sm:shrink-0 text-xs font-mono">
                  <div className="font-bold text-slate-900 text-sm">
                    CONTRATO Nº {document.code}
                  </div>
                  <div className="text-gray-500 font-medium text-[11px]">
                    Data: {formatDateBR(document.createdAt)}
                  </div>
                </div>
              </div>

              {/* QUALIFICAÇÃO DAS PARTES */}
              <div className="space-y-3 text-xs border-b border-gray-200 pb-4">
                <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                  QUALIFICAÇÃO DAS PARTES CONTRATANTES
                </div>

                <div className="space-y-2 text-gray-800 leading-relaxed">
                  <p>
                    <strong>CONTRATADA:</strong> SETGEN & SERVIÇOS (R G VIEIRA BENTES), pessoa jurídica de direito privado inscrita no CNPJ sob o nº <strong>10.744.400/0001-65</strong>, com sede e foro na cidade de Manaus, Estado do Amazonas, doravante denominada simplesmente CONTRATADA, neste ato representada por seu responsável técnico <strong>{techName}</strong>.
                  </p>
                  <p>
                    <strong>CONTRATANTE:</strong> <strong>{clientName}</strong>, pessoa jurídica/física inscrita no CNPJ/CPF sob o nº <strong>{clientDoc}</strong>, com sede/domicílio em <strong>{clientAddress}</strong>{data.contratanteRepresentante ? `, neste ato representada por ${data.contratanteRepresentante}` : ""}, doravante denominada simplesmente CONTRATANTE.
                  </p>
                  <p className="text-[11px] text-gray-600 italic pt-1">
                    As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços Técnicos Especializados em Engenharia Elétrica, que se regerá pelas seguintes cláusulas e condições:
                  </p>
                </div>
              </div>

              {/* CLÁUSULAS CONTRATUAIS DETALHADAS EM FLUXO CONTÍNUO */}
              <div className="space-y-4 text-xs leading-relaxed text-gray-800 divide-y divide-gray-100">
                <div className="pt-2 space-y-1">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 1ª — DO OBJETO E ESCOPO DOS SERVIÇOS
                  </h3>
                  <p>
                    O presente instrumento tem por objeto a prestação, pela CONTRATADA ao CONTRATANTE, de serviços técnicos especializados de engenharia elétrica, compreendendo: <strong>{data.objeto || orderScope}</strong>.
                  </p>
                  <p className="text-[11px] text-gray-500 italic pt-0.5">
                    Parágrafo Único: Serviços não previstos expressamente no memorial acima não integram o presente contrato e, caso solicitados pelo CONTRATANTE, serão objeto de orçamento técnico prévio suplementar.
                  </p>
                </div>

                <div className="pt-3 space-y-1">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 2ª — DOS MATERIAIS, INSTRUMENTOS E EQUIPAMENTOS
                  </h3>
                  <p>
                    Os materiais, instrumentos certificados de medição e equipamentos de intervenção necessários à execução das atividades serão fornecidos conforme estabelecido na proposta comercial técnica homologada entre as partes.
                  </p>
                </div>

                <div className="pt-3 space-y-1.5">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 3ª — DO PREÇO, CONDIÇÕES E FORMA DE PAGAMENTO
                  </h3>
                  <p>
                    Pela perfeita execução dos serviços contratados, o CONTRATANTE pagará à CONTRATADA o valor global de <strong>R$ {formattedQuoteTotal}</strong>.
                  </p>
                  <p>
                    <strong>Condições de Pagamento:</strong> {data.condicoesPagamento || "Conforme proposta comercial aprovada. Pagamento à vista na conclusão ou conforme parcelamento acordado."}
                  </p>
                  <div className="border-l-2 border-slate-900 pl-3 py-1 bg-gray-50 text-[11px] font-mono text-gray-700">
                    <strong>Dados para Pagamento:</strong> {data.dadosBancarios || "Banco Cora SCFI (403) · Agência 0001 · Conta corrente 7284832-9 · Favorecido: R G Vieira Bentes · PIX: contato@setgen.com.br (CNPJ 10.744.400/0001-65)"}
                  </div>
                </div>

                <div className="pt-3 space-y-1">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 4ª — DO PRAZO E CONDIÇÕES DE EXECUÇÃO
                  </h3>
                  <p>
                    Os serviços terão início na data combinada entre as partes, com prazo estimado de conclusão de <strong>{data.prazoExecucaoDias || "conforme cronograma técnico da Ordem de Serviço"}</strong> a contar da liberação integral do local de trabalho.
                  </p>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    O prazo poderá ser estendido sem penalidade à CONTRATADA diante de condições climáticas adversas (chuvas, descargas atmosféricas conforme NR-10/NR-35), falta de acesso às dependências, atrasos na liberação por órgãos ou concessionária de energia.
                  </p>
                </div>

                <div className="pt-3 space-y-1">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 5ª — DAS OBRIGAÇÕES DA CONTRATADA
                  </h3>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    <li>Executar os serviços com profissionais habilitados e qualificados, em conformidade com as normas ABNT NBR 5410, NBR 5419 e NR-10/NR-35.</li>
                    <li>Fornecer ferramentas adequadas, equipamentos de proteção individual (EPIs) e coletiva (EPCs).</li>
                    <li>Comunicar imediatamente qualquer não-conformidade técnica ou risco que comprometa as instalações.</li>
                    <li>Manter o local de trabalho limpo e recolher sobras e resíduos ao término da intervenção.</li>
                    <li>Entregar as instalações testadas e operacionais, orientando o CONTRATANTE sobre seu manuseio seguro.</li>
                  </ul>
                </div>

                <div className="pt-3 space-y-1">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 6ª — DAS OBRIGAÇÕES DO CONTRATANTE
                  </h3>
                  <ul className="list-disc pl-4 space-y-1 text-gray-700">
                    <li>Garantir livre acesso da equipe técnica ao local nas datas agendadas, disponibilizando ponto de energia.</li>
                    <li>Informar a existência de tubulações, cabos embutidos ou interferências estruturais ocultas.</li>
                    <li>Efetuar os pagamentos nas datas e condições acordadas neste instrumento.</li>
                    <li>Não permitir que terceiros não autorizados realizem alterações no sistema durante o período de garantia.</li>
                  </ul>
                </div>

                <div className="pt-3 space-y-1">
                  <h3 className="font-bold text-slate-950 uppercase tracking-wide text-xs">
                    CLÁUSULA 7ª — DA GARANTIA TÉCNICA E FORO DE ELEIÇÃO
                  </h3>
                  <p>
                    A CONTRATADA garante os serviços executados pelo prazo legal de <strong>{data.garantiaMeses || 12} (doze) meses</strong>, contados da entrega formal. Equipamentos seguem a garantia de seus fabricantes. A garantia não cobre danos por sobrecargas indevidas, acidentes naturais ou intervenção de terceiros.
                  </p>
                  <p className="pt-1">
                    <strong>CLÁUSULA 8ª — DO FORO:</strong> As partes elegem a Comarca de <strong>{data.foro || "Manaus / AM"}</strong> para dirimir quaisquer dúvidas oriundas deste contrato, com renúncia expressa a qualquer outro.
                  </p>
                </div>
              </div>

              {/* Datação e Bloco de Assinaturas das Partes */}
              <div className="pt-6 border-t-2 border-slate-900 space-y-6 break-inside-avoid">
                <div className="text-right text-xs text-gray-600 font-medium">
                  Manaus/AM, {formatDateBR(document.createdAt)}.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center pt-2">
                  <div className="flex flex-col items-center justify-end space-y-2">
                    <div className="h-16 w-full flex items-center justify-center">
                      {techSigImg ? (
                        <img src={techSigImg} alt="Assinatura Contratada" className="max-h-14 max-w-[200px] object-contain" />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>
                    <div className="w-64 border-t border-gray-900" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-gray-900">{techName}</p>
                      <p className="text-[11px] text-gray-600">CONTRATADA · SETGEN & SERVIÇOS</p>
                      <p className="text-[10px] text-gray-500 font-mono">CNPJ: 10.744.400/0001-65</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-end space-y-2">
                    <div className="h-16 w-full flex items-center justify-center">
                      {clientSigImg ? (
                        <img src={clientSigImg} alt="Assinatura Contratante" className="max-h-14 max-w-[200px] object-contain" />
                      ) : (
                        <div className="h-12" />
                      )}
                    </div>
                    <div className="w-64 border-t border-gray-900" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-gray-900">{clientName}</p>
                      <p className="text-[11px] text-gray-600">CONTRATANTE</p>
                      <p className="text-[10px] text-gray-500 font-mono">CNPJ/CPF: {clientDoc}</p>
                    </div>
                  </div>
                </div>

                {/* Bloco de Testemunhas */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-center text-[10px] font-black uppercase text-gray-400 tracking-wider mb-6">
                    TESTEMUNHAS INSTRUMENTAIS
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs text-gray-700">
                    <div className="space-y-1">
                      <div className="w-48 border-t border-gray-400 mx-auto" />
                      <p className="font-bold text-[11px]">{data.testemunha1Nome || "Testemunha 1"}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{data.testemunha1Cpf ? `CPF: ${data.testemunha1Cpf}` : "CPF: ____________________"}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="w-48 border-t border-gray-400 mx-auto" />
                      <p className="font-bold text-[11px]">{data.testemunha2Nome || "Testemunha 2"}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{data.testemunha2Cpf ? `CPF: ${data.testemunha2Cpf}` : "CPF: ____________________"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODELO 5: TERMO DE ENTREGA, ACEITE & CERTIFICADO DE GARANTIA     */}
          {/* =============================================================== */}
          {document.type === DocumentType.ACCEPTANCE_TERM && (
            <div className="space-y-6">
              {/* PÁGINA 1: TERMO DE ENTREGA E ACEITE */}
              <div className="space-y-5">
                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      CONCLUSÃO TÉCNICA & HOMOLOGAÇÃO
                    </div>
                    <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
                      TERMO DE ENTREGA E ACEITE TÉCNICO
                    </h2>
                    <p className="text-xs text-gray-700 font-semibold mt-0.5">
                      {orderScope} · {clientName}
                    </p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs font-mono">
                    <div className="font-bold text-slate-900 text-sm">
                      TERMO Nº {document.code}
                    </div>
                    <div className="text-gray-500 font-medium text-[11px]">
                      Conclusão: {formatDateBR(data.dataConclusao || document.createdAt)}
                    </div>
                  </div>
                </div>

                {/* 1. IDENTIFICAÇÃO DO CONTRATANTE E SERVIÇO */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    1. IDENTIFICAÇÃO DO CONTRATANTE E SERVIÇO
                  </div>

                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Contratante:
                        </td>
                        <td className="w-2/6 p-2 font-bold text-gray-900 border-r border-gray-200">
                          {clientName}
                        </td>
                        <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Local da Obra:
                        </td>
                        <td className="w-2/6 p-2 text-gray-900">
                          {clientLocal}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Tipo de Serviço:
                        </td>
                        <td className="p-2 text-gray-900 border-r border-gray-200">
                          {orderScope}
                        </td>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Ordem de Serviço:
                        </td>
                        <td className="p-2 font-mono font-bold text-[#E2661D]">
                          OS nº {orderNumber}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. EQUIPAMENTOS INSTALADOS / ENTREGUES */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    2. EQUIPAMENTOS INSTALADOS / ENTREGUES
                  </div>

                  <table className="w-full text-xs text-left border border-gray-300">
                    <thead className="bg-slate-900 text-white font-bold text-[11px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-700">EQUIPAMENTO</th>
                        <th className="p-2.5 border-r border-slate-700">MARCA / MODELO</th>
                        <th className="p-2.5 font-mono border-r border-slate-700">Nº DE SÉRIE</th>
                        <th className="p-2.5 text-center border-r border-slate-700">QTD</th>
                        <th className="p-2.5 text-center">GARANTIA FABRICANTE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {((data.equipamentos && data.equipamentos.length > 0)
                        ? data.equipamentos
                        : [
                            {
                              equipamento: orderEquipment,
                              marca: orderEquipmentModel,
                              serie: orderEquipmentSerial,
                              qtd: "1 un",
                              garantia: "12 meses",
                            },
                          ]
                      ).map((eq: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-2.5 font-bold text-gray-900 border-r border-gray-200">{eq.equipamento}</td>
                          <td className="p-2.5 text-gray-700 border-r border-gray-200">{eq.marca}</td>
                          <td className="p-2.5 font-mono text-gray-600 border-r border-gray-200">{eq.serie}</td>
                          <td className="p-2.5 text-center text-gray-900 border-r border-gray-200">{eq.qtd}</td>
                          <td className="p-2.5 text-center font-bold text-gray-900">{eq.garantia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 3. VERIFICAÇÕES NA ENTREGA */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    3. VERIFICAÇÕES E TESTES NA ENTREGA
                  </div>

                  <div className="border border-gray-300 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(
                      data.verificacoes || {
                        "Serviço executado conforme proposta comercial e memorial": true,
                        "Circuitos e equipamentos devidamente testados e energizados": true,
                        "Quadro de distribuição identificado e anilhado": true,
                        "Dispositivos de proteção (disjuntores, DR, DPS) testados": true,
                        "Cliente e operadores orientados sobre a operação": true,
                        "Local limpo e sobras de materiais recolhidas": true,
                      }
                    ).map(([v, checked]: any, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className="w-3.5 h-3.5 border border-slate-900 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          ✓
                        </span>
                        <span className="text-gray-800 text-[11px] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. PENDÊNCIAS */}
                <div className="space-y-1 text-xs">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    4. PENDÊNCIAS TÉCNICAS
                  </div>
                  <p className="p-2 border border-gray-300 text-gray-800">
                    {data.pendencias || "Não há pendências: o serviço foi concluído e entregue em perfeito funcionamento."}
                  </p>
                </div>

                {/* 5. DECLARAÇÃO DE ACEITE */}
                <div className="space-y-2 text-xs">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    5. DECLARAÇÃO DE ACEITE TÉCNICO FORMAL
                  </div>
                  <div className="border border-gray-300 p-3 space-y-1.5">
                    <p className="text-gray-800 leading-relaxed">
                      O CONTRATANTE declara que recebeu os serviços e equipamentos descritos neste termo em perfeito estado operacional, tendo sido devidamente instruído quanto à operação segura e aos cuidados de manutenção preventiva.
                    </p>
                    <div className="text-right text-xs text-gray-500 font-medium">
                      Manaus/AM, {formatDateBR(data.dataConclusao || document.createdAt)}.
                    </div>
                  </div>
                </div>

                {/* Assinaturas do Termo de Entrega */}
                {renderSignatureBlock()}
              </div>

              {/* ============================================================= */}
              {/* PÁGINA 2: CERTIFICADO OFICIAL DE GARANTIA                     */}
              {/* ============================================================= */}
              <div className="pt-6 border-t-2 border-dashed border-gray-300 print:break-before-page space-y-5">
                <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-mono tracking-wider border-b border-gray-200 pb-2">
                  <span>Certificado de Garantia — Página 2 de 3</span>
                  <span>{document.code} · Certificado Técnico</span>
                </div>

                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      TERMO DE GARANTIA CONTRATUAL
                    </div>
                    <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
                      CERTIFICADO OFICIAL DE GARANTIA ({data.garantiaMeses || 12} MESES)
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">
                      {clientName} · Válido a partir de {formatDateBR(data.dataConclusao || document.createdAt)}
                    </p>
                  </div>
                  <div className="text-right sm:shrink-0 text-xs font-mono">
                    <span className="font-bold text-slate-900 text-xs uppercase">
                      STATUS: GARANTIA ATIVA
                    </span>
                  </div>
                </div>

                {/* 1. QUADRO DE GARANTIAS */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    1. PRAZOS E COBERTURAS ASSEGURADAS
                  </div>

                  <table className="w-full text-xs text-left border border-gray-300">
                    <thead className="bg-slate-900 text-white font-bold text-[11px]">
                      <tr>
                        <th className="p-2.5 border-r border-slate-700">ITEM COBERTO</th>
                        <th className="p-2.5 text-center border-r border-slate-700">PRAZO</th>
                        <th className="p-2.5 text-center">VÁLIDO ATÉ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="bg-white">
                        <td className="p-2.5 font-bold text-gray-900 border-r border-gray-200">
                          Serviços de intervenção e instalação elétrica executados
                        </td>
                        <td className="p-2.5 text-center font-bold text-gray-900 border-r border-gray-200">
                          {data.garantiaMeses || 12} (doze) meses
                        </td>
                        <td className="p-2.5 text-center font-mono text-gray-800">
                          {data.garantiaAte || formatDateBR(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString())}
                        </td>
                      </tr>
                      <tr className="bg-gray-50/50">
                        <td className="p-2.5 font-bold text-gray-900 border-r border-gray-200">
                          Equipamentos, disjuntores e componentes fornecidos
                        </td>
                        <td className="p-2.5 text-center text-gray-700 border-r border-gray-200">
                          Garantia do fabricante
                        </td>
                        <td className="p-2.5 text-center font-mono text-gray-700">
                          Conforme termo de fábrica
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. TERMOS DE GARANTIA (COBRE VS NÃO COBRE) */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    2. CONDIÇÕES GERAIS DE COBERTURA DA GARANTIA
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="border border-gray-300 p-3 space-y-1.5">
                      <strong className="text-gray-900 uppercase font-bold text-[11px] block border-b border-gray-200 pb-1">
                        A GARANTIA COBRE:
                      </strong>
                      <ul className="list-disc pl-4 space-y-1 text-gray-700">
                        <li>Falhas de execução dos serviços de montagem e instalação realizados.</li>
                        <li>Defeitos em conexões, crimpagens, fixações e cabeamento executados pela SETGEN.</li>
                        <li>Desarmes provocados por inconformidades de montagem comprovadas.</li>
                      </ul>
                    </div>

                    <div className="border border-gray-300 p-3 space-y-1.5">
                      <strong className="text-gray-900 uppercase font-bold text-[11px] block border-b border-gray-200 pb-1">
                        A GARANTIA NÃO COBRE:
                      </strong>
                      <ul className="list-disc pl-4 space-y-1 text-gray-700">
                        <li>Danos causados por sobrecarga ou ligação de cargas acima da capacidade do projeto.</li>
                        <li>Alterações, ampliações ou manutenções realizadas por terceiros não autorizados.</li>
                        <li>Descargas atmosféricas diretas, sinistros ou eventos de força maior.</li>
                        <li>Desgaste natural de peças de consumo.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 3. COMO ACIONAR A GARANTIA */}
                <div className="space-y-1.5 text-xs">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    3. CANAIS PARA ACIONAMENTO DA GARANTIA TÉCNICA
                  </div>
                  <table className="w-full text-xs border border-gray-300">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="w-1/4 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Procedimento:
                        </td>
                        <td className="p-2 text-gray-800">
                          Entre em contato informando o número deste termo (<strong>{document.code}</strong>) e a descrição técnica da ocorrência.
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                          Contatos Oficiais:
                        </td>
                        <td className="p-2 text-gray-800 font-mono">
                          WhatsApp: (92) 98112-0050 · E-mail: contato@setgen.com.br · Manaus / AM
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-gray-500 pt-0.5">
                    * Após o vencimento do prazo de garantia contratual, os chamados serão atendidos sob taxa padrão de visita técnica ({data.taxaVisitaPosGarantia || "R$ 250,00 por visita"}).
                  </p>
                </div>

                {/* Assinatura da Garantia */}
                {renderSignatureBlock()}
              </div>

              {/* ============================================================= */}
              {/* PÁGINA 3: AGENDA DE REVISÕES PREVENTIVAS                      */}
              {/* ============================================================= */}
              <div className="pt-6 border-t-2 border-dashed border-gray-300 print:break-before-page space-y-5">
                <div className="flex items-center justify-between text-xs text-gray-400 uppercase font-mono tracking-wider border-b border-gray-200 pb-2">
                  <span>Agenda de Revisões — Página 3 de 3</span>
                  <span>{document.code} · Manutenção Preventiva</span>
                </div>

                <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      PROGRAMAÇÃO PREVENTIVA DE CONTINUIDADE
                    </div>
                    <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
                      AGENDA DE REVISÕES PREVENTIVAS RECOMENDADAS
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">
                      {clientName} · {clientLocal}
                    </p>
                  </div>
                </div>

                {/* 1. TABELA DE REVISÕES PROGRAMADAS */}
                <div className="space-y-2">
                  <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
                    1. CALENDÁRIO DE REVISÕES PERIÓDICAS
                  </div>

                  <table className="w-full text-xs text-left border border-gray-300">
                    <thead className="bg-slate-900 text-white font-bold text-[11px]">
                      <tr>
                        <th className="p-2.5 text-center w-12 border-r border-slate-700">Nº</th>
                        <th className="p-2.5 w-28 border-r border-slate-700">DATA PREVISTA</th>
                        <th className="p-2.5 border-r border-slate-700">SERVIÇO PREVISTO</th>
                        <th className="p-2.5 text-center w-28 border-r border-slate-700">REALIZADA EM</th>
                        <th className="p-2.5 text-center w-36">TÉCNICO / VISTO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(data.revisoes || [
                        {
                          numero: 1,
                          prazo: "12 meses",
                          dataPrevista: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
                          descricao: "Revisão geral da instalação: reaperto de conexões, termografia de aquecimento e teste das proteções",
                        },
                        {
                          numero: 2,
                          prazo: "24 meses",
                          dataPrevista: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().slice(0, 10),
                          descricao: "Revisão periódica preventiva: reaperto, ensaios de isolamento e continuidade elétrica",
                        },
                      ]).map((rev: any, idx: number) => (
                        <tr key={idx} className="h-14 hover:bg-gray-50">
                          <td className="p-2.5 text-center font-bold text-gray-900 border-r border-gray-200">{rev.numero || idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-slate-800 border-r border-gray-200">
                            {formatDateBR(rev.dataPrevista)}
                            <span className="block text-[10px] text-gray-500 font-normal">({rev.prazo || "12 meses"})</span>
                          </td>
                          <td className="p-2.5 text-gray-700 leading-snug border-r border-gray-200">{rev.descricao}</td>
                          <td className="p-2.5 text-center font-mono text-gray-400 border-r border-gray-200">___/___/_____</td>
                          <td className="p-2.5 text-center">
                            <div className="border-b border-gray-400 w-28 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 2. ITENS VERIFICADOS E OBSERVAÇÕES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="border border-gray-300 p-3 space-y-1.5">
                    <strong className="text-slate-900 uppercase font-bold text-[11px] block border-b border-gray-200 pb-1">
                      O QUE É VERIFICADO NA REVISÃO:
                    </strong>
                    <ul className="list-disc pl-4 space-y-1 text-gray-700">
                      <li>Reaperto com torquímetro das conexões e barramentos.</li>
                      <li>Inspeção termográfica para detecção de pontos quentes.</li>
                      <li>Teste funcional de disjuntores, relés, DR e DPS.</li>
                      <li>Avaliação das condições de aterramento e isolação.</li>
                    </ul>
                  </div>

                  <div className="border border-gray-300 p-3 space-y-1.5">
                    <strong className="text-slate-900 uppercase font-bold text-[11px] block border-b border-gray-200 pb-1">
                      OBSERVAÇÕES IMPORTANTES:
                    </strong>
                    <p className="text-gray-700 leading-relaxed text-[11px]">
                      A realização das revisões preventivas programadas é determinante para assegurar a confiabilidade contínua da instalação e evitar paradas não planejadas. Para agendar a revisão periódica com antecedência, entre em contato pelo telefone (92) 98112-0050.
                    </p>
                  </div>
                </div>

                {/* Rodapé da Agenda */}
                <div className="pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500">
                  SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ 10.744.400/0001-65 · Manaus/AM · (92) 98112-0050 · setgen.com.br
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODELO 6: ART (CREA / CFT) — REGISTRO PROFISSIONAL DE ENGENHARIA  */}
          {/* =============================================================== */}
          {document.type === DocumentType.ART && (
            <div className="space-y-6">
              {/* Cabeçalho Oficial ART */}
              <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    REGISTRO PROFISSIONAL DE ENGENHARIA
                  </div>
                  <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
                    ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA (ART)
                  </h2>
                  <p className="text-xs text-gray-700 font-semibold mt-0.5">
                    {data.conselho || "CREA-AM"} Nº {data.numeroArt || document.code}
                  </p>
                </div>
                <div className="text-right sm:shrink-0 text-xs font-mono">
                  <div className="font-bold text-[#E2661D] text-sm">
                    {data.conselho || "CREA-AM"}
                  </div>
                  <div className="text-gray-500 font-medium text-[11px]">
                    Emissão: {formatDateBR(document.createdAt)}
                  </div>
                </div>
              </div>

              {/* Quadro Oficial Unificado da ART */}
              <div className="border border-gray-300 divide-y divide-gray-300 text-xs">
                {/* 1. DADOS DO PROFISSIONAL */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase text-gray-900">
                    1. DADOS DO PROFISSIONAL RESPONSÁVEL
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-900">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Nome do Profissional:</span>
                      <strong className="font-bold">{techName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Título Profissional:</span>
                      <strong className="font-bold">{data.tituloProfissional || "Engenheiro Eletricista"}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Registro / RNP:</span>
                      <strong className="font-mono text-[#E2661D]">{data.registroNacional || techRegistry}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. DADOS DA EMPRESA VINCULADA */}
                <div className="p-3 space-y-1.5 bg-gray-50/50">
                  <div className="text-[11px] font-bold uppercase text-gray-900">
                    2. DADOS DA EMPRESA VINCULADA
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-gray-900">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Nome Fantasia:</span>
                      <strong className="font-bold text-slate-900">SETGEN & SERVIÇOS</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Razão Social:</span>
                      <strong className="font-medium text-gray-700">R G VIEIRA BENTES</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">CNPJ / Registro:</span>
                      <strong className="font-mono">10.744.400/0001-65 · {data.registroEmpresa || "CREA-AM 35534-AM"}</strong>
                    </div>
                  </div>
                </div>

                {/* 3. DADOS DO CONTRATANTE E DA OBRA */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[11px] font-bold uppercase text-gray-900">
                    3. DADOS DO CONTRATANTE E DA OBRA / SERVIÇO
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-900">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Contratante:</span>
                      <strong className="font-bold">{clientName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">CNPJ / CPF:</span>
                      <strong className="font-mono">{clientDoc}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 text-[11px] block">Endereço da Obra / Serviço:</span>
                      <strong className="font-medium">{clientAddress}</strong>
                    </div>
                  </div>
                </div>

                {/* 4. DADOS DO CONTRATO E ATIVIDADE TÉCNICA */}
                <div className="p-3 space-y-1.5 bg-gray-50/50">
                  <div className="text-[11px] font-bold uppercase text-gray-900">
                    4. DADOS DO CONTRATO & ATIVIDADE TÉCNICA DESENVOLVIDA
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-900">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Tipo de ART:</span>
                      <strong className="font-bold">{data.tipoArt || "Obra ou Serviço Técnico"}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Valor do Contrato:</span>
                      <strong className="font-mono font-bold text-gray-900">R$ {formattedQuoteTotal}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 text-[11px] block">Atividade Técnica:</span>
                      <p className="font-medium leading-relaxed text-gray-800">
                        {data.atividadeTecnica || orderScope}
                      </p>
                    </div>
                    {data.observacoes && (
                      <div className="sm:col-span-2">
                        <span className="text-gray-500 text-[11px] block">Observações:</span>
                        <p className="font-medium text-gray-700 italic">{data.observacoes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. DECLARAÇÃO DE RESPONSABILIDADE */}
                <div className="p-3 space-y-1 text-xs">
                  <strong className="text-slate-900 uppercase font-bold text-[11px] block">
                    5. DECLARAÇÃO DE RESPONSABILIDADE TÉCNICA LEGAL
                  </strong>
                  <p className="text-gray-800 leading-relaxed">
                    Declaro para os devidos fins de direito que os serviços técnicos descritos foram executados sob minha responsabilidade técnica, observando as normas técnicas e regulamentadoras em vigor.
                  </p>
                </div>
              </div>

              {/* Bloco Coeso de Assinaturas */}
              {renderSignatureBlock()}
            </div>
          )}

          {/* =============================================================== */}
          {/* MODELO 7: VISTORIA FINAL (SGQ-OPE-04 · REV. 00)                 */}
          {/* =============================================================== */}
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
              techSigImg={techSigImg}
              clientSigImg={clientSigImg}
              formatDateBR={formatDateBR}
            />
          )}

          {/* =============================================================== */}
          {/* RODAPÉ OFICIAL PADRONIZADO EM TODAS AS FOLHAS (SETGEN ENGENHARIA) */}
          {/* =============================================================== */}
          {document.type !== DocumentType.TECHNICAL_REPORT && !isFinalInspectionDoc(document) && (
            <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 gap-2">
              <span>
                SETGEN & SERVIÇOS (R G VIEIRA BENTES) · CNPJ: 10.744.400/0001-65 · Manaus / AM · setgen.com.br
              </span>
              <span className="font-mono font-bold text-slate-800">
                {docTypeInfo.code}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
