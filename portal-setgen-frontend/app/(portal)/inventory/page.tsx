"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { inventoryApi } from "@/lib/api/inventory";
import { Product, StockMovement, MovementType } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Package,
  Plus,
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Edit,
  Trash2,
  History,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusCard } from "@/components/ui/status-card";
import { Pagination, TablePagination } from "@/components/ui/pagination";
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
import { ProductFormModal } from "@/components/inventory/ProductFormModal";
import { StockMovementModal } from "@/components/inventory/StockMovementModal";
import {
  exportProductsToExcel,
  parseExcelToProducts,
} from "@/lib/inventory-sheet";
import { SETGEN_INITIAL_SHEET_DATA } from "@/lib/seed-inventory-data";
import { groupSheetRowsToProducts } from "@/lib/inventory-sheet";
import { useCanViewValues } from "@/lib/permissions";

export default function InventoryPage() {
  const canViewValues = useCanViewValues();
  const [items, setItems] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"estoque" | "movimentacoes">("estoque");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("TODAS");
  const [stockStatusFilter, setStockStatusFilter] = useState<"ALL" | "LOW" | "ZERO" | "OK">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  const [movementsPage, setMovementsPage] = useState(1);
  const MOVEMENTS_PER_PAGE = 15;
  const totalMovementsPages = Math.ceil(movements.length / MOVEMENTS_PER_PAGE) || 1;
  const paginatedMovements = useMemo(() => {
    const start = (movementsPage - 1) * MOVEMENTS_PER_PAGE;
    return movements.slice(start, start + MOVEMENTS_PER_PAGE);
  }, [movements, movementsPage]);

  // Modais
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementDefaultProduct, setMovementDefaultProduct] = useState<Product | null>(null);
  const [movementDefaultType, setMovementDefaultType] = useState<"ENTRY" | "EXIT">("ENTRY");

  const [uploadingSheet, setUploadingSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [prods, movs] = await Promise.all([
        inventoryApi.getAll(),
        inventoryApi.getMovements().catch(() => []),
      ]);
      setItems(prods);
      setMovements(movs);
    } catch (err) {
      console.error("Erro ao carregar dados do almoxarifado:", err);
      toast.error("Erro ao carregar dados do almoxarifado.");
    } finally {
      setLoading(false);
    }
  };

  // Categorias únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [items]);

  // Alertas e Métricas de Almoxarifado
  const metrics = useMemo(() => {
    let lowStockCount = 0;
    let zeroStockCount = 0;
    let totalStockValue = 0;
    let totalUnits = 0;

    items.forEach((p) => {
      const stock = Number(p.currentStock) || 0;
      const min = Number(p.minStock) || 0;
      const cost = Number(p.unitCost) || 0;

      totalUnits += stock;

      if (stock === 0) {
        zeroStockCount++;
      } else if (stock <= min) {
        lowStockCount++;
      }

      totalStockValue += stock * cost;
    });

    return {
      totalItems: items.length,
      totalUnits,
      lowStockCount,
      zeroStockCount,
      totalStockValue,
    };
  }, [items]);

  // Produtos Filtrados
  const filteredProducts = useMemo(() => {
    return items.filter((p) => {
      // Busca
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search) ||
        (p.code && p.code.toLowerCase().includes(search)) ||
        (p.category && p.category.toLowerCase().includes(search));

      // Categoria
      const matchesCategory =
        categoryFilter === "TODAS" || p.category === categoryFilter;

      // Alerta de Estoque
      const stock = Number(p.currentStock) || 0;
      const min = Number(p.minStock) || 0;

      let matchesStock = true;
      if (stockStatusFilter === "LOW") {
        matchesStock = stock > 0 && stock <= min;
      } else if (stockStatusFilter === "ZERO") {
        matchesStock = stock === 0;
      } else if (stockStatusFilter === "OK") {
        matchesStock = stock > min;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [items, searchTerm, categoryFilter, stockStatusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockStatusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Ações de Modal
  const handleOpenNewProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenMovement = (prod?: Product, type: "ENTRY" | "EXIT" = "ENTRY") => {
    setMovementDefaultProduct(prod || null);
    setMovementDefaultType(type);
    setIsMovementModalOpen(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir o produto "${name}"?`)) return;
    try {
      await inventoryApi.delete(id);
      toast.success("Produto excluído com sucesso.");
      loadInventory();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao excluir produto.");
    }
  };

  // Exportar Excel
  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error("Nenhum produto cadastrado para exportar.");
      return;
    }
    exportProductsToExcel(items, `almoxarifado_setgen_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Planilha de estoque exportada com sucesso!");
  };

  // Subir Planilha Excel
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSheet(true);
    toast.info("Processando planilha de almoxarifado...");

    try {
      const groupedProducts = await parseExcelToProducts(file);
      if (groupedProducts.length === 0) {
        toast.error("Nenhum produto válido encontrado na planilha.");
        return;
      }

      const res = await inventoryApi.bulkImport(groupedProducts);
      toast.success(
        `Importação concluída! ${res.created} criados, ${res.updated} atualizados.`
      );
      loadInventory();
    } catch (err: any) {
      console.error("Erro na importação:", err);
      toast.error("Erro ao importar planilha. Verifique a formatação.");
    } finally {
      setUploadingSheet(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Carregar dados iniciais da Setgen (as centenas de itens da mensagem)
  const handleImportInitialData = async () => {
    if (!confirm("Deseja importar a planilha completa de materiais elétricos da Setgen?")) return;

    setUploadingSheet(true);
    toast.info("Importando catálogo completo da Setgen...");

    try {
      const grouped = groupSheetRowsToProducts(SETGEN_INITIAL_SHEET_DATA);
      const res = await inventoryApi.bulkImport(grouped);
      toast.success(
        `Catálogo importado com sucesso! ${res.created} novos itens adicionados ao almoxarifado.`
      );
      loadInventory();
    } catch (err: any) {
      toast.error("Erro ao importar catálogo inicial.");
    } finally {
      setUploadingSheet(false);
    }
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto pb-12">
      {/* Header com Título e Ações Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Almoxarifado & Catálogo de Materiais
              </h1>
              <p className="text-xs text-gray-500">
                Gestão fidedigna de peças, cotações de fornecedores, entradas, saídas e reposição.
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Importar arquivo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={uploadingSheet}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700"
            title="Importar planilha de produtos (.xlsx, .csv)"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            {uploadingSheet ? "Importando..." : "Importar arquivo"}
          </Button>

          {/* Exportar arquivo */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg border-gray-300 hover:bg-gray-50 text-gray-700"
            title="Exportar planilha do estoque atual (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Exportar arquivo
          </Button>

          {/* Entrada de Material */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenMovement(undefined, "ENTRY")}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
            + Entrada
          </Button>

          {/* Saída de Material */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenMovement(undefined, "EXIT")}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg border-red-300 text-red-700 hover:bg-red-50"
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
            - Saída
          </Button>

          {/* Novo Produto */}
          <Button
            size="sm"
            onClick={handleOpenNewProduct}
            className="text-xs font-semibold gap-1.5 h-9 rounded-lg bg-[#0A58CA] hover:bg-[#084298] text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Novo produto
          </Button>

          {items.length === 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleImportInitialData}
              disabled={uploadingSheet}
              className="text-xs font-semibold gap-1.5 h-9 rounded-lg border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              Carregar Dados da Planilha Setgen
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Resumo & Alertas com StatusCard Padrão Setgen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
        <StatusCard
          label="Total de Itens"
          value={metrics.totalItems}
          description="Cadastrados no catálogo"
          icon={Package}
          variant="blue"
          onClick={() => setStockStatusFilter("ALL")}
          className={`cursor-pointer transition-all ${
            stockStatusFilter === "ALL"
              ? "ring-2 ring-blue-500 border-blue-500/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
        <StatusCard
          label="Estoque Baixo"
          value={metrics.lowStockCount}
          description="Abaixo do estoque mínimo"
          icon={AlertTriangle}
          variant="amber"
          onClick={() => setStockStatusFilter("LOW")}
          className={`cursor-pointer transition-all ${
            stockStatusFilter === "LOW"
              ? "ring-2 ring-amber-500 border-amber-500/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
        <StatusCard
          label="Estoque Zerado"
          value={metrics.zeroStockCount}
          description="Sem saldo em depósito"
          icon={XCircle}
          variant="red"
          onClick={() => setStockStatusFilter("ZERO")}
          className={`cursor-pointer transition-all ${
            stockStatusFilter === "ZERO"
              ? "ring-2 ring-red-500 border-red-500/50 shadow-xs"
              : "hover:border-gray-300"
          }`}
        />
        <StatusCard
          label={canViewValues ? "Valor em Estoque" : "Saldo de Unidades"}
          value={canViewValues ? formatCurrency(metrics.totalStockValue) : `${metrics.totalUnits} un`}
          description={canViewValues ? "Custo total armazenado" : "Volume físico total em almoxarifado"}
          icon={CheckCircle}
          variant="emerald"
        />
      </div>

      {/* Abas: Catálogo / Movimentações */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("estoque")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "estoque"
              ? "bg-gray-900 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Catálogo & Estoque Atual ({filteredProducts.length})
        </button>

        <button
          onClick={() => setActiveTab("movimentacoes")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "movimentacoes"
              ? "bg-gray-900 text-white shadow-2xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Histórico de Entradas e Saídas ({movements.length})
        </button>
      </div>

      {/* ABA 1: CATÁLOGO & ESTOQUE */}
      {activeTab === "estoque" && (
        <Card className="p-4 bg-white border border-gray-200 shadow-2xs space-y-4">
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, código, categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs border-gray-200"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Filtro de Categoria */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg text-gray-700 focus:outline-hidden"
              >
                <option value="TODAS">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Botão Reset Filtros */}
              {(searchTerm || categoryFilter !== "TODAS" || stockStatusFilter !== "ALL") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("TODAS");
                    setStockStatusFilter("ALL");
                  }}
                  className="text-xs h-9 text-gray-500 hover:text-gray-900"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Tabela de Produtos */}
          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="w-16 text-[10px] uppercase font-bold text-gray-500">
                    ID / Cód
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                    Produto / Descrição
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                    Categoria
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                    Unidade
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-500 text-center">
                    Estoque Atual
                  </TableHead>
                  {canViewValues && (
                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                      Fornecedor / Custo (R$)
                    </TableHead>
                  )}
                  {canViewValues && (
                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                      Preço Venda (R$)
                    </TableHead>
                  )}
                  <TableHead className="w-28 text-[10px] uppercase font-bold text-gray-500 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={canViewValues ? 8 : 6} className="text-center py-8 text-gray-400 text-xs">
                      Carregando produtos do almoxarifado...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableEmpty
                    colSpan={canViewValues ? 8 : 6}
                    message="Nenhum material encontrado com os filtros aplicados."
                  />
                ) : (
                  paginatedProducts.map((p) => {
                    const stock = Number(p.currentStock) || 0;
                    const min = Number(p.minStock) || 0;
                    const cost = Number(p.unitCost) || 0;
                    const sale = Number(p.salePrice) || 0;

                    // Status Badge
                    let stockBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        {stock} {p.unit}
                      </span>
                    );

                    if (stock === 0) {
                      stockBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Zerado (0 {p.unit})
                        </span>
                      );
                    } else if (stock <= min) {
                      stockBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Baixo ({stock}/{min} {p.unit})
                        </span>
                      );
                    }

                    // Fornecedor Ativo
                    const usedQuote = Array.isArray(p.supplierQuotations)
                      ? p.supplierQuotations.find((q) => q.isUsed) || p.supplierQuotations[0]
                      : null;

                    return (
                      <TableRow key={p.id} className="hover:bg-gray-50/50 text-xs">
                        <TableCell className="font-mono font-bold text-gray-900 text-xs">
                          {p.code || (p.sheetId ? `#${p.sheetId}` : "—")}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 max-w-xs">
                          <div className="truncate" title={p.name}>
                            {p.name}
                          </div>
                          {p.notes && (
                            <span className="text-[10px] text-gray-400 block truncate italic">
                              {p.notes}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {p.category || "—"}
                        </TableCell>
                        <TableCell className="text-gray-600 uppercase font-mono">
                          {p.unit}
                        </TableCell>
                        <TableCell className="text-center">{stockBadge}</TableCell>
                        {canViewValues && (
                          <TableCell className="text-gray-700">
                            <span className="font-semibold">{formatCurrency(cost)}</span>
                            {usedQuote && (
                              <span className="text-[10px] text-gray-400 block truncate">
                                {usedQuote.supplier}
                              </span>
                            )}
                          </TableCell>
                        )}
                        {canViewValues && (
                          <TableCell className="text-emerald-700 font-bold">
                            {formatCurrency(sale)}
                            {p.fixedSalePrice ? (
                              <span className="text-[9px] text-gray-400 block font-normal">
                                fixa
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-400 block font-normal">
                                +{p.marginPercent ?? 30}%
                              </span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Entrada Rápida */}
                            <button
                              onClick={() => handleOpenMovement(p, "ENTRY")}
                              title="Registrar Entrada de Estoque"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            >
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Saída Rápida */}
                            <button
                              onClick={() => handleOpenMovement(p, "EXIT")}
                              title="Registrar Saída de Estoque"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              title="Editar Produto"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              title="Excluir Produto"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
              totalItems={filteredProducts.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              itemLabel="materiais"
            />
          </div>
        </Card>
      )}

      {/* ABA 2: HISTÓRICO DE MOVIMENTAÇÕES */}
      {activeTab === "movimentacoes" && (
        <Card className="p-4 bg-white border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">
              Histórico de Entradas e Saídas
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMovement(undefined, "ENTRY")}
                className="text-xs h-8 gap-1 text-emerald-700 border-emerald-300"
              >
                <ArrowDownRight className="w-3.5 h-3.5" /> + Entrada
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenMovement(undefined, "EXIT")}
                className="text-xs h-8 gap-1 text-red-700 border-red-300"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> - Saída
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="w-28 text-[10px] uppercase font-bold text-gray-500">
                    Data/Hora
                  </TableHead>
                  <TableHead className="w-24 text-[10px] uppercase font-bold text-gray-500">
                    Tipo
                  </TableHead>
                  <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                    Produto
                  </TableHead>
                  <TableHead className="w-20 text-[10px] uppercase font-bold text-gray-500 text-center">
                    Qtd
                  </TableHead>
                  {canViewValues && (
                    <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                      Custo Unit.
                    </TableHead>
                  )}
                  <TableHead className="text-[10px] uppercase font-bold text-gray-500">
                    Motivo / Observações
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {movements.length === 0 ? (
                  <TableEmpty
                    colSpan={canViewValues ? 6 : 5}
                    message="Nenhuma movimentação registrada até o momento."
                  />
                ) : (
                  paginatedMovements.map((m) => {
                    const isEntry =
                      m.type === MovementType.ENTRY ||
                      m.type === MovementType.ADJUSTMENT_IN;

                    return (
                      <TableRow key={m.id} className="hover:bg-gray-50/50 text-xs">
                        <TableCell className="text-gray-500 font-mono text-[11px]">
                          {new Date(m.createdAt).toLocaleDateString("pt-BR")}{" "}
                          {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isEntry
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {isEntry ? "+ Entrada" : "- Saída"}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">
                          {m.product?.name || "Produto"}
                        </TableCell>
                        <TableCell className="text-center font-bold font-mono">
                          {m.quantity} {m.product?.unit}
                        </TableCell>
                        {canViewValues && (
                          <TableCell className="text-gray-700">
                            {m.unitCost ? formatCurrency(Number(m.unitCost)) : "—"}
                          </TableCell>
                        )}
                        <TableCell className="text-gray-600 italic">
                          {m.reason || "Sem observações"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>

            <TablePagination
              currentPage={movementsPage}
              totalPages={totalMovementsPages}
              totalItems={movements.length}
              itemsPerPage={MOVEMENTS_PER_PAGE}
              onPageChange={setMovementsPage}
              itemLabel="movimentações"
            />
          </div>
        </Card>
      )}

      {/* Modal Fidedigno de Cadastro e Edição de Produto */}
      <ProductFormModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={loadInventory}
        productToEdit={productToEdit}
      />

      {/* Modal de Entrada e Saída de Material */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={loadInventory}
        products={items}
        defaultProduct={movementDefaultProduct}
        defaultType={movementDefaultType}
      />
    </div>
  );
}
