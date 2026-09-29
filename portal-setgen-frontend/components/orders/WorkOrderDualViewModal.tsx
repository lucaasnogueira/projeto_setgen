"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ordersApi } from "@/lib/api/orders";
import { SignaturePad } from "@/app/(portal)/orders/components/SignaturePad";
import {
  FileText,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Clock,
  DollarSign,
  PackageCheck,
  PenTool,
  Printer,
  CheckCircle2,
  Navigation,
  AlertTriangle,
} from "lucide-react";
import { formatDateBR, formatDateTimeBR } from "@/lib/date";

interface WorkOrderDualViewModalProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

export function WorkOrderDualViewModal({
  orderId,
  open,
  onOpenChange,
  onUpdated,
}: WorkOrderDualViewModalProps) {
  const [activeTab, setActiveTab] = useState<"client" | "internal">("client");
  const [clientView, setClientView] = useState<any>(null);
  const [internalView, setInternalView] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signerDoc, setSignerDoc] = useState("");
  const [savingSignature, setSavingSignature] = useState(false);
  const [executingAction, setExecutingAction] = useState(false);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Alimentação");
  const [savingExpense, setSavingExpense] = useState(false);

  useEffect(() => {
    if (open && orderId) {
      loadViews(orderId);
    }
  }, [open, orderId]);

  const loadViews = async (id: string) => {
    setLoading(true);
    try {
      const [cv, iv] = await Promise.allSettled([
        ordersApi.getClientView(id),
        ordersApi.getInternalView(id),
      ]);
      if (cv.status === "fulfilled") setClientView(cv.value);
      if (iv.status === "fulfilled") setInternalView(iv.value);
    } catch (e) {
      console.error("Erro ao carregar visões da OS:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSignature = async (blob: Blob) => {
    if (!orderId) return;
    if (!signerName.trim()) {
      alert("Por favor, informe o nome do responsável pela assinatura.");
      return;
    }

    setSavingSignature(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        await ordersApi.collectClientSignature(orderId, {
          signerName: signerName,
          signerDocument: signerDoc || "Não informado",
          signatureImageUrl: base64data,
        });
        alert("Assinatura do cliente salva com sucesso!");
        loadViews(orderId);
        onUpdated?.();
      };
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao salvar assinatura.");
    } finally {
      setSavingSignature(false);
    }
  };

  const handleAddExpense = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderId || !expenseDesc.trim() || !expenseAmount) {
      alert("Informe a descrição e o valor da despesa.");
      return;
    }
    const val = Number(expenseAmount);
    if (isNaN(val) || val <= 0) {
      alert("Informe um valor válido maior que zero.");
      return;
    }

    setSavingExpense(true);
    try {
      await ordersApi.addExpense(orderId, {
        description: `${expenseCategory}: ${expenseDesc.trim()}`,
        amount: val,
        categoryName: expenseCategory,
      });
      alert(`Despesa "${expenseDesc}" de ${formatMoney(val)} registrada na OS!`);
      setExpenseDesc("");
      setExpenseAmount("");
      loadViews(orderId);
      onUpdated?.();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erro ao registrar despesa na OS.");
    } finally {
      setSavingExpense(false);
    }
  };

  const handleAction = async (action: "displacement" | "checkin" | "checkout") => {
    if (!orderId) return;
    setExecutingAction(true);
    try {
      if (action === "displacement") {
        await ordersApi.startDisplacement(orderId, {
          latitude: -23.55052,
          longitude: -46.633308,
        });
        alert("Deslocamento iniciado registrado!");
      } else if (action === "checkin") {
        await ordersApi.checkin(orderId, {
          latitude: -23.55052,
          longitude: -46.633308,
          notes: "Check-in presencial no local do cliente",
        });
        alert("Check-in realizado!");
      } else if (action === "checkout") {
        const confirmCheckout = window.confirm(
          "Deseja finalizar a OS com Check-out e realizar a baixa automática de materiais em estoque?"
        );
        if (!confirmCheckout) return;
        await ordersApi.checkout(orderId, {
          latitude: -23.55052,
          longitude: -46.633308,
          notes: "Serviço finalizado com sucesso.",
        });
        alert("Check-out realizado e estoque deduzido!");
      }
      loadViews(orderId);
      onUpdated?.();
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao executar ação operacional.");
    } finally {
      setExecutingAction(false);
    }
  };

  const formatMoney = (val: number | null | undefined) =>
    (val || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {clientView
                    ? `OS #${clientView.orderNumber} - ${clientView.client?.companyName || "Cliente"}`
                    : "Visões da Ordem de Serviço"}
                </DialogTitle>
                <DialogDescription>
                  Alternância segura entre visão pública do cliente e visão gerencial interna de custos.
                </DialogDescription>
              </div>
            </div>
            {clientView?.status && (
              <Badge variant="outline" className="px-3 py-1 font-semibold text-xs uppercase">
                {clientView.status}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Carregando dados da Ordem de Serviço...</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
            <TabsList className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl">
              <TabsTrigger value="client" className="rounded-lg gap-2 text-xs font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                OS do Cliente (Externa / Digital)
              </TabsTrigger>
              <TabsTrigger value="internal" className="rounded-lg gap-2 text-xs font-semibold">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                OS Interna (Custos, KM •& Margem)
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: OS DO CLIENTE */}
            <TabsContent value="client" className="space-y-6 pt-4">
              <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-bold text-base text-foreground">Relatório da Ordem de Serviço Digital</h3>
                    <p className="text-xs text-muted-foreground">
                      Visão oficial acordada comercialmente com preços de venda e escopo público.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 text-xs rounded-xl">
                    <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
                  </Button>
                </div>

                {/* Dados Principais */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Cliente:</span>
                    <strong className="text-foreground">{clientView?.client?.companyName || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">CNPJ / CPF:</span>
                    <span className="font-mono text-foreground">{clientView?.client?.document || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Prazo Acordado:</span>
                    <span className="text-foreground">{clientView?.deadline ? formatDateBR(clientView.deadline) : "A combinar"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Técnico / Responsável:</span>
                    <span className="text-foreground">{clientView?.assignedTo?.name || clientView?.createdBy?.name || "Equipe Técnica"}</span>
                  </div>
                </div>

                {/* Serviços Contratados */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Serviços Contratados</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="py-2.5 px-4 text-left font-semibold">Descrição do Serviço</th>
                          <th className="py-2.5 px-4 text-center font-semibold">Qtd</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Valor Unit.</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(clientView?.itemServices || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                              Nenhum serviço registrado.
                            </td>
                          </tr>
                        ) : (
                          clientView.itemServices.map((svc: any) => (
                            <tr key={svc.id}>
                              <td className="py-2.5 px-4">
                                <div className="font-medium text-foreground">{svc.service?.name || svc.description || "Serviço"}</div>
                                {svc.scopeObservation && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap">
                                    {svc.scopeObservation}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">{svc.quantity}</td>
                              <td className="py-2.5 px-4 text-right">{formatMoney(Number(svc.unitPrice))}</td>
                              <td className="py-2.5 px-4 text-right font-semibold">{formatMoney(Number(svc.totalPrice))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Peças e Produtos */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Peças e Materiais Utilizados</h4>
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="py-2.5 px-4 text-left font-semibold">Item</th>
                          <th className="py-2.5 px-4 text-center font-semibold">Qtd</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Valor Unit.</th>
                          <th className="py-2.5 px-4 text-right font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(clientView?.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                              Nenhuma peça faturada diretamente.
                            </td>
                          </tr>
                        ) : (
                          clientView.items.map((it: any) => (
                            <tr key={it.id}>
                              <td className="py-2.5 px-4 font-medium text-foreground">{it.product?.name || "Produto"}</td>
                              <td className="py-2.5 px-4 text-center">{it.quantity}</td>
                              <td className="py-2.5 px-4 text-right">{formatMoney(Number(it.unitPrice))}</td>
                              <td className="py-2.5 px-4 text-right font-semibold">{formatMoney(Number(it.totalPrice))}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Anexos Públicos */}
                {(clientView?.attachments || []).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Anexos e Documentos</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {clientView.attachments.map((att: any) => (
                        <a
                          key={att.id}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-2.5 border rounded-xl hover:bg-muted/40 text-xs transition"
                        >
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate font-medium">{att.fileName}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assinatura Digital do Cliente */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <PenTool className="h-4 w-4 text-orange-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Assinatura Digital de Conclusão / Aceite
                    </h4>
                  </div>

                  {clientView?.signature ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                      <img
                        src={clientView.signature.signatureUrl}
                        alt="Assinatura Coletada"
                        className="h-20 bg-card border rounded-lg p-1 object-contain"
                      />
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="h-4 w-4" /> Assinatura digital válida coletada
                        </div>
                        <p><strong>Nome:</strong> {clientView.signature.signedByName}</p>
                        {clientView.signature.document && <p><strong>Documento:</strong> {clientView.signature.document}</p>}
                        <p className="text-muted-foreground"><strong>Coletado em:</strong> {formatDateTimeBR(clientView.signature.createdAt)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 border rounded-xl bg-muted/20 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Nome do Responsável / Recebedor *</Label>
                          <Input
                            placeholder="Ex: João da Silva"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            className="mt-1 h-8 text-xs rounded-xl"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Documento (CPF / RG)</Label>
                          <Input
                            placeholder="Ex: 123.456.789-00"
                            value={signerDoc}
                            onChange={(e) => setSignerDoc(e.target.value)}
                            className="mt-1 h-8 text-xs rounded-xl"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1.5 block">Assine com o mouse ou tela touch abaixo:</Label>
                        <SignaturePad onSave={handleSaveSignature} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ABA 2: OS INTERNA (CUSTOS, MARGEM & OPERAÇÃO) */}
            <TabsContent value="internal" className="space-y-6 pt-4">
              {/* Painel de Rentabilidade e Margem */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Card className="p-4 space-y-1 bg-card border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" /> Faturamento Previsto
                  </span>
                  <div className="text-lg font-bold text-foreground">
                    {formatMoney(internalView?.marginSummary?.billedTotal)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Receita bruta da OS</span>
                </Card>

                <Card className="p-4 space-y-1 bg-card border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <PackageCheck className="h-3.5 w-3.5 text-amber-600" /> Custo Total Direto
                  </span>
                  <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                    {formatMoney(internalView?.marginSummary?.totalCost)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Materiais + Mão de obra + KM</span>
                </Card>

                <Card className="p-4 space-y-1 bg-card border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" /> Lucro Bruto
                  </span>
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {formatMoney(internalView?.marginSummary?.grossProfit)}
                  </div>
                  <span className="text-[10px] text-muted-foreground">Margem em Reais</span>
                </Card>

                <Card className="p-4 space-y-1 bg-card border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" /> Margem %
                  </span>
                  <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400">
                    {internalView?.marginSummary?.marginPercent || 0}%
                  </div>
                  <span className="text-[10px] text-muted-foreground">Rentabilidade líquida</span>
                </Card>
              </div>

              {/* Ações de Campo (Deslocamento, Check-in, Check-out com Baixa) */}
              <Card className="p-4 border-dashed border-2 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Controle de Deslocamento e Execução Operacional
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={executingAction}
                      onClick={() => handleAction("displacement")}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <MapPin className="h-3.5 w-3.5 text-blue-600" /> Iniciar Deslocamento
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={executingAction}
                      onClick={() => handleAction("checkin")}
                      className="rounded-xl text-xs gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5 text-amber-600" /> Check-in Local
                    </Button>
                    <Button
                      size="sm"
                      disabled={executingAction}
                      onClick={() => handleAction("checkout")}
                      className="rounded-xl text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <PackageCheck className="h-3.5 w-3.5" /> Check-out & Baixa Estoque
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Detalhamento dos Custos Internos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Materiais e Custo de Aquisição */}
                <div className="border rounded-xl p-4 bg-card space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Materiais & Estoque</span>
                    <span className="text-foreground">Custo: {formatMoney(internalView?.marginSummary?.materialsCost)}</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="py-2 px-3 text-left">Item</th>
                          <th className="py-2 px-3 text-center">Qtd</th>
                          <th className="py-2 px-3 text-right">Custo Un.</th>
                          <th className="py-2 px-3 text-right">Preço Venda</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(internalView?.materials || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-3 text-center text-muted-foreground italic">
                              Nenhum material listado.
                            </td>
                          </tr>
                        ) : (
                          internalView.materials.map((m: any) => (
                            <tr key={m.id}>
                              <td className="py-2 px-3 font-medium">{m.product?.name || "Produto"}</td>
                              <td className="py-2 px-3 text-center">{m.quantity}</td>
                              <td className="py-2 px-3 text-right text-amber-700 dark:text-amber-400 font-mono">
                                {formatMoney(Number(m.product?.unitCost || 0))}
                              </td>
                              <td className="py-2 px-3 text-right font-mono">
                                {formatMoney(Number(m.unitPrice))}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mão de Obra e Deslocamento do Técnico */}
                <div className="border rounded-xl p-4 bg-card space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span>Mão de Obra & Deslocamento</span>
                    <span className="text-foreground">
                      Total: {formatMoney(Number(internalView?.marginSummary?.laborCost || 0) + Number(internalView?.marginSummary?.displacementCost || 0))}
                    </span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40">
                      <div>
                        <span className="font-semibold block">Mão de Obra Efetiva:</span>
                        <span className="text-muted-foreground text-[11px]">
                          {internalView?.laborSnapshot?.actualHoursWorked || 0}h trabalhadas •× {formatMoney(internalView?.laborSnapshot?.hourlyRateSnapshot)}/h
                        </span>
                      </div>
                      <span className="font-mono font-bold">{formatMoney(internalView?.marginSummary?.laborCost)}</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-muted/40">
                      <div>
                        <span className="font-semibold block">Deslocamento Real (KM):</span>
                        <span className="text-muted-foreground text-[11px]">
                          {internalView?.laborSnapshot?.actualKmTraveled || 0} KM •× {formatMoney(internalView?.laborSnapshot?.kmRateSnapshot)}/KM
                        </span>
                      </div>
                      <span className="font-mono font-bold">{formatMoney(internalView?.marginSummary?.displacementCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Despesas de Campo (Alimentação, Pedágio, Hospedagem) */}
              <div className="border rounded-xl p-4 bg-card space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-orange-600" />
                    Despesas de Campo & Operacionais (Alimentação, Pedágio, Combustível, Hospedagem)
                  </h4>
                  <span className="text-xs font-bold text-foreground">
                    Total de Gastos: {formatMoney(internalView?.fieldExpensesTracking?.totalExpenses || 0)}
                  </span>
                </div>

                {/* Formulário Rápido de Lançamento */}
                <form onSubmit={handleAddExpense} className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 rounded-xl border border-border">
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="h-8 text-xs rounded-lg border border-border bg-card px-2 outline-none"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Pedágio">Pedágio / Estacionamento</option>
                    <option value="Hospedagem">Hospedagem / Diária</option>
                    <option value="Outro">Outro Custo</option>
                  </select>

                  <Input
                    placeholder="Descrição do gasto (ex: Almoço da equipe técnica no local)"
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    className="h-8 text-xs rounded-lg flex-1 min-w-[200px]"
                  />

                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Valor R$"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="h-8 text-xs rounded-lg w-28 text-right font-mono"
                  />

                  <Button
                    type="submit"
                    size="sm"
                    disabled={savingExpense}
                    className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 gap-1 rounded-lg"
                  >
                    {savingExpense ? "Lançando..." : "+ Lançar Gasto na OS"}
                  </Button>
                </form>

                {/* Tabela de Despesas Lançadas */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="py-2 px-3 text-left">Código</th>
                        <th className="py-2 px-3 text-left">Descrição do Gasto</th>
                        <th className="py-2 px-3 text-left">Lançado por</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(!internalView?.fieldExpensesTracking?.items || internalView.fieldExpensesTracking.items.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground italic">
                            Nenhum gasto adicional (alimentação, pedágio, etc.) registrado nesta OS.
                          </td>
                        </tr>
                      ) : (
                        internalView.fieldExpensesTracking.items.map((exp: any) => (
                          <tr key={exp.id}>
                            <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{exp.code}</td>
                            <td className="py-2 px-3 font-medium">{exp.description}</td>
                            <td className="py-2 px-3 text-muted-foreground">{exp.user?.name || "Colaborador"}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                              {formatMoney(Number(exp.amount))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

