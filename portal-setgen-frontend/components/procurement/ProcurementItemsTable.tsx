import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  FileText,
  Boxes,
  FileCheck,
  Save,
  Send,
  CheckCircle,
  Edit3,
  LayoutList,
} from "lucide-react";
import { ProcurementOrder, ProcurementOrderStatus, Supplier } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/pagination";
import { SupplierCombobox } from "@/components/procurement/SupplierCombobox";
import { STATUS_LABELS, STATUS_BADGES } from "@/components/procurement/constants";
import { formatCurrency } from "@/lib/utils";
import { openAuthedFile } from "@/lib/utils/auth-file";

interface ProcurementItemsTableProps {
  items: Array<{
    order: ProcurementOrder;
    item: ProcurementOrder["items"][0];
  }>;
  suppliers: Supplier[];
  editingRows: Record<string, { quantity: number; unitCost: number; supplierId: string }>;
  setEditingRows: React.Dispatch<
    React.SetStateAction<
      Record<string, { quantity: number; unitCost: number; supplierId: string }>
    >
  >;
  actingId: string | null;
  onSaveInlineItem: (orderId: string, itemId: string) => void;
  onIssue: (orderId: string) => void;
  onAdvance: (orderId: string, status: ProcurementOrderStatus) => void;
  onEditQuotation: (order: ProcurementOrder) => void;
  onOpenInvoiceModal: (order: ProcurementOrder) => void;
  onSupplierCreated: (supplier: Supplier) => void;
}

