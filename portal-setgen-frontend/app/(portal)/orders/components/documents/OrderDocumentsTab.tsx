"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ServiceOrderDocument, DocumentType, DocumentStatus } from "@/types";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import {
  FileText,
  Shield,
  FileCheck,
  Printer,
  Edit,
  Trash2,
  Plus,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  CheckSquare,
} from "lucide-react";
import { formatDateBR } from "@/lib/date";
import { toast } from "sonner";

interface OrderDocumentsTabProps {
  order: any;
  onOrderUpdate?: () => void;
}

export function OrderDocumentsTab({ order, onOrderUpdate }: OrderDocumentsTabProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<ServiceOrderDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    if (!order?.id) return;
    setLoading(true);
    try {
      const data = await orderDocumentsApi.getByOrder(order.id);
      setDocuments(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar documentos da OS");
    } finally {
      setLoading(false);
    }
  }, [order?.id]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Deseja realmente excluir o documento "${title}"?`)) return;
    try {
      await orderDocumentsApi.delete(docId);
      toast.success("Documento excluído com sucesso.");
      loadDocuments();
    } catch (err: any) {
      toast.error("Erro ao excluir documento.");
    }
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case DocumentType.APR:
        return { label: "APR · SEGURANÇA", code: "SGQ-SEG-01", color: "bg-amber-100 text-amber-800 border-amber-300" };
      case DocumentType.WORK_PERMIT:
        return { label: "PT · PERMISSÃO", code: "SGQ-SEG-02", color: "bg-red-100 text-red-800 border-red-300" };
      case DocumentType.CONTRACT:
        return { label: "CONTRATO", code: "SGQ-COM-07", color: "bg-blue-100 text-blue-800 border-blue-300" };
      case DocumentType.ACCEPTANCE_TERM:
        return { label: "ACEITE & GARANTIA", code: "SGQ-OPE-05", color: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case DocumentType.TECHNICAL_REPORT:
        return { label: "LAUDO TÉCNICO", code: "SGQ-TEC-01", color: "bg-purple-100 text-purple-800 border-purple-300" };
      case DocumentType.ART:
        return { label: "ART · CREA/CFT", code: "ART-ENG", color: "bg-orange-100 text-[#E2661D] border-orange-300" };
      case DocumentType.FINAL_INSPECTION:
        return { label: "VISTORIA FINAL", code: "SGQ-OPE-04", color: "bg-teal-100 text-teal-800 border-teal-300" };
      case DocumentType.OTHER:
        return { label: "OUTROS", code: "SGQ-DIV", color: "bg-slate-100 text-slate-800 border-slate-300" };
      default:
        return { label: "DOCUMENTO", code: "SGQ-GERAL", color: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  const clientId = order?.clientId || order?.client?.id;

  const handleCreateDocument = (type: DocumentType) => {
    if (!clientId) {
      toast.error("Cliente não identificado para esta OS.");
      return;
    }
    router.push(`/documents/${clientId}/new?orderId=${order.id}&type=${type}`);
  };

  const handleEditDocument = (doc: ServiceOrderDocument) => {
    const targetClientId = clientId || doc.clientId;
    if (!targetClientId) {
      toast.error("Cliente não identificado para este documento.");
      return;
    }
    router.push(`/documents/${targetClientId}/${doc.id}/edit`);
  };

  const handleViewDocument = (doc: ServiceOrderDocument) => {
    const targetClientId = clientId || doc.clientId;
    if (!targetClientId) {
      toast.error("Cliente não identificado para este documento.");
      return;
    }
    router.push(`/documents/${targetClientId}/${doc.id}/view`);
  };

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Aba de Documentação */}
      <Card className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-50 text-[#E2661D]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Documentação Técnica da Ordem de Serviço
              </h3>
              <p className="text-xs text-gray-500">
                Confeccione e emita documentos técnicos normativos em telas dedicadas
              </p>
            </div>
          </div>
        </div>

        {/* Botões Rápidos de Abertura da Tela Dedicada para cada Modelo */}
        <div className="pt-2 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
            Confeccionar Novo Documento em Tela Dedicada:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.APR)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-amber-500 hover:bg-amber-600 text-white shadow-2xs px-2.5"
            >
              <Shield className="w-3.5 h-3.5" />
              + APR (SGQ-SEG-01)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.WORK_PERMIT)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-red-600 hover:bg-red-700 text-white shadow-2xs px-2.5"
            >
              <Shield className="w-3.5 h-3.5" />
              + Permissão de Trabalho (SGQ-SEG-02)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.ACCEPTANCE_TERM)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs px-2.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              + Termo de Aceite & Garantia (SGQ-OPE-05)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.OTHER)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-teal-600 hover:bg-teal-700 text-white shadow-2xs px-2.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              + Vistoria Final (SGQ-OPE-04)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.CONTRACT)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs px-2.5"
            >
              <FileText className="w-3.5 h-3.5" />
              + Contrato (SGQ-COM-07)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.TECHNICAL_REPORT)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-purple-600 hover:bg-purple-700 text-white shadow-2xs px-2.5"
            >
              <FileText className="w-3.5 h-3.5" />
              + Relatório Técnico (SGQ-TEC-01)
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => handleCreateDocument(DocumentType.ART)}
              className="rounded-lg text-xs font-semibold gap-1.5 h-8 bg-slate-900 hover:bg-slate-800 text-white shadow-2xs px-2.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E2661D]" />
              + ART (CREA/CFT)
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista / Tabela de Documentos da OS (PRIORIZANDO LISTA EM VEZ DE CARDS) */}
      <Card className="overflow-hidden border border-gray-200 bg-white rounded-xl shadow-2xs">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#E2661D]" />
            <span className="text-xs">Carregando acervo documental da OS...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-t-0 hover:bg-transparent bg-gray-50/70">
                <TableHead className="w-[130px] font-bold text-gray-700">Código</TableHead>
                <TableHead className="font-bold text-gray-700">Documento / Título</TableHead>
                <TableHead className="w-[180px] font-bold text-gray-700">Tipo de Documento</TableHead>
                <TableHead className="font-bold text-gray-700">Emissão</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="w-[180px] text-right font-bold text-gray-700 pr-5">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.length === 0 ? (
                <TableEmpty colSpan={6} message="Nenhum documento emitido para esta Ordem de Serviço ainda" />
              ) : (
                documents.map((doc) => {
                  const badge = getDocTypeBadge(doc.type);
                  const isSigned = doc.status === DocumentStatus.SIGNED;

                  return (
                    <TableRow
                      key={doc.id}
                      onClick={() => handleViewDocument(doc)}
                      className="cursor-pointer hover:bg-orange-50/40 transition-colors group"
                    >
                      <TableCell className="font-mono font-bold text-xs text-[#E2661D]">
                        {doc.code}
                      </TableCell>

                      <TableCell>
                        <div className="text-[13px] font-bold text-gray-900 group-hover:text-[#E2661D] transition-colors truncate max-w-sm">
                          {doc.title}
                        </div>
                        {doc.notes && (
                          <div className="text-[11px] text-gray-400 truncate max-w-sm">
                            {doc.notes}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs text-gray-500 font-medium">
                        {formatDateBR(doc.createdAt)}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isSigned
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {isSigned ? "Assinado" : "Emitido"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleViewDocument(doc)}
                            className="h-8 px-2.5 rounded-lg bg-[#E2661D] hover:bg-[#d05a18] text-white text-xs font-bold gap-1 shadow-2xs"
                            title="Visualizar documento em tela cheia e imprimir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </Button>

                          <button
                            type="button"
                            onClick={() => handleEditDocument(doc)}
                            className="p-1.5 text-gray-400 hover:text-[#E2661D] hover:bg-orange-50 rounded-lg transition-colors"
                            title="Editar em tela dedicada"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
