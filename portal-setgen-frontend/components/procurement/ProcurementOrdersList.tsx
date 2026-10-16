import React, { useState, useMemo, useEffect } from "react";
import {
  ShoppingCart,
  FileText,
  Boxes,
  FileCheck,
  ExternalLink,
  Calendar,
  Edit3,
  Send,
  Trash2,
  Truck,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Plus,
} from "lucide-react";
import { ProcurementOrder, ProcurementOrderStatus, Supplier } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import { SupplierCombobox } from "@/components/procurement/SupplierCombobox";
import { STATUS_LABELS, STATUS_BADGES } from "@/components/procurement/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { openAuthedFile } from "@/lib/utils/auth-file";

interface ProcurementOrdersListProps {
  orders: ProcurementOrder[];
  suppliers: Supplier[];
  actingId: string | null;
  onAssignSupplier: (id: string, supplierId: string) => void;
  onSupplierCreated: (supplier: Supplier) => void;
  onIssue: (id: string) => void;
  onAdvance: (id: string, status: ProcurementOrderStatus) => void;
  onDelete: (id: string) => void;
  onEditQuotation: (order: ProcurementOrder) => void;
  onOpenInvoiceModal: (order: ProcurementOrder) => void;
  onOpenNewModal: () => void;
}

export function ProcurementOrdersList({
  orders,
  suppliers,
  actingId,
  onAssignSupplier,
  onSupplierCreated,
  onIssue,
  onAdvance,
  onDelete,
  onEditQuotation,
  onOpenInvoiceModal,
  onOpenNewModal,
}: ProcurementOrdersListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return orders.slice(start, start + ITEMS_PER_PAGE);
  }, [orders, currentPage]);

  if (orders.length === 0) {
    return (
      <Card className="p-8 sm:p-10 text-center rounded-xl border border-gray-200/75 bg-white shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-orange-50 text-[#E2661D] flex items-center justify-center mx-auto mb-2.5">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-gray-900">
          Nenhum pedido de compra encontrado
        </h3>
        <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
          Utilize o botão acima para criar uma nova cotação/pedido de compra ou ajuste os filtros.
        </p>
        <div className="mt-3.5">
          <Button
            onClick={onOpenNewModal}
            className="rounded-lg font-bold text-xs bg-[#E2661D] hover:bg-[#c95716] text-white gap-1.5 h-8 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar Primeiro Pedido
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      {paginatedOrders.map((order) => {
        const badge = STATUS_BADGES[order.status] || STATUS_BADGES.QUOTING;
        const expanded = expandedId === order.id;
        const totalOrder = order.items.reduce(
          (acc, it) => acc + it.quantity * Number(it.unitCost || 0),
          0
        );
        const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);
        const isFinished =
          order.status === ProcurementOrderStatus.RECEIVED ||
          order.status === ProcurementOrderStatus.CANCELLED;

        return (
          <Card
            key={order.id}
            id={`order-${order.id}`}
            className="rounded-xl border border-gray-200/75 bg-white overflow-hidden shadow-2xs hover:border-gray-300 transition-all"
          >
            {/* Linha Principal do Pedido */}
            <div
              className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 sm:p-3.5 cursor-pointer select-none hover:bg-gray-50/50"
              onClick={() => setExpandedId(expanded ? null : order.id)}
            >
              <div className="flex items-start lg:items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 text-[#E2661D] shrink-0 border border-gray-200">
                  <ShoppingCart className="h-4 w-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {order.materialRequest?.serviceOrder ? (
                      <span className="text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-[#E2661D] border border-orange-200 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        OS #{order.materialRequest.serviceOrder.orderNumber}
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 flex items-center gap-1">
                        <Boxes className="h-3 w-3" />
                        Reposição
                      </span>
                    )}

                    <span className="text-gray-300">•</span>

                    {/* Seletor Rápido de Fornecedor */}
                    {!isFinished ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-52"
                      >
                        <SupplierCombobox
                          suppliers={suppliers}
                          selectedSupplierId={order.supplierId || ""}
                          onSelectSupplier={(supId) => onAssignSupplier(order.id, supId)}
                          onSupplierCreated={onSupplierCreated}
                          emptyLabel="(Definir Fornecedor...)"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {order.supplier?.name || "Fornecedor não informado"}
                      </span>
                    )}

                    <span className="text-[10px] font-mono text-gray-400">
                      #{order.id.slice(0, 8)}
                    </span>

                    {/* Tag de Nota Fiscal */}
                    {order.invoiceNumber ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.invoiceUrl) {
                            openAuthedFile(order.invoiceUrl);
                          } else {
                            onOpenInvoiceModal(order);
                          }
                        }}
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
                        title="Clique para abrir arquivo da NF"
                      >
                        <FileCheck className="h-3 w-3 text-emerald-600" />
                        NF-e #{order.invoiceNumber}
                        {order.invoiceUrl && <ExternalLink className="h-2.5 w-2.5 ml-0.5" />}
                      </span>
                    ) : order.invoiceUrl ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          openAuthedFile(order.invoiceUrl!);
                        }}
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 hover:bg-emerald-100 cursor-pointer"
                        title="Clique para abrir arquivo da NF"
                      >
                        <FileCheck className="h-3 w-3 text-emerald-600" />
                        NF Anexada
                        <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                      </span>
                    ) : null}
                  </div>

                  <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2.5 flex-wrap">
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
                      {order.items.length} tipo(s) · {totalUnits} un
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges, Valores e Ações */}
              <div
                className="flex items-center gap-2.5 shrink-0 flex-wrap self-end lg:self-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Valor Total */}
                <div className="text-right pr-1">
                  <div className="text-[9.5px] text-gray-400 uppercase font-bold tracking-wider">
                    Total
                  </div>
                  <div className="text-xs sm:text-[13px] font-bold text-gray-900 font-mono">
                    {formatCurrency(totalOrder)}
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {STATUS_LABELS[order.status]}
                </span>

                {/* Botão de Ajustar Cotação / Preços */}
                {!isFinished && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditQuotation(order)}
                    className="h-7.5 px-2.5 text-xs font-bold rounded-lg border-gray-200 text-gray-700 hover:text-[#E2661D] hover:border-orange-200 hover:bg-orange-50 gap-1"
                    title="Alterar fornecedor, adicionar preços e quantidades"
                  >
                    <Edit3 className="h-3 w-3 text-[#E2661D]" />
                    Cotação
                  </Button>
                )}

                {/* Botão de Nota Fiscal */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenInvoiceModal(order)}
                  className={`h-7.5 px-2.5 text-xs font-bold rounded-lg border-gray-200 gap-1 ${
                    order.invoiceNumber || order.invoiceUrl
                      ? "text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Anexar ou editar Nota Fiscal de compra"
                >
                  <FileText className="h-3 w-3" />
                  {order.invoiceNumber ? "NF" : "+ NF"}
                </Button>

                {/* Ações contextuais de acordo com o Status */}
                {order.status === ProcurementOrderStatus.QUOTING && (
                  <div className="flex items-center gap-1.5">
                    {order.supplierId && (
                      <Button
                        size="sm"
                        disabled={actingId === order.id}
                        onClick={() => onIssue(order.id)}
                        className="h-7.5 px-2.5 text-xs font-bold rounded-lg bg-[#E2661D] hover:bg-[#c95716] text-white gap-1 shadow-2xs"
                      >
                        <Send className="h-3 w-3" />
                        Emitir
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actingId === order.id}
                      onClick={() => onDelete(order.id)}
                      className="h-7.5 w-7.5 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                      title="Excluir Pedido"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {order.status === ProcurementOrderStatus.ORDER_ISSUED && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={actingId === order.id}
                    onClick={() => onAdvance(order.id, ProcurementOrderStatus.AWAITING_DELIVERY)}
                    className="h-7.5 px-2.5 text-xs font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50 gap-1"
                  >
                    <Truck className="h-3 w-3" />
                    A Caminho
                  </Button>
                )}

                {order.status === ProcurementOrderStatus.AWAITING_DELIVERY && (
                  <Button
                    size="sm"
                    disabled={actingId === order.id}
                    onClick={() => onAdvance(order.id, ProcurementOrderStatus.RECEIVED)}
                    className="h-7.5 px-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Dar Entrada
                  </Button>
                )}

                {order.status === ProcurementOrderStatus.RECEIVED && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    <CheckCircle className="h-3 w-3" />
                    Recebido
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : order.id)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
              <div className="px-4 pb-4 pt-2 bg-gray-50/70 border-t border-gray-100 space-y-2.5">
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-bold text-gray-700">
                    Itens Cotados / Solicitados ({order.items.length})
                  </span>
                  {!isFinished && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditQuotation(order)}
                      className="h-6.5 text-[11px] font-bold text-[#E2661D] hover:bg-orange-50 gap-1 rounded-md"
                    >
                      <Edit3 className="h-3 w-3" />
                      Editar Preços ou Quantidades
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 bg-gray-50/50">
                        <th className="py-2 px-3">Código / SKU</th>
                        <th className="py-2 px-3">Descrição da Peça</th>
                        <th className="py-2 px-3 text-center">Qtd. Solicitada</th>
                        <th className="py-2 px-3 text-center">Qtd. a Comprar</th>
                        <th className="py-2 px-3 text-right">Custo Unitário</th>
                        <th className="py-2 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {order.items.map((it) => (
                        <tr key={it.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-mono text-gray-500 text-[10.5px]">
                            {it.product?.code || "—"}
                          </td>
                          <td className="py-2 px-3 font-bold text-gray-800 text-xs">
                            {it.product?.name || "Produto não identificado"}
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-gray-500 text-xs">
                            {it.requestedQuantity !== undefined ? it.requestedQuantity : it.quantity} {it.product?.unit || "un"}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-gray-900 font-mono text-xs">
                            {it.quantity} {it.product?.unit || "un"}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-600 text-xs">
                            {Number(it.unitCost) > 0 ? (
                              formatCurrency(Number(it.unitCost))
                            ) : (
                              <span className="text-amber-600 font-semibold italic text-[10.5px]">
                                Sem preço
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-gray-900 font-mono text-xs">
                            {formatCurrency(it.quantity * Number(it.unitCost || 0))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>
        );
      })}

      <Card className="rounded-xl border border-gray-200/75 bg-white overflow-hidden shadow-2xs">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={orders.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          itemLabel="pedidos de compra"
        />
      </Card>
    </div>
  );
}

