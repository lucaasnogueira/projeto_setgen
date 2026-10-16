"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  ShoppingCart,
  Building,
  Calendar,
  Package,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suppliersApi } from "@/lib/api/suppliers";
import { inventoryApi } from "@/lib/api/inventory";
import { procurementOrdersApi, CreateProcurementOrderPayload } from "@/lib/api/procurement-orders";
import { Supplier, Product, ProcurementOrder } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useCanViewValues } from "@/lib/permissions";
import { SupplierCombobox } from "./SupplierCombobox";
import { ProductCombobox } from "./ProductCombobox";

interface ItemRow {
  productId: string;
  quantity: number;
  unitCost: number;
}

interface NewProcurementOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (order: ProcurementOrder) => void;
  initialProductId?: string;
  initialQuantity?: number;
  initialMaterialRequestId?: string;
  initialItems?: Array<{ productId: string; quantity: number; unitCost?: number }>;
}

export function NewProcurementOrderModal({
  isOpen,
  onClose,
  onSuccess,
  initialProductId,
  initialQuantity = 1,
  initialMaterialRequestId,
  initialItems,
}: NewProcurementOrderModalProps) {
  const canViewValues = useCanViewValues();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form states
  const [supplierId, setSupplierId] = useState<string>("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>("");
  const [materialRequestId, setMaterialRequestId] = useState<string>(initialMaterialRequestId || "");
  const [items, setItems] = useState<ItemRow[]>([
    {
      productId: initialProductId || "",
      quantity: initialQuantity > 0 ? initialQuantity : 1,
      unitCost: 0,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingInitial(true);
    setErrorMessage(null);

    Promise.all([suppliersApi.getAll(true), inventoryApi.getAll()])
      .then(([suppliersData, productsData]) => {
        if (!isMounted) return;
        setSuppliers(suppliersData || []);
        setProducts(productsData || []);

        if (initialItems && initialItems.length > 0) {
          setItems(
            initialItems.map((it) => {
              const p = (productsData || []).find((prod) => prod.id === it.productId);
              return {
                productId: it.productId,
                quantity: it.quantity > 0 ? it.quantity : 1,
                unitCost: it.unitCost !== undefined ? it.unitCost : p?.unitCost ? Number(p.unitCost) : 0,
              };
            })
          );
        } else if (initialProductId) {
          const prod = (productsData || []).find((p) => p.id === initialProductId);
          if (prod) {
            setItems([
              {
                productId: prod.id,
                quantity: initialQuantity > 0 ? initialQuantity : 1,
                unitCost: prod.unitCost ? Number(prod.unitCost) : 0,
              },
            ]);
          }
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar dados do modal de compra:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingInitial(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialProductId, initialQuantity, initialItems]);

  if (!isOpen) return null;

  const handleProductChange = (index: number, newProductId: string) => {
    const selectedProd = products.find((p) => p.id === newProductId);
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: newProductId,
      unitCost: selectedProd?.unitCost ? Number(selectedProd.unitCost) : updated[index].unitCost || 0,
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
    if (items.length <= 1) return;
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
      setErrorMessage("Adicione pelo menos um produto ao pedido de compra.");
      return;
    }

    for (const it of validItems) {
      if (!it.quantity || it.quantity < 1) {
        setErrorMessage("A quantidade de cada item deve ser de pelo menos 1 unidade.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload: CreateProcurementOrderPayload = {
        supplierId: supplierId ? supplierId : undefined,
        materialRequestId: materialRequestId ? materialRequestId : undefined,
        expectedDeliveryDate: expectedDeliveryDate ? expectedDeliveryDate : undefined,
        items: validItems.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost || 0),
        })),
      };

      const created = await procurementOrdersApi.create(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar pedido de compra:", err);
      setErrorMessage(
        err.response?.data?.message || "Ocorreu um erro ao criar o pedido de compra."
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
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  OC-2026-NOVA
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                  Rascunho de Compra
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                Novo Pedido de Compra de Peças & Insumos
              </h2>
              <p className="text-xs text-gray-500">
                Reposição de estoque ou atendimento direto a ordens de serviço
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loadingInitial ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-[#E2661D]" />
              <span className="text-xs">Carregando catálogo de produtos e fornecedores...</span>
            </div>
          ) : (
            <>
              {/* Informações Básicas (Fornecedor e Prazo) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-gray-400" />
                    Fornecedor (Opcional p/ Cotação)
                  </Label>
                  <SupplierCombobox
                    suppliers={suppliers}
                    selectedSupplierId={supplierId}
                    onSelectSupplier={(id) => setSupplierId(id)}
                    onSupplierCreated={(newSup) => setSuppliers((prev) => [newSup, ...prev])}
                    emptyLabel="A definir / Em cotação aberta"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Previsão de Entrega
                  </Label>
                  <Input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="text-xs h-9 rounded-lg border-gray-200"
                  />
                </div>
              </div>

              {/* Tabela de Itens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-[#E2661D]" />
                    Itens e Peças do Pedido ({items.length})
                  </Label>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs font-bold gap-1.5 h-8 border-gray-200 text-[#E2661D] hover:bg-orange-50 hover:border-orange-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Outra Peça
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-gray-50/30">
                  {items.map((item, index) => {
                    const subtotal = (item.quantity || 0) * (item.unitCost || 0);
                    const selectedProd = products.find((p) => p.id === item.productId);

                    return (
                      <div
                        key={index}
                        className="p-3.5 bg-white flex flex-col md:flex-row items-stretch md:items-center gap-3"
                      >
                        {/* Produto com Busca em Tempo Real */}
                        <div className="flex-1 min-w-[220px]">
                          <ProductCombobox
                            products={products}
                            selectedProductId={item.productId}
                            onSelectProduct={(id) => handleProductChange(index, id)}
                          />
                          {selectedProd && (
                            <div className="text-[11px] text-gray-500 mt-1 pl-1">
                              Saldo Físico Atual: <strong>{selectedProd.currentStock || 0} {selectedProd.unit || "un"}</strong>
                            </div>
                          )}
                        </div>

                        {/* Quantidade */}
                        <div className="w-24">
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qtd"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              handleQuantityChange(index, parseInt(e.target.value, 10) || 0)
                            }
                            className="text-xs h-9 rounded-lg border-gray-200 text-center font-bold"
                          />
                        </div>

                        {/* Custo Unitário */}
                        <div className="w-32">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-mono">
                              R$
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0,00"
                              value={item.unitCost || ""}
                              onChange={(e) =>
                                handleCostChange(index, parseFloat(e.target.value) || 0)
                              }
                              className="text-xs h-9 pl-8 rounded-lg border-gray-200 font-mono"
                            />
                          </div>
                        </div>

                        {/* Subtotal */}
                        <div className="w-28 text-right pr-2">
                          <span className="text-xs font-bold text-gray-900 font-mono">
                            {formatCurrency(subtotal)}
                          </span>
                        </div>

                        {/* Remover */}
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            disabled={items.length <= 1}
                            onClick={() => handleRemoveItem(index)}
                            className="p-1.5 text-gray-300 hover:text-rose-600 disabled:opacity-30 disabled:hover:text-gray-300 rounded-lg transition-colors"
                            title="Remover peça"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumo do Pedido */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="text-xs text-gray-600">
                    Total previsto para este pedido:{" "}
                    <strong className="text-gray-900 font-mono">
                      {items.reduce((acc, it) => acc + (it.quantity || 0), 0)} unidade(s)
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 mr-2">Valor Estimado:</span>
                    <span className="text-base font-bold text-gray-900 font-mono">
                      {formatCurrency(totalOrderValue)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg font-medium text-xs h-9 border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || loadingInitial}
              className="rounded-lg font-medium text-xs h-9 bg-gray-900 hover:bg-black text-white shadow-2xs gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Criando Pedido...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Confirmar e Criar Pedido
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
