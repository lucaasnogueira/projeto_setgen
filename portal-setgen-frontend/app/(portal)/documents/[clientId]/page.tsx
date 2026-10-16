"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { ordersApi } from "@/lib/api/orders";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import { Client, ServiceOrder, ServiceOrderDocument, DocumentType, DocumentStatus } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/pagination";
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
  ArrowLeft,
  Plus,
  Search,
  Building2,
  FileText,
  Printer,
  Edit,
  Trash2,
  Calendar,
  Loader2,
  ExternalLink,
  X,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { formatDateBR } from "@/lib/date";
import { toast } from "sonner";

export default function ClientDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [documents, setDocuments] = useState<ServiceOrderDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");

  const loadClientData = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const [clientData, ordersData, docsData] = await Promise.all([
        clientsApi.getOne(clientId),
        ordersApi.getAll({ clientId }),
        orderDocumentsApi.getByClient(clientId),
      ]);
      setClient(clientData);
      setOrders(ordersData || []);
      setDocuments(docsData || []);
    } catch (err: any) {
      toast.error("Erro ao carregar dados do cliente e documentos.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Deseja realmente excluir o documento "${title}"?`)) return;
    try {
      await orderDocumentsApi.delete(docId);
      toast.success("Documento excluído com sucesso.");
      loadClientData();
    } catch (err: any) {
      toast.error("Erro ao excluir documento.");
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType = selectedType === "ALL" || doc.type === selectedType;
      const term = search.toLowerCase().trim();
      const orderNum = (doc.serviceOrder?.orderNumber || "").toLowerCase();
      const code = (doc.code || "").toLowerCase();
      const title = (doc.title || "").toLowerCase();

      const matchesSearch =
        !term ||
        orderNum.includes(term) ||
        code.includes(term) ||
        title.includes(term);

      return matchesType && matchesSearch;
    });
  }, [documents, selectedType, search]);

  const totalPages = Math.ceil(filteredDocs.length / ITEMS_PER_PAGE) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

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
      case DocumentType.OTHER:
        return { label: "VISTORIA FINAL", code: "SGQ-OPE-04", color: "bg-teal-100 text-teal-800 border-teal-300" };
      default:
        return { label: "DOCUMENTO", code: "SGQ-GERAL", color: "bg-gray-100 text-gray-800 border-gray-300" };
    }
  };

  const clientName = client?.companyName || client?.tradeName || "Cliente";

  return (
    <div className="space-y-5 pb-12">
      {/* Botão Voltar */}
      <div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push("/documents")}
          className="text-gray-500 hover:text-gray-900 gap-1.5 -ml-2 text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Clientes
        </Button>
      </div>

      {/* Header do Dossiê do Cliente */}
      <Card className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2661D] text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-orange-50 text-[#E2661D] border border-orange-200">
                  DOSSIÊ DE CLIENTE
                </span>
                <span className="text-xs font-medium text-gray-500">
                  {documents.length} documentos emitidos
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-snug">
                {clientName}
              </h1>
              <p className="text-[11px] text-gray-500 mt-0.5">
                CNPJ/CPF: <strong>{client?.cnpjCpf || "Não informado"}</strong> ·{" "}
                {client?.address?.city || "Manaus"}/{client?.address?.state || "AM"} ·{" "}
                {orders.length} Ordens de Serviço vinculadas
              </p>
            </div>
          </div>

          {/* BOTÃO EM DESTAQUE: TELA DEDICADA DE CONFECCIONAR NOVO DOCUMENTO */}
          <div className="shrink-0">
            <Button
              type="button"
              onClick={() => router.push(`/documents/${clientId}/new`)}
              className="w-full sm:w-auto h-9 px-4 rounded-lg bg-[#E2661D] hover:bg-[#d05a18] text-white font-semibold text-xs gap-1.5 shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              Confeccionar Novo Documento
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista / Tabela de Documentos do Cliente (PRIORIZANDO LISTA EM VEZ DE CARDS) */}
      <Card className="overflow-hidden border border-gray-200 bg-white rounded-xl shadow-2xs space-y-0">
        {/* Barra de Filtros e Busca */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por código (ex: AP2026-001), título ou OS..."
                className="pl-9 h-9 text-xs rounded-lg bg-gray-50/70 border-gray-200"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Exibindo <strong>{filteredDocs.length}</strong> de {documents.length} documentos
            </div>
          </div>

          {/* Pílulas de Filtro por Tipo */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { type: "ALL", label: "Todos os Documentos" },
              { type: DocumentType.APR, label: "APR (Segurança)" },
              { type: DocumentType.WORK_PERMIT, label: "Permissão (PT)" },
              { type: DocumentType.ACCEPTANCE_TERM, label: "Aceite & Garantia" },
              { type: DocumentType.OTHER, label: "Vistoria Final" },
              { type: DocumentType.CONTRACT, label: "Contratos" },
              { type: DocumentType.TECHNICAL_REPORT, label: "Laudos Técnicos" },
              { type: DocumentType.ART, label: "ARTs" },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => {
                  setSelectedType(item.type);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedType === item.type
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabela de Documentos */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#E2661D]" />
            <span className="text-xs">Carregando acervo do cliente...</span>
          </div>
        ) : (
          <>
            <Table>
            <TableHeader>
              <TableRow className="border-t-0 hover:bg-transparent bg-gray-50/70">
                <TableHead className="w-[130px] font-bold text-gray-700">Código</TableHead>
                <TableHead className="font-bold text-gray-700">Documento / Título</TableHead>
                <TableHead className="w-[180px] font-bold text-gray-700">Categoria / Tipo</TableHead>
                <TableHead className="font-bold text-gray-700">Ordem de Serviço</TableHead>
                <TableHead className="font-bold text-gray-700">Emissão</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="w-[200px] text-right font-bold text-gray-700 pr-5">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableEmpty colSpan={7} message="Nenhum documento encontrado para este cliente" />
              ) : (
                paginatedDocs.map((doc) => {
                  const badge = getDocTypeBadge(doc.type);
                  const isSigned = doc.status === DocumentStatus.SIGNED;

                  return (
                    <TableRow
                      key={doc.id}
                      onClick={() => router.push(`/documents/${clientId}/${doc.id}/view`)}
                      className="cursor-pointer hover:bg-orange-50/40 transition-colors group"
                    >
                      {/* Código SGQ */}
                      <TableCell className="font-mono font-bold text-xs text-[#E2661D]">
                        {doc.code}
                      </TableCell>

                      {/* Título do Documento */}
                      <TableCell>
                        <div className="text-[13px] font-bold text-gray-900 group-hover:text-[#E2661D] transition-colors truncate max-w-xs">
                          {doc.title}
                        </div>
                        {doc.notes && (
                          <div className="text-[11px] text-gray-400 truncate max-w-xs">
                            {doc.notes}
                          </div>
                        )}
                      </TableCell>

                      {/* Tipo SGQ */}
                      <TableCell>
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </TableCell>

                      {/* Ordem de Serviço */}
                      <TableCell className="text-xs text-gray-600">
                        {doc.serviceOrder ? (
                          <span className="font-medium text-gray-800">
                            #{doc.serviceOrder.orderNumber}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Emissão */}
                      <TableCell className="text-xs text-gray-500 font-medium">
                        {formatDateBR(doc.createdAt)}
                      </TableCell>

                      {/* Status */}
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

                      {/* Ações */}
                      <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => router.push(`/documents/${clientId}/${doc.id}/view`)}
                            className="h-8 px-2.5 rounded-lg bg-[#E2661D] hover:bg-[#d05a18] text-white text-xs font-bold gap-1 shadow-2xs"
                            title="Visualizar documento em tela cheia e imprimir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </Button>

                          <button
                            type="button"
                            onClick={() => router.push(`/documents/${clientId}/${doc.id}/edit`)}
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

            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDocs.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="documentos"
            />
          </>
        )}
      </Card>
    </div>
  );
}
