"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Building,
  Calendar,
  Package,
  AlertCircle,
  Loader2,
  DollarSign,
  ShoppingCart,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suppliersApi } from "@/lib/api/suppliers";
import { inventoryApi } from "@/lib/api/inventory";
import { procurementOrdersApi } from "@/lib/api/procurement-orders";
import { Supplier, Product, ProcurementOrder } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { SupplierCombobox } from "./SupplierCombobox";
import { ProductCombobox } from "./ProductCombobox";

interface ItemRow {
  productId: string;
  requestedQuantity?: number;
  quantity: number;
  unitCost: number;
  productName?: string;
  productCode?: string;
  productUnit?: string;
}

interface EditQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ProcurementOrder | null;
  onSuccess: (updatedOrder: ProcurementOrder) => void;
}

export function EditQuotationModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: EditQuotationModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [supplierId, setSupplierId] = useState<string>("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [items, setItems] = useState<ItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !order) return;

    let isMounted = true;
    setLoadingInitial(true);
    setErrorMessage(null);

    setSupplierId(order.supplierId || "");
    setExpectedDeliveryDate(
      order.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : ""
    );

    // Mapear itens existentes do pedido
    const initialItems: ItemRow[] = (order.items || []).map((it) => ({
      productId: it.productId,
      requestedQuantity: it.requestedQuantity !== undefined ? it.requestedQuantity : it.quantity,
      quantity: it.quantity,
      unitCost: Number(it.unitCost || 0),
      productName: it.product?.name,
      productCode: it.product?.code,
      productUnit: it.product?.unit,
    }));
    setItems(initialItems);

    Promise.all([suppliersApi.getAll(true), inventoryApi.getAll()])
      .then(([suppliersData, productsData]) => {
        if (!isMounted) return;
        setSuppliers(suppliersData || []);
        setProducts(productsData || []);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados complementares:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const handleProductChange = (index: number, newProductId: string) => {
    const selectedProd = products.find((p) => p.id === newProductId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      productName: selectedProd?.name,
      productCode: selectedProd?.code,
      productUnit: selectedProd?.unit,
      unitCost: selectedProd?.unitCost
        ? Number(selectedProd.unitCost)
        : updated[index].unitCost || 0,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], quantity: Math.max(1, qty) };
    setItems(updated);
  };

  const handleCostChange = (index: number, cost: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], unitCost: Math.max(0, cost) };
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: "", quantity: 1, unitCost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning("O pedido precisa conter pelo menos um item.");
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalOrderValue = items.reduce(
    (acc, it) => acc + (it.quantity || 0) * (it.unitCost || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validItems = items.filter((it) => it.productId.trim() !== "");
    if (validItems.length === 0) {
      setErrorMessage("Adicione pelo menos um item válido ao pedido.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplierId: supplierId ? supplierId : undefined,
        expectedDeliveryDate: expectedDeliveryDate ? expectedDeliveryDate : undefined,
        items: validItems.map((it) => ({
          productId: it.productId,
          requestedQuantity: it.requestedQuantity !== undefined ? it.requestedQuantity : it.quantity,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost || 0),
        })),
      };

      const updated = await procurementOrdersApi.update(order.id, payload);
      toast.success("Cotação e fornecedor atualizados com sucesso!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      console.error("Erro ao atualizar cotação do pedido:", err);
      setErrorMessage(
        err.response?.data?.message || "Ocorreu um erro ao atualizar o pedido de compra."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200/80 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D] shrink-0 mt-0.5">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                  Pedido #{order.id.slice(0, 8)}
                </span>
                {order.materialRequest?.serviceOrder && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-50 text-[#E2661D] border border-orange-200">
                    OS #{order.materialRequest.serviceOrder.orderNumber}
                  </span>
                )}
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                Ajustar Fornecedor, Preços & Itens da Cotação
              </h2>
              <p className="text-xs text-gray-500">
                Altere o fornecedor parceiro, informe os custos unitários negociados e recalcule o total
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#E2661D]" />
              <span className="text-xs">Carregando dados da cotação...</span>
            </div>
          ) : (
            <>
              {/* Fornecedor e Previsão */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50/70 p-4 rounded-xl border border-gray-200">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-[#E2661D]" />
                    Fornecedor Escolhido
                  </Label>
                  <SupplierCombobox
                    suppliers={suppliers}
                    selectedSupplierId={supplierId}
                    onSelectSupplier={(id) => setSupplierId(id)}
                    onSupplierCreated={(newSup) => setSuppliers((prev) => [newSup, ...prev])}
                    emptyLabel="A definir / Em cotação aberta"
                  />
                  <p className="text-[11px] text-gray-500">
                    Você pode alterar para qualquer fornecedor parceiro ou cadastrar um novo a qualquer momento.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Previsão de Entrega Prometida
                  </Label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="text-xs h-9 rounded-lg border-gray-200 bg-white"
                  />
                  <p className="text-[11px] text-gray-500">
                    Prazo acordado com o fornecedor para chegada ao almoxarifado.
                  </p>
                </div>
              </div>

              {/* Tabela de Itens e Custo Unitário */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-[#E2661D]" />
                    Composição de Preços dos Itens ({items.length})
                  </Label>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold gap-1.5 h-8 border-gray-200 text-[#E2661D] hover:bg-orange-50 hover:border-orange-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Outro Item
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white shadow-2xs">
                  <div className="bg-gray-50/80 px-4 py-2.5 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider gap-2">
                    <span className="flex-1">Peça / Insumo</span>
                    <span className="w-24 text-center">Qtd. Solicitada</span>
                    <span className="w-24 text-center text-[#E2661D]">Qtd. a Comprar</span>
                    <span className="w-28 text-center text-[#E2661D]">Preço Unit. (R$)</span>
                    <span className="w-24 text-right">Subtotal</span>
                    <span className="w-8"></span>
                  </div>

                  {items.map((item, index) => {
                    const subtotal = (item.quantity || 0) * (item.unitCost || 0);

                    return (
                      <div
                        key={index}
                        className="p-3 bg-white flex flex-col md:flex-row items-stretch md:items-center gap-2 hover:bg-gray-50/40"
                      >
                        {/* Seleção de Produto com Busca */}
                        <div className="flex-1 min-w-[180px]">
                          <ProductCombobox
                            products={products}
                            selectedProductId={item.productId}
                            onSelectProduct={(id) => handleProductChange(index, id)}
                          />
                        </div>

                        {/* Quantidade Solicitada (Informativo / Referência) */}
                        <div className="w-24 flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 font-mono font-bold text-xs border border-gray-200">
                            {item.requestedQuantity !== undefined ? item.requestedQuantity : item.quantity} {item.productUnit || "un"}
                          </span>
                        </div>

                        {/* Quantidade Comprada (Editável) */}
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleQuantityChange(index, parseInt(e.target.value, 10) || 0)
                            }
                            className="text-xs h-9 rounded-lg border-orange-200 focus:border-[#E2661D] text-center font-bold text-gray-900"
                            title="Defina a quantidade que realmente deseja comprar"
                          />
                        </div>

                        {/* Preço Unitário (Editável) */}
                        <div className="w-28">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={item.unitCost ?? ""}
                              onChange={(e) =>
                                handleCostChange(index, parseFloat(e.target.value) || 0)
                              }
                              className="text-xs h-9 pl-7 rounded-lg border-orange-200 focus:border-[#E2661D] font-mono font-semibold"
                            />
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="w-24 text-right font-mono font-bold text-xs text-gray-900 pr-1">
                          {formatCurrency(subtotal)}
                        </div>

                        {/* Excluir */}
                        <div className="w-8 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="p-1 text-gray-300 hover:text-rose-600 disabled:opacity-20 rounded"
                            title="Remover item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Rodapé com Resumo de Valor Total */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-orange-50/60 border border-orange-200">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-[#E2661D]" />
              <span className="text-xs font-semibold text-orange-950">
                Total recalculado para {items.length} tipo(s) de peça(s)
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10.5px] uppercase font-bold text-orange-700 tracking-wider mr-2">
                Valor Total do Pedido:
              </span>
              <span className="text-base font-black font-mono text-gray-950">
                {formatCurrency(totalOrderValue)}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9 text-xs rounded-xl border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingInitial}
              className="h-9 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-xl gap-2 shadow-xs"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

