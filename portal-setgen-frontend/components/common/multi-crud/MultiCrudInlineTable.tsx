"use client";

import React, { useState } from "react";
import { Plus, Trash2, Package, Sparkles, AlertCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";

export interface MultiCrudItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  availableStock?: number;
  unit?: string;
}

export interface CatalogOption {
  id: string;
  code: string;
  name: string;
  unitPrice: number;
  availableStock?: number;
  category?: string;
}

export interface MultiCrudInlineTableProps {
  items: MultiCrudItem[];
  onChange: (items: MultiCrudItem[]) => void;
  catalogOptions?: CatalogOption[];
  onOpenQuickCreateModal?: () => void;
  title?: string;
  subtitle?: string;
  className?: string;
  readOnly?: boolean;
}

export function MultiCrudInlineTable({
  items,
  onChange,
  catalogOptions = [],
  onOpenQuickCreateModal,
  title = "Peças e Materiais Requisitados",
  subtitle = "Adicione itens do almoxarifado à ordem de serviço com controle automático de saldo.",
  className,
  readOnly = false,
}: MultiCrudInlineTableProps) {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(1);

  const selectedCatalogItem = catalogOptions.find((c) => c.id === selectedCatalogId);

  const handleAddItem = () => {
    if (!selectedCatalogItem || addQty <= 0) return;

    // Check if item already exists in list
    const existingIndex = items.findIndex((i) => i.id === selectedCatalogItem.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += addQty;
      onChange(updated);
    } else {
      const newItem: MultiCrudItem = {
        id: selectedCatalogItem.id,
        code: selectedCatalogItem.code,
        name: selectedCatalogItem.name,
        category: selectedCatalogItem.category,
        quantity: addQty,
        unitPrice: selectedCatalogItem.unitPrice,
        availableStock: selectedCatalogItem.availableStock,
        unit: "UN",
      };
      onChange([...items, newItem]);
    }

    setSelectedCatalogId("");
    setAddQty(1);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const updated = [...items];
    updated[index].quantity = newQty;
    onChange(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated);
  };

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Cabeçalho do Bloco Multi-CRUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E2661D]" />
            <span>{title}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#E2661D]">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {onOpenQuickCreateModal && !readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenQuickCreateModal}
            className="border-orange-200 text-[#E2661D] hover:bg-orange-50 font-semibold gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Cadastrar Nova Peça no Estoque</span>
          </Button>
        )}
      </div>

      {/* Seletor Rápido de Adição (Inline Toolbar) */}
      {!readOnly && (
        <div className="bg-slate-50/90 border border-gray-200/80 p-3 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
              Selecionar Peça do Almoxarifado
            </label>
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] transition-all"
            >
              <option value="">Selecione um item disponível no catálogo...</option>
              {catalogOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  [{opt.code}] {opt.name} — {formatCurrency(opt.unitPrice)} (Saldo: {opt.availableStock ?? 0})
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-36">
            <label className="text-[10px] font-bold uppercase text-slate-600 block mb-1">
              Quantidade
            </label>
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden h-9">
              <button
                type="button"
                onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                className="w-9 h-full bg-slate-50 border-r border-gray-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                -
              </button>
              <Input
                type="number"
                min={1}
                value={addQty}
                onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-full text-center rounded-none border-none font-bold text-slate-800 shadow-none focus-visible:ring-0 text-xs"
              />
              <button
                type="button"
                onClick={() => setAddQty((q) => q + 1)}
                className="w-9 h-full bg-slate-50 border-l border-gray-200 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-end pt-2 md:pt-0">
            <Button
              type="button"
              onClick={handleAddItem}
              disabled={!selectedCatalogId}
              className="h-9 bg-[#E2661D] hover:bg-[#c95514] text-white font-bold gap-1.5 px-4 w-full md:w-auto rounded-lg shadow-2xs text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar à O.S.</span>
            </Button>
          </div>
        </div>
      )}

      {/* Tabela de Itens Adicionados */}
      <div className="border border-gray-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-gray-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3.5">Item & Código</th>
              <th className="py-2.5 px-3.5 hidden sm:table-cell">Categoria</th>
              <th className="py-2.5 px-3.5 text-center">Quantidade</th>
              <th className="py-2.5 px-3.5 text-right">Valor Unitário</th>
              <th className="py-2.5 px-3.5 text-right">Subtotal</th>
              {!readOnly && <th className="py-2.5 px-3.5 text-center w-14">Ação</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                      Nenhuma peça ou material adicionado a esta ordem.
                    </p>
                    <p className="text-xs text-slate-400">
                      Utilize o seletor acima para adicionar itens do almoxarifado.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const subtotal = item.quantity * item.unitPrice;
                const isLowStock = item.availableStock !== undefined && item.availableStock < item.quantity;

                return (
                  <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[11px] font-bold text-[#E2661D] bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">
                          {item.code}
                        </span>
                        {isLowStock && (
                          <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Saldo insuficiente ({item.availableStock} disp.)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 hidden sm:table-cell text-slate-500 text-xs">
                      {item.category || "Geral"}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {readOnly ? (
                        <span className="font-bold text-slate-800">{item.quantity}</span>
                      ) : (
                        <div className="inline-flex items-center border border-slate-200 rounded-md overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, item.quantity - 1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 font-bold text-slate-800 text-xs">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, item.quantity + 1)}
                            className="px-2 py-1 text-slate-500 hover:bg-slate-100 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-600 font-medium text-xs">
                      {formatCurrency(item.unitPrice)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                      {formatCurrency(subtotal)}
                    </td>

                    {!readOnly && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remover peça"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-slate-50/70 border-t border-slate-200 font-semibold text-slate-900">
              <tr>
                <td colSpan={readOnly ? 4 : 4} className="py-3 px-4 text-right text-xs uppercase text-slate-500">
                  Total de Peças & Materiais:
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-[#E2661D] text-base">
                  {formatCurrency(totalAmount)}
                </td>
                {!readOnly && <td></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}

