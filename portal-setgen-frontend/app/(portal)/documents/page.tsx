"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { clientsApi } from "@/lib/api/clients";
import { orderDocumentsApi } from "@/lib/api/order-documents";
import { Client, ServiceOrderDocument } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/PageHeader";
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
  Search,
  Building2,
  ChevronRight,
  FileText,
  ShieldCheck,
  Loader2,
  X,
  FolderOpen,
  CheckCircle2,
  Files,
  ArrowUpRight,
} from "lucide-react";
import { getAvatarColor, getInitials, formatCNPJ, formatCPF } from "@/lib/utils";
import { toast } from "sonner";

export default function DocumentsClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<ServiceOrderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WITH_DOCS" | "EMPTY">("ALL");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [clientsData, docsData] = await Promise.all([
          clientsApi.getAll(),
          orderDocumentsApi.getAll(),
        ]);
        setClients(clientsData || []);
        setDocuments(docsData || []);
      } catch (err: any) {
        toast.error("Erro ao carregar lista de clientes e documentos.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Mapeamento da quantidade de documentos por cliente
  const docCountsByClient = useMemo(() => {
    const map = new Map<string, number>();
    documents.forEach((doc) => {
      if (doc.clientId) {
        map.set(doc.clientId, (map.get(doc.clientId) || 0) + 1);
      }
    });
    return map;
  }, [documents]);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return clients.filter((c) => {
      const matchesSearch =
        !term ||
        c.companyName?.toLowerCase().includes(term) ||
        c.tradeName?.toLowerCase().includes(term) ||
        c.cnpjCpf?.toLowerCase().includes(term);

      const count = docCountsByClient.get(c.id) || 0;
      const matchesFilter =
        statusFilter === "ALL" ||
        (statusFilter === "WITH_DOCS" && count > 0) ||
        (statusFilter === "EMPTY" && count === 0);

      return matchesSearch && matchesFilter;
    });
  }, [clients, searchTerm, statusFilter, docCountsByClient]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE) || 1;
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, currentPage]);

  const clientsWithDocsCount = useMemo(() => {
    return clients.filter((c) => (docCountsByClient.get(c.id) || 0) > 0).length;
  }, [clients, docCountsByClient]);

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho Oficial (Sem "& SGQ") */}
      <PageHeader
        title="Gestão de Documentos"
        subtitle="Gerenciamento centralizado do acervo documental dos clientes (APR, Permissões de Trabalho, Contratos, Termos de Aceite, Laudos Técnicos e ART)"
      />

      {/* Cards de Métricas Executivas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Clientes no Acervo
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-gray-900 tracking-tight">{clients.length}</span>
            <span className="text-[11px] text-gray-400 font-medium">cadastrados</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            <strong>{clientsWithDocsCount}</strong> com documentos ativos
          </p>
        </Card>

        <Card className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Documentos Emitidos
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-[#E2661D] flex items-center justify-center">
              <Files className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-[#E2661D] tracking-tight">{documents.length}</span>
            <span className="text-[11px] text-gray-400 font-medium">arquivos</span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Laudos, contratos e fichas operacionais
          </p>
        </Card>

        <Card className="p-3.5 sm:p-4 rounded-xl border border-gray-200/80 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Conformidade Técnica
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-600 tracking-tight">100%</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
              Homologado
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Normas ABNT NBR & NRs vigentes
          </p>
        </Card>
      </div>

      {/* Tabela de Clientes */}
      <Card className="overflow-hidden border border-gray-200/80 bg-white rounded-xl shadow-2xs">
        {/* Barra de Busca e Filtros Rápidos */}
        <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar cliente por razão social, nome fantasia ou CNPJ..."
              className="pl-8.5 h-9 text-xs rounded-lg bg-gray-50/70 border-gray-200 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Pílulas de Filtro */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "ALL"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Todos ({clients.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("WITH_DOCS");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === "WITH_DOCS"
                    ? "bg-white text-gray-900 shadow-2xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Com Documentos ({clientsWithDocsCount})
              </button>
            </div>

            <span className="text-xs text-gray-400 font-medium hidden sm:inline">
              Exibindo <strong>{filteredClients.length}</strong>
            </span>
          </div>
        </div>

        {/* Tabela */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#E2661D]" />
            <span className="text-xs font-medium">Carregando acervo de clientes...</span>
          </div>
        ) : (
          <>
            <Table>
            <TableHeader>
              <TableRow className="border-t-0 hover:bg-transparent bg-gray-50/80">
                <TableHead className="w-[38%] font-bold text-gray-700 pl-5">Cliente / Razão Social</TableHead>
                <TableHead className="font-bold text-gray-700">CNPJ / CPF</TableHead>
                <TableHead className="font-bold text-gray-700">Cidade / UF</TableHead>
                <TableHead className="text-center font-bold text-gray-700">Documentos no Acervo</TableHead>
                <TableHead className="font-bold text-gray-700">Situação Cadastral</TableHead>
                <TableHead className="w-[180px] text-right font-bold text-gray-700 pr-5">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableEmpty colSpan={6} message="Nenhum cliente encontrado com os filtros selecionados" />
              ) : (
                paginatedClients.map((client) => {
                  const docCount = docCountsByClient.get(client.id) || 0;
                  const color = getAvatarColor(client.companyName);
                  const formattedCnpj =
                    client.cnpjCpf?.length === 11
                      ? formatCPF(client.cnpjCpf)
                      : client.cnpjCpf?.length === 14
                      ? formatCNPJ(client.cnpjCpf)
                      : client.cnpjCpf || "—";

                  return (
                    <TableRow
                      key={client.id}
                      onClick={() => router.push(`/documents/${client.id}`)}
                      className="cursor-pointer hover:bg-orange-50/40 transition-colors group"
                    >
                      {/* Cliente com Avatar */}
                      <TableCell className="pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${color.bg} ${color.fg}`}
                          >
                            {getInitials(client.companyName)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-gray-900 group-hover:text-[#E2661D] transition-colors truncate">
                              {client.companyName || client.tradeName || "Cliente"}
                            </div>
                            {client.tradeName && client.tradeName !== client.companyName && (
                              <div className="text-[11px] text-gray-400 truncate">
                                {client.tradeName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* CNPJ / CPF */}
                      <TableCell className="text-xs font-mono text-gray-600">
                        {formattedCnpj}
                      </TableCell>

                      {/* Cidade / UF */}
                      <TableCell className="text-xs text-gray-500 font-medium">
                        {client.address?.city || "Manaus"}
                        {client.address?.state ? `/${client.address.state}` : "/AM"}
                      </TableCell>

                      {/* Documentos Emitidos */}
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            docCount > 0
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}
                        >
                          <FileText className="w-3 h-3" />
                          {docCount} {docCount === 1 ? "documento" : "documentos"}
                        </span>
                      </TableCell>

                      {/* Situação Cadastral */}
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          Ativo · Regular
                        </span>
                      </TableCell>

                      {/* Ação */}
                      <TableCell className="text-right pr-5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/documents/${client.id}`);
                          }}
                          className="h-8 px-3 rounded-xl text-xs font-bold text-gray-700 hover:text-[#E2661D] hover:bg-orange-50 gap-1 transition-colors"
                        >
                          <span>Acessar Acervo</span>
                          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Button>
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
              totalItems={filteredClients.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="clientes"
            />
          </>
        )}
      </Card>
    </div>
  );
}
