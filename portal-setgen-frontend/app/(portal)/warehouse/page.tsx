"use client";

import { useEffect, useState } from "react";
import { materialRequestsApi } from "@/lib/api/material-requests";
import { MaterialRequest, MaterialRequestStatus } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  PackageSearch,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Search,
  Truck,
  ArrowRight,
  Check,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { toast } from "sonner";
import Link from "next/link";

const STATUS_LABELS: Record<MaterialRequestStatus, string> = {
  [MaterialRequestStatus.PENDING]: "Pendente de Separação",
  [MaterialRequestStatus.PARTIALLY_RESERVED]: "Parcialmente Reservado",
  [MaterialRequestStatus.SEPARATED]: "Separado (Pronto)",
  [MaterialRequestStatus.AWAITING_PURCHASE]: "Aguardando Compra",
  [MaterialRequestStatus.RELEASED]: "Liberado ao Técnico",
};

const STATUS_BADGES: Record<MaterialRequestStatus, { bg: string; text: string; border: string }> = {
  [MaterialRequestStatus.PENDING]: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  },
  [MaterialRequestStatus.PARTIALLY_RESERVED]: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  [MaterialRequestStatus.SEPARATED]: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  [MaterialRequestStatus.AWAITING_PURCHASE]: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  [MaterialRequestStatus.RELEASED]: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
};

