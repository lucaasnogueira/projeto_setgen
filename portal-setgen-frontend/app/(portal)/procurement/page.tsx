"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Building, Barcode } from "lucide-react";
import { toast } from "sonner";

import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { suppliersApi } from "@/lib/api/suppliers";
import { inventoryApi } from "@/lib/api/inventory";
import { ProcurementOrder, ProcurementOrderStatus, Supplier, Product } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

import { ProcurementKPIs } from "@/components/procurement/ProcurementKPIs";
import { LowStockAlert } from "@/components/procurement/LowStockAlert";
import { WarehouseDemandsAlert } from "@/components/procurement/WarehouseDemandsAlert";
import { ProcurementFilterBar } from "@/components/procurement/ProcurementFilterBar";
import { ProcurementItemsTable } from "@/components/procurement/ProcurementItemsTable";
import { ProcurementOrdersList } from "@/components/procurement/ProcurementOrdersList";

import { NewProcurementOrderModal } from "@/components/procurement/NewProcurementOrderModal";
import { EditQuotationModal } from "@/components/procurement/EditQuotationModal";
import { InvoiceModal } from "@/components/procurement/InvoiceModal";
import { ReceiveMaterialModal } from "@/components/procurement/ReceiveMaterialModal";

export default function ProcurementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<ProcurementOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  // Modo de visualização: Priorizado por LISTA ("LIST") por padrão
  const [viewMode, setViewMode] = useState<"LIST" | "ORDERS">("LIST");

  // Edição inline por linha (nada engessado)
  const [editingRows, setEditingRows] = useState<
    Record<string, { quantity: number; unitCost: number; supplierId: string }>
  >({});

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingQuotationOrder, setEditingQuotationOrder] = useState<ProcurementOrder | null>(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<ProcurementOrder | null>(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [receiveOrderId, setReceiveOrderId] = useState<string | undefined>(undefined);

  // Parâmetros de pré-carregamento do novo pedido
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(
    searchParams.get("productId") || undefined
  );
  const [selectedQuantity, setSelectedQuantity] = useState<number | undefined>(
    searchParams.get("qty") ? parseInt(searchParams.get("qty")!, 10) : undefined
  );
  const [selectedMaterialRequestId, setSelectedMaterialRequestId] = useState<string | undefined>(
    searchParams.get("materialRequestId") || undefined
  );
  const [batchLowStockItems, setBatchLowStockItems] = useState<
    Array<{ productId: string; quantity: number; unitCost?: number }> | undefined
  >(undefined);

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
      const [ordersData, suppliersData, lowStockData] = await Promise.all([
        procurementOrdersApi.getAll(),
        suppliersApi.getAll(true),
        inventoryApi.getLowStock(),
      ]);
      setOrders(ordersData || []);
      setSuppliers(suppliersData || []);
      setLowStockProducts(lowStockData || []);
    } catch (error) {
      console.error("Erro ao carregar dados de compras:", error);
      toast.error("Erro ao carregar dados de compras.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSupplier = async (id: string, supplierId: string) => {
    setActingId(id);
    try {
      const updated = await procurementOrdersApi.update(id, {
        supplierId: supplierId ? supplierId : undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      toast.success("Fornecedor atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atribuir fornecedor.");
    } finally {
      setActingId(null);
    }
  };

  const handleSaveInlineItem = async (orderId: string, itemId: string) => {
    const edit = editingRows[itemId];
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || !edit) return;

    setActingId(itemId);
    try {
      const updatedItems = targetOrder.items.map((it) => {
        if (it.id === itemId) {
          return {
            productId: it.productId,
            requestedQuantity:
              it.requestedQuantity !== undefined ? it.requestedQuantity : it.quantity,
            quantity: Number(edit.quantity),
            unitCost: Number(edit.unitCost),
          };
        }
        return {
          productId: it.productId,
          requestedQuantity:
            it.requestedQuantity !== undefined ? it.requestedQuantity : it.quantity,
          quantity: it.quantity,
          unitCost: Number(it.unitCost || 0),
        };
      });

      const payload: any = {
        items: updatedItems,
      };
      if (edit.supplierId !== undefined) {
        payload.supplierId = edit.supplierId ? edit.supplierId : undefined;
      }

      const updated = await procurementOrdersApi.update(orderId, payload);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...updated } : o)));

      setEditingRows((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });

      toast.success("Item de compra atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao salvar alterações do item.");
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
    if (nextStatus === ProcurementOrderStatus.RECEIVED) {
      setReceiveOrderId(id);
      setIsReceiveModalOpen(true);
      return;
    }

    setActingId(id);
    try {
      const updated = await procurementOrdersApi.updateStatus(id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
      toast.success("Status do pedido atualizado com sucesso!");
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

  const handleOrderSingleLowStock = (product: Product) => {
    const deficit = Math.max(1, (product.minStock || 1) * 2 - (product.currentStock || 0));
    setSelectedProductId(product.id);
    setSelectedQuantity(deficit);
    setSelectedMaterialRequestId(undefined);
    setBatchLowStockItems(undefined);
    setIsNewModalOpen(true);
  };

  const handleOrderAllLowStock = () => {
    if (lowStockProducts.length === 0) return;
    const items = lowStockProducts.map((p) => {
      const deficit = Math.max(1, (p.minStock || 1) * 2 - (p.currentStock || 0));
      return {
        productId: p.id,
        quantity: deficit,
        unitCost: p.unitCost ? Number(p.unitCost) : 0,
      };
    });
    setSelectedProductId(undefined);
    setSelectedQuantity(undefined);
    setSelectedMaterialRequestId(undefined);
    setBatchLowStockItems(items);
    setIsNewModalOpen(true);
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

  // Filtragem de pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSupplier = o.supplier?.name?.toLowerCase().includes(term);
        const matchOs = o.materialRequest?.serviceOrder?.orderNumber
          ?.toLowerCase()
          .includes(term);
        const matchInvoice = o.invoiceNumber?.toLowerCase().includes(term);
        const matchItems = o.items?.some(
          (i) =>
            i.product?.name?.toLowerCase().includes(term) ||
            i.product?.code?.toLowerCase().includes(term)
        );
        const matchId = o.id.toLowerCase().includes(term);

        if (!matchSupplier && !matchOs && !matchItems && !matchId && !matchInvoice) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  // Lista linear de itens
  const flatItemsList = useMemo(() => {
    const list: Array<{
      order: ProcurementOrder;
      item: ProcurementOrder["items"][0];
    }> = [];

    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        list.push({ order, item });
      });
    });

    return list;
  }, [filteredOrders]);

  const warehouseDemands = useMemo(() => {
    return orders.filter(
      (o) => o.materialRequest && o.status === ProcurementOrderStatus.QUOTING
    );
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E2661D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Compras & Suprimentos"
        subtitle="Controle por lista: quantidade solicitada, quantidade comprada, cotação de preços, escolha de fornecedor e notas fiscais"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => {
                setReceiveOrderId(undefined);
                setIsReceiveModalOpen(true);
              }}
              className="rounded-lg font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs h-8 text-xs"
            >
              <Barcode className="h-3.5 w-3.5" />
              Receber Material (Bipar NF)
            </Button>
            <Link href="/suppliers">
              <Button
                variant="outline"
                className="rounded-lg font-bold gap-1.5 border-gray-200 h-8 text-xs text-gray-700"
              >
                <Building className="h-3.5 w-3.5 text-gray-500" />
                Fornecedores
              </Button>
            </Link>
            <Button
              onClick={() => {
                setSelectedProductId(undefined);
                setSelectedQuantity(undefined);
                setSelectedMaterialRequestId(undefined);
                setBatchLowStockItems(undefined);
                setIsNewModalOpen(true);
              }}
              className="rounded-lg font-bold gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white shadow-2xs h-8 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo Pedido de Compra
            </Button>
          </div>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <ProcurementKPIs
        totalCount={totalCount}
        quotingCount={quotingCount}
        awaitingDeliveryCount={awaitingDeliveryCount}
        receivedCount={receivedCount}
      />

      {/* Alerta de Estoque Baixo / Reposição */}
      <LowStockAlert
        products={lowStockProducts}
        onOrderSingle={handleOrderSingleLowStock}
        onOrderAll={handleOrderAllLowStock}
      />

      {/* Alerta de Demandas do Almoxarifado */}
      <WarehouseDemandsAlert
        demands={warehouseDemands}
        onEditQuotation={(wo) => setEditingQuotationOrder(wo)}
      />

      {/* Barra de Filtros, Busca e Alternância */}
      <ProcurementFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        flatItemsCount={flatItemsList.length}
        filteredOrdersCount={filteredOrders.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        statusCounts={{
          total: totalCount,
          quoting: quotingCount,
          orderIssued: orders.filter((o) => o.status === ProcurementOrderStatus.ORDER_ISSUED).length,
          awaitingDelivery: awaitingDeliveryCount,
          received: receivedCount,
        }}
      />

      {/* Visão em Lista (Item a Item) ou Visão em Pedidos */}
      {viewMode === "LIST" ? (
        <ProcurementItemsTable
          items={flatItemsList}
          suppliers={suppliers}
          editingRows={editingRows}
          setEditingRows={setEditingRows}
          actingId={actingId}
          onSaveInlineItem={handleSaveInlineItem}
          onIssue={handleIssue}
          onAdvance={handleAdvance}
          onEditQuotation={(order) => setEditingQuotationOrder(order)}
          onOpenInvoiceModal={(order) => setInvoiceModalOrder(order)}
          onSupplierCreated={(newSup) => setSuppliers((prev) => [newSup, ...prev])}
        />
      ) : (
        <ProcurementOrdersList
          orders={filteredOrders}
          suppliers={suppliers}
          actingId={actingId}
          onAssignSupplier={handleAssignSupplier}
          onSupplierCreated={(newSup) => setSuppliers((prev) => [newSup, ...prev])}
          onIssue={handleIssue}
          onAdvance={handleAdvance}
          onDelete={handleDelete}
          onEditQuotation={(order) => setEditingQuotationOrder(order)}
          onOpenInvoiceModal={(order) => setInvoiceModalOrder(order)}
          onOpenNewModal={() => {
            setSelectedProductId(undefined);
            setSelectedQuantity(undefined);
            setSelectedMaterialRequestId(undefined);
            setBatchLowStockItems(undefined);
            setIsNewModalOpen(true);
          }}
        />
      )}

      {/* Modais */}
      <NewProcurementOrderModal
        isOpen={isNewModalOpen}
        onClose={() => {
          setIsNewModalOpen(false);
          setSelectedProductId(undefined);
          setSelectedQuantity(undefined);
          setSelectedMaterialRequestId(undefined);
          setBatchLowStockItems(undefined);
          if (searchParams.get("new")) {
            router.replace("/procurement");
          }
        }}
        onSuccess={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          toast.success("Pedido de compra criado com sucesso!");
        }}
        initialProductId={selectedProductId}
        initialQuantity={selectedQuantity}
        initialMaterialRequestId={selectedMaterialRequestId}
        initialItems={batchLowStockItems}
      />

      <EditQuotationModal
        isOpen={!!editingQuotationOrder}
        onClose={() => setEditingQuotationOrder(null)}
        order={editingQuotationOrder}
        onSuccess={(updated) => {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
          setEditingQuotationOrder(null);
        }}
      />

      <InvoiceModal
        isOpen={!!invoiceModalOrder}
        onClose={() => setInvoiceModalOrder(null)}
        order={invoiceModalOrder}
        onSuccess={(updated) => {
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
          setInvoiceModalOrder(null);
        }}
      />

      <ReceiveMaterialModal
        isOpen={isReceiveModalOpen}
        onClose={() => {
          setIsReceiveModalOpen(false);
          setReceiveOrderId(undefined);
        }}
        initialOrderId={receiveOrderId}
        onSuccess={() => {
          load();
          toast.success("Pedidos e saldo de estoque atualizados!");
        }}
      />
    </div>
  );
}
