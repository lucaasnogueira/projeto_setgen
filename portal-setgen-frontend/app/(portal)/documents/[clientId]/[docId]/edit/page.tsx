"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { ordersApi } from "@/lib/api/orders";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import { Client, ServiceOrder, ServiceOrderDocument, DocumentType, DocumentStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ArrowLeft,
  Save,
  Loader2,
  FileText,
  RefreshCw,
  Printer,
  Sparkles,
  Upload,
  Trash2,
  PenTool,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDefaultDocumentData,
  extractClientContracts,
  ClientContractOption,
} from "@/app/(portal)/orders/components/documents/forms/defaults";
import { AprForm } from "@/app/(portal)/orders/components/documents/forms/AprForm";
import { WorkPermitForm } from "@/app/(portal)/orders/components/documents/forms/WorkPermitForm";
import { AcceptanceTermForm } from "@/app/(portal)/orders/components/documents/forms/AcceptanceTermForm";
import { ContractForm } from "@/app/(portal)/orders/components/documents/forms/ContractForm";
import { TechnicalReportForm } from "@/app/(portal)/orders/components/documents/forms/TechnicalReportForm";
import { ArtForm } from "@/app/(portal)/orders/components/documents/forms/ArtForm";
import { FinalInspectionForm } from "@/app/(portal)/orders/components/documents/forms/FinalInspectionForm";
import { isFinalInspectionDoc } from "@/types";

