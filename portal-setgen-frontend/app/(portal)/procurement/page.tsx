"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import { ProcurementOrder, ProcurementOrderStatus, Supplier } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useCanViewValues } from "@/lib/permissions";
import {
  ShoppingCart,
  Truck,
  Clock,
  CheckCircle,
  Plus,
  Building,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  AlertCircle,
  Trash2,
  Send,
  Boxes,
  FileText,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusCard } from "@/components/ui/status-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { NewProcurementOrderModal } from "@/components/procurement/NewProcurementOrderModal";

const STATUS_LABELS: Record<ProcurementOrderStatus, string> = {
  [ProcurementOrderStatus.QUOTING]: "Em Cotação",
  [ProcurementOrderStatus.ORDER_ISSUED]: "Pedido Emitido",
  [ProcurementOrderStatus.AWAITING_DELIVERY]: "Aguardando Entrega",
  [ProcurementOrderStatus.RECEIVED]: "Recebido no Estoque",
  [ProcurementOrderStatus.CANCELLED]: "Cancelado",
};

const STATUS_BADGES: Record<
  ProcurementOrderStatus,
  { bg: string; text: string; border: string }
> = {
  [ProcurementOrderStatus.QUOTING]: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  [ProcurementOrderStatus.ORDER_ISSUED]: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  [ProcurementOrderStatus.AWAITING_DELIVERY]: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
  },
  [ProcurementOrderStatus.RECEIVED]: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  [ProcurementOrderStatus.CANCELLED]: {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export default function ProcurementPage() {
  const canViewValues = useCanViewValues();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal de novo pedido
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const initialProductId = searchParams.get("productId") || undefined;
  const initialQuantity = searchParams.get("qty") ? parseInt(searchParams.get("qty")!, 10) : undefined;
  const initialMaterialRequestId = searchParams.get("materialRequestId") || undefined;

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsNewModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ordersData, suppliersData] = await Promise.all([
        procurementOrdersApi.getAll(),
        suppliersApi.getAll(true),
      ]);
      setOrders(ordersData || []);
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error("Erro ao carregar pedidos de compra:", error);
      toast.error("Erro ao carregar dados de compras.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupplier = async (id: string, supplierId: string) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.update(id, { supplierId });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      toast.success("Fornecedor vinculado com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atribuir fornecedor.");
    } finally {
      setActingId(null);
    }
  };

  const handleIssue = async (id: string) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.updateStatus(
        id,
        ProcurementOrderStatus.ORDER_ISSUED
      );
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      toast.success("Pedido emitido formalmente ao fornecedor!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao emitir pedido.");
    } finally {
      setActingId(null);
    }
  };

  const handleAdvance = async (id: string, nextStatus: ProcurementOrderStatus) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.updateStatus(id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      if (nextStatus === ProcurementOrderStatus.RECEIVED) {
        toast.success(
          "Mercadorias recebidas! Saldo de estoque atualizado e materiais vinculados foram reservados automaticamente."
        );
      } else {
        toast.success("Status do pedido atualizado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atualizar status do pedido.");
    } finally {
      setActingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar e excluir este pedido de compra?")) return;
    setActingId(id);
    try {
      await procurementOrdersApi.delete(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("Pedido de compra removido com sucesso.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao remover pedido de compra.");
    } finally {
      setActingId(null);
    }
  };

  // KPIs
  const totalCount = orders.length;
  const quotingCount = orders.filter((o) => o.status === ProcurementOrderStatus.QUOTING).length;
  const awaitingDeliveryCount = orders.filter(
    (o) =>
      o.status === ProcurementOrderStatus.ORDER_ISSUED ||
      o.status === ProcurementOrderStatus.AWAITING_DELIVERY
  ).length;
  const receivedCount = orders.filter(
    (o) => o.status === ProcurementOrderStatus.RECEIVED
  ).length;

  // Filtragem
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status
      if (statusFilter !== "ALL" && o.status !== statusFilter) {
        return false;
      }

      // Busca
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSupplier = o.supplier?.name?.toLowerCase().includes(term);
        const matchOs = o.materialRequest?.serviceOrder?.orderNumber
          ?.toLowerCase()
          .includes(term);
        const matchItems = o.items?.some((i) =>
          i.product?.name?.toLowerCase().includes(term) ||
          i.product?.code?.toLowerCase().includes(term)
        );
        const matchId = o.id.toLowerCase().includes(term);

        if (!matchSupplier && !matchOs && !matchItems && !matchId) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compras & Suprimentos"
        subtitle="Cotação de peças, pedidos de compra a fornecedores e recebimento com entrada física em estoque"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/suppliers">
              <Button
                variant="outline"
                className="rounded-[9px] font-bold gap-2 border-gray-200"
              >
                <Building className="h-4 w-4 text-gray-500" />
                Fornecedores
              </Button>
            </Link>
            <Button
              onClick={() => setIsNewModalOpen(true)}
              className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Novo Pedido de Compra
            </Button>
          </div>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard
          label="Total de Pedidos"
          value={totalCount}
          icon={ShoppingCart}
          variant="orange"
        />
        <StatusCard
          label="Em Cotação"
          value={quotingCount}
          icon={Clock}
          variant="amber"
        />
        <StatusCard
          label="Aguardando Entrega"
          value={awaitingDeliveryCount}
          icon={Truck}
          variant="blue"
        />
        <StatusCard
          label="Recebidos no Estoque"
          value={receivedCount}
          icon={CheckCircle}
          variant="emerald"
        />
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="p-4 rounded-2xl border border-gray-200 space-y-3 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Pílulas de Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Todos", count: totalCount },
              {
                id: ProcurementOrderStatus.QUOTING,
                label: "Em Cotação",
                count: quotingCount,
              },
              {
                id: ProcurementOrderStatus.ORDER_ISSUED,
                label: "Pedido Emitido",
                count: orders.filter((o) => o.status === ProcurementOrderStatus.ORDER_ISSUED).length,
              },
              {
                id: ProcurementOrderStatus.AWAITING_DELIVERY,
                label: "Aguardando Entrega",
                count: orders.filter(
                  (o) => o.status === ProcurementOrderStatus.AWAITING_DELIVERY
                ).length,
              },
              {
                id: ProcurementOrderStatus.RECEIVED,
                label: "Recebidos / Estoque",
                count: receivedCount,
              },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-[#E2661D] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] ${
                      active
                        ? "bg-white/20 text-white"
                        : "bg-white text-gray-700 border border-gray-200"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por OS, fornecedor, peça ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#E2661D]/30"
            />
          </div>
        </div>
      </Card>

      {/* Lista de Pedidos */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border border-gray-200 bg-white">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-[#E2661D] flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              Nenhum pedido de compra encontrado
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Utilize o botão acima para criar uma nova cotação/pedido de compra ou ajuste os filtros.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => setIsNewModalOpen(true)}
                className="rounded-xl font-bold text-xs bg-[#E2661D] hover:bg-[#c95716] text-white gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Criar Primeiro Pedido
              </Button>
            </div>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const badge = STATUS_BADGES[order.status] || STATUS_BADGES.QUOTING;
            const expanded = expandedId === order.id;
            const totalOrder = order.items.reduce(
              (acc, it) => acc + it.quantity * Number(it.unitCost || 0),
              0
            );
            const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <Card
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:border-gray-300 transition-all"
              >
                {/* Linha Principal do Pedido */}
                <div
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 cursor-pointer select-none hover:bg-gray-50/50"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                >
                  <div className="flex items-start lg:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-[#E2661D] shrink-0 border border-orange-100">
                      <ShoppingCart className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.materialRequest?.serviceOrder ? (
                          <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-orange-50 text-[#E2661D] border border-orange-200 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            OS #{order.materialRequest.serviceOrder.orderNumber}
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 flex items-center gap-1">
                            <Boxes className="h-3 w-3" />
                            Reposição de Estoque
                          </span>
                        )}

                        <span className="text-gray-300">•</span>
                        <span className="text-sm font-bold text-gray-900 truncate">
                          {order.supplier?.name || "Fornecedor a Definir"}
                        </span>
                      </div>

                      <div className="text-[11.5px] text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                        <span>
                          Pedido emitido em {formatDate(order.createdAt)}
                        </span>
                        {order.expectedDeliveryDate && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-gray-700 font-medium">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              Entrega prevista: {formatDate(order.expectedDeliveryDate)}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {order.items.length} tipo(s) de item · {totalUnits} unidade(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges, Valores e Ações */}
                  <div
                    className="flex items-center gap-3 shrink-0 flex-wrap self-end lg:self-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Valor Total do Pedido */}
                    <div className="text-right pr-2">
                      <div className="text-[10.5px] text-gray-400 uppercase font-bold">
                        Valor do Pedido
                      </div>
                      <div className="text-sm font-black text-gray-900 font-mono">
                        {formatCurrency(totalOrder)}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>

                    {/* Ações contextuais de acordo com o Status */}
                    {order.status === ProcurementOrderStatus.QUOTING && (
                      <div className="flex items-center gap-2">
                        {!order.supplierId && (
                          <select
                            disabled={actingId === order.id}
                            value=""
                            onChange={(e) => handleAssignSupplier(order.id, e.target.value)}
                            className="text-xs h-8 px-2 rounded-xl border border-gray-200 bg-white"
                          >
                            <option value="">Definir fornecedor...</option>
                            {suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}

                        {order.supplierId && (
                          <Button
                            size="sm"
                            disabled={actingId === order.id}
                            onClick={() => handleIssue(order.id)}
                            className="h-8 text-xs font-bold rounded-xl bg-[#E2661D] hover:bg-[#c95716] text-white gap-1.5 shadow-xs"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Emitir Pedido
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actingId === order.id}
                          onClick={() => handleDelete(order.id)}
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                          title="Excluir Cotação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {order.status === ProcurementOrderStatus.ORDER_ISSUED && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === order.id}
                        onClick={() =>
                          handleAdvance(order.id, ProcurementOrderStatus.AWAITING_DELIVERY)
                        }
                        className="h-8 text-xs font-bold rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        Marcar a Caminho
                      </Button>
                    )}

                    {order.status === ProcurementOrderStatus.AWAITING_DELIVERY && (
                      <Button
                        size="sm"
                        disabled={actingId === order.id}
                        onClick={() =>
                          handleAdvance(order.id, ProcurementOrderStatus.RECEIVED)
                        }
                        className="h-8 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Confirmar Recebimento (Dar Entrada no Estoque)
                      </Button>
                    )}

                    {order.status === ProcurementOrderStatus.RECEIVED && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Entrada no Estoque Concluída
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : order.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors ml-1"
                      title={expanded ? "Recolher itens" : "Ver itens"}
                    >
                      {expanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Detalhes dos Itens do Pedido (Expandido) */}
                {expanded && (
                  <div className="px-5 pb-5 pt-2 bg-gray-50/70 border-t border-gray-100 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 uppercase text-[10.5px] font-bold tracking-wider border-b border-gray-200">
                            <th className="py-2.5">Código / SKU</th>
                            <th className="py-2.5">Descrição da Peça</th>
                            <th className="py-2.5 text-right">Quantidade</th>
                            <th className="py-2.5 text-right">Custo Unitário</th>
                            <th className="py-2.5 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {order.items.map((it) => (
                            <tr key={it.id} className="hover:bg-white/60">
                              <td className="py-2.5 font-mono text-gray-500 text-[11px]">
                                {it.product?.code || "—"}
                              </td>
                              <td className="py-2.5 font-bold text-gray-800">
                                {it.product?.name || "Produto não identificado"}
                              </td>
                              <td className="py-2.5 text-right font-black text-gray-900">
                                {it.quantity} {it.product?.unit || "un"}
                              </td>
                              <td className="py-2.5 text-right font-mono text-gray-600">
                                {formatCurrency(Number(it.unitCost || 0))}
                              </td>
                              <td className="py-2.5 text-right font-bold text-gray-900 font-mono">
                                {formatCurrency(it.quantity * Number(it.unitCost || 0))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Vínculo com OS */}
                    {order.materialRequest?.serviceOrder && (
                      <div className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Package className="h-4 w-4 text-[#E2661D]" />
                          <span>
                            Pedido originado para suprir peças faltantes da{" "}
                            <strong>OS #{order.materialRequest.serviceOrder.orderNumber}</strong>.
                          </span>
                        </div>
                        <Link href={`/orders/${order.materialRequest.serviceOrder.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold text-[#E2661D] hover:bg-orange-50 gap-1"
                          >
                            Abrir Ordem de Serviço
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Criação de Pedido */}
      <NewProcurementOrderModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          if (searchParams.get("new")) {
            router.replace("/procurement");
          }
        }}
        onSuccess={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          toast.success("Pedido de compra criado com sucesso!");
        }}
        initialProductId={initialProductId}
        initialQuantity={initialQuantity}
        initialMaterialRequestId={initialMaterialRequestId}
      />
    </div>
  );
}
