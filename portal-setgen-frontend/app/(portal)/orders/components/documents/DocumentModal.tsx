"use client";

import React, { useState, useEffect } from "react";
import { ServiceOrderDocument, DocumentType, DocumentStatus } from "@/types";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Save, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { getDefaultDocumentData } from "./forms/defaults";
import { AprForm } from "./forms/AprForm";
import { WorkPermitForm } from "./forms/WorkPermitForm";
import { AcceptanceTermForm } from "./forms/AcceptanceTermForm";
import { ContractForm } from "./forms/ContractForm";
import { TechnicalReportForm } from "./forms/TechnicalReportForm";
import { ArtForm } from "./forms/ArtForm";

interface DocumentModalProps {
  order?: any;
  clientOrders?: any[];
  clientData?: any;
  documentType?: DocumentType;
  existingDocument?: ServiceOrderDocument | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DocumentModal({
  order,
  clientOrders,
  clientData,
  documentType,
  existingDocument,
  isOpen,
  onClose,
  onSuccess,
}: DocumentModalProps) {
  const [saving, setSaving] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    order?.id || existingDocument?.serviceOrderId || (clientOrders && clientOrders.length > 0 ? clientOrders[0].id : "")
  );
  const [selectedType, setSelectedType] = useState<DocumentType>(
    existingDocument?.type || documentType || DocumentType.APR
  );
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<DocumentStatus>(DocumentStatus.ACTIVE);
  const [availableAprs, setAvailableAprs] = useState<any[]>([]);
  const [data, setData] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState("");

  const currentOrder = order || (clientOrders ? clientOrders.find((o) => o.id === selectedOrderId) : null);
  const currentClient = currentOrder?.client || clientData || {};
  const clientName = currentClient.companyName || currentClient.tradeName || "Cliente";

  // Carrega APRs existentes para reaproveitamento
  useEffect(() => {
    const cid = currentClient?.id || currentOrder?.clientId;
    if (!cid || !isOpen) return;
    orderDocumentsApi
      .getByClient(cid)
      .then((docs) => {
        const aprs = (docs || []).filter((d: any) => d.type === DocumentType.APR);
        setAvailableAprs(aprs);
      })
      .catch(() => {});
  }, [currentClient?.id, currentOrder?.clientId, isOpen]);

  // Inicializa dados e metadados quando o modal abre ou muda de tipo
  useEffect(() => {
    if (existingDocument) {
      setTitle(existingDocument.title);
      setCode(existingDocument.code);
      setStatus(existingDocument.status);
      setData(existingDocument.data || {});
      setNotes(existingDocument.notes || "");
      setSelectedType(existingDocument.type);
      if (existingDocument.serviceOrderId) {
        setSelectedOrderId(existingDocument.serviceOrderId);
      }
    } else {
      const year = new Date().getFullYear();
      const orderNum = currentOrder?.orderNumber
        ? currentOrder.orderNumber.replace(/[^0-9]/g, "").slice(-4)
        : "001";

      const defaultData = getDefaultDocumentData(selectedType, clientName, currentOrder);
      setData(defaultData);

      if (selectedType === DocumentType.APR) {
        setTitle(`APR — Análise Preliminar de Risco · ${clientName}`);
        setCode(`AP${year}-${orderNum}`);
      } else if (selectedType === DocumentType.WORK_PERMIT) {
        setTitle(`Permissão de Trabalho (PT) · ${clientName}`);
        setCode(`PT${year}-${orderNum}`);
      } else if (selectedType === DocumentType.CONTRACT) {
        setTitle(`Contrato de Prestação de Serviços · ${clientName}`);
        setCode(`CT${year}-${orderNum}`);
      } else if (selectedType === DocumentType.ACCEPTANCE_TERM) {
        setTitle(`Termo de Entrega e Aceite · ${clientName}`);
        setCode(`TE${year}-${orderNum}`);
      } else if (selectedType === DocumentType.TECHNICAL_REPORT) {
        setTitle(`Relatório Técnico de Inspeção SPDA · ${clientName}`);
        setCode(`RT${year}-${orderNum}`);
      } else if (selectedType === DocumentType.ART) {
        setTitle(`ART — Anotação de Responsabilidade Técnica · ${clientName}`);
        setCode(`ART${year}-${orderNum}`);
      }

      setStatus(DocumentStatus.ACTIVE);
      setNotes("");
    }
  }, [existingDocument, selectedType, selectedOrderId, currentOrder, clientName, isOpen]);

