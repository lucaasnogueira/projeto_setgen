"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Package, Search, Check, ChevronDown, X } from "lucide-react";
import { Product } from "@/types";

interface ProductComboboxProps {
  products: Product[];
  selectedProductId?: string;
  onSelectProduct: (productId: string) => void;
  placeholder?: string;
}

export function ProductCombobox({
  products,
  selectedProductId,
  onSelectProduct,
  placeholder = "Selecione ou pesquise o produto/peça...",
}: ProductComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products.slice(0, 50); // Mostra primeiros 50 por performance
    const term = searchTerm.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(term) ||
          p.code?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term)
      )
      .slice(0, 50);
  }, [products, searchTerm]);

  const handleSelect = (id: string) => {
    onSelectProduct(id);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Botão Gatilho */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs h-9 px-3 rounded-lg border border-gray-200 bg-white hover:border-gray-300 flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30 transition-all"
      >
        <div className="flex items-center gap-2 truncate">
          <Package className="h-3.5 w-3.5 text-[#E2661D] shrink-0" />
          <span
            className={`truncate ${
              selectedProduct ? "font-bold text-gray-900" : "text-gray-400"
            }`}
          >
            {selectedProduct
              ? `${selectedProduct.code ? `[${selectedProduct.code}] ` : ""}${selectedProduct.name}`
              : placeholder}
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" />
      </button>

      {/* Dropdown de Busca */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
            <Search className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Digite o código SKU ou nome da peça..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-xs outline-none placeholder:text-gray-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-gray-50">
            {filteredProducts.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                Nenhum produto encontrado com "{searchTerm}".
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedProductId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                      isSelected
                        ? "bg-orange-50 text-[#E2661D] font-bold"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-semibold">
                        {p.code ? (
                          <span className="font-mono text-gray-500 mr-1.5">
                            [{p.code}]
                          </span>
                        ) : null}
                        {p.name}
                      </p>
                      <p className="text-[10.5px] text-gray-500 mt-0.5">
                        Saldo Físico: <strong>{p.currentStock || 0}</strong> {p.unit || "un"}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-[#E2661D] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

