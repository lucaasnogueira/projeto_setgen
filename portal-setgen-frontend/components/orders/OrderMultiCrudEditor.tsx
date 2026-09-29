"use client";

// =================================================================
// OrderMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com navegação por abas + Área central + Rodapé fixo
// 100% tela cheia, sem steps quebrados, com rascunho
// =================================================================

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Wrench, Calendar, Package, ClipboardCheck, PenTool,
  Save, Clock, Plus, Trash2, CheckCircle, AlertTriangle, Users, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ordersApi, CreateServiceOrderPayload } from "@/lib/api/orders";
import { quotesApi } from "@/lib/api/quotes";
import { Quote, QuoteStatus } from "@/types";
import { inventoryApi } from "@/lib/api/inventory";
import { usersApi, User } from "@/lib/api/users";
import { checklistTemplatesApi } from "@/lib/api/checklist-templates";
import { ServiceOrder, ServiceOrderStatus, ChecklistTemplate, Product, ChecklistFieldType } from "@/types";
import { toDateInputValue, endOfBusinessDayISO } from "@/lib/date";

const SignaturePad = dynamic(
  () => import("@/app/(portal)/orders/components/SignaturePad").then((m) => m.SignaturePad),
  { ssr: false }
);

type OrderTabKey = "planejamento" | "pecas" | "checklist" | "assinatura" | "observacoes";

interface LocalChecklistItem {
  item: string;
  completed: boolean;
}

interface Props {
  orderId?: string;
  quoteId?: string;
  initialData?: Partial<ServiceOrder>;
  onClose?: () => void;
  onSuccess?: (order: ServiceOrder) => void;
}