  const handleResetDefaults = () => {
    const defaultData = getDefaultDocumentData(selectedType, clientName, currentOrder);
    setData(defaultData);
    toast.success("Campos redefinidos para os valores padrão da norma / SGQ.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder?.id) {
      toast.error("Selecione a Ordem de Serviço vinculada ao documento.");
      return;
    }
    if (!title.trim()) {
      toast.error("Informe o título do documento.");
      return;
    }

    setSaving(true);
    try {
      if (existingDocument) {
        await orderDocumentsApi.update(existingDocument.id, {
          title: title.trim(),
          code: code.trim() || undefined,
          status,
          data,
          notes: notes.trim() || undefined,
        });
        toast.success("Documento atualizado com sucesso!");
      } else {
        await orderDocumentsApi.create({
          serviceOrderId: currentOrder.id,
          type: selectedType,
          title: title.trim(),
          code: code.trim() || undefined,
          status,
          data,
          notes: notes.trim() || undefined,
        });
        toast.success("Documento confeccionado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar documento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto rounded-xl bg-white p-4 sm:p-5 shadow-xl space-y-3.5">
        <DialogHeader className="border-b border-gray-100 pb-2.5">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-100 text-[#E2661D]">
                <FileText className="w-4 h-4" />
              </span>
              {existingDocument ? "Editar Formulário do Documento Técnico" : "Confeccionar Documento Técnico (Formulário SGQ)"}
            </DialogTitle>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-xs font-bold text-gray-600 gap-1 rounded-lg hover:bg-gray-50"
              title="Recarregar dados pré-configurados do PDF"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Restaurar Padrão do PDF
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Seletor de Tipo de Documento se não for fixo ou edição */}
          {!existingDocument && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Selecione o Modelo de Documento</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { type: DocumentType.APR, label: "APR (SGQ-SEG-01)" },
                  { type: DocumentType.WORK_PERMIT, label: "PT (SGQ-SEG-02)" },
                  { type: DocumentType.ACCEPTANCE_TERM, label: "Aceite & Garantia" },
                  { type: DocumentType.CONTRACT, label: "Contrato (SGQ-COM-07)" },
                  { type: DocumentType.TECHNICAL_REPORT, label: "Laudo SPDA" },
                  { type: DocumentType.ART, label: "ART (CREA/CFT)" },
                ].map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setSelectedType(t.type)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      selectedType === t.type
                        ? "bg-[#E2661D] text-white border-[#E2661D] shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Seletor de OS caso venha do Dossiê do Cliente com múltiplas OSs */}
          {!order && clientOrders && clientOrders.length > 0 && !existingDocument && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">Vincular à Ordem de Serviço do Cliente</Label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs bg-white font-medium focus:ring-2 focus:ring-[#E2661D]"
                required
              >
                <option value="">Selecione uma OS deste cliente...</option>
                {clientOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    OS #{o.orderNumber} — {o.scope}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dados do Cabeçalho */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <Label className="text-xs font-bold text-gray-700">Título do Documento</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: APR — Análise Preliminar de Risco"
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Código SGQ</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: AP2026-001"
                className="h-9 text-xs font-mono font-bold rounded-xl"
              />
            </div>
          </div>

          {/* Destaque de Integração com a OS */}
          {currentOrder && (
            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/80 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E2661D] shrink-0" />
                <span className="text-gray-700">
                  <strong>Cliente:</strong> {clientName} · <strong>OS:</strong> #{currentOrder.orderNumber} ({currentOrder.scope})
                </span>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* FORMULÁRIO ESPECÍFICO DE ACORDO COM CADA PDF ANEXADO      */}
          {/* ========================================================= */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-gray-200 bg-gray-50/40">
            {selectedType === DocumentType.APR && (
              <AprForm data={data} onChange={setData} />
            )}

            {selectedType === DocumentType.WORK_PERMIT && (
              <WorkPermitForm
                data={data}
                onChange={setData}
                availableAprs={availableAprs}
                currentOrder={currentOrder}
                currentClient={currentClient}
              />
            )}

            {selectedType === DocumentType.ACCEPTANCE_TERM && (
              <AcceptanceTermForm data={data} onChange={setData} />
            )}

            {selectedType === DocumentType.CONTRACT && (
              <ContractForm
                data={data}
                onChange={setData}
                currentClient={currentClient}
                currentOrder={currentOrder}
              />
            )}

            {selectedType === DocumentType.TECHNICAL_REPORT && (
              <TechnicalReportForm data={data} onChange={setData} />
            )}

            {selectedType === DocumentType.ART && (
              <ArtForm data={data} onChange={setData} />
            )}
          </div>

          {/* Status do Documento */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-gray-700">Status:</Label>
              {[
                { value: DocumentStatus.ACTIVE, label: "Emitido / Ativo", color: "bg-emerald-50 text-emerald-800 border-emerald-300" },
                { value: DocumentStatus.DRAFT, label: "Rascunho", color: "bg-gray-50 text-gray-700 border-gray-300" },
                { value: DocumentStatus.SIGNED, label: "Assinado Formalmente", color: "bg-blue-50 text-blue-800 border-blue-300" },
              ].map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => setStatus(st.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    status === st.value
                      ? `${st.color} ring-2 ring-[#E2661D]/30 shadow-2xs`
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <DialogFooter className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="rounded-xl">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#E2661D] hover:bg-[#d05a18] text-white font-bold rounded-xl gap-1.5 shadow-xs"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {existingDocument ? "Salvar Alterações" : "Emitir Documento"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
