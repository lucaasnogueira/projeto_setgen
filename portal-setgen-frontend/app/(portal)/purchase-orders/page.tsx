"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { PurchaseOrder } from "@/types";
import {
  ShoppingBag,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Eye,
  Printer,
  FileText,
  DollarSign,
  Share2,
  Trash2,
  Edit,
  Truck,
  Building2,
  User as UserIcon,
  Package,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusCard } from "@/components/ui/status-card";
import { TablePagination } from "@/components/ui/pagination";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { PurchaseOrderPrintModal } from "@/components/purchase-orders/PurchaseOrderPrintModal";
import { toast } from "sonner";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<PurchaseOrder | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const router = useRouter();

  const loadOrders = async () => {
    try {
      const data = await purchaseOrdersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar Ordens de Compra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleOpenPrint = (order: PurchaseOrder) => {
    setSelectedOrderForPrint(order);
    setPrintModalOpen(true);
  };

  const handleMarkAsCompleted = async (order: PurchaseOrder) => {
    try {
      await purchaseOrdersApi.update(order.id, { pickupStatus: "COMPLETED" });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, pickupStatus: "COMPLETED" } : o))
      );
      toast.success(`Ordem ${order.orderNumber} marcada como Retirada!`);
    } catch (err) {
      toast.error("Erro ao atualizar status da ordem.");
    }
  };

  const handleDelete = async (order: PurchaseOrder) => {
    if (!window.confirm(`Deseja realmente excluir a Ordem de Compra ${order.orderNumber}?`)) {
      return;
    }
    try {
      await purchaseOrdersApi.delete(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      toast.success("Ordem de Compra excluída com sucesso!");
    } catch (err) {
      toast.error("Erro ao excluir Ordem de Compra.");
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (!o) return false;
      const term = (searchTerm || "").toLowerCase();
      const num = (o.orderNumber || "").toLowerCase();
      const sup = (o.supplierName || "").toLowerCase();
      const car = (o.carrierName || "").toLowerCase();
      const dest = (o.destination || "").toLowerCase();

      const matchesSearch =
        num.includes(term) || sup.includes(term) || car.includes(term) || dest.includes(term);

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      const st = o.pickupStatus || "PENDING";
      return st === statusFilter;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const totalPending = orders.filter((o) => (o.pickupStatus || "PENDING") === "PENDING").length;
  const totalCompleted = orders.filter((o) => o.pickupStatus === "COMPLETED").length;
  const totalAmountSum = orders.reduce(
    (acc, o) => acc + Number(o.totalAmount || o.value || 0),
    0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordens de Compra & Retiradas de Materiais"
        subtitle={`${filtered.length} autorizações emitidas para retirada de materiais e peças em fornecedores e lojas`}
        actions={
          <Button
            onClick={() => router.push("/purchase-orders/new")}
            className="rounded-xl font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Nova Ordem de Compra / Retirada
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard
          label="Total de Ordens Emitidas"
          value={orders.length}
          icon={ShoppingBag}
          variant="orange"
        />
        <StatusCard
          label="Aguardando Retirada"
          value={totalPending}
          icon={Clock}
          variant="amber"
        />
        <StatusCard
          label="Materiais Retirados"
          value={totalCompleted}
          icon={CheckCircle}
          variant="emerald"
        />
        <StatusCard
          label="Total Autorizado (R$)"
          value={formatCurrency(totalAmountSum)}
          icon={DollarSign}
          variant="blue"
        />
      </div>

      {/* Filtros e Busca */}
      <Card className="p-3 sm:p-3.5 rounded-xl border border-gray-200/75 bg-white shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Buscar por nº da OC, loja, portador ou destino..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-gray-200 w-full"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { key: "ALL", label: "Todas" },
              { key: "PENDING", label: "Aguardando Retirada" },
              { key: "COMPLETED", label: "Retiradas" },
              { key: "CANCELLED", label: "Canceladas" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  statusFilter === tab.key
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Tabela de Ordens de Compra */}
      <Card className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-gray-100">
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs">Nº OC</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs">Loja / Fornecedor</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs">Portador (Quem Retira)</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs">Destino / Aplicação</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs text-center">Itens</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs text-right">Valor Total</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs">Data Emissão</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs text-center">Status</TableHead>
                <TableHead className="py-3 px-4 font-bold text-gray-700 text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableEmpty
                  colSpan={9}
                  message="Nenhuma ordem de compra ou autorização de retirada encontrada."
                />
              ) : (
                paginatedOrders.map((o) => {
                  const itemsCount = Array.isArray(o.items) ? o.items.length : 0;
                  const total = Number(o.totalAmount || o.value || 0);
                  const isCompleted = o.pickupStatus === "COMPLETED";
                  const isCancelled = o.pickupStatus === "CANCELLED";

                  return (
                    <TableRow key={o.id} className="hover:bg-slate-50/70 transition-colors">
                      <TableCell className="py-3 px-4 font-black text-gray-900 text-xs whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => router.push(`/purchase-orders/${o.id}`)}
                          className="hover:text-orange-600 hover:underline text-left"
                        >
                          {o.orderNumber}
                        </button>
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="font-bold text-gray-900 text-xs truncate max-w-[180px]">
                            {o.supplierName}
                          </span>
                        </div>
                        {o.supplierPhone && (
                          <span className="text-[10.5px] text-gray-400 block truncate">
                            {o.supplierPhone}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserIcon className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span className="font-semibold text-gray-800 text-xs truncate max-w-[170px]">
                            {o.carrierName}
                          </span>
                        </div>
                        {o.carrierDoc && (
                          <span className="text-[10.5px] text-gray-400 block font-mono">
                            Doc: {o.carrierDoc}
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4">
                        <span className="text-xs text-gray-700 truncate max-w-[170px] block">
                          {o.destination || "Uso Geral"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center">
                        <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right font-bold text-gray-900 text-xs whitespace-nowrap">
                        {total > 0 ? formatCurrency(total) : "-"}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(o.issueDate)}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-center whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Retirado
                          </span>
                        ) : isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Aguardando Retirada
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botão de destaque: Visualizar Documento / Imprimir PDF */}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => router.push(`/purchase-orders/${o.id}`)}
                            className="h-7 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-[11px] gap-1 rounded-lg"
                            title="Visualizar documento oficial e emitir arquivo / PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-orange-600" />
                            Visualizar / PDF
                          </Button>

                          {!isCompleted && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleMarkAsCompleted(o)}
                              title="Marcar como material já retirado"
                              className="text-gray-400 hover:text-emerald-600 p-1 rounded"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => router.push(`/purchase-orders/${o.id}/edit`)}
                            title="Editar ordem de compra"
                            className="text-gray-400 hover:text-slate-700 p-1 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(o)}
                            title="Excluir ordem de compra"
                            className="text-gray-400 hover:text-red-500 p-1 rounded"
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
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        itemLabel="ordens de compra"
      />
    </Card>

      {/* Modal de Emissão e Impressão de Arquivo PDF */}
      <PurchaseOrderPrintModal
        order={selectedOrderForPrint}
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
      />
    </div>
  );
}
