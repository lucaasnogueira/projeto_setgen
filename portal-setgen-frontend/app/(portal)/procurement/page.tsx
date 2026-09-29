"use client";

import { useEffect, useState } from "react";
import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import { ProcurementOrder, ProcurementOrderStatus, Supplier } from "@/types";
import { formatDate } from "@/lib/utils";
import { ShoppingCart, Truck, Clock, CheckCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusCard } from "@/components/ui/status-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STATUS_LABELS: Record<ProcurementOrderStatus, string> = {
  [ProcurementOrderStatus.QUOTING]: "Em Cotação",
  [ProcurementOrderStatus.ORDER_ISSUED]: "Pedido Emitido",
  [ProcurementOrderStatus.AWAITING_DELIVERY]: "Aguardando Entrega",
  [ProcurementOrderStatus.RECEIVED]: "Recebido",
  [ProcurementOrderStatus.CANCELLED]: "Cancelado",
};

const STATUS_COLORS: Record<ProcurementOrderStatus, string> = {
  [ProcurementOrderStatus.QUOTING]: "bg-muted text-foreground",
  [ProcurementOrderStatus.ORDER_ISSUED]: "bg-blue-50 text-blue-700",
  [ProcurementOrderStatus.AWAITING_DELIVERY]: "bg-amber-50 text-amber-700",
  [ProcurementOrderStatus.RECEIVED]: "bg-emerald-50 text-emerald-700",
  [ProcurementOrderStatus.CANCELLED]: "bg-red-50 text-red-700",
};

const NEXT_STATUS: Partial<Record<ProcurementOrderStatus, { status: ProcurementOrderStatus; label: string }>> = {
  [ProcurementOrderStatus.ORDER_ISSUED]: { status: ProcurementOrderStatus.AWAITING_DELIVERY, label: "Marcar aguardando entrega" },
  [ProcurementOrderStatus.AWAITING_DELIVERY]: { status: ProcurementOrderStatus.RECEIVED, label: "Confirmar recebimento" },
};

export default function ProcurementPage() {
  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [ordersData, suppliersData] = await Promise.all([
        procurementOrdersApi.getAll(),
        suppliersApi.getAll(true),
      ]);
      setOrders(ordersData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error("Erro ao carregar painel de compras:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupplier = async (id: string, supplierId: string) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.update(id, { supplierId });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atribuir fornecedor");
    } finally {
      setActingId(null);
    }
  };

  const handleIssue = async (id: string) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.updateStatus(id, ProcurementOrderStatus.ORDER_ISSUED);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao emitir pedido");
    } finally {
      setActingId(null);
    }
  };

  const handleAdvance = async (id: string, status: ProcurementOrderStatus) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao atualizar status");
    } finally {
      setActingId(null);
    }
  };

  const open = orders.filter((o) => o.status !== ProcurementOrderStatus.CANCELLED);

  const totalQuoting = orders.filter(o => o.status === ProcurementOrderStatus.QUOTING).length;
  const totalAwaiting = orders.filter(o => o.status === ProcurementOrderStatus.AWAITING_DELIVERY || o.status === ProcurementOrderStatus.ORDER_ISSUED).length;
  const totalReceived = orders.filter(o => o.status === ProcurementOrderStatus.RECEIVED).length;

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
        subtitle={`${open.length} pedidos de compras de insumos para ordens técnicas`}
        actions={
          <Link href="/suppliers/new">
            <Button className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white">
              <Plus className="h-4 w-4" />
              Novo Fornecedor
            </Button>
          </Link>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Pedidos" value={orders.length} icon={ShoppingCart} variant="orange" />
        <StatusCard label="Em Cotação" value={totalQuoting} icon={Clock} variant="amber" />
        <StatusCard label="Aguardando Entrega" value={totalAwaiting} icon={Truck} variant="blue" />
        <StatusCard label="Recebidos / Estoque" value={totalReceived} icon={CheckCircle} variant="emerald" />
      </div>

      <Card className="overflow-hidden divide-y divide-border">
        {open.length === 0 ? (
          <div className="p-10 text-center text-text-muted text-sm">
            Nenhum pedido de compra em aberto.
          </div>
        ) : (
          open.map((order) => {
            const next = NEXT_STATUS[order.status];
            const total = order.items.reduce((acc, i) => acc + i.quantity * Number(i.unitCost), 0);
            return (
              <div key={order.id} className="px-5 py-4 hover:bg-gray-50/40 transition-colors">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center bg-orange-50 text-[#E2661D] font-bold shrink-0">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-foreground truncate">
                        {order.materialRequest?.serviceOrder ? `OS #${order.materialRequest.serviceOrder.orderNumber}` : "Pedido avulso"}
                      </div>
                      <div className="text-[11.5px] text-text-muted">
                        Criado em {formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? "item" : "itens"} · R$ {total.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>

                    {/* Atribuir fornecedor */}
                    {order.status === ProcurementOrderStatus.QUOTING && (
                      <select
                        aria-label="Selecionar fornecedor"
                        disabled={actingId === order.id}
                        value={order.supplierId || ""}
                        onChange={(e) => handleAssignSupplier(order.id, e.target.value)}
                        className="text-[12px] h-8 px-2 rounded-[8px] border border-border bg-background"
                      >
                        <option value="">Selecione fornecedor...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    )}

                    {/* Emitir pedido */}
                    {order.status === ProcurementOrderStatus.QUOTING && order.supplierId && (
                      <Button
                        size="sm"
                        disabled={actingId === order.id}
                        onClick={() => handleIssue(order.id)}
                        className="h-8 text-[12px] rounded-[8px] bg-[#E2661D] hover:bg-[#c95716] text-white"
                      >
                        Emitir Pedido
                      </Button>
                    )}

                    {/* Próximo passo */}
                    {next && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === order.id}
                        onClick={() => handleAdvance(order.id, next.status)}
                        className="h-8 text-[12px] rounded-[8px]"
                      >
                        {next.label}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Itens */}
                <div className="mt-3 pl-12 space-y-1">
                  {order.items.map((it) => (
                    <div key={it.id} className="text-[12px] text-text-secondary flex justify-between max-w-md">
                      <span>{it.quantity}x {it.product?.name || "Produto"}</span>
                      <span className="font-mono text-text-muted">R$ {(it.quantity * Number(it.unitCost)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