export function ProcurementItemsTable({
  items,
  suppliers,
  editingRows,
  setEditingRows,
  actingId,
  onSaveInlineItem,
  onIssue,
  onAdvance,
  onEditQuotation,
  onOpenInvoiceModal,
  onSupplierCreated,
}: ProcurementItemsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  return (
    <Card className="rounded-xl border border-gray-200/75 bg-white overflow-hidden shadow-2xs">
      <div className="p-3.5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gray-50/50">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
            <LayoutList className="h-4 w-4 text-[#E2661D]" />
            Lista Geral de Demandas & Itens de Compras ({items.length})
          </h3>
          <p className="text-[11px] text-gray-500">
            Personalize fornecedor, quantidade comprada e preço unitário direto na tabela sem travas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-medium">
            Edite os valores nas colunas e clique em <strong>Salvar</strong>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-gray-500 uppercase text-[10px] font-bold tracking-wider border-b border-gray-200 bg-gray-50/80">
              <th className="py-2.5 px-3">Peça / Insumo</th>
              <th className="py-2.5 px-3">Vínculo / Origem</th>
              <th className="py-2.5 px-3">Fornecedor</th>
              <th className="py-2.5 px-3 text-center">Qtd. Solicitada</th>
              <th className="py-2.5 px-3 text-center text-[#E2661D]">Qtd. a Comprar</th>
              <th className="py-2.5 px-3 text-center text-[#E2661D]">Preço Unit. (R$)</th>
              <th className="py-2.5 px-3 text-right">Subtotal</th>
              <th className="py-2.5 px-3 text-center">Status / NF-e</th>
              <th className="py-2.5 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400">
                  <div className="w-9 h-9 rounded-full bg-orange-50 text-[#E2661D] flex items-center justify-center mx-auto mb-2">
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">Nenhum item encontrado nesta listagem</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Ajuste os filtros acima ou crie um novo pedido de compra.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedItems.map(({ order, item }) => {
                const badge = STATUS_BADGES[order.status] || STATUS_BADGES.QUOTING;
                const isFinished =
                  order.status === ProcurementOrderStatus.RECEIVED ||
                  order.status === ProcurementOrderStatus.CANCELLED;

                const edit = editingRows[item.id];
                const currentQuantity = edit !== undefined ? edit.quantity : item.quantity;
                const currentUnitCost =
                  edit !== undefined ? edit.unitCost : Number(item.unitCost || 0);
                const currentSupplierId =
                  edit !== undefined ? edit.supplierId : order.supplierId || "";
                const isDirty = edit !== undefined;

                const subtotal = currentQuantity * currentUnitCost;
                const requestedQty =
                  item.requestedQuantity !== undefined ? item.requestedQuantity : item.quantity;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50/60 transition-colors ${
                      isDirty ? "bg-orange-50/30" : ""
                    }`}
                  >
                    {/* Peça / Insumo */}
                    <td className="py-2 px-3 min-w-[180px]">
                      <div className="font-bold text-gray-900 truncate text-xs">
                        {item.product?.name || "Peça não identificada"}
                      </div>
                      <div className="text-[10.5px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                        <span>{item.product?.code ? `SKU: ${item.product.code}` : "S/C"}</span>
                        <span>•</span>
                        <span>
                          Saldo: <strong>{item.product?.currentStock || 0}</strong> {item.product?.unit || "un"}
                        </span>
                      </div>
                    </td>

                    {/* Vínculo / Origem */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      {order.materialRequest?.serviceOrder ? (
                        <div>
                          <Link
                            href={`/orders/${order.materialRequest.serviceOrder.id}`}
                            className="font-mono font-bold text-[#E2661D] hover:underline flex items-center gap-1 text-[11px]"
                          >
                            <FileText className="h-3 w-3" />
                            OS #{order.materialRequest.serviceOrder.orderNumber}
                          </Link>
                          {order.materialRequest.serviceOrder.client && (
                            <p className="text-[10.5px] text-gray-500 truncate max-w-[120px]">
                              {order.materialRequest.serviceOrder.client.tradeName ||
                                order.materialRequest.serviceOrder.client.companyName}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 flex items-center gap-1 w-fit">
                          <Boxes className="h-3 w-3" />
                          Reposição
                        </span>
                      )}
                    </td>

                    {/* Fornecedor */}
                    <td className="py-2 px-3 min-w-[180px]">
                      {!isFinished ? (
                        <SupplierCombobox
                          suppliers={suppliers}
                          selectedSupplierId={currentSupplierId}
                          onSelectSupplier={(newSup) => {
                            setEditingRows((prev) => ({
                              ...prev,
                              [item.id]: {
                                quantity: currentQuantity,
                                unitCost: currentUnitCost,
                                supplierId: newSup,
                              },
                            }));
                          }}
                          onSupplierCreated={onSupplierCreated}
                          emptyLabel="(Definir Fornecedor...)"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900 text-xs">
                          {order.supplier?.name || "Não informado"}
                        </span>
                      )}
                    </td>

                    {/* Quantidade Solicitada */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono font-bold text-xs border border-gray-200">
                        {requestedQty} {item.product?.unit || "un"}
                      </span>
                    </td>

                    {/* Quantidade a Comprar */}
                    <td className="py-2 px-3 text-center w-24">
                      {!isFinished ? (
                        <Input
                          type="number"
                          min="1"
                          value={currentQuantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 0;
                            setEditingRows((prev) => ({
                              ...prev,
                              [item.id]: {
                                quantity: val,
                                unitCost: currentUnitCost,
                                supplierId: currentSupplierId,
                              },
                            }));
                          }}
                          className="h-7 text-xs text-center font-bold font-mono border-orange-200 focus:border-[#E2661D]"
                          title="Quantidade que será comprada efetivamente"
                        />
                      ) : (
                        <span className="font-bold text-gray-900 font-mono text-xs">
                          {currentQuantity} {item.product?.unit || "un"}
                        </span>
                      )}
                    </td>

                    {/* Preço Unitário */}
                    <td className="py-2 px-3 text-center w-32">
                      {!isFinished ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="relative w-full">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={
                                currentUnitCost > 0
                                  ? currentUnitCost
                                  : edit?.unitCost !== undefined
                                  ? edit.unitCost
                                  : ""
                              }
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditingRows((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    quantity: currentQuantity,
                                    unitCost: val,
                                    supplierId: currentSupplierId,
                                  },
                                }));
                              }}
                              className={`h-7 pl-6 text-xs font-semibold font-mono ${
                                currentUnitCost === 0
                                  ? "border-amber-300 bg-amber-50/40 text-amber-900 placeholder:text-amber-500"
                                  : "border-orange-200 focus:border-[#E2661D]"
                              }`}
                              placeholder="0,00 (Cotar)"
                              title="O Administrativo define o preço negociado"
                            />
                          </div>
                          {currentUnitCost === 0 && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-1 py-0.2 rounded whitespace-nowrap">
                              A Cotar
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="font-mono text-gray-700 text-xs">
                          {currentUnitCost > 0 ? (
                            formatCurrency(currentUnitCost)
                          ) : (
                            <span className="text-amber-700 font-medium italic text-[10.5px]">
                              Não informado
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Subtotal */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 whitespace-nowrap text-xs">
                      {currentUnitCost > 0 ? (
                        formatCurrency(subtotal)
                      ) : (
                        <span className="text-[10.5px] text-amber-700 font-semibold italic">
                          Aguardando
                        </span>
                      )}
                    </td>

                    {/* Status / NF-e */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {STATUS_LABELS[order.status]}
                        </span>

                        {order.invoiceNumber ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (order.invoiceUrl) openAuthedFile(order.invoiceUrl);
                              else onOpenInvoiceModal(order);
                            }}
                            className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                            title="Visualizar Nota Fiscal"
                          >
                            <FileCheck className="h-3 w-3" />
                            NF #{order.invoiceNumber}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenInvoiceModal(order)}
                            className="text-[10px] text-gray-400 hover:text-[#E2661D] font-medium"
                          >
                            + Anexar NF
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {isDirty && (
                          <Button
                            size="sm"
                            disabled={actingId === item.id}
                            onClick={() => onSaveInlineItem(order.id, item.id)}
                            className="h-6.5 px-2 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md gap-1 shadow-2xs"
                            title="Salvar alterações deste item"
                          >
                            <Save className="h-3 w-3" />
                            Salvar
                          </Button>
                        )}

                        {order.status === ProcurementOrderStatus.QUOTING && order.supplierId && !isDirty && (
                          <Button
                            size="sm"
                            disabled={actingId === order.id}
                            onClick={() => onIssue(order.id)}
                            className="h-6.5 px-2 text-[11px] font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-md gap-1 shadow-2xs"
                            title="Emitir pedido formalmente ao fornecedor"
                          >
                            <Send className="h-3 w-3" />
                            Emitir
                          </Button>
                        )}

                        {order.status === ProcurementOrderStatus.AWAITING_DELIVERY && !isDirty && (
                          <Button
                            size="sm"
                            disabled={actingId === order.id}
                            onClick={() =>
                              onAdvance(order.id, ProcurementOrderStatus.RECEIVED)
                            }
                            className="h-6.5 px-2 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md gap-1 shadow-2xs"
                            title="Confirmar recebimento físico no almoxarifado"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Receber
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditQuotation(order)}
                          className="h-6.5 w-6.5 p-0 rounded-md text-gray-400 hover:text-gray-700"
                          title="Mais opções / Editar Pedido Completo"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={items.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
        itemLabel="itens de compra"
      />
    </Card>
  );
}

