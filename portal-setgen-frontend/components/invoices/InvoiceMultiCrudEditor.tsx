"use client";

// =================================================================
// InvoiceMultiCrudEditor — Padrão Aurora Setgen
// Sidebar esquerda com abas + Área central scrollável + Rodapé fixo
// Sem wizard quebrado, com rascunho e emissão SEFAZ limpa
// =================================================================

import React, { useState, useEffect } from "react";
import {
  FileText, Building2, Package, ShieldCheck, CheckCircle,
  Save, Clock, AlertCircle, Plus, Trash2, DollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fiscalApi, EmitirNotaMercadoriaDto } from "@/lib/api/fiscal";
import { clientsApi } from "@/lib/api/clients";
import { inventoryApi } from "@/lib/api/inventory";
import { ordersApi } from "@/lib/api/orders";
import { Client, Product, ServiceOrder, ServiceOrderStatus } from "@/types";

type InvoiceTabKey = "destinatario" | "itens" | "fiscal";

interface NotaItem {
  productId: string;
  code: string;
  name: string;
  ncm: string;
  quantidade: number;
  valorUnitario: number;
  fabricadoNaZfm: boolean;
}

interface Props {
  defaultClientId?: string;
  defaultServiceOrderId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function InvoiceMultiCrudEditor({
  defaultClientId,
  defaultServiceOrderId,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<InvoiceTabKey>("destinatario");

  // === Form States ===
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [serviceOrderId, setServiceOrderId] = useState(defaultServiceOrderId || "");
  const [ambiente, setAmbiente] = useState<"PRODUCAO" | "HOMOLOGACAO">("HOMOLOGACAO");
  const [cfopPadrao, setCfopPadrao] = useState("5102");
  const [items, setItems] = useState<NotaItem[]>([]);

  // === Catálogos ===
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);

  // === Adicionar Item ===
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  // === UI States ===
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [c, p, o1, o2, o3] = await Promise.all([
          clientsApi.getAll().catch(() => [] as Client[]),
          inventoryApi.getAll().catch(() => [] as Product[]),
          ordersApi.getAll({ status: ServiceOrderStatus.AWAITING_MATERIALS }).catch(() => [] as ServiceOrder[]),
          ordersApi.getAll({ status: ServiceOrderStatus.IN_PROGRESS }).catch(() => [] as ServiceOrder[]),
          ordersApi.getAll({ status: ServiceOrderStatus.COMPLETED }).catch(() => [] as ServiceOrder[]),
        ]);
        setClients(c);
        setProducts(p);
        setServiceOrders([...o1, ...o2, ...o3]);
      } catch (err) {
        console.error("Erro ao carregar dados fiscais:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const clientServiceOrders = serviceOrders.filter((os) => !clientId || os.clientId === clientId);
  const selectedClient = clients.find((c) => c.id === clientId);

  // Rascunho
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_invoice_draft");
      if (saved) {
        try {
          const d = JSON.parse(saved);
          if (d.clientId || (d.items && d.items.length > 0)) setDraftNotice(true);
        } catch {}
      }
    }
  }, []);

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_invoice_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.clientId) setClientId(d.clientId);
      if (d.serviceOrderId) setServiceOrderId(d.serviceOrderId);
      if (d.ambiente) setAmbiente(d.ambiente);
      if (d.items) setItems(d.items);
    } catch {} finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_invoice_draft");
    setDraftNotice(false);
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "setgen_invoice_draft",
      JSON.stringify({ clientId, serviceOrderId, ambiente, items })
    );
    alert("Rascunho de faturamento salvo com sucesso!");
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;
    if (items.some((i) => i.productId === selectedProductId)) {
      alert("Este produto já foi adicionado aos itens da nota.");
      return;
    }

    const qty = Math.max(1, Number(quantidade) || 1);
    const price = Number(prod.unitPrice || prod.unitCost || 0);

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        code: prod.code || "",
        name: prod.name,
        ncm: prod.ncm || "8502.11.10",
        quantidade: qty,
        valorUnitario: price,
        fabricadoNaZfm: true,
      },
    ]);
    setSelectedProductId("");
    setQuantidade("1");
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalValue = items.reduce((acc, it) => acc + it.quantidade * it.valorUnitario, 0);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!clientId) errs.clientId = "Cliente destinatário da nota é obrigatório";
    if (items.length === 0) errs.items = "Adicione pelo menos um produto para emitir a NF-e";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleEmitir = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const payload: EmitirNotaMercadoriaDto = {
        clientId,
        serviceOrderId: serviceOrderId || undefined,
        ambiente,
        itens: items.map((it) => ({
          productId: it.productId,
          quantidade: it.quantidade,
          valorUnitario: it.valorUnitario,
          fabricadoNaZfm: it.fabricadoNaZfm,
          cfop: cfopPadrao,
        })),
      };

      await fiscalApi.emitirMercadoria(payload);
      localStorage.removeItem("setgen_invoice_draft");
      alert("Nota fiscal emitida com sucesso junto à SEFAZ!");
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      alert(`Erro na emissão: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: InvoiceTabKey; icon: React.ComponentType<{ className?: string }>; label: string; count?: number }[] = [
    { key: "destinatario", icon: Building2, label: "Destinatário & Vínculo" },
    { key: "itens", icon: Package, label: "Produtos & Peças", count: items.length },
    { key: "fiscal", icon: ShieldCheck, label: "Parâmetros Fiscais & ZFM" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen bg-white">

      {/* ===== SIDEBAR ESQUERDA (PADRÃO CLIENTE) ===== */}
      <aside className="w-full lg:w-64 bg-gray-50/90 border-r border-gray-200 p-5 shrink-0 flex flex-col justify-between text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <FileText className="w-4 h-4 text-orange-600" />
              Emitir NF-e
            </span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              ambiente === "PRODUCAO" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
            }`}>
              {ambiente}
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

        {/* Resumo da Nota */}
        <div className="pt-4 border-t border-gray-200 space-y-2 text-[11px] text-gray-500">
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span className="font-semibold text-gray-800 truncate max-w-[120px]">
              {selectedClient?.companyName || "Não selecionado"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Itens:</span>
            <span className="font-semibold text-gray-800">{items.length} produto(s)</span>
          </div>
          <div className="flex justify-between">
            <span>Total da NF:</span>
            <span className="font-bold text-emerald-600">
              R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
              Existe um rascunho de emissão de NF-e salvo. Deseja restaurá-lo?
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

          {/* ══ ABA 1: DESTINATÁRIO & VÍNCULO ═════════════════════ */}
          {activeTab === "destinatario" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />Destinatário da Nota Fiscal
                  </h4>
                  <span className="text-gray-400 text-xs">Dados cadastrais e fiscais do tomador</span>
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">
                    Cliente / Razão Social <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-medium"
                  >
                    <option value="">Selecione o cliente destinatário...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.cnpjCpf ? `(${c.cnpjCpf})` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.clientId}</p>}
                </div>

                <div>
                  <Label className="block font-semibold text-gray-700 mb-1">
                    Vincular à Ordem de Serviço (Opcional)
                  </Label>
                  <select
                    value={serviceOrderId}
                    onChange={(e) => setServiceOrderId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                  >
                    <option value="">Nenhuma O.S. vinculada (venda direta de peças/mercadoria)</option>
                    {clientServiceOrders.map((os) => (
                      <option key={os.id} value={os.id}>
                        O.S. {os.orderNumber} — {os.client?.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: PRODUTOS & PEÇAS ═══════════════════════════ */}
          {activeTab === "itens" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" />Itens da Nota Fiscal
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">Selecione peças e materiais do estoque para compor a nota</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50/60 p-3.5 rounded-xl border border-gray-200">
                  <div className="flex-1">
                    <Label className="block font-semibold text-gray-700 mb-1">Produto / Peça do Estoque</Label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value="">Selecione um produto...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code ? `[${p.code}] ` : ""}{p.name} (R$ {Number(p.unitPrice || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <Label className="block font-semibold text-gray-700 mb-1">Qtd.</Label>
                    <Input
                      type="number"
                      min="1"
                      value={quantidade}
                      onChange={(e) => setQuantidade(e.target.value)}
                      className="h-9 text-xs bg-white"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs h-9 px-4 rounded-lg font-bold gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </Button>
                </div>

                {errors.items && <p className="text-[11px] text-red-500 font-semibold">{errors.items}</p>}

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-xl">
                    Nenhum produto adicionado à nota ainda.
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="text-left px-4 py-2.5">Código / Descrição</th>
                          <th className="text-center px-4 py-2.5">NCM</th>
                          <th className="text-right px-4 py-2.5">Qtd.</th>
                          <th className="text-right px-4 py-2.5">Valor Unit.</th>
                          <th className="text-right px-4 py-2.5">Total</th>
                          <th className="text-center px-4 py-2.5 w-16">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-gray-500 mr-2">{it.code || "—"}</span>
                              <span className="font-medium text-gray-900">{it.name}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center font-mono text-gray-500">{it.ncm}</td>
                            <td className="px-4 py-2.5 text-right font-medium">{it.quantidade}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600">R$ {it.valorUnitario.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                              R$ {(it.quantidade * it.valorUnitario).toFixed(2)}
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

          {/* ══ ABA 3: PARÂMETROS FISCAIS & ZFM ════════════════════ */}
          {activeTab === "fiscal" && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />Parâmetros Tributários & SEFAZ-AM
                </h4>
                <p className="text-gray-400 text-xs">Configuração do ambiente de emissão e benefícios fiscais Suframa</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Ambiente de Emissão SEFAZ</Label>
                    <select
                      value={ambiente}
                      onChange={(e) => setAmbiente(e.target.value as any)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 font-semibold"
                    >
                      <option value="HOMOLOGACAO">Homologação (Testes / Sem valor fiscal)</option>
                      <option value="PRODUCAO">Produção (SEFAZ Real / Valor Jurídico)</option>
                    </select>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">CFOP Padrão de Saída</Label>
                    <Input
                      type="text"
                      value={cfopPadrao}
                      onChange={(e) => setCfopPadrao(e.target.value)}
                      placeholder="Ex: 5102, 6102, 5949"
                      className="h-9 text-xs bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-800">
                  <span className="font-bold block mb-1">Regime Especial Zona Franca de Manaus:</span>
                  Os itens cadastrados com fabricação ZFM contam com desoneração automática de PIS/COFINS e incentivo de ICMS conforme a legislação vigente do Estado do Amazonas.
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
              disabled={submitting}
              onClick={handleEmitir}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs rounded-lg h-9 px-5 gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {submitting ? "Transmitindo SEFAZ..." : "Emitir Nota Fiscal"}
            </Button>
          </div>
        </div>

      </main>
    </div>
  );
}
