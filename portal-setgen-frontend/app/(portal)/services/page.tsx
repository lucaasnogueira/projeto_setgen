"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Wrench,
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  Zap,
  Tag,
  DollarSign,
  CheckCircle,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { servicesApi, ServiceItem } from "@/lib/api/services";
import {
  ServiceFormModal,
  STANDARD_SERVICE_CATEGORIES,
  SERVICE_UNITS,
} from "@/components/services/ServiceFormModal";
import {
  exportServicesToExcel,
  parseExcelToServices,
} from "@/lib/services-sheet";
import { ImportExportDropdown } from "@/components/ui/import-export-dropdown";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODAS");
  const [unitFilter, setUnitFilter] = useState("TODAS");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modais e Upload
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await servicesApi.getAll();
      setServices(data || []);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
      toast.error("Erro ao carregar catálogo de serviços.");
    } finally {
      setLoading(false);
    }
  };

  // Categorias presentes no banco ou catálogo padrão
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    STANDARD_SERVICE_CATEGORIES.forEach((c) => set.add(c));
    services.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [services]);

  // Métricas para os 4 KPI Cards
  const metrics = useMemo(() => {
    const total = services.length;
    const activeCount = services.filter((s) => s.active !== false).length;
    const catSet = new Set(services.map((s) => s.category).filter(Boolean));
    const totalPrice = services.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
    const avgPrice = total > 0 ? totalPrice / total : 0;

    return {
      total,
      activeCount,
      totalCategories: catSet.size,
      avgPrice,
    };
  }, [services]);

  // Lista Filtrada
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.title.toLowerCase().includes(q) ||
        (s.externalCode && s.externalCode.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.unit && s.unit.toLowerCase().includes(q)) ||
        (s.defaultObservation && s.defaultObservation.toLowerCase().includes(q));

      const matchesCategory =
        categoryFilter === "TODAS" || s.category === categoryFilter;

      const matchesUnit =
        unitFilter === "TODAS" || s.unit?.toLowerCase() === unitFilter.toLowerCase();

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") {
        matchesStatus = s.active !== false;
      } else if (statusFilter === "INACTIVE") {
        matchesStatus = s.active === false;
      }

      return matchesSearch && matchesCategory && matchesUnit && matchesStatus;
    });
  }, [services, searchTerm, categoryFilter, unitFilter, statusFilter]);

  // Serviços paginados
  const totalPages = Math.ceil(filteredServices.length / pageSize) || 1;
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredServices.slice(start, start + pageSize);
  }, [filteredServices, currentPage, pageSize]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, unitFilter, statusFilter, pageSize]);

  // Ações de Criação / Edição
  const handleOpenNew = () => {
    setServiceToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (svc: ServiceItem) => {
    setServiceToEdit(svc);
    setIsModalOpen(true);
  };

  const handleDelete = async (svc: ServiceItem) => {
    if (!confirm(`Deseja excluir o serviço "${svc.title}"?`)) return;

    try {
      await servicesApi.delete(svc.id);
      toast.success("Serviço excluído com sucesso.");
      loadServices();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir serviço.");
    }
  };

  // Exportar Excel
  const handleExportExcel = () => {
    if (services.length === 0) {
      toast.error("Nenhum serviço disponível para exportar.");
      return;
    }
    exportServicesToExcel(
      services,
      `catalogo_servicos_setgen_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
    toast.success("Catálogo de serviços exportado com sucesso!");
  };

  // Upload Planilha Excel / CSV
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    toast.info("Processando arquivo de serviços...");

    try {
      const parsed = await parseExcelToServices(file);
      if (parsed.length === 0) {
        toast.error("Nenhum serviço válido identificado no arquivo.");
        return;
      }

      const res = await servicesApi.bulkImport(parsed);
      toast.success(
        `Importação concluída! ${res.created ?? res.total} serviços processados.`
      );
      loadServices();
    } catch (err: any) {
      console.error("Erro na importação de serviços:", err);
      toast.error("Erro ao importar planilha. Verifique as colunas.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Carregar catálogo oficial Setgen (248 serviços) via import dinâmico para não poluir o bundle
  const handleImportInitialData = async () => {
    if (
      !confirm(
        "Deseja carregar a tabela oficial com os 248 serviços técnicos da Setgen Engenharia?"
      )
    )
      return;

    setUploading(true);
    toast.info("Carregando 248 serviços oficiais da Setgen...");

    try {
      const { SETGEN_INITIAL_SERVICES } = await import("@/lib/seed-services-data");
      const res = await servicesApi.bulkImport(SETGEN_INITIAL_SERVICES);
      toast.success(
        `Catálogo carregado com sucesso! ${res.created ?? res.total} serviços sincronizados com sucesso.`
      );
      loadServices();
    } catch (err: any) {
      toast.error("Erro ao carregar catálogo inicial.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
      {/* Header com Título e Ações Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Catálogo de Serviços & Mão de Obra
              </h1>
              <p className="text-xs text-gray-500">
                Cadastro de apoio comercial: precificação de referência, unidades de medida e escopo de execução.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportDropdown
            title="Catálogo de Serviços"
            entityName="Serviços"
            data={filteredServices.map((s) => ({
              "Código": s.externalCode || "",
              "Título": s.title,
              "Preço": Number(s.price) || 0,
              "Unidade": s.unit || "sv",
              "Categoria": s.category || "",
              "NFS-e Descrição": s.nfseDescription || "",
              "CNAE": s.cnae || "",
              "Status": s.active ? "Ativo" : "Inativo",
            }))}
            exportFilename="servicos_setgen"
            templateColumns={[
              "Titulo do serviço",
              "Descrição do serviço na NFS-e",
              "Formatação do texto na NFS-e",
              "Preço",
              "Código externo",
              "Status",
              "Observação",
              "CNAE do serviço"
            ]}
            templateSampleRow={{
              "Titulo do serviço": "MÃO DE OBRA TÉC EM ELÉTRICA",
              "Descrição do serviço na NFS-e": "MÃO DE OBRA TÉC EM ELÉTRICA",
              "Formatação do texto na NFS-e": "Ativo",
              "Preço": "27890,88",
              "Código externo": "SRV-001",
              "Status": "Ativo",
              "Observação": "Manutenção preventiva e corretiva",
              "CNAE do serviço": "manutenção"
            }}
            onImport={servicesApi.bulkImport}
            onSuccess={loadServices}
          />

          {/* Botão de Carga Oficial Setgen (248 serviços) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportInitialData}
            disabled={uploading}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg border-orange-300 text-orange-700 hover:bg-orange-50"
            title="Carregar ou sincronizar os 248 serviços padrão da Setgen"
          >
            <Zap className="w-3.5 h-3.5 text-orange-600" />
            {services.length === 0
              ? "Carregar Catálogo Inicial (248 Serviços)"
              : "Sincronizar Catálogo Padrão"}
          </Button>

          {/* Novo Serviço */}
          <Button
            size="sm"
            onClick={handleOpenNew}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg bg-[#E2661D] hover:bg-[#c95514] text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Novo serviço
          </Button>
        </div>
      </div>

      {/* Cards de Métricas & Indicadores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Serviços */}
        <div
          onClick={() => {
            setCategoryFilter("TODAS");
            setStatusFilter("ALL");
          }}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
            statusFilter === "ALL" && categoryFilter === "TODAS"
              ? "border-orange-500 ring-2 ring-orange-500/10 shadow-xs"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total de Serviços
            </span>
            <Wrench className="w-4 h-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {metrics.total}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Cadastrados no catálogo</p>
        </div>

        {/* Categorias Técnicas */}
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Categorias
            </span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600">
            {metrics.totalCategories}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Especialidades e frentes</p>
        </div>

        {/* Média de Preço Referência */}
        <div className="p-4 rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Média de Referência
            </span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-700">
            {formatCurrency(metrics.avgPrice)}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Média unitária ponderada</p>
        </div>

        {/* Serviços Ativos */}
        <div
          onClick={() => setStatusFilter("ACTIVE")}
          className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
            statusFilter === "ACTIVE"
              ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-xs"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Disponíveis p/ Orçamento
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-gray-900">
            {metrics.activeCount}
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">Ativos para uso comercial</p>
        </div>
      </div>

      {/* Card da Tabela e Filtros */}
      <Card className="p-4 bg-white border border-gray-200 shadow-2xs space-y-4">
        {/* Barra de Busca e Filtros Rápidos */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por descrição, código, categoria, escopo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs border-gray-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de Categoria */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden max-w-[220px] truncate"
            >
              <option value="TODAS">Todas as Categorias</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filtro de Unidade */}
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
            >
              <option value="TODAS">Todas as Unidades</option>
              {SERVICE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Apenas Ativos</option>
              <option value="INACTIVE">Apenas Inativos</option>
            </select>

            {/* Limpar Filtros */}
            {(searchTerm ||
              categoryFilter !== "TODAS" ||
              unitFilter !== "TODAS" ||
              statusFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("TODAS");
                  setUnitFilter("TODAS");
                  setStatusFilter("ALL");
                }}
                className="text-xs h-9 text-gray-500 hover:text-gray-900"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Tabela de Serviços */}
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="w-16 text-[10px] uppercase font-bold text-gray-500">
                  ID / Cód
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                  Descrição do Serviço & Escopo Técnico
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                  Categoria
                </TableHead>
                <TableHead className="w-20 text-[10px] uppercase font-bold text-gray-500 text-center">
                  Unidade
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-gray-500 text-right">
                  Valor de Referência (R$)
                </TableHead>
                <TableHead className="w-24 text-[10px] uppercase font-bold text-gray-500 text-center">
                  Status
                </TableHead>
                <TableHead className="w-24 text-[10px] uppercase font-bold text-gray-500 text-right">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-orange-500" />
                      <span>Carregando catálogo de serviços Setgen...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                        <Wrench className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">
                        Nenhum serviço encontrado
                      </h3>
                      <p className="text-xs text-gray-500">
                        {services.length === 0
                          ? "Você ainda não possui serviços cadastrados no catálogo comercial. Carregue os 248 itens oficiais com um clique abaixo."
                          : "Nenhum resultado corresponde aos filtros aplicados."}
                      </p>
                      {services.length === 0 && (
                        <Button
                          onClick={handleImportInitialData}
                          disabled={uploading}
                          className="bg-[#E2661D] hover:bg-[#c95514] text-white text-xs font-semibold gap-2 mt-2"
                        >
                          <Zap className="w-4 h-4" />
                          Carregar 248 Serviços Oficiais Setgen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedServices.map((s, idx) => {
                  const displayCode = s.externalCode || `#${(currentPage - 1) * pageSize + idx + 1}`;
                  const isActive = s.active !== false;

                  return (
                    <TableRow key={s.id} className="hover:bg-gray-50/50 text-xs">
                      {/* Código */}
                      <TableCell className="font-mono font-bold text-gray-800 text-xs whitespace-nowrap">
                        {displayCode}
                      </TableCell>

                      {/* Descrição e Observações */}
                      <TableCell className="max-w-md">
                        <div className="font-semibold text-gray-900 leading-tight">
                          {s.title}
                        </div>
                        {s.defaultObservation && (
                          <div
                            className="text-[11px] text-gray-500 line-clamp-2 mt-0.5"
                            title={s.defaultObservation}
                          >
                            {s.defaultObservation}
                          </div>
                        )}
                      </TableCell>

                      {/* Categoria */}
                      <TableCell className="whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {s.category || "Geral"}
                        </span>
                      </TableCell>

                      {/* Unidade */}
                      <TableCell className="text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center font-mono font-bold px-2 py-0.5 rounded text-[11px] bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                          {s.unit || "sv"}
                        </span>
                      </TableCell>

                      {/* Valor de Referência */}
                      <TableCell className="text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatCurrency(Number(s.price) || 0)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Inativo
                          </span>
                        )}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(s)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Editar serviço"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            title="Excluir serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Rodapé com Informações de Paginação */}
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredServices.length}
          itemsPerPage={pageSize}
          onPageChange={setCurrentPage}
          itemLabel="serviços"
        />
      </Card>

      {/* Modal de Cadastro / Edição de Serviço */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceToEdit={serviceToEdit}
        onSuccess={() => {
          loadServices();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}
