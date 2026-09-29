"use client";

// =================================================================
// EquipmentMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizard quebrado, com Multi-CRUD inline e rascunho
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Zap, Building2, Wrench, MapPin, FileText, CheckCircle,
  Save, Clock, Plus, AlertCircle, Box, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { equipmentApi } from "@/lib/api/equipment";
import { clientsApi } from "@/lib/api/clients";
import { Equipment, EquipmentType, Client } from "@/types";

type EquipmentTabKey = "geral" | "especificacoes" | "localizacao";

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Grupo Gerador a Diesel / Gás",
  [EquipmentType.SUBSTATION]: "Subestação / Transformador",
  [EquipmentType.OTHER]: "Outro Equipamento Técnico",
};

interface Props {
  equipmentId?: string;
  initialData?: Partial<Equipment>;
  fixedClientId?: string;
  onClose?: () => void;
  onSuccess?: (equipment: Equipment) => void;
}

export function EquipmentMultiCrudEditor({
  equipmentId,
  initialData,
  fixedClientId,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<EquipmentTabKey>("geral");

  // === Form States ===
  const [clientId, setClientId] = useState(fixedClientId || initialData?.clientId || "");
  const [type, setType] = useState<EquipmentType>(initialData?.type || EquipmentType.GENERATOR);
  const [brand, setBrand] = useState(initialData?.brand || "");
  const [model, setModel] = useState(initialData?.model || "");
  const [serialNumber, setSerialNumber] = useState(initialData?.serialNumber || "");
  const [powerRating, setPowerRating] = useState(initialData?.powerRating || "");
  const [installLocation, setInstallLocation] = useState(initialData?.installLocation || "");
  const [purchaseDate, setPurchaseDate] = useState(
    initialData?.purchaseDate ? initialData.purchaseDate.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  // === Catálogo de Clientes ===
  const [clients, setClients] = useState<Client[]>([]);

  // === Multi-CRUD Quick Add Cliente ===
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [qcName, setQcName] = useState("");
  const [qcCnpj, setQcCnpj] = useState("");
  const [qcEmail, setQcEmail] = useState("");
  const [qcPhone, setQcPhone] = useState("");

  // === UI States ===
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    clientsApi.getAll()
      .then(setClients)
      .catch(err => console.error("Erro ao carregar clientes:", err));
  }, []);

  // Rascunho
  useEffect(() => {
    if (!equipmentId && typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_equipment_draft");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.clientId || d.brand || d.serialNumber) setDraftNotice(true);
        } catch {}
      }
    }
  }, [equipmentId]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_equipment_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.clientId && !fixedClientId) setClientId(d.clientId);
      if (d.type) setType(d.type);
      if (d.brand) setBrand(d.brand);
      if (d.model) setModel(d.model);
      if (d.serialNumber) setSerialNumber(d.serialNumber);
      if (d.powerRating) setPowerRating(d.powerRating);
      if (d.installLocation) setInstallLocation(d.installLocation);
      if (d.purchaseDate) setPurchaseDate(d.purchaseDate);
      if (d.notes) setNotes(d.notes);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_equipment_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_equipment_draft",
      JSON.stringify({
        clientId, type, brand, model, serialNumber,
        powerRating, installLocation, purchaseDate, notes
      })
    );
    alert("Rascunho do equipamento salvo com sucesso!");
  };

  // Quick-Add Cliente Inline
  const handleQuickAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcName.trim()) {
      alert("Informe a razão social ou nome fantasia do cliente");
      return;
    }
    setQuickSaving(true);
    try {
      const newClient = await clientsApi.create({
        companyName: qcName.trim(),
        cnpjCpf: qcCnpj.trim() || undefined,
        email: qcEmail.trim() || undefined,
        phone: qcPhone.trim() || undefined,
      });
      setClients(prev => [newClient, ...prev]);
      setClientId(newClient.id);
      setShowQuickClient(false);
      setQcName("");
      setQcCnpj("");
      setQcEmail("");
      setQcPhone("");
      alert(`Cliente "${newClient.companyName}" cadastrado e selecionado!`);
    } catch (err: any) {
      alert(`Erro ao cadastrar cliente: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setQuickSaving(false);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = "Cliente proprietário é obrigatório";
    if (!type) errs.type = "Tipo de equipamento é obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload: Partial<Equipment> = {
        clientId,
        type,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serialNumber: serialNumber.trim() || undefined,
        powerRating: powerRating.trim() || undefined,
        installLocation: installLocation.trim() || undefined,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : undefined,
        notes: notes.trim() || undefined,
      };

      let result: Equipment;
      if (equipmentId) {
        result = await equipmentApi.update(equipmentId, payload);
      } else {
        result = await equipmentApi.create(payload);
        localStorage.removeItem("setgen_equipment_draft");
      }

      alert(equipmentId ? "Equipamento atualizado com sucesso!" : "Equipamento cadastrado com sucesso!");
      onSuccess?.(result);
      onClose?.();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: EquipmentTabKey; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "geral", icon: Zap, label: "Cliente & Tipo" },
    { key: "especificacoes", icon: Wrench, label: "Especificações & TAG" },
    { key: "localizacao", icon: MapPin, label: "Instalação & Notas" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <Zap className="w-4 h-4 text-orange-600" />
              {equipmentId ? "Editar Equipamento" : "Novo Equipamento"}
            </span>
            <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {equipmentId ? "EDIÇÃO" : "NOVO"}
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
            <span>Cliente:</span>
            <span className="font-semibold text-gray-800 truncate max-w-[120px]">
              {clients.find(c => c.id === clientId)?.companyName || "Não selecionado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tipo:</span>
            <span className="font-semibold text-gray-800">
              {type === EquipmentType.GENERATOR ? "Gerador" : type === EquipmentType.SUBSTATION ? "Subestação" : "Outro"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Potência:</span>
            <span className="font-semibold text-orange-600">{powerRating || "—"}</span>
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
              Existe um rascunho de equipamento salvo. Deseja restaurá-lo?
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

          {/* ══ ABA 1: CLIENTE & TIPO ════════════════════════════ */}
          {activeTab === "geral" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />Proprietário & Categoria Técnica
                  </h4>
                  <span className="text-gray-400 text-xs">Vínculo com cliente e tipo de equipamento</span>
                </div>

                {/* Cliente com Quick-Add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="font-semibold text-gray-700">Cliente Proprietário *</Label>
                    {!fixedClientId && (
                      <button
                        type="button"
                        onClick={() => setShowQuickClient(!showQuickClient)}
                        className="text-xs text-orange-600 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {showQuickClient ? "Fechar cadastro rápido" : "Cadastrar Novo Cliente"}
                      </button>
                    )}
                  </div>

                  {showQuickClient && !fixedClientId && (
                    <div className="mb-3 p-4 bg-orange-50/60 rounded-xl border border-orange-200 space-y-3">
                      <span className="font-semibold text-xs text-orange-800 block">Novo Cliente Rápido</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder="Razão Social / Nome Fantasia *"
                          value={qcName}
                          onChange={e => setQcName(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="CNPJ ou CPF"
                          value={qcCnpj}
                          onChange={e => setQcCnpj(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="E-mail de contato"
                          type="email"
                          value={qcEmail}
                          onChange={e => setQcEmail(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <Input
                          placeholder="Telefone / Celular"
                          value={qcPhone}
                          onChange={e => setQcPhone(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowQuickClient(false)}
                          className="text-xs h-7"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={quickSaving}
                          onClick={handleQuickAddClient}
                          className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-7 font-bold"
                        >
                          {quickSaving ? "Salvando..." : "Salvar e Selecionar"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <select
                    value={clientId}
                    disabled={!!fixedClientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-medium disabled:bg-gray-100"
                  >
                    <option value="">Selecione o cliente proprietário...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.cnpjCpf ? `(${c.cnpjCpf})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.clientId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Tipo de Equipamento *</Label>
                    <select
                      value={type}
                      onChange={e => setType(e.target.value as EquipmentType)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value={EquipmentType.GENERATOR}>{EQUIPMENT_TYPE_LABELS[EquipmentType.GENERATOR]}</option>
                      <option value={EquipmentType.SUBSTATION}>{EQUIPMENT_TYPE_LABELS[EquipmentType.SUBSTATION]}</option>
                      <option value={EquipmentType.OTHER}>{EQUIPMENT_TYPE_LABELS[EquipmentType.OTHER]}</option>
                    </select>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Potência Nominal</Label>
                    <Input
                      type="text"
                      value={powerRating}
                      onChange={e => setPowerRating(e.target.value)}
                      placeholder="Ex: 250 kVA / 200 kW ou 500 kVA"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: ESPECIFICAÇÕES & TAG ═══════════════════════ */}
          {activeTab === "especificacoes" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-600" />Identificação Técnica do Fabricante
                </h4>
                <p className="text-gray-400 text-xs">Marca, modelo, número de série e rastreabilidade</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Fabricante / Marca</Label>
                    <Input
                      type="text"
                      value={brand}
                      onChange={e => setBrand(e.target.value)}
                      placeholder="Ex: Cummins, Scania, Caterpillar, Stemac, MWM"
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Modelo do Equipamento</Label>
                    <Input
                      type="text"
                      value={model}
                      onChange={e => setModel(e.target.value)}
                      placeholder="Ex: C250 D6, QSB7-G5, GSW-275"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Número de Série / TAG Patrimonial</Label>
                    <Input
                      type="text"
                      value={serialNumber}
                      onChange={e => setSerialNumber(e.target.value)}
                      placeholder="Ex: S/N 88273910 / TAG-GER-01"
                      className="h-9 text-xs bg-white font-mono"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Data de Fabricação / Aquisição</Label>
                    <Input
                      type="date"
                      value={purchaseDate}
                      onChange={e => setPurchaseDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3: LOCALIZAÇÃO & NOTAS ════════════════════════ */}
          {activeTab === "localizacao" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-600" />Instalação Física & Observações Técnicas
                </h4>
                <p className="text-gray-400 text-xs">Posicionamento dentro da planta do cliente e histórico</p>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Local Exato de Instalação</Label>
                  <Input
                    type="text"
                    value={installLocation}
                    onChange={e => setInstallLocation(e.target.value)}
                    placeholder="Ex: Sala de Máquinas Subsolo 2, Casa de Força Externa, Cobertura Bloco B"
                    className="h-9 text-xs bg-white"
                  />
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Observações Técnicas / Restrições de Acesso</Label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Anotações sobre QTA acoplado, capacidade do tanque de diesel, voltagem nominal, etc..."
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-orange-500 resize-none"
                  />
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
              {saving ? "Salvando..." : equipmentId ? "Salvar Alterações" : "Salvar Equipamento"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
