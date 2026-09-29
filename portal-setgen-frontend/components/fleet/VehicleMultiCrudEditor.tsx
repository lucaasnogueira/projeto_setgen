"use client";

// =================================================================
// VehicleMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizard quebrado, com rascunho e validação limpa
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Truck, Gauge, Wrench, CheckCircle, Save, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vehiclesApi } from "@/lib/api/vehicles";
import { Vehicle } from "@/types";

type VehicleTabKey = "geral" | "odometro" | "manutencao";

interface Props {
  vehicleId?: string;
  initialData?: Partial<Vehicle>;
  onClose?: () => void;
  onSuccess?: (vehicle: Vehicle) => void;
}

export function VehicleMultiCrudEditor({
  vehicleId,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<VehicleTabKey>("geral");

  // === Form States ===
  const [name, setName] = useState(initialData?.name || "");
  const [plate, setPlate] = useState(initialData?.plate || "");
  const [currentKm, setCurrentKm] = useState<number>(initialData?.currentKm ?? 0);
  const [lastOilChangeKm, setLastOilChangeKm] = useState<number>(initialData?.lastOilChangeKm ?? 0);
  const [oilChangeIntervalKm, setOilChangeIntervalKm] = useState<number>(
    initialData?.oilChangeIntervalKm ?? 10000
  );
  const [active, setActive] = useState(initialData?.active ?? true);

  // === UI States ===
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Checar Rascunho
  useEffect(() => {
    if (!vehicleId && typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_vehicle_draft");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.name || d.plate) setDraftNotice(true);
        } catch {}
      }
    }
  }, [vehicleId]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_vehicle_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.name) setName(d.name);
      if (d.plate) setPlate(d.plate);
      if (d.currentKm !== undefined) setCurrentKm(Number(d.currentKm));
      if (d.lastOilChangeKm !== undefined) setLastOilChangeKm(Number(d.lastOilChangeKm));
      if (d.oilChangeIntervalKm !== undefined) setOilChangeIntervalKm(Number(d.oilChangeIntervalKm));
      if (d.active !== undefined) setActive(d.active);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_vehicle_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_vehicle_draft",
      JSON.stringify({ name, plate, currentKm, lastOilChangeKm, oilChangeIntervalKm, active })
    );
    alert("Rascunho do veículo salvo com sucesso!");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Modelo / Nome do veículo é obrigatório";
    if (!plate.trim()) errs.plate = "Placa do veículo é obrigatória";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload: Partial<Vehicle> = {
        name: name.trim().toUpperCase(),
        plate: plate.trim().toUpperCase(),
        currentKm: Number(currentKm) || 0,
        lastOilChangeKm: Number(lastOilChangeKm) || 0,
        oilChangeIntervalKm: Number(oilChangeIntervalKm) || 10000,
        active,
      };

      let result: Vehicle;
      if (vehicleId) {
        result = await vehiclesApi.update(vehicleId, payload);
      } else {
        result = await vehiclesApi.create(payload);
        localStorage.removeItem("setgen_vehicle_draft");
      }

      alert(vehicleId ? "Veículo atualizado com sucesso!" : "Veículo cadastrado na frota!");
      onSuccess?.(result);
      onClose?.();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: VehicleTabKey; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "geral", icon: Truck, label: "Identificação do Veículo" },
    { key: "odometro", icon: Gauge, label: "Quilometragem & Odômetro" },
    { key: "manutencao", icon: Wrench, label: "Manutenção & Óleo" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <Truck className="w-4 h-4 text-orange-600" />
              {vehicleId ? "Editar Veículo" : "Novo Veículo"}
            </span>
            <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {vehicleId ? "EDIÇÃO" : "FROTA"}
            </span>
          </div>

          {/* Abas Verticais */}
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-colors text-left ${
                    isActive
                      ? "bg-white text-orange-600 font-semibold shadow-xs border border-gray-200/80"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-orange-600" : "text-gray-400"}`} />
                    <span>{tab.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Resumo */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
          <div className="flex justify-between">
            <span>Placa:</span>
            <span className="font-mono font-bold text-gray-900">{plate || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>KM Atual:</span>
            <span className="font-semibold text-gray-800">{currentKm.toLocaleString("pt-BR")} km</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-bold ${active ? "text-emerald-600" : "text-gray-400"}`}>
              {active ? "Operacional" : "Inativo"}
            </span>
          </div>
        </div>
      </aside>

      {/* ===== ÁREA CENTRAL SCROLLÁVEL ===== */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFB]">

        {/* Banner de Rascunho */}
        {draftNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Existe um rascunho de veículo salvo. Deseja restaurá-lo?
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={discardDraft} className="text-amber-800 text-xs h-7">
                Descartar
              </Button>
              <Button size="sm" onClick={restoreDraft} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7">
                Restaurar
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ══ ABA 1: IDENTIFICAÇÃO DO VEÍCULO ══════════════════ */}
          {activeTab === "geral" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-600" />Identificação da Unidade Móvel
                  </h4>
                  <span className="text-gray-400 text-xs">Dados de emplacamento e modelo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Modelo / Descrição do Veículo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: FIAT FIORINO 1.4 EVO, TOYOTA HILUX 4X4, RENAULT MASTER"
                      className="h-9 text-xs bg-white uppercase"
                    />
                    {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Placa do Veículo (Mercosul ou antiga) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={plate}
                      onChange={e => setPlate(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC1D23 ou ABC-1234"
                      className="h-9 text-xs bg-white font-mono uppercase"
                    />
                    {errors.plate && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.plate}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="vehicleActive"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <Label htmlFor="vehicleActive" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Veículo Ativo / Disponível para Viagens e Deslocamento Técnico
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: QUILOMETRAGEM & ODÔMETRO ═══════════════════ */}
          {activeTab === "odometro" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-orange-600" />Odômetro & Controle de Rodagem
                </h4>
                <p className="text-gray-400 text-xs">Quilometragem base para cálculo automático de consumo e viagens</p>

                <div className="max-w-md">
                  <Label className="block font-semibold text-gray-700 mb-1">Quilometragem Atual (KM)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={currentKm}
                    onChange={e => setCurrentKm(Number(e.target.value))}
                    className="h-9 text-xs bg-white"
                  />
                  <p className="text-gray-400 text-[11px] mt-1">
                    Esta marcação será incrementada automaticamente a cada finalização de viagem.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3: MANUTENÇÃO & ÓLEO ══════════════════════════ */}
          {activeTab === "manutencao" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-600" />Plano de Revisão & Troca de Óleo
                </h4>
                <p className="text-gray-400 text-xs">Alertas preventivos para evitar desgaste mecânico prematuro da frota</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">KM da Última Troca de Óleo Realizada</Label>
                    <Input
                      type="number"
                      min={0}
                      value={lastOilChangeKm}
                      onChange={e => setLastOilChangeKm(Number(e.target.value))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Intervalo Padrão de Troca (KM)</Label>
                    <Input
                      type="number"
                      min={1000}
                      step={1000}
                      value={oilChangeIntervalKm}
                      onChange={e => setOilChangeIntervalKm(Number(e.target.value))}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200 text-xs text-orange-800">
                  <span className="font-bold block mb-1">Previsão da Próxima Troca:</span>
                  {(lastOilChangeKm + oilChangeIntervalKm).toLocaleString("pt-BR")} KM
                  {currentKm >= lastOilChangeKm + oilChangeIntervalKm ? (
                    <span className="ml-2 font-bold text-red-600">(ATENÇÃO: Óleo vencido ou próximo do limite!)</span>
                  ) : (
                    <span className="ml-2 text-emerald-700">
                      (Faltam {((lastOilChangeKm + oilChangeIntervalKm) - currentKm).toLocaleString("pt-BR")} km)
                    </span>
                  )}
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
              {saving ? "Salvando..." : vehicleId ? "Salvar Alterações" : "Salvar Veículo"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
