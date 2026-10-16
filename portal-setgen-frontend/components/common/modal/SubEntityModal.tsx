"use client";

import React, { useState } from "react";
import { CenteredModal } from "./CenteredModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PackagePlus, Factory, Sparkles, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubEntityType = "part" | "plant" | "client" | "custom";

export interface CreatedSubEntity {
  id: string;
  type: SubEntityType;
  name: string;
  code: string;
  category?: string;
  unitPrice?: number;
  stockQty?: number;
  details?: Record<string, any>;
}

export interface SubEntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: SubEntityType;
  onCreated: (entity: CreatedSubEntity) => void;
  title?: string;
}

export function SubEntityModal({
  open,
  onOpenChange,
  defaultType = "part",
  onCreated,
  title,
}: SubEntityModalProps) {
  const [activeTab, setActiveTab] = useState<SubEntityType>(defaultType);
  const [isSaving, setIsSaving] = useState(false);

  // Form states - Peça / Item de Almoxarifado
  const [partName, setPartName] = useState("");
  const [partSku, setPartSku] = useState("DISJ-50A-DC");
  const [partCategory, setPartCategory] = useState("Disjuntores & Proteções");
  const [partPrice, setPartPrice] = useState("185.00");
  const [partStock, setPartStock] = useState("15");
  const [partLocation, setPartLocation] = useState("Armazém Central - Rua B-04");

  // Form states - Usina / Planta Fotovoltaica
  const [plantName, setPlantName] = useState("");
  const [plantCode, setPlantCode] = useState("USN-GUA-02");
  const [plantCapacity, setPlantCapacity] = useState("75 kWp");
  const [plantLocationCity, setPlantLocationCity] = useState("Guaxupé - MG");

  const handleGenerateSku = () => {
    const random = Math.floor(100 + Math.random() * 900);
    if (activeTab === "part") {
      setPartSku(`EQP-${random}-DC`);
    } else {
      setPlantCode(`USN-${random}-BR`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      if (activeTab === "part") {
        const entity: CreatedSubEntity = {
          id: `item-${Date.now()}`,
          type: "part",
          name: partName.trim() || "Item Almoxarifado Sem Nome",
          code: partSku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
          category: partCategory,
          unitPrice: parseFloat(partPrice) || 0,
          stockQty: parseInt(partStock, 10) || 1,
          details: { location: partLocation },
        };
        onCreated(entity);
      } else {
        const entity: CreatedSubEntity = {
          id: `plant-${Date.now()}`,
          type: "plant",
          name: plantName.trim() || "Nova Usina Solar",
          code: plantCode.trim() || `USN-${Date.now().toString().slice(-4)}`,
          category: "Fotovoltaica",
          details: { capacity: plantCapacity, city: plantLocationCity },
        };
        onCreated(entity);
      }
      onOpenChange(false);
    }, 450);
  };

  const modalTitle =
    title || (activeTab === "part" ? "Cadastrar Nova Peça no Almoxarifado" : "Cadastrar Nova Usina / Planta");

  return (
    <CenteredModal
      open={open}
      onOpenChange={onOpenChange}
      title={modalTitle}
      description="Cadastre rapidamente o item e vincule diretamente à ordem sem perder as alterações da tela principal."
      badge="Atalho Rápido"
      size="2xl"
      icon={
        activeTab === "part" ? (
          <PackagePlus className="w-5 h-5" />
        ) : (
          <Factory className="w-5 h-5" />
        )
      }
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="border-slate-300 text-slate-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || (activeTab === "part" ? !partName : !plantName)}
            className="bg-[#E2661D] hover:bg-[#c95514] text-white font-bold gap-2 px-5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Cadastrando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Salvar e Injetar no Formulário</span>
              </>
            )}
          </Button>
        </>
      }
    >
      {/* Abas Superiores de Seleção de Tipo */}
      <div className="flex border-b border-slate-200 gap-4 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("part")}
          className={cn(
            "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
            activeTab === "part"
              ? "border-[#E2661D] text-[#E2661D]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <PackagePlus className="w-4 h-4" />
          <span>Peça / Material (Almoxarifado)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("plant")}
          className={cn(
            "pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors",
            activeTab === "plant"
              ? "border-[#E2661D] text-[#E2661D]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Factory className="w-4 h-4" />
          <span>Usina / Local Técnico</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === "part" ? (
          <>
            {/* Descrição e Código SKU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="partName" className="text-xs font-bold text-slate-700 uppercase">
                  Descrição do Material / Peça *
                </Label>
                <Input
                  id="partName"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="Ex: Disjuntor Curva C 50A Tripolar"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="partSku" className="text-xs font-bold text-slate-700 uppercase">
                    SKU / Código *
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] text-[#E2661D] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar
                  </button>
                </div>
                <Input
                  id="partSku"
                  value={partSku}
                  onChange={(e) => setPartSku(e.target.value)}
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Categoria e Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partCategory" className="text-xs font-bold text-slate-700 uppercase">
                  Categoria
                </Label>
                <Input
                  id="partCategory"
                  value={partCategory}
                  onChange={(e) => setPartCategory(e.target.value)}
                  placeholder="Ex: Disjuntores & Proteções"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partLocation" className="text-xs font-bold text-slate-700 uppercase">
                  Endereçamento de Estoque
                </Label>
                <Input
                  id="partLocation"
                  value={partLocation}
                  onChange={(e) => setPartLocation(e.target.value)}
                  placeholder="Ex: Armazém Central - Rua B-04"
                  className="h-10"
                />
              </div>
            </div>

            {/* Preço Unitário e Estoque Inicial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="partPrice" className="text-xs font-bold text-slate-700 uppercase">
                  Valor Unitário Estimado (R$)
                </Label>
                <Input
                  id="partPrice"
                  type="number"
                  step="0.01"
                  value={partPrice}
                  onChange={(e) => setPartPrice(e.target.value)}
                  className="h-10 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="partStock" className="text-xs font-bold text-slate-700 uppercase">
                  Saldo Inicial em Almoxarifado (UN)
                </Label>
                <Input
                  id="partStock"
                  type="number"
                  value={partStock}
                  onChange={(e) => setPartStock(e.target.value)}
                  className="h-10 font-semibold"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Usina / Planta */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="plantName" className="text-xs font-bold text-slate-700 uppercase">
                  Nome da Usina / Local *
                </Label>
                <Input
                  id="plantName"
                  value={plantName}
                  onChange={(e) => setPlantName(e.target.value)}
                  placeholder="Ex: Usina Solar Fazenda Boa Vista"
                  required
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="plantCode" className="text-xs font-bold text-slate-700 uppercase">
                    Código Técnico
                  </Label>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="text-[11px] text-[#E2661D] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar
                  </button>
                </div>
                <Input
                  id="plantCode"
                  value={plantCode}
                  onChange={(e) => setPlantCode(e.target.value)}
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="plantCapacity" className="text-xs font-bold text-slate-700 uppercase">
                  Capacidade Instalada
                </Label>
                <Input
                  id="plantCapacity"
                  value={plantCapacity}
                  onChange={(e) => setPlantCapacity(e.target.value)}
                  placeholder="Ex: 75 kWp ou 1.2 MW"
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plantLocationCity" className="text-xs font-bold text-slate-700 uppercase">
                  Cidade / Estado
                </Label>
                <Input
                  id="plantLocationCity"
                  value={plantLocationCity}
                  onChange={(e) => setPlantLocationCity(e.target.value)}
                  placeholder="Ex: Guaxupé - MG"
                  className="h-10"
                />
              </div>
            </div>
          </>
        )}
      </form>
    </CenteredModal>
  );
}