export function OrderMultiCrudEditor({
  orderId,
  quoteId,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<OrderTabKey>("planejamento");

  // === 1. Planejamento & Prazos ===
  const [deadline, setDeadline] = useState(toDateInputValue(initialData?.deadline));
  const [responsibleIds, setResponsibleIds] = useState<string[]>(initialData?.responsibleIds || []);
  const [team, setTeam] = useState<string>((initialData?.requiredResources?.team || []).join(", "));

  // === 2. Peças & Itens ===
  const [items, setItems] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    name?: string;
    code?: string;
  }>>(initialData?.items?.map(i => ({
    productId: i.productId,
    quantity: Number(i.quantity),
    unitPrice: Number(i.unitPrice),
    name: i.product?.name,
    code: i.product?.code,
  })) || []);

  const [selectedProductId, setSelectedProductId] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");

  // === 3. Checklist ===
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialData?.checklistTemplateId || "");
  const [checklistItems, setChecklistItems] = useState<LocalChecklistItem[]>(
    (initialData?.checklist || []).map((c: any) => ({
      item: c.item || c.description || c.label || "Item",
      completed: !!c.completed,
    }))
  );

  // === 4. Assinatura ===
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // === 5. Observações & Horímetro ===
  const [notes, setNotes] = useState(
    (initialData?.requiredResources as any)?.notes || (initialData as any)?.notes || ""
  );
  const [initialHorimeter, setInitialHorimeter] = useState("");
  const [finalHorimeter, setFinalHorimeter] = useState("");

  // === Vínculo com Orçamentos Aprovados ===
  const [quotesList, setQuotesList] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quoteId || initialData?.quoteId || "");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  
  // === Modais de Cadastro Rápido (+) sem sair da tela ===
  const [showQuickProductModal, setShowQuickProductModal] = useState(false);
  const [quickProdName, setQuickProdName] = useState("");
  const [quickProdCode, setQuickProdCode] = useState("");
  const [quickProdUnit, setQuickProdUnit] = useState("UN");
  const [quickProdCost, setQuickProdCost] = useState("");
  const [quickProdPrice, setQuickProdPrice] = useState("");
  const [quickProdStock, setQuickProdStock] = useState("10");
  const [savingQuickProd, setSavingQuickProd] = useState(false);

  const [showQuickUserModal, setShowQuickUserModal] = useState(false);
  const [quickUserName, setQuickUserName] = useState("");
  const [quickUserEmail, setQuickUserEmail] = useState("");
  const [savingQuickUser, setSavingQuickUser] = useState(false);

  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdName.trim()) return;
    setSavingQuickProd(true);
    try {
      const code = quickProdCode.trim() || `PEC-${Date.now().toString().slice(-4)}`;
      const cost = Number(quickProdCost.replace(',', '.')) || 0;
      const price = Number(quickProdPrice.replace(',', '.')) || (cost > 0 ? cost * 1.5 : 0);
      const stock = Number(quickProdStock) || 0;

      const created = await inventoryApi.create({
        name: quickProdName.trim(),
        code,
        unit: quickProdUnit || "UN",
        unitCost: cost,
        unitPrice: price,
        salePrice: price,
        currentStock: stock,
        minStock: 1,
        active: true,
      });

      const freshProds = await inventoryApi.getAll().catch(() => []);
      setProductsCatalog(freshProds);
      setSelectedProductId(created.id);
      setShowQuickProductModal(false);
      setQuickProdName("");
      setQuickProdCode("");
      setQuickProdCost("");
      setQuickProdPrice("");
    } catch (err) {
      console.error("Erro ao cadastrar peça rápida:", err);
    } finally {
      setSavingQuickProd(false);
    }
  };

  const handleQuickCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUserName.trim() || !quickUserEmail.trim()) return;
    setSavingQuickUser(true);
    try {
      const created = await usersApi.create({
        name: quickUserName.trim(),
        email: quickUserEmail.trim(),
        password: `Setgen@${Math.floor(1000 + Math.random() * 9000)}`,
        role: "TECHNICIAN",
      });

      const freshUsers = await usersApi.getSelectable().catch(() => []);
      setUsersList(freshUsers);
      setResponsibleIds(prev => [...prev, created.id]);
      setShowQuickUserModal(false);
      setQuickUserName("");
      setQuickUserEmail("");
    } catch (err) {
      console.error("Erro ao cadastrar técnico rápido:", err);
    } finally {
      setSavingQuickUser(false);
    }
  };

  // === Catálogos ===
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);

  // === UI States ===
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [p, u, t, qList] = await Promise.all([
          inventoryApi.getAll(),
          usersApi.getSelectable(),
          checklistTemplatesApi.getAll(),
          quotesApi.getAll().catch(() => []),
        ]);
        setProductsCatalog(p);
        setUsersList(u);
        setTemplates(t);
        const validQuotes = (qList || []).filter(
          (q: Quote) => q.status === QuoteStatus.ACCEPTED || q.status === QuoteStatus.APPROVED || q.id === quoteId
        );
        setQuotesList(validQuotes.length > 0 ? validQuotes : qList);
      } catch (err) {
        console.error("Erro ao carregar dados auxiliares:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Verificar Rascunho se for criação
  useEffect(() => {
    if (!orderId && typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_order_draft");
      if (saved) setDraftNotice(true);
    }
  }, [orderId]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_order_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.deadline) setDeadline(d.deadline);
      if (d.responsibleIds) setResponsibleIds(d.responsibleIds);
      if (d.team) setTeam(d.team);
      if (d.items) setItems(d.items);
      if (d.selectedTemplateId) setSelectedTemplateId(d.selectedTemplateId);
      if (d.notes) setNotes(d.notes);
      if (d.initialHorimeter) setInitialHorimeter(d.initialHorimeter);
      if (d.finalHorimeter) setFinalHorimeter(d.finalHorimeter);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_order_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_order_draft",
      JSON.stringify({
        deadline, responsibleIds, team, items, selectedTemplateId, notes,
        initialHorimeter, finalHorimeter,
      })
    );
    alert("Rascunho da Ordem de Serviço salvo!");
  };

  // Puxar dados do Orçamento Selecionado
  const handleSelectQuote = async (qId: string) => {
    setSelectedQuoteId(qId);
    if (!qId) {
      setSelectedQuote(null);
      return;
    }
    try {
      const q = await quotesApi.getById(qId);
      if (!q) return;
      setSelectedQuote(q);

      if (q.validUntil) {
        setDeadline(toDateInputValue(q.validUntil));
      }
      if (q.salesRepId) {
        setResponsibleIds([q.salesRepId]);
      } else if (q.createdById) {
        setResponsibleIds([q.createdById]);
      }
      if (q.scope) {
        setNotes((prev: string) => prev ? `${prev}\n\nEscopo do Orçamento:\n${q.scope}` : q.scope);
      }

      const importedItems: any[] = [];
      if (q.itemProducts && q.itemProducts.length > 0) {
        q.itemProducts.forEach((ip: any) => {
          importedItems.push({
            productId: ip.productId,
            name: ip.product?.name,
            code: ip.product?.code,
            quantity: Number(ip.quantity) || 1,
            unitPrice: Number(ip.unitPrice) || 0,
          });
        });
      }
      if (importedItems.length === 0 && q.quoteLines && q.quoteLines.length > 0) {
        q.quoteLines.forEach((ql: any) => {
          if (ql.type === 'MATERIAL') {
            const matched = productsCatalog.find(
              p => p.name.toLowerCase() === ql.description.toLowerCase() ||
                   ql.description.toLowerCase().includes(p.name.toLowerCase())
            ) || productsCatalog[0];
            if (matched) {
              importedItems.push({
                productId: matched.id,
                name: ql.description || matched.name,
                code: matched.code,
                quantity: Number(ql.quantity) || 1,
                unitPrice: Number(ql.unitValue) || 0,
              });
            }
          }
        });
      }

      if (importedItems.length > 0) {
        setItems(importedItems);
      }
    } catch (err) {
      console.error("Erro ao puxar dados do orçamento:", err);
    }
  };

  // Efeito para carregar quoteId se vier na URL ou props
  useEffect(() => {
    if (quoteId && productsCatalog.length > 0) {
      handleSelectQuote(quoteId);
    }
  }, [quoteId, productsCatalog]);

  // Manipulação de Peças
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = productsCatalog.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = Number(itemQuantity) || 1;
    const price = Number(prod.unitPrice ?? prod.unitCost ?? 0);

    setItems(prev => {
      const existing = prev.findIndex(i => i.productId === selectedProductId);
      if (existing >= 0) {
        const u = [...prev];
        u[existing].quantity += qty;
        return u;
      }
      return [...prev, { productId: prod.id, name: prod.name, code: prod.code, quantity: qty, unitPrice: price }];
    });

    setSelectedProductId("");
    setItemQuantity("1");
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Checklist template change
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl && tmpl.fields) {
      setChecklistItems(tmpl.fields.map(f => ({ item: f.label, completed: false })));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!deadline) e.deadline = "Data limite é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      const teamArray = team.split(",").map(s => s.trim()).filter(Boolean);
      const payload: CreateServiceOrderPayload = {
        quoteId: selectedQuoteId || quoteId || initialData?.quoteId || "",
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
        requiredResources: teamArray.length > 0 ? { team: teamArray } : undefined,
        deadline: deadline ? endOfBusinessDayISO(deadline) : undefined,
        responsibleIds: responsibleIds.length > 0 ? responsibleIds : undefined,
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
        checklistTemplateId: selectedTemplateId || undefined,
      };

      let result: ServiceOrder;
      if (orderId) {
        result = await ordersApi.update(orderId, {
          requiredResources: teamArray.length > 0 ? { team: teamArray } : undefined,
          deadline: deadline ? endOfBusinessDayISO(deadline) : undefined,
          responsibleIds: responsibleIds.length > 0 ? responsibleIds : undefined,
          checklist: checklistItems.map(c => ({
            id: '',
            label: c.item,
            name: c.item,
            type: ChecklistFieldType.BOOLEAN,
            required: false,
            answer: c.completed,
            completed: c.completed,
            item: c.item,
          })),
        });
      } else {
        result = await ordersApi.createFromQuote(payload);
        localStorage.removeItem("setgen_order_draft");
      }

      alert(orderId ? "Ordem de Serviço atualizada!" : "Ordem de Serviço criada com sucesso!");
      onSuccess?.(result);
      onClose?.();
    } catch (err: any) {
      alert(`Erro: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs: { key: OrderTabKey; icon: React.ComponentType<{ className?: string }>; label: string; count?: number }[] = [
    { key: "planejamento", icon: Calendar, label: "Planejamento & Prazos" },
    { key: "pecas", icon: Package, label: "Peças & Insumos", count: items.length },
    { key: "checklist", icon: ClipboardCheck, label: "Checklist Técnico", count: checklistItems.length },
    { key: "assinatura", icon: PenTool, label: "Assinatura do Cliente" },
    { key: "observacoes", icon: Wrench, label: "Horímetro & Notas" },
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
              <Wrench className="w-4 h-4 text-orange-600" />
              {orderId ? "Editar O.S." : "Nova Ordem de Serviço"}
            </span>
            <span className="bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]">
              {orderId ? "EDIÇÃO" : "NOVA"}
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
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Informações da OS / Quote */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
          <div className="flex justify-between">
            <span>Peças Alocadas:</span>
            <span className="font-semibold text-gray-800">{items.length} itens</span>
          </div>
          <div className="flex justify-between">
            <span>Checklist:</span>
            <span className="font-semibold text-gray-800">
              {checklistItems.filter(c => c.completed).length} de {checklistItems.length}
            </span>
          </div>
          {signatureData && (
            <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-[11px] pt-1">
              <CheckCircle className="w-3.5 h-3.5" /> Assinatura coletada
            </div>
          )}
        </div>
      </aside>

      {/* ===== ÁREA CENTRAL SCROLLÁVEL ===== */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#FAFAFB]">

        {/* Banner de Rascunho */}
        {draftNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-800 shrink-0">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Existe um rascunho salvo anteriormente. Deseja restaurá-lo?
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

          {/* ══ ABA 1: PLANEJAMENTO & PRAZOS ══════════════════════ */}
          {activeTab === "planejamento" && (
            <div className="space-y-5">
              {/* Card de Vínculo com Orçamento Aprovado */}
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/50 rounded-2xl border border-orange-200 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-gray-900 text-xs flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#E2661D]" />
                    Puxar Dados de Orçamento Aprovado / Aceito
                  </Label>
                  {selectedQuote && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Orçamento Vinculado
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedQuoteId}
                    onChange={(e) => handleSelectQuote(e.target.value)}
                    className="flex-1 h-9 rounded-xl border border-gray-300 text-xs bg-white px-3 font-medium text-gray-800 shadow-inner"
                  >
                    <option value="">Selecione um orçamento aprovado para importar dados...</option>
                    {quotesList.map((q) => (
                      <option key={q.id} value={q.id}>
                        #{q.quoteNumber} — {q.client?.companyName} ({q.status === 'ACCEPTED' ? 'Aceito' : 'Aprovado'})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedQuote && (
                  <div className="text-xs text-gray-700 bg-white/90 p-3.5 rounded-xl border border-orange-200/80 space-y-1.5 shadow-2xs">
                    <p className="font-bold text-gray-900">
                      Cliente: <span className="text-[#E2661D]">{selectedQuote.client?.companyName}</span>
                    </p>
                    {selectedQuote.scope && (
                      <p className="text-[11px] text-gray-500 line-clamp-2">
                        Escopo: {selectedQuote.scope}
                      </p>
                    )}
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                      ✓ {items.length} peça(s)/produto(s) importado(s) automaticamente para esta OS
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-600" />Agendamento & Responsáveis
                  </h4>
                  <span className="text-gray-400 text-xs">Prazos e alocação de equipe técnica</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Data Limite de Conclusão <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                    {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline}</p>}
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Equipe de Campo (Separada por vírgula)</Label>
                    <Input
                      type="text"
                      placeholder="Ex: João Silva, Pedro Santos"
                      value={team}
                      onChange={e => setTeam(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="block font-semibold text-gray-700">Responsáveis Técnicos Registrados</Label>
                    <button
                      type="button"
                      onClick={() => setShowQuickUserModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] bg-orange-100 hover:bg-orange-200/80 px-2 py-0.5 rounded-md transition-colors"
                      title="Cadastrar Novo Colaborador sem sair da tela"
                    >
                      <Plus className="h-3 w-3" /> Novo Técnico
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50/70 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                    {usersList.map(u => (
                      <label key={u.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={responsibleIds.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) setResponsibleIds(prev => [...prev, u.id]);
                            else setResponsibleIds(prev => prev.filter(id => id !== u.id));
                          }}
                          className="rounded text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: PEÇAS & INSUMOS ════════════════════════════ */}
          {activeTab === "pecas" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" />Peças e Insumos do Estoque
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">Vincule os materiais que serão retirados para execução da ordem</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50/60 p-3.5 rounded-xl border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block font-semibold text-gray-700">Selecionar Produto / Peça</Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickProductModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] bg-orange-100 hover:bg-orange-200/80 px-2 py-0.5 rounded-md transition-colors"
                        title="Cadastrar Nova Peça no Estoque sem sair da tela"
                      >
                        <Plus className="h-3 w-3" /> Nova Peça
                      </button>
                    </div>
                    <select
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value="">Selecione uma peça...</option>
                      {productsCatalog.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ""}{p.name} (Estoque: {p.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28">
                    <Label className="block font-semibold text-gray-700 mb-1">Qtd.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={e => setItemQuantity(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 px-4 rounded-lg font-bold gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Peça
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                    Nenhuma peça associada a esta Ordem de Serviço ainda.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="text-left px-4 py-2.5">Código / Descrição</th>
                          <th className="text-right px-4 py-2.5">Qtd.</th>
                          <th className="text-right px-4 py-2.5">Preço Unit.</th>
                          <th className="text-right px-4 py-2.5">Total</th>
                          <th className="text-center px-4 py-2.5 w-16">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-gray-500 mr-2">{it.code || "—"}</span>
                              <span className="font-medium text-gray-900">{it.name || "Item sem nome"}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium">{it.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">R$ {it.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                              R$ {(it.quantity * it.unitPrice).toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ABA 3: CHECKLIST TÉCNICO ═════════════════════════ */}
          {activeTab === "checklist" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-orange-600" />Checklist Operacional & QTA
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">Procedimento padronizado de inspeção e teste de carga</p>
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Template de Checklist</Label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => handleTemplateChange(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 max-w-md"
                  >
                    <option value="">Selecione um checklist padrão...</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                {checklistItems.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="block font-semibold text-gray-700">Itens de Verificação Técnica</Label>
                    <div className="divide-y divide-gray-100 bg-gray-50/70 p-3 rounded-xl border border-gray-200 space-y-1">
                      {checklistItems.map((c, i) => (
                        <label key={i} className="flex items-center gap-2.5 py-2 text-xs text-gray-800 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={c.completed}
                            onChange={e => {
                              const u = [...checklistItems]; u[i].completed = e.target.checked; setChecklistItems(u);
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                          />
                          <span className={c.completed ? "line-through text-gray-400" : "font-medium"}>{c.item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ABA 4: ASSINATURA DO CLIENTE ═════════════════════ */}
          {activeTab === "assinatura" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-orange-600" />Assinatura Digital de Entrega
                </h4>
                <p className="text-gray-500 text-xs">Coleta da assinatura do responsável pelo recebimento do gerador no local.</p>

                <div className="max-w-lg border border-gray-200 rounded-xl p-3 bg-gray-50">
                  <SignaturePad
                    onSave={(blob: Blob) => {
                      const reader = new FileReader();
                      reader.readAsDataURL(blob);
                      reader.onloadend = () => {
                        setSignatureData(reader.result as string);
                      };
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 5: HORÍMETRO & NOTAS ══════════════════════════ */}
          {activeTab === "observacoes" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-orange-600" />Apontamento de Horímetro & Observações de Campo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Horímetro Inicial (Horas)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 1250.5"
                      value={initialHorimeter}
                      onChange={e => setInitialHorimeter(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Horímetro Final (Horas)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 1258.0"
                      value={finalHorimeter}
                      onChange={e => setFinalHorimeter(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">Relatório Técnico / Observações da Equipe</Label>
                  <textarea
                    rows={5}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Descreva as condições encontradas, testes realizados e recomendações técnicas..."
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
              {saving ? "Salvando..." : orderId ? "Salvar Alterações" : "Salvar Ordem de Serviço"}
            </Button>
          </div>
        </div>

      </main>

      {/* MODAL 1: CADASTRO RÁPIDO DE PEÇA NO ESTOQUE */}
      <Dialog open={showQuickProductModal} onOpenChange={setShowQuickProductModal}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Package className="w-4 h-4" />
              </div>
              <span>Cadastrar Nova Peça no Estoque</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Cadastre a peça para vincular diretamente à ordem sem sair da tela.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateProduct} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Nome da Peça / Produto *</Label>
              <Input
                required
                value={quickProdName}
                onChange={e => setQuickProdName(e.target.value)}
                placeholder="Ex: Filtro de Combustível Racor"
                className="h-9 text-xs bg-white mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Código / SKU</Label>
                <Input
                  value={quickProdCode}
                  onChange={e => setQuickProdCode(e.target.value)}
                  placeholder="Ex: FIL-RAC-02"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Unidade</Label>
                <select
                  value={quickProdUnit}
                  onChange={e => setQuickProdUnit(e.target.value)}
                  className="w-full h-9 text-xs rounded-lg border border-gray-300 bg-white px-2 mt-1"
                >
                  <option value="UN">UN</option>
                  <option value="PC">PC</option>
                  <option value="JG">JG</option>
                  <option value="LT">LT</option>
                  <option value="MT">MT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Custo (R$)</Label>
                <Input
                  value={quickProdCost}
                  onChange={e => setQuickProdCost(e.target.value)}
                  placeholder="Ex: 90,00"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Venda (R$)</Label>
                <Input
                  value={quickProdPrice}
                  onChange={e => setQuickProdPrice(e.target.value)}
                  placeholder="Ex: 150,00"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-gray-700">Estoque</Label>
                <Input
                  type="number"
                  value={quickProdStock}
                  onChange={e => setQuickProdStock(e.target.value)}
                  placeholder="10"
                  className="h-9 text-xs bg-white mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickProductModal(false)}
                className="text-xs h-9 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingQuickProd}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 rounded-xl font-bold gap-1.5"
              >
                {savingQuickProd ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar e Selecionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: CADASTRO RÁPIDO DE TÉCNICO */}
      <Dialog open={showQuickUserModal} onOpenChange={setShowQuickUserModal}>
        <DialogContent className="max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-[#E2661D]">
                <Users className="w-4 h-4" />
              </div>
              <span>Cadastrar Novo Colaborador</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Adicione um técnico de campo para alocar na execução desta ordem.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateUser} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Nome Completo *</Label>
              <Input
                required
                value={quickUserName}
                onChange={e => setQuickUserName(e.target.value)}
                placeholder="Ex: Roberto Gomes"
                className="h-9 text-xs bg-white mt-1"
                autoFocus
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">E-mail *</Label>
              <Input
                type="email"
                required
                value={quickUserEmail}
                onChange={e => setQuickUserEmail(e.target.value)}
                placeholder="roberto@setgen.com.br"
                className="h-9 text-xs bg-white mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickUserModal(false)}
                className="text-xs h-9 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingQuickUser}
                className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 rounded-xl font-bold gap-1.5"
              >
                {savingQuickUser ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Salvar e Selecionar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
