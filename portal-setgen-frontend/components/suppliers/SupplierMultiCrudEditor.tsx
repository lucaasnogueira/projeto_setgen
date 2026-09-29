"use client";

// =================================================================
// SupplierMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizard quebrado, com rascunho e validação limpa
// =================================================================

import React, { useState, useEffect } from "react";
import {
  Building, Phone, FileText, CheckCircle, Save, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { suppliersApi } from "@/lib/api/suppliers";
import { Supplier } from "@/types";

type SupplierTabKey = "geral" | "contato" | "fiscal";

interface Props {
  supplierId?: string;
  initialData?: Partial<Supplier>;
  onClose?: () => void;
  onSuccess?: (supplier: Supplier) => void;
}

export function SupplierMultiCrudEditor({
  supplierId,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<SupplierTabKey>("geral");

  // === Form States ===
  const [name, setName] = useState(initialData?.name || "");
  const [cnpj, setCnpj] = useState(initialData?.cnpj || "");
  const [contact, setContact] = useState(initialData?.contact || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [active, setActive] = useState(initialData?.active ?? true);

  // === UI States ===
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Checar Rascunho
  useEffect(() => {
    if (!supplierId && typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_supplier_draft");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.name || d.cnpj) setDraftNotice(true);
        } catch {}
      }
    }
  }, [supplierId]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_supplier_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.name) setName(d.name);
      if (d.cnpj) setCnpj(d.cnpj);
      if (d.contact) setContact(d.contact);
      if (d.email) setEmail(d.email);
      if (d.phone) setPhone(d.phone);
      if (d.active !== undefined) setActive(d.active);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_supplier_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_supplier_draft",
      JSON.stringify({ name, cnpj, contact, email, phone, active })
    );
    alert("Rascunho do fornecedor salvo com sucesso!");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Razão Social ou Nome Fantasia é obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const payload: Partial<Supplier> = {
        name: name.trim(),
        cnpj: cnpj.trim() || undefined,
        contact: contact.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        active,
      };

      let result: Supplier;
      if (supplierId) {
        result = await suppliersApi.update(supplierId, payload);
      } else {
        result = await suppliersApi.create(payload);
        localStorage.removeItem("setgen_supplier_draft");
      }

      alert(supplierId ? "Fornecedor atualizado com sucesso!" : "Fornecedor cadastrado com sucesso!");
      onSuccess?.(result);
      onClose?.();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: SupplierTabKey; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "geral", icon: Building, label: "Dados Cadastrais" },
    { key: "contato", icon: Phone, label: "Contato & Comercial" },
    { key: "fiscal", icon: FileText, label: "Identificação Fiscal" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <Building className="w-4 h-4 text-orange-600" />
              {supplierId ? "Editar Fornecedor" : "Novo Fornecedor"}
            </span>
            <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {supplierId ? "EDIÇÃO" : "NOVO"}
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
            <span>Status:</span>
            <span className={`font-bold ${active ? "text-emerald-600" : "text-gray-400"}`}>
              {active ? "Ativo" : "Inativo"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>CNPJ:</span>
            <span className="font-semibold text-gray-800">{cnpj || "Não informado"}</span>
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
              Existe um rascunho de fornecedor salvo. Deseja restaurá-lo?
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

          {/* ══ ABA 1: DADOS CADASTRAIS ═══════════════════════════ */}
          {activeTab === "geral" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-orange-600" />Identificação da Empresa Fornecedora
                  </h4>
                  <span className="text-gray-400 text-xs">Informações cadastrais principais</span>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">
                    Razão Social / Nome Fantasia <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Cummins Brasil Ltda ou Distribuidora de Peças Diesel"
                    className="h-9 text-xs bg-white"
                  />
                  {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="supplierActive"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <Label htmlFor="supplierActive" className="text-xs font-semibold text-gray-800 cursor-pointer">
                    Fornecedor Ativo no Sistema (disponível para cotações e compras)
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: CONTATO & COMERCIAL ════════════════════════ */}
          {activeTab === "contato" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-600" />Canais de Comunicação & Representante
                </h4>
                <p className="text-gray-400 text-xs">Pessoa de contato e meios diretos para envio de ordens de compra</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Pessoa de Contato / Vendedor</Label>
                    <Input
                      type="text"
                      value={contact}
                      onChange={e => setContact(e.target.value)}
                      placeholder="Ex: Carlos Eduardo (Consultor de Vendas)"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Telefone / WhatsApp Comercial</Label>
                    <Input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321 / (11) 3456-7890"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">E-mail para Pedidos de Compra</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Ex: pedidos@fornecedor.com.br ou vendas@fornecedor.com.br"
                    className="h-9 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3: DADOS FISCAIS ══════════════════════════════ */}
          {activeTab === "fiscal" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />Dados Tributários & Fiscais
                </h4>
                <p className="text-gray-400 text-xs">Utilizado para validação de XML de notas fiscais e compras</p>

                <div className="max-w-md">
                  <Label className="block font-semibold text-gray-700 mb-1">CNPJ do Fornecedor</Label>
                  <Input
                    type="text"
                    value={cnpj}
                    onChange={e => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-9 text-xs bg-white"
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
              {saving ? "Salvando..." : supplierId ? "Salvar Alterações" : "Salvar Fornecedor"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