export default function WarehousePage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await materialRequestsApi.getAll();
      setRequests(data);
    } catch (error) {
      console.error("Erro ao carregar mesa do almoxarife:", error);
      toast.error("Erro ao carregar solicitações de material.");
    } finally {
      setLoading(false);
    }
  };

  const handleSeparate = async (id: string, orderNumber?: string) => {
    setActingId(id);
    try {
      const updated = await materialRequestsApi.separate(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      if (updated.status === MaterialRequestStatus.AWAITING_PURCHASE) {
        toast.warning(`OS #${orderNumber || ""}: Estoque insuficiente. Cotação de compra gerada automaticamente!`);
      } else {
        toast.success(`OS #${orderNumber || ""}: Materiais separados e reservados com sucesso!`);
      }
    } catch (error: any) {
      console.error("Erro ao separar material:", error);
      toast.error(error.response?.data?.message || "Erro ao separar material.");
    } finally {
      setActingId(null);
    }
  };

  const handleRelease = async (id: string, orderNumber?: string) => {
    setActingId(id);
    try {
      const updated = await materialRequestsApi.release(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      toast.success(`OS #${orderNumber || ""}: Materiais liberados formalmente para a equipe técnica!`);
    } catch (error: any) {
      console.error("Erro ao liberar material:", error);
      toast.error(error.response?.data?.message || "Erro ao liberar material.");
    } finally {
      setActingId(null);
    }
  };

  // Contadores para os KPIs
  const totalCount = requests.length;
  const pendingCount = requests.filter(
    (r) => r.status === MaterialRequestStatus.PENDING || r.status === MaterialRequestStatus.PARTIALLY_RESERVED
  ).length;
  const awaitingPurchaseCount = requests.filter(
    (r) => r.status === MaterialRequestStatus.AWAITING_PURCHASE
  ).length;
  const separatedCount = requests.filter(
    (r) => r.status === MaterialRequestStatus.SEPARATED
  ).length;

  // Filtragem dos registros
  const filteredRequests = requests.filter((r) => {
    // Filtro por status
    if (statusFilter === "PENDING" && r.status !== MaterialRequestStatus.PENDING && r.status !== MaterialRequestStatus.PARTIALLY_RESERVED) return false;
    if (statusFilter === "AWAITING_PURCHASE" && r.status !== MaterialRequestStatus.AWAITING_PURCHASE) return false;
    if (statusFilter === "SEPARATED" && r.status !== MaterialRequestStatus.SEPARATED) return false;
    if (statusFilter === "RELEASED" && r.status !== MaterialRequestStatus.RELEASED) return false;

    // Filtro por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchOs = r.serviceOrder?.orderNumber?.toLowerCase().includes(term);
      const matchClient = r.serviceOrder?.client?.companyName?.toLowerCase().includes(term);
      const matchItems = r.items?.some((i) => i.product?.name?.toLowerCase().includes(term) || i.product?.code?.toLowerCase().includes(term));
      if (!matchOs && !matchClient && !matchItems) return false;
    }

    return true;
  });

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
        subtitle="Separação, reserva e liberação de materiais para Ordens de Serviço"
        actions={
          <div className="flex items-center gap-2.5">
            <Link href="/inventory">
              <Button variant="outline" className="rounded-[9px] font-bold gap-2 border-gray-200">
                Ver Saldo de Peças
              </Button>
            </Link>
            <Link href="/procurement">
              <Button variant="outline" className="rounded-[9px] font-bold gap-2 border-gray-200">
                <ShoppingCart className="h-4 w-4 text-[#E2661D]" />
                Painel de Compras
              </Button>
            </Link>
          </div>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard
          label="Total de Requisições"
          value={totalCount}
          icon={PackageSearch}
          variant="orange"
        />
        <StatusCard
          label="Pendentes de Separação"
          value={pendingCount}
          icon={Clock}
          variant="amber"
        />
        <StatusCard
          label="Aguardando Compra"
          value={awaitingPurchaseCount}
          icon={ShoppingCart}
          variant="red"
        />
        <StatusCard
          label="Separados (Prontos)"
          value={separatedCount}
          icon={CheckCircle2}
          variant="emerald"
        />
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="p-4 rounded-2xl border border-gray-200 space-y-3 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Pílulas de Status */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Todas", count: totalCount },
              { id: "PENDING", label: "A Separar", count: pendingCount },
              { id: "AWAITING_PURCHASE", label: "Em Falta / Compra", count: awaitingPurchaseCount },
              { id: "SEPARATED", label: "Prontas p/ Liberação", count: separatedCount },
              { id: "RELEASED", label: "Liberadas", count: requests.filter((r) => r.status === MaterialRequestStatus.RELEASED).length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "bg-[#E2661D] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por OS, cliente ou peça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-input rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#E2661D] bg-background"
            />
          </div>
        </div>
      </Card>

      {/* Lista de Solicitações */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <Card className="p-12 text-center rounded-2xl border border-gray-200 bg-white">
            <PackageSearch className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-gray-700">Nenhuma solicitação encontrada</h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Não há requisições de material correspondentes aos filtros selecionados.
            </p>
          </Card>
        ) : (
          filteredRequests.map((r) => {
            const expanded = expandedId === r.id;
            const badge = STATUS_BADGES[r.status];
            const missingItems = r.items.filter((i) => i.quantityReserved < i.quantityNeeded);
            const isSeparated = r.status === MaterialRequestStatus.SEPARATED;
            const isReleased = r.status === MaterialRequestStatus.RELEASED;

            return (
              <Card
                key={r.id}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:border-gray-300 transition-all"
              >
                {/* Linha Resumo / Header da Requisição */}
                <div
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 cursor-pointer select-none hover:bg-gray-50/50"
                  onClick={() => setExpandedId(expanded ? null : r.id)}
                >
                  <div className="flex items-start md:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-50 text-[#E2661D] shrink-0 border border-orange-100">
                      <PackageSearch className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/orders/${r.serviceOrder?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-black text-gray-900 hover:text-[#E2661D] transition-colors"
                        >
                          OS #{r.serviceOrder?.orderNumber}
                        </Link>
                        <span className="text-gray-300">•</span>
                        <span className="text-xs font-bold text-gray-700 truncate max-w-xs">
                          {r.serviceOrder?.client?.companyName || "Cliente não informado"}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>
                          {r.items.length} item(ns) previstos
                        </span>
                        <span>•</span>
                        <span>
                          Solicitado em {formatDate(r.createdAt)}
                        </span>
                        {missingItems.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-rose-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {missingItems.length} item(ns) em falta
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações e Badges */}
                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto" onClick={(e) => e.stopPropagation()}>
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>

                    {/* Botão de Separação */}
                    {!isSeparated && !isReleased && (
                      <Button
                        size="sm"
                        disabled={actingId === r.id}
                        onClick={() => handleSeparate(r.id, r.serviceOrder?.orderNumber)}
                        className="rounded-xl font-bold gap-1.5 h-8 text-xs bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {actingId === r.id ? "Separando..." : "Separar Material"}
                      </Button>
                    )}

                    {/* Botão de Liberação ao Técnico */}
                    {isSeparated && (
                      <Button
                        size="sm"
                        disabled={actingId === r.id}
                        onClick={() => handleRelease(r.id, r.serviceOrder?.orderNumber)}
                        className="rounded-xl font-bold gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        {actingId === r.id ? "Liberando..." : "Liberar p/ Execução"}
                      </Button>
                    )}

                    {isReleased && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                        <Check className="h-3 w-3" /> Entregue ao Técnico
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : r.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title={expanded ? "Recolher detalhes" : "Expandir itens"}
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Detalhamento dos Itens (Expandido) */}
                {expanded && (
                  <div className="px-5 pb-5 pt-2 bg-gray-50/70 border-t border-gray-100 space-y-3">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left text-gray-500 uppercase text-[10.5px] font-bold tracking-wider border-b border-gray-200">
                            <th className="py-2.5">Código</th>
                            <th className="py-2.5">Peça / Produto</th>
                            <th className="py-2.5 text-center">Localização</th>
                            <th className="py-2.5 text-right">Necessário</th>
                            <th className="py-2.5 text-right">Reservado</th>
                            <th className="py-2.5 text-right">Saldo Físico</th>
                            <th className="py-2.5 text-center">Situação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {r.items.map((item) => {
                            const hasEnough = (item.product?.currentStock || 0) >= (item.quantityNeeded - item.quantityReserved);
                            const isFullyReserved = item.quantityReserved >= item.quantityNeeded;

                            return (
                              <tr key={item.id} className="hover:bg-white/60">
                                <td className="py-2.5 font-mono text-gray-500 text-[11px]">
                                  {item.product?.code || "—"}
                                </td>
                                <td className="py-2.5 font-bold text-gray-800">
                                  {item.product?.name || "Peça não identificada"}
                                </td>
                                <td className="py-2.5 text-center text-gray-500">
                                  {item.product?.location?.code || "Galpão Principal"}
                                </td>
                                <td className="py-2.5 text-right font-black text-gray-900">
                                  {item.quantityNeeded} {item.product?.unit || "un"}
                                </td>
                                <td className="py-2.5 text-right font-bold text-emerald-600">
                                  {item.quantityReserved} {item.product?.unit || "un"}
                                </td>
                                <td className="py-2.5 text-right font-medium text-gray-600">
                                  {item.product?.currentStock} {item.product?.unit || "un"}
                                </td>
                                <td className="py-2.5 text-center">
                                  {isFullyReserved ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      Totalmente Reservado
                                    </span>
                                  ) : hasEnough ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                      Disponível no Físico
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      Estoque Insuficiente
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Alerta de Cotação de Compras Gerada Automaticamente */}
                    {missingItems.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-rose-800">
                          <ShoppingCart className="h-4 w-4 shrink-0 text-rose-600" />
                          <span>
                            <strong>Falta de Estoque Detectada:</strong> O sistema gera cotação/pedido em rascunho automaticamente para o setor de compras suprir as peças faltantes.
                          </span>
                        </div>
                        <Link href="/procurement">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs font-bold border-rose-300 text-rose-700 hover:bg-rose-100 rounded-lg gap-1 shrink-0"
                          >
                            Ir para Compras
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
    </div>
  );
}
