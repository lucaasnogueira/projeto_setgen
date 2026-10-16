import React, { useState, useMemo } from "react";
import { AlertTriangle, Boxes, ChevronDown, ChevronUp, ShoppingCart, Search } from "lucide-react";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

interface LowStockAlertProps {
  products: Product[];
  onOrderSingle: (product: Product) => void;
  onOrderAll: () => void;
}

const INITIAL_DISPLAY_COUNT = 6;

export function LowStockAlert({
  products,
  onOrderSingle,
  onOrderAll,
}: LowStockAlertProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  if (products.length === 0) return null;

  const filteredProducts = useMemo(() => {
    if (!searchFilter.trim()) return products;
    const term = searchFilter.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.code && p.code.toLowerCase().includes(term))
    );
  }, [products, searchFilter]);

  const displayedProducts = showAll
    ? filteredProducts
    : filteredProducts.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-3 sm:p-3.5 space-y-2.5 shadow-2xs">
      {/* Cabeçalho do Alerta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wide text-amber-950">
                {products.length} Peça(s) em Nível Crítico / Baixo Estoque
              </h4>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                Ação Preventiva
              </span>
            </div>
            <p className="text-[11px] text-amber-800">
              Estoque atual menor ou igual ao mínimo definido. Reponha antes que falte para novas ordens de serviço.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            size="sm"
            onClick={onOrderAll}
            className="h-7.5 px-3 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white rounded-lg shadow-2xs gap-1.5"
          >
            <Boxes className="h-3.5 w-3.5" />
            Repor Todos em Lote ({products.length})
          </Button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-amber-800 hover:bg-amber-100/70 transition-colors"
            title={isExpanded ? "Recolher lista" : "Expandir lista"}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Grade Suavizada de Itens com Baixo Estoque */}
      {isExpanded && (
        <div className="space-y-2 pt-1 border-t border-amber-200/60">
          {products.length > INITIAL_DISPLAY_COUNT && (
            <div className="flex items-center justify-between gap-2">
              <div className="relative w-64">
                <Search className="h-3 w-3 text-amber-600 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filtrar peças críticas..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-[11px] bg-white rounded-md border border-amber-200 text-gray-800 placeholder:text-gray-400 outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <span className="text-[11px] text-amber-800/80">
                Exibindo {displayedProducts.length} de {filteredProducts.length} peças
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {displayedProducts.map((p) => {
              const deficit = Math.max(1, (p.minStock || 1) * 2 - (p.currentStock || 0));
              return (
                <div
                  key={p.id}
                  className="px-2.5 py-1.5 bg-white rounded-lg border border-amber-200/80 flex items-center justify-between gap-2 text-xs shadow-2xs hover:border-amber-300 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-gray-500 font-semibold bg-slate-50 px-1 py-0.2 rounded border border-gray-100 shrink-0">
                        {p.code ? p.code : "S/C"}
                      </span>
                      <p className="font-bold text-gray-900 truncate text-[11.5px]">{p.name}</p>
                    </div>
                    <div className="text-[10.5px] text-gray-600 mt-0.5 flex items-center gap-1.5">
                      <span>
                        Atual: <strong className="text-rose-600">{p.currentStock || 0}</strong> / Mín: {p.minStock || 0} {p.unit || "un"}
                      </span>
                      {p.unitCost && (
                        <span className="text-gray-400">
                          • Est.: {formatCurrency(Number(p.unitCost))}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOrderSingle(p)}
                    className="h-6.5 px-2 text-[10.5px] font-bold border-amber-200 text-amber-900 hover:bg-amber-50 rounded-md shrink-0 gap-1 shadow-2xs"
                  >
                    <ShoppingCart className="h-3 w-3 text-[#E2661D]" />
                    Comprar (+{deficit})
                  </Button>
                </div>
              );
            })}
          </div>

          {filteredProducts.length > INITIAL_DISPLAY_COUNT && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer"
              >
                {showAll
                  ? "Recolher para as 6 mais críticas"
                  : `Ver todas as ${filteredProducts.length} peças críticas em grade completa...`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

