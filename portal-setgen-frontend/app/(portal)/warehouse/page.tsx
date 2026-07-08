"use client";

import { useEffect, useState } from "react";
import { materialRequestsApi } from "@/lib/api/material-requests";
import { MaterialRequest, MaterialRequestStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import { PackageSearch, ChevronDown, ChevronUp, CheckCircle2, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const STATUS_LABELS: Record<MaterialRequestStatus, string> = {
  [MaterialRequestStatus.PENDING]: "Pendente",
  [MaterialRequestStatus.PARTIALLY_RESERVED]: "Parcialmente Reservado",
  [MaterialRequestStatus.SEPARATED]: "Separado",
  [MaterialRequestStatus.AWAITING_PURCHASE]: "Aguardando Compra",
  [MaterialRequestStatus.RELEASED]: "Liberado",
};

const STATUS_COLORS: Record<MaterialRequestStatus, string> = {
  [MaterialRequestStatus.PENDING]: "bg-muted text-foreground",
  [MaterialRequestStatus.PARTIALLY_RESERVED]: "bg-amber-50 text-amber-700",
  [MaterialRequestStatus.SEPARATED]: "bg-emerald-50 text-emerald-700",
  [MaterialRequestStatus.AWAITING_PURCHASE]: "bg-red-50 text-red-700",
  [MaterialRequestStatus.RELEASED]: "bg-blue-50 text-blue-700",
};

export default function WarehousePage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const data = await materialRequestsApi.getAll();
      setRequests(data);
    } catch (error) {
      console.error("Erro ao carregar mesa do almoxarife:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeparate = async (id: string) => {
    setActingId(id);
    try {
      const updated = await materialRequestsApi.separate(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao separar material");
    } finally {
      setActingId(null);
    }
  };

  const handleRelease = async (id: string) => {
    setActingId(id);
    try {
      const updated = await materialRequestsApi.release(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao liberar material");
    } finally {
      setActingId(null);
    }
  };

  const active = requests.filter((r) => r.status !== MaterialRequestStatus.RELEASED);

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
        title="Mesa do Almoxarife"
        subtitle={`${active.length} solicitações de material em aberto`}
      />

      <Card className="overflow-hidden divide-y divide-border">
        {active.length === 0 ? (
          <div className="p-10 text-center text-text-muted text-sm">
            Nenhuma solicitação de material pendente.
          </div>
        ) : (
          active.map((r) => {
            const expanded = expandedId === r.id;
            const missingItems = r.items.filter((i) => i.quantityReserved < i.quantityNeeded);
            return (
              <div key={r.id}>
                <div
                  className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-muted/40"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-[9px] flex items-center justify-center bg-orange-50 text-orange-700 shrink-0">
                      <PackageSearch className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-foreground truncate">
                        OS #{r.serviceOrder?.orderNumber} — {r.serviceOrder?.client?.companyName}
                      </div>
                      <div className="text-[11.5px] text-text-muted">
                        {r.items.length} item(ns) · criado em {formatDate(r.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    {r.status !== MaterialRequestStatus.SEPARATED && (
                      <Button
                        size="sm"
                        disabled={actingId === r.id}
                        onClick={(e) => { e.stopPropagation(); handleSeparate(r.id); }}
                        className="rounded-[8px] font-bold gap-1.5 h-8"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Separar
                      </Button>
                    )}
                    {r.status === MaterialRequestStatus.SEPARATED && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === r.id}
                        onClick={(e) => { e.stopPropagation(); handleRelease(r.id); }}
                        className="rounded-[8px] font-bold h-8"
                      >
                        Liberar p/ execução
                      </Button>
                    )}
                    {expanded ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
                  </div>
                </div>

                {expanded && (
                  <div className="px-5 pb-5 bg-muted/20">
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="text-left text-text-muted uppercase text-[10.5px] tracking-wider">
                          <th className="py-2">Produto</th>
                          <th className="py-2 text-right">Necessário</th>
                          <th className="py-2 text-right">Reservado</th>
                          <th className="py-2 text-right">Em estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.items.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="py-2 font-medium">{item.product?.name}</td>
                            <td className="py-2 text-right">{item.quantityNeeded} {item.product?.unit}</td>
                            <td className="py-2 text-right">{item.quantityReserved} {item.product?.unit}</td>
                            <td className="py-2 text-right text-text-muted">{item.product?.currentStock} {item.product?.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {missingItems.length > 0 && r.procurementOrders && r.procurementOrders.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 text-[12px] text-red-700">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Compra gerada automaticamente —
                        <Link href="/procurement" className="font-bold underline">ver painel de compras</Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
