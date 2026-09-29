"use client";

// =================================================================
// PurchaseOrderMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizard quebrado, com rascunho e validação limpa
// =================================================================

import React, { useState, useEffect } from "react";
import {
  FileText, DollarSign, Calendar, Upload, CheckCircle,
  Save, Clock, AlertCircle, ShoppingCart, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { purchaseOrdersApi } from "@/lib/api/purchase-orders";
import { quotesApi } from "@/lib/api/quotes";
import { PurchaseOrder, Quote, QuoteStatus } from "@/types";
import { toDateInputValue, startOfBusinessDayISO, endOfBusinessDayISO } from "@/lib/date";

const OC_ELIGIBLE_STATUSES: QuoteStatus[] = [
  QuoteStatus.APPROVED,
  QuoteStatus.SENT_TO_CLIENT,
  QuoteStatus.AWAITING_RESPONSE,
];

type OCTabKey = "vinculo" | "dados" | "documento";

interface Props {
  orderId?: string;
  defaultQuoteId?: string;
  initialData?: Partial<PurchaseOrder>;
  onClose?: () => void;
  onSuccess?: (order: PurchaseOrder) => void;
}

export function PurchaseOrderMultiCrudEditor({
  orderId,
  defaultQuoteId,
  initialData,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<OCTabKey>("vinculo");

  // === Form States ===
  const [quoteId, setQuoteId] = useState(defaultQuoteId || initialData?.quoteId || "");
  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [orderNumber, setOrderNumber] = useState(initialData?.orderNumber || "");
  const [value, setValue] = useState(initialData?.value !== undefined ? String(initialData.value) : "");
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate ? toDateInputValue(initialData.issueDate) : toDateInputValue(new Date())
  );
  const [expiryDate, setExpiryDate] = useState(
    initialData?.expiryDate ? toDateInputValue(initialData.expiryDate) : ""
  );
  const [file, setFile] = useState<File | null>(null);

  // === Catálogo de Orçamentos ===
  const [quotes, setQuotes] = useState<Quote[]>([]);

  // === UI States ===
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadQuotes() {
      setLoading(true);
      try {
        const data = await quotesApi.getAll();
        const eligible = data.filter(
          (q) => OC_ELIGIBLE_STATUSES.includes(q.status) || q.id === (defaultQuoteId || initialData?.quoteId)
        );
        setQuotes(eligible);

        if (defaultQuoteId && !orderId) {
          const q = eligible.find((x) => x.id === defaultQuoteId);
          if (q) {
            setClientId(q.clientId);
            setOrderNumber(generateOCNumber(q.quoteNumber));
          }
        }
      } catch (err) {
        console.error("Erro ao carregar orçamentos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadQuotes();
  }, [defaultQuoteId, initialData?.quoteId, orderId]);

  const generateOCNumber = (qNumber: string) => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `OC-${year}-${qNumber}-${random}`;
  };

  const handleQuoteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setQuoteId(selectedId);
    const selectedQuote = quotes.find((q) => q.id === selectedId);
    if (selectedQuote) {
      setClientId(selectedQuote.clientId);
      if (!orderNumber) {
        setOrderNumber(generateOCNumber(selectedQuote.quoteNumber));
      }
    }
  };

  // Rascunho
  useEffect(() => {
    if (!orderId && typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_po_draft");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.quoteId || d.orderNumber || d.value) setDraftNotice(true);
        } catch {}
      }
    }
  }, [orderId]);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_po_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.quoteId) setQuoteId(d.quoteId);
      if (d.clientId) setClientId(d.clientId);
      if (d.orderNumber) setOrderNumber(d.orderNumber);
      if (d.value) setValue(d.value);
      if (d.issueDate) setIssueDate(d.issueDate);
      if (d.expiryDate) setExpiryDate(d.expiryDate);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_po_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_po_draft",
      JSON.stringify({ quoteId, clientId, orderNumber, value, issueDate, expiryDate })
    );
    alert("Rascunho da Ordem de Compra salvo com sucesso!");
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!quoteId) errs.quoteId = "Orçamento vinculado é obrigatório";
    if (!orderNumber.trim()) errs.orderNumber = "Número da OC é obrigatório";
    if (!orderId && !file) errs.file = "O anexo digital da OC (PDF ou imagem) é obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      if (orderId) {
        const payload: Partial<PurchaseOrder> = {
          orderNumber: orderNumber.trim(),
          value: value ? Number(value) : undefined,
          issueDate: issueDate ? startOfBusinessDayISO(issueDate) : undefined,
          expiryDate: expiryDate ? endOfBusinessDayISO(expiryDate) : undefined,
        };
        const result = await purchaseOrdersApi.update(orderId, payload);
        alert("Ordem de Compra atualizada com sucesso!");
        onSuccess?.(result);
      } else {
        const formData = new FormData();
        formData.append("quoteId", quoteId);
        formData.append("clientId", clientId);
        formData.append("orderNumber", orderNumber.trim());
        if (value) formData.append("value", value);
        formData.append("issueDate", startOfBusinessDayISO(issueDate) || "");
        formData.append("expiryDate", endOfBusinessDayISO(expiryDate) || "");
        if (file) formData.append("file", file);

        const result = await purchaseOrdersApi.create(formData);
        localStorage.removeItem("setgen_po_draft");
        alert("Ordem de Compra / Pedido cadastrado com sucesso!");
        onSuccess?.(result);
      }
      onClose?.();
    } catch (err: any) {
      alert(`Erro ao salvar: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedQuote = quotes.find(q => q.id === quoteId);

  const tabs: { key: OCTabKey; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { key: "vinculo", icon: ShoppingCart, label: "Orçamento & Cliente" },
    { key: "dados", icon: FileText, label: "Dados da OC & Valores" },
    { key: "documento", icon: Paperclip, label: "Documento Anexo" },
  ];

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <ShoppingCart className="w-4 h-4 text-orange-600" />
              {orderId ? "Editar OC/OP" : "Nova Ordem de Compra"}
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
                </button>
              );
            })}
          </nav>
        </div>

        {/* Resumo */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
          <div className="flex justify-between">
            <span>Orçamento:</span>
            <span className="font-mono font-bold text-gray-900">{selectedQuote?.quoteNumber || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="font-semibold text-gray-800 truncate max-w-[120px]">
              {selectedQuote?.client?.companyName || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Valor OC:</span>
            <span className="font-bold text-emerald-600">
              {value ? `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
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
              Existe um rascunho de Ordem de Compra salvo. Deseja restaurá-lo?
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

          {/* ══ ABA 1: ORÇAMENTO & CLIENTE ═══════════════════════ */}
          {activeTab === "vinculo" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-orange-600" />Vínculo com Proposta Comercial
                  </h4>
                  <span className="text-gray-400 text-xs">A OC deve ser emitida sobre um orçamento aprovado</span>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">
                    Orçamento Comercial Aprovado <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={quoteId}
                    onChange={handleQuoteSelect}
                    disabled={!!defaultQuoteId || !!orderId}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-medium disabled:bg-gray-100"
                  >
                    <option value="">Selecione um orçamento aprovado...</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quoteNumber} — {q.client?.companyName}
                      </option>
                    ))}
                  </select>
                  {errors.quoteId && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.quoteId}</p>}
                </div>

                {selectedQuote && (
                  <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Cliente Faturado:</span>
                      <span>{selectedQuote.client?.companyName}</span>
                    </div>
                    {selectedQuote.scope && (
                      <div className="pt-1">
                        <span className="font-semibold text-gray-900 block mb-0.5">Escopo Comercial Aprovado:</span>
                        <p className="text-gray-600 line-clamp-3">{selectedQuote.scope}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ABA 2: DADOS DA OC & VALORES ══════════════════════ */}
          {activeTab === "dados" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />Identificação da Ordem de Compra
                </h4>
                <p className="text-gray-400 text-xs">Número gerado pelo cliente, valores contratuais e vigência</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Número da Ordem de Compra / Pedido <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                      placeholder="Ex: OC-2026-0042 ou PED-88410"
                      className="h-9 text-xs bg-white font-mono"
                    />
                    {errors.orderNumber && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.orderNumber}</p>}
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Valor Total Autorizado (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={value}
                      onChange={e => setValue(e.target.value)}
                      placeholder="Ex: 15450.00"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Data de Emissão da OC</Label>
                    <Input
                      type="date"
                      value={issueDate}
                      onChange={e => setIssueDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Data Limite de Validade / Execução</Label>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={e => setExpiryDate(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 3: DOCUMENTO ANEXO ════════════════════════════ */}
          {activeTab === "documento" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-orange-600" />Arquivo Digital da OC / Pedido Assinado
                </h4>
                <p className="text-gray-400 text-xs">Faça o upload do documento emitido pelo cliente para fins de compliance e auditoria</p>

                <div className="border-2 border-dashed border-gray-200 hover:border-orange-400 rounded-2xl p-8 text-center transition-colors">
                  <input
                    type="file"
                    id="poFileUpload"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={e => {
                      if (e.target.files?.[0]) setFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <label htmlFor="poFileUpload" className="cursor-pointer block space-y-2">
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                      <Paperclip className="w-5 h-5" />
                    </div>
                    {file ? (
                      <div>
                        <span className="font-bold text-gray-900 text-xs block">{file.name}</span>
                        <span className="text-gray-400 text-[11px]">{(file.size / 1024).toFixed(1)} KB · Clique para trocar</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-gray-700 text-xs block">
                          Clique para selecionar ou arraste o arquivo aqui
                        </span>
                        <span className="text-gray-400 text-[11px]">Formatos suportados: PDF, PNG, JPG (máx. 25MB)</span>
                      </div>
                    )}
                  </label>
                </div>
                {errors.file && <p className="text-[11px] text-red-500 font-semibold">{errors.file}</p>}
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
              {saving ? "Salvando..." : orderId ? "Salvar Alterações" : "Salvar Ordem de Compra"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
