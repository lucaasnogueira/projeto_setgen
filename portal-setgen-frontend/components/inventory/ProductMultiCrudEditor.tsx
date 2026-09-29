"use client";

// =================================================================
// ProductMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central limpa + Rodapé fixo
// Sem wizard quebrado, com rascunho e campos claros
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Package, MapPin, DollarSign, FileText, Barcode,
  Save, Clock, CheckCircle, Plus, AlertCircle, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryApi } from "@/lib/api/inventory";
import { stockLocationsApi } from "@/lib/api/stock-locations";
import { Product, StockLocation } from "@/types";

type ProductTabKey = "identificacao" | "estoque" | "precos" | "fiscal";

interface Props {
  productId?: string;
  initialData?: Partial<Product>;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function ProductMultiCrudEditor({
  productId,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<ProductTabKey>("identificacao");

  // === 1. Identificação ===
  const [code, setCode] = useState(initialData?.code || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [unit, setUnit] = useState(initialData?.unit || "UN");
  const [barcode, setBarcode] = useState(initialData?.barcode || "");
  const [active, setActive] = useState(initialData?.active ?? true);

  // === 2. Estoque & Localização ===
  const [currentStock, setCurrentStock] = useState<number>(Number(initialData?.currentStock) || 0);
  const [minStock, setMinStock] = useState<number>(Number(initialData?.minStock) || 0);
  const [locationId, setLocationId] = useState(initialData?.locationId || "");

  // === 3. Preços & Custos ===
  const [unitPrice, setUnitPrice] = useState<string>(
    initialData?.unitPrice !== undefined ? String(initialData.unitPrice) : ""
  );
  const [unitCost, setUnitCost] = useState<string>(
    initialData?.unitCost !== undefined ? String(initialData.unitCost) : ""
  );

  // === 4. Fiscal / Embalagem ===
  const [ncm, setNcm] = useState(initialData?.ncm || "");
  const [unitsPerPackage, setUnitsPerPackage] = useState<string>(
    initialData?.unitsPerPackage !== undefined ? String(initialData.unitsPerPackage) : "1"
  );

  // === Catálogos ===
  const [locations, setLocations] = useState<StockLocation[]>([]);

  // === UI States ===
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    stockLocationsApi.getAll().then(setLocations).catch(() => []);
  }, []);

  // Rascunho local via localStorage
  useEffect(() => {
    if (!productId) {
      try {
        const d = JSON.parse(localStorage.getItem("setgen_product_draft") || "{}");
        if (d.name || d.code) setDraftNotice(true);
      } catch {}
    }
  }, [productId]);

  const restoreDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem("setgen_product_draft") || "{}");
      if (d.code) setCode(d.code);
      if (d.name) setName(d.name);
      if (d.description) setDescription(d.description);
      if (d.unit) setUnit(d.unit);
      if (d.barcode) setBarcode(d.barcode);
      if (d.currentStock !== undefined) setCurrentStock(d.currentStock);
      if (d.minStock !== undefined) setMinStock(d.minStock);
      if (d.locationId) setLocationId(d.locationId);
      if (d.unitPrice) setUnitPrice(d.unitPrice);
      if (d.unitCost) setUnitCost(d.unitCost);
      if (d.ncm) setNcm(d.ncm);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_product_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_product_draft",
      JSON.stringify({
        code, name, description, unit, barcode, currentStock, minStock,
        locationId, unitPrice, unitCost, ncm, unitsPerPackage
      })
    );
    alert("Rascunho do produto salvo!");
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nome da peça/produto é obrigatório";
    if (!code.trim()) e.code = "Código de identificação é obrigatório";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      setActiveTab("identificacao");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload: any = {
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        unit: unit.trim() || "UN",
        barcode: barcode.trim() || undefined,
        currentStock: Number(currentStock) || 0,
        minStock: Number(minStock) || 0,
        locationId: locationId || undefined,
        unitPrice: unitPrice ? Number(unitPrice) : undefined,
        unitCost: unitCost ? Number(unitCost) : undefined,
        ncm: ncm.trim() || undefined,
        unitsPerPackage: unitsPerPackage ? Number(unitsPerPackage) : 1,
        active,
      };

      if (productId) {
        await inventoryApi.update(productId, payload);
      } else {
        await inventoryApi.create(payload);
        localStorage.removeItem("setgen_product_draft");
      }

      alert(productId ? "Peça/Produto atualizado com sucesso!" : "Peça/Produto cadastrado no estoque com sucesso!");
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: ProductTabKey; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "identificacao", icon: Package, label: "Identificação da Peça" },
    { key: "estoque", icon: MapPin, label: "Estoque & Localização" },
    { key: "precos", icon: DollarSign, label: "Preços & Custos" },
    { key: "fiscal", icon: FileText, label: "Dados Fiscais / NCM" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <Package className="w-4 h-4 text-orange-600" />
              {productId ? "Editar Peça" : "Nova Peça / Produto"}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${active ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-600"}`}>
              {active ? "Ativo" : "Inativo"}
            </span>
          </div>

          {draftNotice && !productId && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[11px]">
                <Clock className="w-3.5 h-3.5 text-amber-600" />Rascunho Encontrado
              </div>
              <p className="text-[10.5px] leading-tight">Você tem dados salvos de uma sessão anterior.</p>
              <div className="flex items-center gap-1.5 pt-1">
                <button type="button" onClick={restoreDraft} className="px-2 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">Restaurar</button>
                <button type="button" onClick={discardDraft} className="px-2 py-0.5 bg-white border border-amber-300 text-amber-700 rounded text-[10px]">Descartar</button>
              </div>
            </div>
          )}

          {/* Navegação por abas verticais */}
          <nav className="space-y-1">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all ${
                  activeTab === key
                    ? "bg-orange-50 text-orange-700 border border-orange-200 shadow-xs"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${activeTab === key ? "text-orange-600" : "text-gray-400"}`} />
                <span className="truncate">{label}</span>
                {errors[key] && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
              </button>
            ))}
          </nav>

          <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-1.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Saldo Físico</span>
            <div className="text-sm font-black text-gray-900">
              {currentStock} {unit}
            </div>
            <div className="text-[10.5px] text-gray-500">
              Mínimo: {minStock} {unit}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
          <span>Setgen Estoque</span>
          <button type="button" onClick={handleSaveDraft} className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold">
            <Save className="w-3 h-3" />Rascunho
          </button>
        </div>
      </aside>

      {/* ===== ÁREA CENTRAL ===== */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header da aba ativa */}
        <div className="h-12 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {tabs.filter(t => t.key === activeTab).map(({ icon: Icon, label }) => (
              <React.Fragment key={label}>
                <Icon className="w-4 h-4 text-orange-600" />
                <span className="font-bold text-gray-900 text-sm">{label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Conteúdo scrollável (#FAFAFB) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs bg-[#FAFAFB]">

          {/* ══ ABA 1: IDENTIFICAÇÃO ═══════════════════════════════ */}
          {activeTab === "identificacao" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-600" />Dados Cadastrais da Peça
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <Label className="block font-semibold text-gray-700 mb-1">Nome do Item / Peça *</Label>
                    <Input
                      placeholder="Ex: Filtro de Combustível Racor 500kVA"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                    {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Código Interno / Part Number *</Label>
                    <Input
                      placeholder="Ex: FLT-500-RAC"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                    {errors.code && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.code}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Unidade de Medida</Label>
                    <select
                      value={unit}
                      onChange={e => setUnit(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                    >
                      {["UN", "PC", "CX", "KG", "L", "M", "M²", "HR"].map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <Label className="block font-semibold text-gray-700 mb-1">Código de Barras / EAN</Label>
                    <Input
                      placeholder="Ex: 7891234567890"
                      value={barcode}
                      onChange={e => setBarcode(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Descrição Detalhada / Aplicação Técnica</Label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Compatibilidade com geradores Cummins, Scania, MWM, especificações técnicas..."
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: ESTOQUE & LOCALIZAÇÃO ═══════════════════════ */}
          {activeTab === "estoque" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />Controle de Saldo & Endereçamento
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Estoque Físico Atual</Label>
                    <Input
                      type="number"
                      min={0}
                      value={currentStock}
                      onChange={e => setCurrentStock(Number(e.target.value) || 0)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Estoque Mínimo (Ponto de Reposição)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={minStock}
                      onChange={e => setMinStock(Number(e.target.value) || 0)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Endereço no Almoxarifado / Prateleira</Label>
                  <select
                    value={locationId}
                    onChange={e => setLocationId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 max-w-md"
                  >
                    <option value="">Selecione uma localização física...</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.code} {loc.description ? `· ${loc.description}` : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3: PREÇOS & CUSTOS ═════════════════════════════ */}
          {activeTab === "precos" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-600" />Valores Comerciais & Custos
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Preço de Venda Unitário (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0,00"
                      value={unitPrice}
                      onChange={e => setUnitPrice(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                    <p className="text-[10.5px] text-gray-400 mt-1">Preço sugerido para orçamentos e faturamento</p>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Custo Médio de Aquisição (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0,00"
                      value={unitCost}
                      onChange={e => setUnitCost(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                    <p className="text-[10.5px] text-gray-400 mt-1">Custo contábil médio de entrada</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 4: FISCAL / NCM ═════════════════════════════════ */}
          {activeTab === "fiscal" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />Tributação & Embalagem
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Código NCM</Label>
                    <Input
                      placeholder="Ex: 8421.23.00"
                      value={ncm}
                      onChange={e => setNcm(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Unidades por Embalagem / Caixa</Label>
                    <Input
                      type="number"
                      min={1}
                      value={unitsPerPackage}
                      onChange={e => setUnitsPerPackage(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ===== RODAPÉ FIXO (PADRÃO CLIENTE) ===== */}
        <div className="h-14 bg-white border-t border-gray-200 px-6 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSaveDraft}
            className="text-xs text-gray-600 hover:text-orange-600 gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />Salvar Rascunho
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-lg h-9 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={handleSave}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs rounded-lg h-9 px-5 gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : productId ? "Salvar Alterações" : "Cadastrar Peça"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
