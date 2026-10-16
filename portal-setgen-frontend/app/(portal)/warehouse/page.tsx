"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { materialRequestsApi } from "@/lib/api/material-requests";
import { inventoryApi } from "@/lib/api/inventory";
import { MaterialRequest, MaterialRequestStatus, MaterialRequestItem } from "@/types";
import { formatDate } from "@/lib/utils";
import {
  PackageSearch,
  CheckCircle2,
  ShoppingCart,
  Clock,
  AlertTriangle,
  Search,
  Truck,
  ArrowRight,
  Check,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  Box,
  ChevronRight,
  ShieldAlert,
  Send,
  X,
  Sparkles,
  Info,
  Boxes,
  Barcode,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ReceiveMaterialModal } from "@/components/procurement/ReceiveMaterialModal";
import { TablePagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const STATUS_LABELS: Record<MaterialRequestStatus, string> = {
  [MaterialRequestStatus.PENDING]: "Aguardando Separação",
  [MaterialRequestStatus.PARTIALLY_RESERVED]: "Parcialmente Reservado",
  [MaterialRequestStatus.AWAITING_PURCHASE]: "Falta Peça / Solicitado ao Admin",
  [MaterialRequestStatus.SEPARATED]: "100% Separado (Pronto p/ Retirada)",
  [MaterialRequestStatus.RELEASED]: "Liberado ao Técnico",
};

const STATUS_BADGES: Record<
  MaterialRequestStatus,
  { bg: string; text: string; border: string; icon: any }
> = {
  [MaterialRequestStatus.PENDING]: {
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: Clock,
  },
  [MaterialRequestStatus.PARTIALLY_RESERVED]: {
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: AlertTriangle,
  },
  [MaterialRequestStatus.AWAITING_PURCHASE]: {
    bg: "bg-rose-50 text-rose-800 border-rose-200",
    text: "text-rose-800",
    border: "border-rose-200",
    icon: ShoppingCart,
  },
  [MaterialRequestStatus.SEPARATED]: {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: CheckCircle2,
  },
  [MaterialRequestStatus.RELEASED]: {
    bg: "bg-blue-50 text-blue-800 border-blue-200",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: Truck,
  },
};

export default function WarehousePage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [isPickingModalOpen, setIsPickingModalOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [purchaseNote, setPurchaseNote] = useState<string>("");
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);

  useEffect(() => {
    loadRequests();

    // Auto-refresh a cada 10 segundos na mesa do almoxarife
    const interval = setInterval(() => {
      loadRequests(false);
    }, 10000);

    // Atualiza imediatamente quando a janela/aba volta a ter foco
    const handleFocus = () => loadRequests(false);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const loadRequests = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else if (!requests.length) setLoading(true);

    try {
      const [data, lowStock] = await Promise.all([
        materialRequestsApi.getAll(),
        inventoryApi.getLowStock(),
      ]);
      setRequests(data || []);
      setLowStockCount(lowStock?.length || 0);
      if (isManual) toast.success("Fila de materiais atualizada");
    } catch (error) {
      console.error("Erro ao carregar mesa do almoxarife:", error);
      if (isManual) toast.error("Erro ao carregar solicitações de material.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Separação / Reserva de materiais disponíveis
  const handleSeparateAndReserve = async (request: MaterialRequest) => {
    setActingId(request.id);
    try {
      const updated = await materialRequestsApi.separate(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, ...updated } : r)));

      if (updated.status === MaterialRequestStatus.AWAITING_PURCHASE) {
        toast.warning(
          `OS #${request.serviceOrder?.orderNumber}: Estoque insuficiente. Solicitação de compra enviada ao Administrador!`
        );
      } else {
        toast.success(
          `OS #${request.serviceOrder?.orderNumber}: Todos os materiais foram separados e reservados no galpão!`
        );
      }
      setIsPickingModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao separar material:", error);
      toast.error(error.response?.data?.message || "Erro ao separar material.");
    } finally {
      setActingId(null);
    }
  };

  // Liberação final para o técnico
  const handleReleaseToTechnician = async (request: MaterialRequest) => {
    setActingId(request.id);
    try {
      const updated = await materialRequestsApi.release(request.id);
      setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, ...updated } : r)));
      toast.success(
        `OS #${request.serviceOrder?.orderNumber}: Materiais entregues e liberados para a equipe técnica!`
      );
      setIsPickingModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao liberar material:", error);
      toast.error(error.response?.data?.message || "Erro ao liberar material.");
    } finally {
      setActingId(null);
    }
  };

  // Diagnóstico de estoque para uma requisição
  const getRequestDiagnosis = (req: MaterialRequest) => {
    const items = req.items || [];
    let totalItems = items.length;
    let fullyReserved = 0;
    let availableInStock = 0;
    let missingItems: Array<{ item: MaterialRequestItem; missingQty: number }> = [];

    items.forEach((i) => {
      const needed = Number(i.quantityNeeded) || 0;
      const reserved = Number(i.quantityReserved) || 0;
      const stock = Number(i.product?.currentStock) || 0;

      if (reserved >= needed) {
        fullyReserved++;
      } else {
        const stillNeeded = needed - reserved;
        if (stock >= stillNeeded) {
          availableInStock++;
        } else {
          missingItems.push({
            item: i,
            missingQty: Math.max(0, stillNeeded - stock),
          });
        }
      }
    });

    const isAllReserved = totalItems > 0 && fullyReserved === totalItems;
    const canFulfillNow = missingItems.length === 0;

    return {
      totalItems,
      fullyReserved,
      availableInStock,
      missingItems,
      isAllReserved,
      canFulfillNow,
    };
  };

  // Contadores KPIs
  const totalCount = requests.length;
  const pendingCount = requests.filter(
    (r) =>
      r.status === MaterialRequestStatus.PENDING ||
      r.status === MaterialRequestStatus.PARTIALLY_RESERVED
  ).length;
  const awaitingPurchaseCount = requests.filter(
    (r) => r.status === MaterialRequestStatus.AWAITING_PURCHASE
  ).length;
  const separatedCount = requests.filter(
    (r) => r.status === MaterialRequestStatus.SEPARATED
  ).length;
  const releasedCount = requests.filter(
    (r) => r.status === MaterialRequestStatus.RELEASED
  ).length;

  // Filtragem da lista
  const filteredRequests = (requests || []).filter((r) => {
    if (!r) return false;

    if (activeTab === "PENDING" && r.status !== MaterialRequestStatus.PENDING && r.status !== MaterialRequestStatus.PARTIALLY_RESERVED) return false;
    if (activeTab === "AWAITING_PURCHASE" && r.status !== MaterialRequestStatus.AWAITING_PURCHASE) return false;
    if (activeTab === "SEPARATED" && r.status !== MaterialRequestStatus.SEPARATED) return false;
    if (activeTab === "RELEASED" && r.status !== MaterialRequestStatus.RELEASED) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchOs = (r.serviceOrder?.orderNumber || "").toLowerCase().includes(term);
      const matchClient = (
        r.serviceOrder?.client?.tradeName ||
        r.serviceOrder?.client?.companyName ||
        ""
      ).toLowerCase().includes(term);
      const matchEquip = (r.serviceOrder?.equipment?.model || "").toLowerCase().includes(term);
      const reqItems = Array.isArray(r.items) ? r.items : [];
      const matchItems = reqItems.some(
        (i) =>
          (i?.product?.name || "").toLowerCase().includes(term) ||
          (i?.product?.code || "").toLowerCase().includes(term)
      );
      if (!matchOs && !matchClient && !matchEquip && !matchItems) return false;
    }

    return true;
  });

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Mesa do Almoxarife"
          subtitle="Triagem de materiais, picking e conferência física para Ordens de Serviço aprovadas"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => setIsReceiveModalOpen(true)}
            className="h-9 px-3.5 rounded-lg font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          >
            <Barcode className="h-4 w-4" />
            <span>Receber Material (Bipar NF)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRequests(true)}
            disabled={refreshing}
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 border-border"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Atualizar</span>
          </Button>

          <Link href="/inventory">
            <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-semibold gap-1.5 border-border">
              <Box className="h-4 w-4 text-primary" />
              <span>Saldo de Estoque</span>
            </Button>
          </Link>

          <Link href="/procurement">
            <Button size="sm" className="h-9 rounded-lg font-bold gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-xs">
              <ShoppingCart className="h-4 w-4" />
              <span>Painel de Compras</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* GUIA DO FLUXO (ESTEIRA VISUAL) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
            1
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Orçamento Aprovado</p>
            <p className="text-[11px] text-muted-foreground">OS gerada cai na triagem</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shrink-0">
            2
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Conferência no Galpão</p>
            <p className="text-[11px] text-muted-foreground">Almoxarife checa saldo</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Falta? Solicita ao Admin</p>
            <p className="text-[11px] text-muted-foreground">Admin inicia compras</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
            4
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Separação & Liberação</p>
            <p className="text-[11px] text-muted-foreground">Técnico retira peças</p>
          </div>
        </div>
      </div>

      {/* KPIS DE TRIAGEM */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
        <StatusCard
          label="Aguardando Separação"
          value={pendingCount}
          icon={Clock}
          variant="amber"
        />
        <StatusCard
          label="Falta Peça (Em Compra)"
          value={awaitingPurchaseCount}
          icon={ShoppingCart}
          variant="red"
        />
        <StatusCard
          label="100% Separado (No Box)"
          value={separatedCount}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatusCard
          label="Entregue ao Técnico"
          value={releasedCount}
          icon={Truck}
          variant="blue"
        />
      </div>

      {/* Alerta de Estoque Baixo para o Almoxarife */}
      {lowStockCount > 0 && (
        <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">
                Atenção: {lowStockCount} produto(s) com estoque baixo ou zerado no almoxarifado
              </p>
              <p className="text-[11px] text-amber-800">
                Verifique os itens em nível crítico e solicite reposição antecipada antes de novas ordens de serviço.
              </p>
            </div>
          </div>
          <Link href="/procurement">
            <Button
              size="sm"
              className="h-8 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-lg gap-1.5 shrink-0 shadow-xs"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Repor no Painel de Compras
            </Button>
          </Link>
        </div>
      )}

      {/* BARRA DE FILTROS & BUSCA */}
      <Card className="p-4 border-border shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs por Fase do Processo */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Todas as OSs", count: totalCount },
              { id: "PENDING", label: "A Separar (Triagem)", count: pendingCount },
              { id: "AWAITING_PURCHASE", label: "Falta Peça / Compras", count: awaitingPurchaseCount },
              { id: "SEPARATED", label: "Prontas no Box", count: separatedCount },
              { id: "RELEASED", label: "Liberadas ao Técnico", count: releasedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Busca Rápida */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por OS, cliente, equipamento ou peça..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 border border-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/25 bg-background text-foreground"
            />
          </div>
        </div>
      </Card>

      {/* LISTAGEM DE REQUISIÇÕES (CARDS INTELIGENTES) */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <Card className="p-6 text-center border-gray-200/80 shadow-2xs rounded-xl bg-white space-y-2">
            <PackageSearch className="h-8 w-8 text-muted-foreground/40 mx-auto mb-1" />
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Nenhuma requisição nesta etapa</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Não há ordens de serviço pendentes correspondentes ao filtro selecionado.
            </p>
          </Card>
        ) : (
          paginatedRequests.map((r) => {
            const diagnosis = getRequestDiagnosis(r);
            const badge = STATUS_BADGES[r.status] || STATUS_BADGES[MaterialRequestStatus.PENDING];
            const StatusIcon = badge.icon;
            const statusLabel = STATUS_LABELS[r.status] || r.status;
            const clientName =
              r.serviceOrder?.client?.tradeName ||
              r.serviceOrder?.client?.companyName ||
              "Cliente não identificado";
            const equipModel = r.serviceOrder?.equipment?.model || null;

            return (
              <Card
                key={r.id}
                className="p-5 border-border shadow-xs hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Lado Esquerdo: Identificação da OS e Diagnóstico */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-black text-foreground">
                      OS #{r.serviceOrder?.orderNumber || "S/N"}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs font-bold text-foreground truncate max-w-sm">
                      {clientName}
                    </span>
                    {equipModel && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-xs font-semibold text-muted-foreground truncate">
                          {equipModel}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Layers className="h-3.5 w-3.5 text-primary" />
                      {diagnosis.totalItems} peça(s) prevista(s)
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      OS gerada em {formatDate(r.createdAt)}
                    </span>
                    {r.serviceOrder?.deadline && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-700 font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          Prazo: {new Date(r.serviceOrder.deadline).toLocaleDateString("pt-BR")}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Barra de Diagnóstico de Estoque */}
                  <div className="pt-1">
                    {r.status === MaterialRequestStatus.RELEASED ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700">
                        <Check className="h-3.5 w-3.5" />
                        Materiais entregues e em posse da equipe técnica
                      </span>
                    ) : r.status === MaterialRequestStatus.SEPARATED ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        100% dos materiais separados e reservados no box da OS
                      </span>
                    ) : diagnosis.missingItems.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <AlertCircle className="h-3 w-3" />
                          {diagnosis.missingItems.length} peça(s) em falta no galpão
                        </span>
                        {r.status === MaterialRequestStatus.AWAITING_PURCHASE ? (
                          <span className="text-[11px] font-semibold text-rose-700">
                            → Compra solicitada ao Administrador (Pedido de Compras gerado)
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700">
                            → Necessário separar disponíveis e solicitar compra ao Admin
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Todos os {diagnosis.totalItems} itens com saldo físico disponível no galpão
                      </span>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Status & Botão de Conferência */}
                <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {statusLabel}
                  </span>

                  <Button
                    onClick={() => {
                      setSelectedRequest(r);
                      setIsPickingModalOpen(true);
                    }}
                    className={`h-9 px-3.5 rounded-lg text-xs font-bold gap-1.5 shadow-xs ${
                      r.status === MaterialRequestStatus.SEPARATED
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : diagnosis.canFulfillNow && r.status === MaterialRequestStatus.AWAITING_PURCHASE
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                        : r.status === MaterialRequestStatus.AWAITING_PURCHASE
                        ? "bg-slate-800 hover:bg-slate-900 text-white"
                        : "bg-primary hover:bg-primary/90 text-white"
                    }`}
                  >
                    <span>
                      {r.status === MaterialRequestStatus.SEPARATED
                        ? "Liberar p/ Técnico"
                        : diagnosis.canFulfillNow && r.status === MaterialRequestStatus.AWAITING_PURCHASE
                        ? "Chegou! Separar Agora"
                        : r.status === MaterialRequestStatus.AWAITING_PURCHASE
                        ? "Ver Solicitação de Compra"
                        : "Conferir Materiais"}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}

        <Card className="rounded-xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredRequests.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="requisições de materiais"
          />
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CONFERÊNCIA & PICKING DE MATERIAIS */}
      {/* ========================================================================= */}
      <Dialog open={isPickingModalOpen} onOpenChange={setIsPickingModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-xl border-gray-200 shadow-xl">
          {selectedRequest && (() => {
            const diagnosis = getRequestDiagnosis(selectedRequest);
            const reqItems = selectedRequest.items || [];
            const isSeparated = selectedRequest.status === MaterialRequestStatus.SEPARATED;
            const isReleased = selectedRequest.status === MaterialRequestStatus.RELEASED;
            const isAwaitingPurchase = selectedRequest.status === MaterialRequestStatus.AWAITING_PURCHASE;

            return (
              <div className="flex flex-col max-h-[85vh]">
                {/* Header do Modal */}
                <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DialogTitle className="text-lg font-black text-foreground">
                          Conferência & Separação — OS #{selectedRequest.serviceOrder?.orderNumber}
                        </DialogTitle>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold border ${
                            STATUS_BADGES[selectedRequest.status]?.bg
                          }`}
                        >
                          {STATUS_LABELS[selectedRequest.status]}
                        </span>
                      </div>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Cliente:{" "}
                        <strong className="text-foreground">
                          {selectedRequest.serviceOrder?.client?.tradeName ||
                            selectedRequest.serviceOrder?.client?.companyName}
                        </strong>{" "}
                        {selectedRequest.serviceOrder?.equipment?.model && (
                          <>
                            • Equipamento:{" "}
                            <strong className="text-foreground">
                              {selectedRequest.serviceOrder.equipment.model}
                            </strong>
                          </>
                        )}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Conteúdo: Lista de Peças e Localização Física */}
                <div className="p-6 space-y-5 overflow-y-auto flex-1">
                  {/* Quadro de Diagnóstico Geral */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">Itens da OS</p>
                      <p className="text-xl font-black text-foreground">{diagnosis.totalItems} peças</p>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">Saldo Disponível</p>
                      <p className="text-xl font-black text-emerald-600">
                        {diagnosis.totalItems - diagnosis.missingItems.length} peças
                      </p>
                    </div>
                    <div className="p-3 rounded-xl border border-border bg-card">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">Falta em Estoque</p>
                      <p
                        className={`text-xl font-black ${
                          diagnosis.missingItems.length > 0 ? "text-rose-600" : "text-foreground"
                        }`}
                      >
                        {diagnosis.missingItems.length} peças
                      </p>
                    </div>
                  </div>

                  {/* Tabela de Picking (Conferência no Galpão) */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Checklist de Materiais & Localização no Galpão
                    </h4>

                    <div className="border border-border rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/60 text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border">
                          <tr>
                            <th className="py-2.5 px-3">Código</th>
                            <th className="py-2.5 px-3">Descrição da Peça</th>
                            <th className="py-2.5 px-3 text-center">Local no Galpão</th>
                            <th className="py-2.5 px-3 text-right">Necessário</th>
                            <th className="py-2.5 px-3 text-right">Reservado</th>
                            <th className="py-2.5 px-3 text-right">Saldo Físico</th>
                            <th className="py-2.5 px-3 text-center">Diagnóstico</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reqItems.map((item) => {
                            const needed = Number(item.quantityNeeded) || 0;
                            const reserved = Number(item.quantityReserved) || 0;
                            const currentStock = Number(item.product?.currentStock) || 0;
                            const isFullyReserved = reserved >= needed;
                            const stillMissing = needed - reserved;
                            const hasEnough = currentStock >= stillMissing;

                            return (
                              <tr key={item.id} className="hover:bg-muted/20">
                                <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                  {item.product?.code || "—"}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-foreground">
                                      {item.product?.name || "Produto não identificado"}
                                    </span>
                                    {item.billingType === "INCLUDED_IN_SERVICE" ? (
                                      <span className="text-[9.5px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
                                        Insumo de Serviço
                                      </span>
                                    ) : (
                                      <span className="text-[9.5px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                                        Venda de Peça
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[10.5px] font-semibold text-foreground">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    {item.product?.location?.code || "Galpão Principal"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-foreground">
                                  {needed} {item.product?.unit || "un"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                                  {reserved} {item.product?.unit || "un"}
                                </td>
                                <td className="py-2.5 px-3 text-right font-semibold text-muted-foreground">
                                  {currentStock} {item.product?.unit || "un"}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {isFullyReserved ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      ✓ 100% Reservado
                                    </span>
                                  ) : hasEnough ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                      ✓ Disponível no Físico
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                      Faltam {stillMissing - currentStock} un
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* CAIXA DE AÇÃO CONTEXTUAL */}
                  {isReleased ? (
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 flex items-center gap-3">
                      <Truck className="h-5 w-5 text-blue-600 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold">Materiais já entregues</p>
                        <p className="text-blue-700">Esta requisição foi totalmente liberada para a execução da OS.</p>
                      </div>
                    </div>
                  ) : isSeparated ? (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold">Tudo pronto no galpão!</p>
                          <p className="text-emerald-700">
                            Todas as peças estão reservadas no box da OS. Clique abaixo para liberar a retirada pelo técnico.
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleReleaseToTechnician(selectedRequest)}
                        disabled={actingId === selectedRequest.id}
                        className="rounded-lg font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                      >
                        <Truck className="h-4 w-4" />
                        <span>{actingId === selectedRequest.id ? "Liberando..." : "Liberar ao Técnico"}</span>
                      </Button>
                    </div>
                  ) : diagnosis.missingItems.length > 0 ? (
                    <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-950 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-rose-900">
                            Peças em falta no estoque físico ({diagnosis.missingItems.length} itens)
                          </p>
                          <p className="text-rose-800">
                            Para dar continuidade, o almoxarife deve acionar o Administrador/Compras. O almoxarifado
                            solicita apenas a quantidade física das peças faltantes; a cotação de preços e escolha
                            do fornecedor são de responsabilidade do time Administrativo.
                          </p>
                        </div>
                      </div>

                      {/* Lista resumida das faltas */}
                      <div className="bg-white/80 p-3 rounded-lg border border-rose-200 text-xs space-y-1">
                        <p className="font-bold text-rose-900 mb-1">Peças a solicitar compra:</p>
                        {diagnosis.missingItems.map(({ item, missingQty }) => (
                          <div key={item.id} className="flex justify-between text-rose-800">
                            <span>• {item.product?.name} ({item.product?.code})</span>
                            <span className="font-bold">Comprar: {missingQty} {item.product?.unit || "un"}</span>
                          </div>
                        ))}
                      </div>

                      {/* Ação de Solicitar ao Admin ou Separar se já chegou */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                        {diagnosis.canFulfillNow ? (
                          <Button
                            onClick={() => handleSeparateAndReserve(selectedRequest)}
                            disabled={actingId === selectedRequest.id}
                            className="w-full sm:w-auto font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>
                              {actingId === selectedRequest.id
                                ? "Separando..."
                                : "Peças Chegaram no Estoque! Confirmar Separação"}
                            </span>
                          </Button>
                        ) : isAwaitingPurchase ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-rose-800">
                              ✓ Compra já solicitada ao Admin
                            </span>
                            <Link href="/procurement">
                              <Button size="sm" variant="outline" className="h-8 text-xs font-bold border-rose-300 text-rose-800">
                                Acompanhar em Compras
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleSeparateAndReserve(selectedRequest)}
                            disabled={actingId === selectedRequest.id}
                            className="w-full sm:w-auto font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-xs"
                          >
                            <Send className="h-4 w-4" />
                            <span>
                              {actingId === selectedRequest.id
                                ? "Enviando solicitação..."
                                : "Reservar Disponíveis & Solicitar Compra ao Admin"}
                            </span>
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold">Saldo total disponível no galpão!</p>
                          <p className="text-emerald-800">
                            Todas as peças constam no estoque. Ao confirmar, o sistema baixará o físico e reservará para a OS.
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleSeparateAndReserve(selectedRequest)}
                        disabled={actingId === selectedRequest.id}
                        className="rounded-lg font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>
                          {actingId === selectedRequest.id
                            ? "Separando..."
                            : "Confirmar Separação e Baixa de Estoque"}
                        </span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Footer do Modal */}
                <div className="p-4 px-6 border-t border-border bg-muted/10 flex items-center justify-between">
                  <Link
                    href={`/orders/${selectedRequest.serviceOrder?.id}`}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Abrir Ordem de Serviço #{selectedRequest.serviceOrder?.orderNumber}
                    <ArrowRight className="h-3 w-3" />
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPickingModalOpen(false)}
                    className="rounded-lg text-xs"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <ReceiveMaterialModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        onSuccess={() => {
          loadRequests(true);
          toast.success("Mesa do almoxarife atualizada com sucesso!");
        }}
      />
    </div>
  );
}
