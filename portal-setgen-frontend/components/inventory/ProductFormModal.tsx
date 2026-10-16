"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product, SupplierQuotation } from "@/types";
import { inventoryApi } from "@/lib/api/inventory";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
}

const UNITS = [
  "un",
  "pç",
  "m",
  "m²",
  "m³",
  "cj",
  "vb",
  "kg",
  "rl",
  "cx",
  "par",
  "h",
  "dia",
  "sv",
  "kit",
  "l",
];

export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("un");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [marginPercent, setMarginPercent] = useState<string>("30");
  const [fixedSalePrice, setFixedSalePrice] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [currentStock, setCurrentStock] = useState<string>("0");
  const [minStock, setMinStock] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista de Cotações dos Fornecedores
  const [quotations, setQuotations] = useState<
    Array<{
      id: string;
      supplier: string;
      costPrice: string;
      quotationDate: string;
      isUsed: boolean;
    }>
  >([
    {
      id: "1",
      supplier: "",
      costPrice: "",
      quotationDate: new Date().toISOString().split("T")[0],
      isUsed: true,
    },
    {
      id: "2",
      supplier: "",
      costPrice: "",
      quotationDate: new Date().toISOString().split("T")[0],
      isUsed: false,
    },
  ]);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || "");
      setUnit(productToEdit.unit || "un");
      setCode(productToEdit.code || "");
      setCategory(productToEdit.category || "");
      setMarginPercent(
        productToEdit.marginPercent !== undefined
          ? String(productToEdit.marginPercent)
          : "30"
      );
      setFixedSalePrice(
        productToEdit.fixedSalePrice !== undefined && productToEdit.fixedSalePrice !== null
          ? String(productToEdit.fixedSalePrice)
          : ""
      );
      setNotes(productToEdit.notes || "");
      setCurrentStock(String(productToEdit.currentStock ?? 0));
      setMinStock(String(productToEdit.minStock ?? 0));

      if (
        Array.isArray(productToEdit.supplierQuotations) &&
        productToEdit.supplierQuotations.length > 0
      ) {
        setQuotations(
          productToEdit.supplierQuotations.map((q, idx) => ({
            id: String(idx + 1),
            supplier: q.supplier || "",
            costPrice: q.costPrice !== undefined ? String(q.costPrice) : "",
            quotationDate: q.quotationDate
              ? String(q.quotationDate).split("T")[0]
              : new Date().toISOString().split("T")[0],
            isUsed: Boolean(q.isUsed),
          }))
        );
      } else if (productToEdit.unitCost) {
        setQuotations([
          {
            id: "1",
            supplier: "Referência",
            costPrice: String(productToEdit.unitCost),
            quotationDate: new Date().toISOString().split("T")[0],
            isUsed: true,
          },
        ]);
      }
    } else {
      // Reset para criação
      setName("");
      setUnit("un");
      setCode("");
      setCategory("");
      setMarginPercent("30");
      setFixedSalePrice("");
      setNotes("");
      setCurrentStock("0");
      setMinStock("0");
      setQuotations([
        {
          id: "1",
          supplier: "",
          costPrice: "",
          quotationDate: new Date().toISOString().split("T")[0],
          isUsed: true,
        },
        {
          id: "2",
          supplier: "",
          costPrice: "",
          quotationDate: new Date().toISOString().split("T")[0],
          isUsed: false,
        },
      ]);
    }
    setError(null);
  }, [productToEdit, isOpen]);

  // Cálculo Dinâmico de Custo e Venda
  const { effectiveCost, effectiveSale, marginLabel } = useMemo(() => {
    // Acha a cotação marcada como "usar" ou a de menor preço
    const validQuotes = quotations
      .map((q) => ({
        ...q,
        priceNum: parseFloat(q.costPrice.replace(",", ".")),
      }))
      .filter((q) => !isNaN(q.priceNum) && q.priceNum > 0);

    let cost: number | null = null;
    const usedQuote = validQuotes.find((q) => q.isUsed);

    if (usedQuote) {
      cost = usedQuote.priceNum;
    } else if (validQuotes.length > 0) {
      cost = Math.min(...validQuotes.map((q) => q.priceNum));
    }

    const fixed = parseFloat(fixedSalePrice.replace(",", "."));
    const margin = parseFloat(marginPercent.replace(",", ".")) || 30;

    let sale: number | null = null;
    let label = `margem ${margin}%, padrão`;

    if (!isNaN(fixed) && fixed > 0) {
      sale = fixed;
      label = "venda fixa";
    } else if (cost !== null) {
      sale = cost * (1 + margin / 100);
    }

    return {
      effectiveCost: cost,
      effectiveSale: sale,
      marginLabel: label,
    };
  }, [quotations, fixedSalePrice, marginPercent]);

  const handleAddSupplier = () => {
    setQuotations((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        supplier: "",
        costPrice: "",
        quotationDate: new Date().toISOString().split("T")[0],
        isUsed: false,
      },
    ]);
  };

  const handleRemoveSupplier = (id: string) => {
    if (quotations.length <= 1) return;
    setQuotations((prev) => prev.filter((q) => q.id !== id));
  };

  const handleSelectUsed = (id: string) => {
    setQuotations((prev) =>
      prev.map((q) => ({
        ...q,
        isUsed: q.id === id,
      }))
    );
  };

  const handleUpdateSupplier = (
    id: string,
    field: "supplier" | "costPrice" | "quotationDate",
    value: string
  ) => {
    setQuotations((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome / descrição do produto é obrigatório.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsedMargin = parseFloat(marginPercent.replace(",", ".")) || 30;
      const parsedFixedSale = fixedSalePrice
        ? parseFloat(fixedSalePrice.replace(",", "."))
        : null;

      const formattedQuotations: SupplierQuotation[] = quotations
        .filter((q) => q.supplier.trim() || q.costPrice.trim())
        .map((q) => ({
          supplier: q.supplier.trim() || "Fornecedor",
          costPrice: parseFloat(q.costPrice.replace(",", ".")) || 0,
          quotationDate: q.quotationDate,
          isUsed: q.isUsed,
        }));

      const payload: any = {
        name: name.trim(),
        unit,
        code: code.trim() || undefined,
        category: category.trim() || undefined,
        marginPercent: parsedMargin,
        fixedSalePrice: parsedFixedSale,
        unitCost: effectiveCost ?? undefined,
        salePrice: effectiveSale ?? undefined,
        notes: notes.trim() || undefined,
        currentStock: parseInt(currentStock, 10) || 0,
        minStock: parseInt(minStock, 10) || 0,
        supplierQuotations: formattedQuotations,
      };

      if (productToEdit) {
        await inventoryApi.update(productToEdit.id, payload);
      } else {
        // Gera código se vazio
        if (!payload.code) {
          payload.code = `PRD-${Date.now().toString().slice(-6)}`;
        }
        await inventoryApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      setError(
        err.response?.data?.message ||
          "Erro ao salvar produto. Verifique os dados informados."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 border border-gray-200">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#0B2238]">
            {productToEdit ? "Editar produto" : "Novo produto"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário Fidedigno ao Print */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Linha 1: Nome e Unidade */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                NOME / DESCRIÇÃO
              </Label>
              <Input
                placeholder="Ex.: Cabo flexível 10 mm² preto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                UNIDADE
              </Label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Linha 2: Código e Categoria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                CÓDIGO
              </Label>
              <Input
                placeholder="Opcional"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                CATEGORIA
              </Label>
              <Input
                placeholder="Ex.: Cabos, Disjuntores"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Linha 3: Margem % e Venda Fixa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                MARGEM % (vazio = padrão)
              </Label>
              <Input
                placeholder="Padrão (30%)"
                value={marginPercent}
                onChange={(e) => setMarginPercent(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                VENDA FIXA (R$)
              </Label>
              <Input
                placeholder="Automática"
                value={fixedSalePrice}
                onChange={(e) => setFixedSalePrice(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Linha 4: Cotações dos Fornecedores */}
          <div className="space-y-2 pt-1">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              COTAÇÕES DOS FORNECEDORES
            </Label>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 gap-2 bg-gray-50/80 px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <div className="col-span-5">FORNECEDOR</div>
                <div className="col-span-3">PREÇO (R$)</div>
                <div className="col-span-3">DATA</div>
                <div className="col-span-1 text-center">USAR</div>
              </div>

              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                {quotations.map((q) => (
                  <div
                    key={q.id}
                    className="grid grid-cols-12 gap-2 px-3 py-2 items-center hover:bg-gray-50/50"
                  >
                    <div className="col-span-5">
                      <Input
                        placeholder="Fornecedor"
                        value={q.supplier}
                        onChange={(e) =>
                          handleUpdateSupplier(q.id, "supplier", e.target.value)
                        }
                        className="h-8 text-xs border-gray-200"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Preço"
                        value={q.costPrice}
                        onChange={(e) =>
                          handleUpdateSupplier(q.id, "costPrice", e.target.value)
                        }
                        className="h-8 text-xs border-gray-200"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="date"
                        value={q.quotationDate}
                        onChange={(e) =>
                          handleUpdateSupplier(
                            q.id,
                            "quotationDate",
                            e.target.value
                          )
                        }
                        className="h-8 text-xs border-gray-200"
                      />
                    </div>
                    <div className="col-span-1 flex items-center justify-center gap-1.5">
                      <input
                        type="radio"
                        name="usedQuotation"
                        checked={q.isUsed}
                        onChange={() => handleSelectUsed(q.id)}
                        className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        title="Marcar como cotação padrão"
                      />
                      {quotations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupplier(q.id)}
                          className="text-gray-300 hover:text-red-500 p-0.5 rounded transition-colors"
                          title="Remover fornecedor"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSupplier}
              className="text-xs h-8 text-gray-700 border-gray-300 gap-1 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar fornecedor
            </Button>

            <p className="text-[11px] text-gray-400">
              O custo usado é o fornecedor marcado em &quot;usar&quot; ou, se nenhum
              estiver marcado, o de menor preço. Ao mudar um preço, atualize a data.
            </p>

            {/* Banner Dinâmico de Cálculo */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Custo:{" "}
                  {effectiveCost !== null
                    ? `R$ ${effectiveCost.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "—"}
                </span>
                <span className="mx-2 text-emerald-300">|</span>
                <span className="font-semibold">
                  Venda:{" "}
                  {effectiveSale !== null
                    ? `R$ ${effectiveSale.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "—"}
                </span>
                <span className="text-[11px] text-emerald-700 ml-1.5">
                  ({marginLabel})
                </span>
              </div>
            </div>
          </div>

          {/* Linha 5: Controle de Estoque e Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                ESTOQUE ATUAL
              </Label>
              <Input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                ESTOQUE MÍNIMO (ALERTA)
              </Label>
              <Input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="h-10 text-sm rounded-lg border-gray-200"
              />
            </div>
          </div>

          {/* Linha 6: Observações */}
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              OBSERVAÇÕES
            </Label>
            <textarea
              placeholder="Ex.: marca preferida, prazo de entrega..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Rodapé com Botões */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-6 rounded-lg text-sm text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-10 px-7 rounded-lg text-sm font-semibold bg-[#0A58CA] hover:bg-[#084298] text-white gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