export default function EditDocumentPage() {
  const params = useParams();
  const router = useRouter();

  const clientId = params?.clientId as string;
  const docId = params?.docId as string;

  const [document, setDocument] = useState<ServiceOrderDocument | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<DocumentStatus>(DocumentStatus.ACTIVE);
  const [availableAprs, setAvailableAprs] = useState<any[]>([]);
  const [availableContracts, setAvailableContracts] = useState<ClientContractOption[]>([]);
  const [data, setData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    if (!docId || !clientId) return;
    setLoading(true);
    try {
      const [docData, clientData, ordersData, clientDocs] = await Promise.all([
        orderDocumentsApi.getById(docId),
        clientsApi.getOne(clientId),
        ordersApi.getAll({ clientId }),
        orderDocumentsApi.getByClient(clientId).catch(() => []),
      ]);
      setDocument(docData);
      setClient(clientData);
      setOrders(ordersData || []);

      const aprs = (clientDocs || []).filter((d: any) => d.type === DocumentType.APR);
      setAvailableAprs(aprs);

      const contracts = extractClientContracts(clientData, clientDocs);
      setAvailableContracts(contracts);

      setTitle(docData.title);
      setCode(docData.code);
      setStatus(docData.status);
      setData(docData.data || {});
      setNotes(docData.notes || "");
    } catch (err: any) {
      toast.error("Erro ao carregar os dados do documento.");
    } finally {
      setLoading(false);
    }
  }, [docId, clientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clientName = client?.companyName || client?.tradeName || "Cliente";
  const activeOrder = orders.find((o) => o.id === document?.serviceOrderId) || document?.serviceOrder;

  const handleResetDefaults = () => {
    if (!document) return;
    const defaultData = getDefaultDocumentData(document.type, clientName, activeOrder);
    setData(defaultData);
    toast.success("Campos redefinidos para os valores padrão do modelo oficial.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título do documento.");
      return;
    }

    setSaving(true);
    try {
      await orderDocumentsApi.update(docId, {
        title: title.trim(),
        code: code.trim() || undefined,
        status,
        data,
        notes: notes.trim() || undefined,
      });

      toast.success("Documento atualizado com sucesso!");
      router.push(`/documents/${clientId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar alterações no documento.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !document) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#E2661D]" />
        <span className="text-sm font-medium">Carregando formulário de edição...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Botão Voltar */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/documents/${clientId}`)}
          className="text-gray-500 hover:text-gray-900 gap-1.5 -ml-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Dossiê de Documentos de {clientName}
        </Button>
      </div>

      {/* Cabeçalho da Tela Dedicada */}
      <PageHeader
        title={`Editar: ${document.title}`}
        subtitle={`Código: ${document.code} · Cliente: ${clientName}`}
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs font-bold text-gray-700 gap-1.5 rounded-xl border-gray-300 hover:bg-gray-50 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restaurar Padrão do PDF
          </Button>
        }
      />

      {/* Banner Corporativo SETGEN com Logo Oficial */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <img
            src="/images/setgen-logo.png"
            alt="SETGEN"
            className="h-8 sm:h-9 w-auto object-contain shrink-0"
          />
          <div>
            <h2 className="text-xs sm:text-sm font-bold uppercase text-slate-900 tracking-wide">
              SETGEN & SERVIÇOS
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              R G VIEIRA BENTES · CNPJ: 10.744.400/0001-65 · Manaus / AM · setgen.com.br
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-orange-50 text-[#E2661D] border border-orange-200">
            EDIÇÃO TÉCNICA
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Painel de Identificação */}
        <Card className="p-4 sm:p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Título do Documento</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título identificador do documento"
                className="h-9 text-xs rounded-lg border-gray-200"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Código do Documento</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-9 text-xs font-mono font-bold rounded-lg border-gray-200 text-[#E2661D]"
              />
            </div>
          </div>

          {activeOrder && (
            <div className="p-3 rounded-lg bg-orange-50/70 border border-orange-200/80 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E2661D] shrink-0" />
                <span className="text-gray-700">
                  <strong>OS Vinculada:</strong> #{activeOrder.orderNumber} · <strong>Escopo:</strong> {activeOrder.scope} · <strong>Cliente:</strong> {clientName}
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* TELA DEDICADA: FORMULÁRIO DO TIPO DE DOCUMENTO */}
        <Card className="p-4 sm:p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E2661D] flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Edição dos Campos Oficiais do Modelo
              </h3>
              <span className="text-[11px] text-gray-400">
                Altere os campos técnicos abaixo. As alterações serão salvas imediatamente no SGQ.
              </span>
            </div>
          </div>

          {document.type === DocumentType.APR && (
            <AprForm data={data} onChange={setData} />
          )}

          {document.type === DocumentType.WORK_PERMIT && (
            <WorkPermitForm
              data={data}
              onChange={setData}
              availableAprs={availableAprs}
              currentOrder={activeOrder}
              currentClient={client}
            />
          )}

          {document.type === DocumentType.ACCEPTANCE_TERM && (
            <AcceptanceTermForm data={data} onChange={setData} />
          )}

          {document.type === DocumentType.CONTRACT && (
            <ContractForm
              data={data}
              onChange={setData}
              availableContracts={availableContracts}
              currentClient={client}
              currentOrder={activeOrder}
            />
          )}

          {document.type === DocumentType.TECHNICAL_REPORT && (
            <TechnicalReportForm data={data} onChange={setData} />
          )}

          {document.type === DocumentType.ART && (
            <ArtForm data={data} onChange={setData} />
          )}

          {(isFinalInspectionDoc(document) || document.type === DocumentType.OTHER) && (
            <FinalInspectionForm data={data} onChange={setData} />
          )}
        </Card>

        {/* Painel de Anexo de Assinaturas (Opcional - caso queira que saia impressa) */}
        <Card className="p-4 sm:p-5 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3.5">
          <div className="flex items-center gap-2.5 border-b border-gray-100 pb-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
              <PenTool className="w-4 h-4 text-[#E2661D]" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                Anexo de Assinaturas (Opcional)
              </h3>
              <p className="text-[11px] text-gray-500">
                Se possuir a imagem da assinatura escaneada/rubrica, anexe abaixo para sair impressa no PDF. Caso não anexe nada, o documento sairá com o espaço limpo em branco para assinatura manual com caneta.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Assinatura do Responsável Técnico */}
            <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800">
                  Assinatura do Responsável Técnico
                </span>
                {data.assinaturaTecnicoUrl && (
                  <button
                    type="button"
                    onClick={() => setData({ ...data, assinaturaTecnicoUrl: "" })}
                    className="text-[11px] text-red-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                )}
              </div>

              {data.assinaturaTecnicoUrl ? (
                <div className="p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-center h-20">
                  <img
                    src={data.assinaturaTecnicoUrl}
                    alt="Assinatura Técnico"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 hover:border-[#E2661D] rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white p-2">
                  <Upload className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-xs font-semibold text-gray-700">Anexar Imagem da Assinatura</span>
                  <span className="text-[10px] text-gray-400">PNG ou JPG (se vazio, sai em branco)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setData({ ...data, assinaturaTecnicoUrl: reader.result as string });
                        toast.success("Assinatura do responsável técnico anexada!");
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Assinatura do Cliente */}
            <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-800">
                  Assinatura do Cliente / Aceite
                </span>
                {data.assinaturaClienteUrl && (
                  <button
                    type="button"
                    onClick={() => setData({ ...data, assinaturaClienteUrl: "" })}
                    className="text-[11px] text-red-600 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                )}
              </div>

              {data.assinaturaClienteUrl ? (
                <div className="p-2 bg-white rounded-lg border border-gray-200 flex items-center justify-center h-20">
                  <img
                    src={data.assinaturaClienteUrl}
                    alt="Assinatura Cliente"
                    className="max-h-16 w-auto object-contain"
                  />
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 hover:border-[#E2661D] rounded-lg h-20 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white p-2">
                  <Upload className="w-4 h-4 text-gray-400 mb-1" />
                  <span className="text-xs font-semibold text-gray-700">Anexar Imagem da Assinatura</span>
                  <span className="text-[10px] text-gray-400">PNG ou JPG (se vazio, sai em branco)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        setData({ ...data, assinaturaClienteUrl: reader.result as string });
                        toast.success("Assinatura do cliente anexada!");
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </Card>

        {/* Barra Inferior / Ações de Salvar */}
        <Card className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold text-gray-700">Status Operacional:</Label>
            {[
              { value: DocumentStatus.ACTIVE, label: "Emitido / Ativo", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
              { value: DocumentStatus.DRAFT, label: "Rascunho", color: "bg-gray-50 text-gray-700 border-gray-300" },
              { value: DocumentStatus.SIGNED, label: "Assinado Formalmente", color: "bg-blue-50 text-blue-800 border-blue-300" },
            ].map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setStatus(st.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  status === st.value
                    ? `${st.color} ring-1 ring-[#E2661D]/40 shadow-2xs`
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/documents/${clientId}`)}
              className="rounded-lg px-4 h-9 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-lg px-4 h-9 bg-[#E2661D] hover:bg-[#d05a18] text-white font-semibold text-xs gap-1.5 shadow-2xs"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar Alterações
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
