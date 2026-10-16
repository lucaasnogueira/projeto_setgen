"use client";

import React, { useState, useEffect } from "react";
import { X, ArrowDownRight, ArrowUpRight, Save, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product, MovementType, ServiceOrder } from "@/types";
import { inventoryApi } from "@/lib/api/inventory";
import { ordersApi } from "@/lib/api/orders";
import { useCanViewValues } from "@/lib/permissions";

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: Product[];
  defaultProduct?: Product | null;
  defaultType?: "ENTRY" | "EXIT";
}

export function StockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  products,
  defaultProduct,
  defaultType = "ENTRY",
}: StockMovementModalProps) {
  const canViewValues = useCanViewValues();
  const [selectedProductId, setSelectedProductId] = useState(
    defaultProduct?.id || (products[0]?.id ?? "")
  );
  const [movementType, setMovementType] = useState<MovementType>(
    defaultType === "ENTRY" ? MovementType.ENTRY : MovementType.EXIT
  );
  const [quantity, setQuantity] = useState<string>("1");
  const [unitCost, setUnitCost] = useState<string>("");
  const [reason, setReason] = useState("");
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Carregar Ordens de Serviço para vincular ao fluxo
      ordersApi.getAll().then(setServiceOrders).catch(() => []);
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultProduct) {
      setSelectedProductId(defaultProduct.id);
      if (defaultProduct.unitCost) {
        setUnitCost(String(defaultProduct.unitCost));
      }
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
    setMovementType(defaultType === "ENTRY" ? MovementType.ENTRY : MovementType.EXIT);
    setQuantity("1");
    setReason("");
    setSelectedOrderId("");
    setError(null);
  }, [defaultProduct, defaultType, isOpen, products]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setError("Selecione um produto.");
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      setError("A quantidade deve ser maior que zero.");
      return;
    }

    if (
      (movementType === MovementType.EXIT ||
        movementType === MovementType.ADJUSTMENT_OUT) &&
      selectedProduct &&
      qty > selectedProduct.currentStock
    ) {
      setError(
        `Estoque insuficiente. Disponível no momento: ${selectedProduct.currentStock} ${selectedProduct.unit}.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedUnitCost = unitCost
        ? parseFloat(unitCost.replace(",", "."))
        : undefined;

      let finalReason = reason.trim();
      if (selectedOrderId) {
        const os = serviceOrders.find((o) => o.id === selectedOrderId);
        const osRef = os ? `OS #${os.orderNumber} (${os.client?.companyName || "Cliente"})` : `OS #${selectedOrderId}`;
        finalReason = finalReason ? `${osRef} — ${finalReason}` : osRef;
      }

      await inventoryApi.createMovement({
        productId: selectedProductId,
        quantity: qty,
        type: movementType,
        unitCost: parsedUnitCost,
        reason: finalReason || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao registrar movimentação:", err);
      setError(
        err.response?.data?.message ||
          "Erro ao movimentar estoque. Verifique os dados."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEntry =
    movementType === MovementType.ENTRY ||
    movementType === MovementType.ADJUSTMENT_IN;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isEntry ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              }`}
            >
              {isEntry ? (
                <ArrowDownRight className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {isEntry ? "Entrada de Material no Almoxarifado" : "Saída de Material (Consumo no Fluxo)"}
              </h2>
              <p className="text-xs text-gray-500">
                {isEntry
                  ? "Entrada por compra ou devolução de obra"
                  : "Baixa de material para Ordem de Serviço ou oficina"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Selecionar Produto */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">
              Produto / Material
            </Label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p && p.unitCost) setUnitCost(String(p.unitCost));
              }}
              className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ""} — Saldo: {p.currentStock}{" "}
                  {p.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Info de Estoque Atual */}
          {selectedProduct && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs flex justify-between items-center text-gray-600">
              <span>
                Estoque atual:{" "}
                <strong className="text-gray-900 text-sm">
                  {selectedProduct.currentStock} {selectedProduct.unit}
                </strong>
              </span>
              <span>
                Mínimo de Alerta: <strong>{selectedProduct.minStock} {selectedProduct.unit}</strong>
              </span>
            </div>
          )}

          {/* Tipo de Movimentação */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">
              Tipo de Movimentação
            </Label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as MovementType)}
              className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <optgroup label="Entradas (+)">
                <option value={MovementType.ENTRY}>Entrada por Compra / Nota Fiscal</option>
                <option value={MovementType.ADJUSTMENT_IN}>
                  Devolução de Sobra de OS / Ajuste Positivo
                </option>
              </optgroup>
              <optgroup label="Saídas (-)">
                <option value={MovementType.EXIT}>
                  Aplicação em Ordem de Serviço (Fluxo Técnico)
                </option>
                <option value={MovementType.ADJUSTMENT_OUT}>
                  Consumo Interno / Descarte / Perda
                </option>
              </optgroup>
            </select>
          </div>

          {/* Vínculo com Ordem de Serviço (Coesão com o Fluxo) */}
          <div className="space-y-1 p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Vincular à Ordem de Serviço (Opcional)</span>
            </div>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full h-9 px-2.5 text-xs bg-white border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            >
              <option value="">Nenhum vínculo (Movimentação avulsa)</option>
              {serviceOrders.map((os) => (
                <option key={os.id} value={os.id}>
                  OS #{os.orderNumber} — {os.client?.companyName || "Cliente"} ({os.status})
                </option>
              ))}
            </select>
            <p className="text-[10.5px] text-blue-700">
              Associa a saída da peça diretamente à execução do serviço para o cliente.
            </p>
          </div>

          {/* Quantidade e Custo */}
          <div className={canViewValues ? "grid grid-cols-2 gap-3" : "space-y-1"}>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">
                Quantidade
              </Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
                required
              />
            </div>
            {canViewValues && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">
                  Custo Unitário (R$, opcional)
                </Label>
                <Input
                  placeholder="R$ 0,00"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="h-10 text-sm rounded-lg border-gray-200"
                />
              </div>
            )}
          </div>

          {/* Motivo / Detalhes */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">
              Observações / Referência
            </Label>
            <textarea
              placeholder="Ex.: Troca de cabos no gerador, NF-1234, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`h-9 px-5 rounded-lg text-xs font-semibold text-white gap-2 shadow-xs ${
                isEntry
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              {loading ? "Registrando..." : isEntry ? "Confirmar Entrada" : "Confirmar Saída"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
