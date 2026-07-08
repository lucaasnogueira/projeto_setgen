"use client";

import { useEffect, useState } from "react";
import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import { ProcurementOrder, ProcurementOrderStatus, Supplier } from "@/types";
import { formatDate } from "@/lib/utils";
import { ShoppingCart, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Compras"
        subtitle={`${open.length} pedidos de compra`}
        actions={
          <Link href="/suppliers/new">
            <Button variant="outline" className="rounded-[9px] font-bold gap-2">
              Novo Fornecedor
            </Button>
          </Link>
        }
      />

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
              <div key={order.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center bg-blue-50 text-blue-700 shrink-0">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-foreground truncate">
                        {order.materialRequest?.serviceOrder ? `OS #${order.materialRequest.serviceOrder.orderNumber}` : "Pedido avulso"}
                      </div>
                      <div className="text-[11.5px] text-text-muted">
                        {order.items.length} item(ns) · {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · criado em {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 flex-wrap pl-12">
                  {order.status === ProcurementOrderStatus.QUOTING && (
                    <>
                      <select
                        value={order.supplierId || ""}
                        onChange={(e) => handleAssignSupplier(order.id, e.target.value)}
                        className="h-9 px-3 rounded-[8px] border border-border text-[12.5px] bg-background"
                      >
                        <option value="">Selecione o fornecedor...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        disabled={!order.supplierId || actingId === order.id}
                        onClick={() => handleIssue(order.id)}
                        className="rounded-[8px] font-bold h-9"
                      >
                        Emitir Pedido
                      </Button>
                    </>
                  )}

                  {next && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === order.id}
                      onClick={() => handleAdvance(order.id, next.status)}
                      className="rounded-[8px] font-bold h-9 gap-1.5"
                    >
                      <Truck className="h-3.5 w-3.5" />
                      {next.label}
                    </Button>
                  )}

                  {order.supplier && (
                    <span className="text-[12px] text-text-muted">Fornecedor: <strong className="text-foreground">{order.supplier.name}</strong></span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
