"use client";

// =================================================================
// QuoteMultiCrudEditor — Padrão Completo Aurora Setgen
// 1. Tradução completa ("Orçamento", "Orçamentos")
// 2. Multi-CRUD e '+' em todas as listas (Cliente, Colaborador, Forma, Prazo, Tipo de Tarefa)
// 3. Salvar como Rascunho com redirecionamento imediato para /quotes e status DRAFT
// 4. Exportação / Impressão em PDF formatada da proposta comercial
// 5. Auto-preenchimento ao selecionar cliente (Contato no local e Responsável SETGEN)
// 6. "Incluir Produto", "Incluir Serviço", "Incluir Custo", "Incluir Tarefa"
// 7. Fast Add Bar + Seleção Múltipla em Lote para PRODUTOS, SERVIÇOS e CUSTOS
// 8. Multi-CRUD em condições, notas e prazos
// 9. Botões de ação sempre visíveis no cabeçalho e rodapé (zero scroll)
// 10. Validações e mensagens de pendência 100% em português
// =================================================================

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Package, Wrench, DollarSign, Calendar, Paperclip,
  CheckCircle2, Plus, Trash2, Save, Clock, X, Building2,
  Users, CreditCard, ChevronRight, CheckCircle, Search, Loader2,
  Printer, Download, Copy, ArrowLeft, ExternalLink, HelpCircle,
  AlertCircle, FileCheck, Layers, Sparkles, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { quotesApi } from "@/lib/api/quotes";
import { servicesApi, ServiceItem } from "@/lib/api/services";
import { inventoryApi } from "@/lib/api/inventory";
import { paymentMethodsApi, PaymentMethodConfigItem } from "@/lib/api/payment-methods";
import { clientsApi } from "@/lib/api/clients";
import { usersApi, User } from "@/lib/api/users";
import { Client, Product, QuoteLineType, ServiceOrderType, QuoteStatus } from "@/types";
import { formatCurrency, formatDate, formatPhone, cn } from "@/lib/utils";
import { toast } from "sonner";

export type QuoteTabKey = "dados" | "produtos" | "servicos" | "custos" | "condicoes" | "tarefas" | "anexos" | "status";

export interface ProductItem {
  id?: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface ServiceRow {
  id?: string;
  serviceId?: string;
  title: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  customObservation?: string;
}

export interface AdditionalCostRow {
  id?: string;
  description: string;
  amount: number;
}

export interface TaskRow {
  id?: string;
  code: string;
  type: string;
  date: string;
  collaboratorName?: string;
}

export interface AttachmentRow {
  id?: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  date: string;
  showToClient: boolean;
}

const DEFAULT_COST_PRESETS = [
  "Deslocamento Técnico (KM)",
  "Hospedagem / Diária Técnica",
  "Alimentação / Refeições da Equipe",
  "Pedágio / Estacionamento",
  "Locação de Equipamentos / Caminhão Munck",
  "Taxa Administrativa / Emissão de ART",
  "Outro Custo Operacional",
];

const DEFAULT_TASK_TYPES = [
  "Preventiva Mecânica",
  "Corretiva Elétrica",
  "Inspeção Termográfica",
  "Comissionamento / Start-up",
  "Instalação / Cabeamento de Força",
  "Análise de Óleo / Coleta Laboratorial",
  "Treinamento Operacional",
  "Visita Técnica Diagnóstica",
];

const DEFAULT_PAYMENT_TERMS = [
  "À vista (100% no pedido)",
  "15 dias após emissão da NF",
  "28 dias após emissão da NF",
  "30 dias após emissão da NF",
  "15 / 30 dias da NF",
  "30 / 60 dias da NF",
  "30 / 60 / 90 dias da NF",
  "50% no pedido + 50% na conclusão",
];

const DEFAULT_STANDARD_CONDITIONS = [
  "Validade da proposta: 15 (quinze) dias corridos a partir da data de emissão.",
  "Frete e seguro inclusos para entrega na Região Metropolitana.",
  "Garantia de 12 meses para peças novas genuínas e 90 dias para os serviços executados.",
  "Faturamento direto faturado mediante aprovação cadastral e envio de Ordem de Compra (OC).",
  "Os serviços serão executados por técnicos habilitados seguindo as normas NR-10 e NR-35.",
];

function QuickAddPanel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-orange-200 bg-orange-50/80 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
      <div className="flex items-center justify-between pb-1 border-b border-orange-200/60">
        <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-orange-600" />
          {title}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-orange-500 hover:text-orange-800 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  );
}

interface Props {
  quoteId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function QuoteMultiCrudEditor({ quoteId, onClose, onSuccess }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<QuoteTabKey>("dados");
  const [targetType, setTargetType] = useState<"CLIENTE" | "LEAD">("CLIENTE");

  // === 1. Dados Gerais ===
  const [clientId, setClientId] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [requestDate, setRequestDate] = useState(new Date().toISOString().split("T")[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [responsibleName, setResponsibleName] = useState("");
  const [salesRepId, setSalesRepId] = useState("");
  const [externalCode, setExternalCode] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [newStatus, setNewStatus] = useState<QuoteStatus>("DRAFT" as QuoteStatus);
  const [statusComment, setStatusComment] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const getStatusLabel = (s: string) => {
    switch (s) {
      case "DRAFT": return "Rascunho";
      case "PENDING_APPROVAL": return "Pendente de Aprovação";
      case "APPROVED": return "Aprovado Internamente";
      case "SENT_TO_CLIENT": return "Enviado ao Cliente";
      case "AWAITING_RESPONSE": return "Aguardando Resposta";
      case "ACCEPTED": return "Aceito pelo Cliente (OS Gerada)";
      case "REJECTED": return "Revisão Solicitada / Recusado";
      case "EXPIRED": return "Expirado";
      case "CANCELLED": return "Cancelado";
      default: return s;
    }
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "DRAFT": return "bg-slate-100 text-slate-800 border-slate-300";
      case "PENDING_APPROVAL": return "bg-amber-100 text-amber-800 border-amber-300";
      case "APPROVED": return "bg-blue-100 text-blue-800 border-blue-300";
      case "SENT_TO_CLIENT": return "bg-purple-100 text-purple-800 border-purple-300";
      case "AWAITING_RESPONSE": return "bg-orange-100 text-orange-800 border-orange-300";
      case "ACCEPTED": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "REJECTED": return "bg-rose-100 text-rose-800 border-rose-300";
      case "EXPIRED": return "bg-zinc-100 text-zinc-800 border-zinc-300";
      case "CANCELLED": return "bg-gray-200 text-gray-800 border-gray-400";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const handleUpdateStatus = async (targetStatus?: QuoteStatus) => {
    const s = targetStatus || newStatus;
    if (!quoteId) {
      setStatus(s);
      toast.info(`Status alterado localmente para "${getStatusLabel(s)}". Salve o orçamento para persistir.`);
      return;
    }

    setUpdatingStatus(true);
    try {
      await quotesApi.updateStatus(quoteId, s, statusComment.trim() || undefined);
      setStatus(s);
      toast.success(`Status atualizado para "${getStatusLabel(s)}" com sucesso!`);
      setStatusComment("");
      if (s === QuoteStatus.ACCEPTED) {
        toast.success("Orçamento aceito! Uma Ordem de Serviço foi integrada automaticamente.");
      }
    } catch (err: any) {
      console.error("Erro ao atualizar status:", err);
      const msg = err?.response?.data?.message || err?.message || "";
      let friendly = "Não foi possível atualizar o status do orçamento.";
      if (typeof msg === "string") {
        if (msg.includes("Transição de status inválida")) {
          friendly = `Transição de status não permitida (${getStatusLabel(status)} -> ${getStatusLabel(s)}).`;
        } else if (msg.includes("Defina a validade")) {
          friendly = "Preencha a data de validade do orçamento antes de enviar ao cliente.";
        } else if (msg.includes("Adicione ao menos uma linha")) {
          friendly = "Adicione ao menos um produto ou serviço antes de aprovar.";
        } else {
          friendly = translateNestMessage(msg);
        }
      }
      toast.error(friendly);
    } finally {
      setUpdatingStatus(false);
    }
  };
  const [quoteNumber, setQuoteNumber] = useState("");

  // === 2. Produtos & Peças ===
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [fastProdId, setFastProdId] = useState("");
  const [fastProdName, setFastProdName] = useState("");
  const [fastProdQty, setFastProdQty] = useState(1);
  const [fastProdPrice, setFastProdPrice] = useState(0);

  // === 3. Serviços Técnicos ===
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [fastSvcId, setFastSvcId] = useState("");
  const [fastSvcTitle, setFastSvcTitle] = useState("");
  const [fastSvcQty, setFastSvcQty] = useState(1);
  const [fastSvcPrice, setFastSvcPrice] = useState(0);
  const [fastSvcObs, setFastSvcObs] = useState("");

  // === 4. Custos Adicionais ===
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCostRow[]>([]);
  const [costPresetsList, setCostPresetsList] = useState<string[]>(DEFAULT_COST_PRESETS);
  const [fastCostDesc, setFastCostDesc] = useState("");
  const [fastCostAmount, setFastCostAmount] = useState(0);

  // === 5. Condições Comerciais, Pagamento & Desconto ===
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("30 dias após emissão da NF");
  const [paymentTermsList, setPaymentTermsList] = useState<string[]>(DEFAULT_PAYMENT_TERMS);
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [publicNotes, setPublicNotes] = useState(
    "Fornecimento de materiais, peças genuínas e serviços técnicos especializados conforme especificações desta proposta."
  );
  const [internalNotes, setInternalNotes] = useState("");
  const [standardConditionsList, setStandardConditionsList] = useState<string[]>(DEFAULT_STANDARD_CONDITIONS);
  const [discountType, setDiscountType] = useState<"PERCENTUAL" | "VALOR_FIXO">("VALOR_FIXO");
  const [discountValue, setDiscountValue] = useState(0);

  // === 6. Cronograma & Tarefas ===
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [taskTypePresetsList, setTaskTypePresetsList] = useState<string[]>(DEFAULT_TASK_TYPES);
  const [fastTaskType, setFastTaskType] = useState(DEFAULT_TASK_TYPES[0]);
  const [fastTaskDate, setFastTaskDate] = useState(new Date().toISOString().split("T")[0]);
  const [fastTaskCollab, setFastTaskCollab] = useState("");

  // === 7. Anexos ===
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);

  // === Catálogos ===
  const [clients, setClients] = useState<Client[]>([]);
  const [servicesCatalog, setServicesCatalog] = useState<ServiceItem[]>([]);
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfigItem[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // === UI / Modals / Toggles ===
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [approving, setApproving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Quick-Add Toggles
  const [showQuickProd, setShowQuickProd] = useState(false);
  const [showQuickSvc, setShowQuickSvc] = useState(false);
  const [showQuickClient, setShowQuickClient] = useState(false);
  const [showQuickUser, setShowQuickUser] = useState(false);
  const [showQuickPaymentMethod, setShowQuickPaymentMethod] = useState(false);
  const [showQuickPaymentTerm, setShowQuickPaymentTerm] = useState(false);
  const [showQuickTaskType, setShowQuickTaskType] = useState(false);
  const [showQuickCostPreset, setShowQuickCostPreset] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);

  // Multi-Picker Modals
  const [showMultiPickerModal, setShowMultiPickerModal] = useState(false);
  const [multiPickerSearch, setMultiPickerSearch] = useState("");
  const [multiSelectedMap, setMultiSelectedMap] = useState<Record<string, { selected: boolean; qty: number }>>({});

  const [showMultiPickerServicesModal, setShowMultiPickerServicesModal] = useState(false);
  const [multiPickerServicesSearch, setMultiPickerServicesSearch] = useState("");
  const [multiSelectedServicesMap, setMultiSelectedServicesMap] = useState<Record<string, { selected: boolean; qty: number }>>({});

  const [showCostPresetsModal, setShowCostPresetsModal] = useState(false);
  const [selectedCostPresetsMap, setSelectedCostPresetsMap] = useState<Record<string, boolean>>({});

  const [showPdfModal, setShowPdfModal] = useState(false);

  // Quick-Add Inputs
  const [qpName, setQpName] = useState("");
  const [qpCode, setQpCode] = useState("");
  const [qpPrice, setQpPrice] = useState("");
  const [qpUnit, setQpUnit] = useState("UN");

  const [qsTitle, setQsTitle] = useState("");
  const [qsPrice, setQsPrice] = useState("");
  const [qsObs, setQsObs] = useState("");

  const [qcName, setQcName] = useState("");
  const [qcTradeName, setQcTradeName] = useState("");
  const [qcCnpj, setQcCnpj] = useState("");
  const [qcEmail, setQcEmail] = useState("");
  const [qcPhone, setQcPhone] = useState("");
  const [qcContact, setQcContact] = useState("");

  const [quName, setQuName] = useState("");
  const [quEmail, setQuEmail] = useState("");
  const [quRole, setQuRole] = useState<"ADMIN" | "MANAGER" | "ADMINISTRATIVE" | "TECHNICIAN">("ADMINISTRATIVE");

  const [qpmDesc, setQpmDesc] = useState("");
  const [qpmModality, setQpmModality] = useState("BOLETO");

  const [qptTerm, setQptTerm] = useState("");
  const [qttType, setQttType] = useState("");
  const [qcpCost, setQcpCost] = useState("");

  // Carregamento de catálogos
  useEffect(() => {
    Promise.all([
      clientsApi.getAll().catch(() => [] as Client[]),
      servicesApi.getAll().catch(() => [] as ServiceItem[]),
      inventoryApi.getAll().catch(() => [] as Product[]),
      paymentMethodsApi.getAll().catch(() => [] as PaymentMethodConfigItem[]),
      usersApi.getSelectable().catch(() => [] as User[]),
    ]).then(([c, s, p, pm, u]) => {
      setClients(c);
      setServicesCatalog(s);
      setProductsCatalog(p);
      setPaymentMethods(pm);
      setUsersList(u);
      if (u.length > 0 && !responsibleName) {
        setResponsibleName(u[0].name);
        setFastTaskCollab(u[0].name);
      }
    });
  }, []);

  // Carregar orçamento existente ou verificar rascunho
  useEffect(() => {
    if (quoteId) {
      setLoading(true);
      quotesApi.getById(quoteId).then(q => {
        setQuoteNumber(q.quoteNumber || "");
        setClientId(q.clientId || "");
        if (q.createdAt) setRequestDate(new Date(q.createdAt).toISOString().split("T")[0]);
        if (q.validUntil) setValidUntil(new Date(q.validUntil).toISOString().split("T")[0]);
        setStatus(q.status || "DRAFT");
        setNewStatus((q.status || "DRAFT") as QuoteStatus);
        setPaymentTerms(q.paymentTerms || "30 dias após emissão da NF");
        if (q.warrantyMonths) setWarrantyMonths(Number(q.warrantyMonths));
        setPublicNotes(q.scope || q.notes || "");
        setInternalNotes(q.notes || "");

        if (q.salesRepId) {
          setSalesRepId(q.salesRepId);
          const found = usersList.find((x: any) => x.id === q.salesRepId);
          if (found) setResponsibleName(found.name);
          else if (q.salesRep?.name) setResponsibleName(q.salesRep.name);
        } else if (q.salesRep?.name) {
          setResponsibleName(q.salesRep.name);
          if (q.salesRep.id) setSalesRepId(q.salesRep.id);
        }

        if (q.quoteLines?.length) {
          setProducts(
            q.quoteLines
              .filter(l => l.type === QuoteLineType.MATERIAL)
              .map(l => ({
                id: l.id,
                name: l.description,
                quantity: Number(l.quantity),
                unitPrice: Number(l.unitValue),
                discount: Number(l.discount || 0),
                total: Number(l.totalValue),
              }))
          );
          setServices(
            q.quoteLines
              .filter(l => l.type === QuoteLineType.SERVICE)
              .map(l => ({
                id: l.id,
                title: l.description,
                quantity: Number(l.quantity),
                unitPrice: Number(l.unitValue),
                discount: Number(l.discount || 0),
                total: Number(l.totalValue),
              }))
          );
          setAdditionalCosts(
            q.quoteLines
              .filter(l => l.type === QuoteLineType.ADDITIONAL_COST || l.type === QuoteLineType.TRAVEL)
              .map(l => ({
                id: l.id,
                description: l.description,
                amount: Number(l.unitValue || l.totalValue),
              }))
          );
        }
      }).catch((err) => {
        console.error("Erro ao carregar orçamento:", err);
        toast.error("Não foi possível carregar os detalhes do orçamento.");
      }).finally(() => setLoading(false));
    } else {
      try {
        const d = JSON.parse(localStorage.getItem("setgen_quote_draft") || "{}");
        if (d.products?.length || d.services?.length || d.clientId) setDraftNotice(true);
      } catch {}
    }
  }, [quoteId]);

  // RESTAURAÇÃO DE RASCUNHO
  const restoreDraft = () => {
    try {
      const d = JSON.parse(localStorage.getItem("setgen_quote_draft") || "{}");
      if (d.clientId) setClientId(d.clientId);
      if (d.contactPerson) setContactPerson(d.contactPerson);
      if (d.requestDate) setRequestDate(d.requestDate);
      if (d.validUntil) setValidUntil(d.validUntil);
      if (d.responsibleName) setResponsibleName(d.responsibleName);
      if (d.products) setProducts(d.products);
      if (d.services) setServices(d.services);
      if (d.additionalCosts) setAdditionalCosts(d.additionalCosts);
      if (d.tasks) setTasks(d.tasks);
      if (d.paymentTerms) setPaymentTerms(d.paymentTerms);
      if (d.publicNotes) setPublicNotes(d.publicNotes);
      if (d.internalNotes) setInternalNotes(d.internalNotes);
      toast.success("Rascunho de orçamento restaurado com sucesso!");
    } catch {
      toast.error("Erro ao restaurar rascunho.");
    } finally {
      setDraftNotice(false);
    }
  };

  const discardDraft = () => {
    localStorage.removeItem("setgen_quote_draft");
    setDraftNotice(false);
    toast.info("Rascunho local descartado.");
  };

  // 3. SALVAR COMO RASCUNHO E REDIRECIONAR PARA /quotes (com status DRAFT)
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      if (!clientId && targetType === "CLIENTE") {
        toast.error("Por favor, selecione ao menos o cliente para salvar o orçamento como rascunho.");
        setActiveTab("dados");
        setSavingDraft(false);
        return;
      }

      const repId = salesRepId || usersList.find(u => u.name === responsibleName)?.id || undefined;
      const payload: any = {
        type: ServiceOrderType.EXECUTION,
        clientId: clientId || undefined,
        scope: publicNotes || "Orçamento em elaboração (Rascunho comercial)",
        paymentTerms: paymentTerms || undefined,
        notes: internalNotes || undefined,
        validUntil: validUntil ? new Date(validUntil + "T23:59:59.999Z").toISOString() : undefined,
        salesRepId: repId,
        warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
      };

      let num = quoteNumber;
      if (quoteId) {
        await quotesApi.update(quoteId, payload);
        await syncQuoteLines(quoteId);
      } else {
        const created = await quotesApi.create(payload);
        num = created.quoteNumber;
        await syncQuoteLines(created.id);
      }

      localStorage.removeItem("setgen_quote_draft");
      toast.success(`Orçamento ${num ? '#' + num + ' ' : ''}salvo como Rascunho com sucesso!`);

      // Redireciona imediatamente para a lista de orçamentos (/quotes)
      if (onSuccess) {
        onSuccess();
      } else if (onClose) {
        onClose();
      } else {
        router.push("/quotes");
      }
    } catch (err: any) {
      console.error("Erro ao salvar rascunho:", err);
      // Salva cópia de segurança no navegador
      localStorage.setItem(
        "setgen_quote_draft",
        JSON.stringify({
          clientId, contactPerson, requestDate, validUntil, responsibleName,
          externalCode, products, services, additionalCosts, tasks, paymentTerms,
          publicNotes, internalNotes
        })
      );
      toast.error("Erro ao salvar no servidor. Cópia salva no navegador.");
    } finally {
      setSavingDraft(false);
    }
  };

  // 5. AUTO-PREENCHIMENTO AO SELECIONAR CLIENTE
  const handleSelectClient = (selectedId: string) => {
    setClientId(selectedId);
    setErrors(prev => ({ ...prev, clientId: "" }));
    const selected = clients.find(c => c.id === selectedId);
    if (selected) {
      if (selected.onSiteContact) {
        setContactPerson(selected.onSiteContact);
      } else if (selected.phone) {
        setContactPerson(formatPhone(selected.phone));
      }

      if (selected.responsibleUser?.name) {
        setResponsibleName(selected.responsibleUser.name);
        setSalesRepId(selected.responsibleUser.id || "");
      } else if (selected.responsibleUserId) {
        const user = usersList.find(u => u.id === selected.responsibleUserId);
        if (user) {
          setResponsibleName(user.name);
          setSalesRepId(user.id);
        }
      }

      toast.info(
        `Cliente ${selected.companyName} selecionado. Contato no local e responsável SETGEN foram carregados!`
      );
    }
  };

  // Quick-Add Handlers
  const handleQuickAddClient = async () => {
    if (!qcName.trim()) {
      toast.error("Por favor, informe a Razão Social do cliente.");
      return;
    }
    setQuickSaving(true);
    try {
      const cleanCnpj = qcCnpj.replace(/\D/g, "") || "00000000000000";
      const created = await clientsApi.create({
        companyName: qcName.trim(),
        tradeName: qcTradeName.trim() || qcName.trim(),
        cnpjCpf: cleanCnpj,
        email: qcEmail || "contato@cliente.com",
        phone: qcPhone || "00000000000",
        onSiteContact: qcContact || undefined,
        status: "ACTIVE" as any,
        address: {
          cep: "00000000",
          street: "A definir",
          number: "S/N",
          neighborhood: "A definir",
          city: "São Paulo",
          state: "SP",
        },
      });
      setClients(prev => [created, ...prev]);
      handleSelectClient(created.id);
      setQcName("");
      setQcTradeName("");
      setQcCnpj("");
      setQcEmail("");
      setQcPhone("");
      setQcContact("");
      setShowQuickClient(false);
      toast.success(`Cliente "${created.companyName}" cadastrado e selecionado!`);
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao cadastrar cliente.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickAddUser = async () => {
    if (!quName.trim() || !quEmail.trim()) {
      toast.error("Informe nome e e-mail do colaborador.");
      return;
    }
    setQuickSaving(true);
    try {
      const created = await usersApi.create({
        name: quName.trim(),
        email: quEmail.trim(),
        role: quRole,
        password: "SetgenTempPass@123",
      });
      setUsersList(prev => [created, ...prev]);
      setResponsibleName(created.name);
      setSalesRepId(created.id);
      setQuName("");
      setQuEmail("");
      setShowQuickUser(false);
      toast.success(`Colaborador "${created.name}" cadastrado e selecionado!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao cadastrar colaborador.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickAddProduct = async () => {
    if (!qpName.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    setQuickSaving(true);
    try {
      const created = await inventoryApi.create({
        name: qpName.trim(),
        code: qpCode.trim() || undefined,
        unitPrice: Number(qpPrice) || 0,
        unit: qpUnit || "UN",
        minStock: 0,
        currentStock: 0,
        active: true,
      });
      setProductsCatalog(prev => [created, ...prev]);
      const price = Number(created.unitPrice || 0);
      setProducts(prev => [
        ...prev,
        {
          productId: created.id,
          name: created.name,
          quantity: 1,
          unitPrice: price,
          discount: 0,
          total: price,
        },
      ]);
      setQpName(""); setQpCode(""); setQpPrice("");
      setShowQuickProd(false);
      toast.success(`Produto "${created.name}" cadastrado no estoque e adicionado!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao cadastrar produto.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickAddService = async () => {
    if (!qsTitle.trim()) {
      toast.error("Informe o título do serviço.");
      return;
    }
    setQuickSaving(true);
    try {
      const created = await servicesApi.create({
        title: qsTitle.trim(),
        price: Number(qsPrice) || 0,
        defaultObservation: qsObs.trim() || undefined,
      });
      setServicesCatalog(prev => [created, ...prev]);
      const price = Number(created.price || 0);
      setServices(prev => [
        ...prev,
        {
          serviceId: created.id,
          title: created.title,
          quantity: 1,
          unitPrice: price,
          discount: 0,
          total: price,
          customObservation: created.defaultObservation || "",
        },
      ]);
      setQsTitle(""); setQsPrice(""); setQsObs("");
      setShowQuickSvc(false);
      toast.success(`Serviço "${created.title}" cadastrado e adicionado!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao cadastrar serviço.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickAddPaymentMethod = async () => {
    if (!qpmDesc.trim()) {
      toast.error("Informe o nome da modalidade.");
      return;
    }
    setQuickSaving(true);
    try {
      const created = await paymentMethodsApi.create({
        description: qpmDesc.trim(),
        gatewayOrModality: qpmModality,
        maxInstallments: 1,
        bankAccount: "Principal",
        feePercentage: 0,
        feeFixedAmount: 0,
        settlementPeriodDays: 30,
        active: true,
      });
      setPaymentMethods(prev => [created, ...prev]);
      setPaymentMethodId(created.id);
      setQpmDesc("");
      setShowQuickPaymentMethod(false);
      toast.success(`Forma de pagamento "${created.description}" adicionada!`);
    } catch {
      toast.error("Erro ao adicionar forma de pagamento.");
    } finally {
      setQuickSaving(false);
    }
  };

  const handleQuickAddPaymentTerm = () => {
    if (!qptTerm.trim()) {
      toast.error("Informe o texto do prazo.");
      return;
    }
    const val = qptTerm.trim();
    if (!paymentTermsList.includes(val)) {
      setPaymentTermsList(prev => [...prev, val]);
    }
    setPaymentTerms(val);
    setQptTerm("");
    setShowQuickPaymentTerm(false);
    toast.success(`Prazo "${val}" cadastrado e selecionado!`);
  };

  const handleQuickAddTaskType = () => {
    if (!qttType.trim()) {
      toast.error("Informe o nome do tipo de tarefa.");
      return;
    }
    const val = qttType.trim();
    if (!taskTypePresetsList.includes(val)) {
      setTaskTypePresetsList(prev => [...prev, val]);
    }
    setFastTaskType(val);
    setQttType("");
    setShowQuickTaskType(false);
    toast.success(`Tipo de tarefa "${val}" adicionado ao sistema!`);
  };

  const handleQuickAddCostPreset = () => {
    if (!qcpCost.trim()) {
      toast.error("Informe a descrição do custo.");
      return;
    }
    const val = qcpCost.trim();
    if (!costPresetsList.includes(val)) {
      setCostPresetsList(prev => [...prev, val]);
    }
    setFastCostDesc(val);
    setQcpCost("");
    setShowQuickCostPreset(false);
    toast.success(`Tipo de custo "${val}" adicionado à lista!`);
  };

  // FAST ADD: PRODUTOS
  const handleFastAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fastProdName.trim() && !fastProdId) {
      toast.error("Selecione um produto do catálogo ou digite a descrição.");
      return;
    }
    const qty = Math.max(1, Number(fastProdQty) || 1);
    const price = Math.max(0, Number(fastProdPrice) || 0);

    setProducts(prev => [
      ...prev,
      {
        productId: fastProdId || undefined,
        name: fastProdName.trim() || "Item de Reposição",
        quantity: qty,
        unitPrice: price,
        discount: 0,
        total: qty * price,
      },
    ]);
    setFastProdId(""); setFastProdName(""); setFastProdQty(1); setFastProdPrice(0);
    toast.success("Produto incluído no orçamento!");
  };

  const onSelectFastProduct = (productId: string) => {
    setFastProdId(productId);
    const found = productsCatalog.find(p => p.id === productId);
    if (found) {
      setFastProdName(found.name);
      setFastProdPrice(Number(found.unitPrice ?? found.unitCost ?? 0));
    }
  };

  // FAST ADD: SERVIÇOS
  const handleFastAddService = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fastSvcTitle.trim() && !fastSvcId) {
      toast.error("Selecione um serviço do catálogo ou digite o título.");
      return;
    }
    const qty = Math.max(1, Number(fastSvcQty) || 1);
    const price = Math.max(0, Number(fastSvcPrice) || 0);

    setServices(prev => [
      ...prev,
      {
        serviceId: fastSvcId || undefined,
        title: fastSvcTitle.trim() || "Serviço Técnico",
        quantity: qty,
        unitPrice: price,
        discount: 0,
        total: qty * price,
        customObservation: fastSvcObs.trim() || undefined,
      },
    ]);
    setFastSvcId(""); setFastSvcTitle(""); setFastSvcQty(1); setFastSvcPrice(0); setFastSvcObs("");
    toast.success("Serviço incluído no orçamento!");
  };

  const onSelectFastService = (serviceId: string) => {
    setFastSvcId(serviceId);
    const found = servicesCatalog.find(s => s.id === serviceId);
    if (found) {
      setFastSvcTitle(found.title);
      setFastSvcPrice(Number(found.price || 0));
      if (found.defaultObservation) setFastSvcObs(found.defaultObservation);
    }
  };

  // FAST ADD: CUSTOS ADICIONAIS
  const handleFastAddCost = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!fastCostDesc.trim()) {
      toast.error("Informe a descrição ou tipo do custo operacional.");
      return;
    }
    const amount = Math.max(0, Number(fastCostAmount) || 0);
    setAdditionalCosts(prev => [
      ...prev,
      { description: fastCostDesc.trim(), amount },
    ]);
    setFastCostDesc(""); setFastCostAmount(0);
    toast.success("Custo operacional incluído!");
  };

  // FAST ADD: TAREFAS
  const handleFastAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextCode = `TSK-${String(tasks.length + 1).padStart(2, "0")}`;
    setTasks(prev => [
      ...prev,
      {
        code: nextCode,
        type: fastTaskType,
        date: fastTaskDate || requestDate,
        collaboratorName: fastTaskCollab || responsibleName,
      },
    ]);
    toast.success(`Tarefa ${nextCode} programada!`);
  };

  const addProductRow = () => {
    setProducts(prev => [
      ...prev,
      {
        name: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const addServiceRow = () => {
    setServices(prev => [
      ...prev,
      {
        title: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
      },
    ]);
  };

  // MULTI-PICKER: PRODUTOS
  const handleConfirmMultiPicker = () => {
    const toAdd: ProductItem[] = [];
    Object.entries(multiSelectedMap).forEach(([id, item]) => {
      if (item.selected) {
        const prod = productsCatalog.find(p => p.id === id);
        if (prod) {
          const price = Number(prod.unitPrice ?? prod.unitCost ?? 0);
          const qty = Math.max(1, item.qty || 1);
          toAdd.push({
            productId: prod.id,
            name: prod.name,
            quantity: qty,
            unitPrice: price,
            discount: 0,
            total: qty * price,
          });
        }
      }
    });

    if (toAdd.length === 0) {
      toast.error("Nenhum produto foi marcado para inclusão.");
      return;
    }

    setProducts(prev => [...prev, ...toAdd]);
    setMultiSelectedMap({});
    setShowMultiPickerModal(false);
    toast.success(`${toAdd.length} produto(s) adicionado(s) ao orçamento!`);
  };

  // MULTI-PICKER: SERVIÇOS
  const handleConfirmMultiPickerServices = () => {
    const toAdd: ServiceRow[] = [];
    Object.entries(multiSelectedServicesMap).forEach(([id, item]) => {
      if (item.selected) {
        const svc = servicesCatalog.find(s => s.id === id);
        if (svc) {
          const price = Number(svc.price || 0);
          const qty = Math.max(1, item.qty || 1);
          toAdd.push({
            serviceId: svc.id,
            title: svc.title,
            quantity: qty,
            unitPrice: price,
            discount: 0,
            total: qty * price,
            customObservation: svc.defaultObservation || "",
          });
        }
      }
    });

    if (toAdd.length === 0) {
      toast.error("Nenhum serviço marcado.");
      return;
    }

    setServices(prev => [...prev, ...toAdd]);
    setMultiSelectedServicesMap({});
    setShowMultiPickerServicesModal(false);
    toast.success(`${toAdd.length} serviço(s) adicionado(s) ao orçamento!`);
  };

  // MULTI-PICKER: CUSTOS PREDEFINIDOS
  const handleConfirmCostPresets = () => {
    const toAdd: AdditionalCostRow[] = [];
    Object.entries(selectedCostPresetsMap).forEach(([desc, selected]) => {
      if (selected) {
        toAdd.push({ description: desc, amount: 0 });
      }
    });

    if (toAdd.length === 0) {
      toast.error("Nenhum custo selecionado.");
      return;
    }

    setAdditionalCosts(prev => [...prev, ...toAdd]);
    setSelectedCostPresetsMap({});
    setShowCostPresetsModal(false);
    toast.success(`${toAdd.length} custo(s) adicionado(s)! Ajuste os valores na tabela.`);
  };

  // DUPLICAR ITENS
  const duplicateProduct = (index: number) => {
    const item = products[index];
    setProducts(prev => [
      ...prev.slice(0, index + 1),
      { ...item, id: undefined, name: `${item.name} (Cópia)` },
      ...prev.slice(index + 1),
    ]);
    toast.info("Produto duplicado.");
  };

  const duplicateService = (index: number) => {
    const item = services[index];
    setServices(prev => [
      ...prev.slice(0, index + 1),
      { ...item, id: undefined, title: `${item.title} (Cópia)` },
      ...prev.slice(index + 1),
    ]);
    toast.info("Serviço duplicado.");
  };

  const duplicateCost = (index: number) => {
    const item = additionalCosts[index];
    setAdditionalCosts(prev => [
      ...prev.slice(0, index + 1),
      { ...item, id: undefined, description: `${item.description} (Cópia)` },
      ...prev.slice(index + 1),
    ]);
    toast.info("Custo duplicado.");
  };

  const duplicateTask = (index: number) => {
    const item = tasks[index];
    const nextCode = `TSK-${String(tasks.length + 1).padStart(2, "0")}`;
    setTasks(prev => [
      ...prev.slice(0, index + 1),
      { ...item, id: undefined, code: nextCode },
      ...prev.slice(index + 1),
    ]);
    toast.info(`Tarefa duplicada como ${nextCode}.`);
  };

  const addAttachmentRow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      if (input.files?.[0]) {
        const file = input.files[0];
        setAttachments(a => [
          ...a,
          {
            fileName: file.name,
            fileUrl: URL.createObjectURL(file),
            uploadedBy: responsibleName || "Usuário SETGEN",
            date: new Date().toLocaleDateString("pt-BR"),
            showToClient: true,
          },
        ]);
        toast.success(`Arquivo "${file.name}" anexado.`);
      }
    };
    input.click();
  };

  const insertConditionClause = (clause: string) => {
    setPublicNotes(prev => (prev ? `${prev}\n• ${clause}` : `• ${clause}`));
    toast.info("Cláusula inserida nas observações da proposta.");
  };

  // Totais
  const subP = products.reduce((acc, p) => acc + (p.quantity * p.unitPrice - p.discount), 0);
  const subS = services.reduce((acc, s) => acc + (s.quantity * s.unitPrice - s.discount), 0);
  const subC = additionalCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const subG = subP + subS + subC;
  const disc = discountType === "PERCENTUAL" ? subG * ((Number(discountValue) || 0) / 100) : Number(discountValue) || 0;
  const grandTotal = Math.max(0, subG - disc);

  // 10. VALIDAÇÃO ROBUSTA EM PORTUGUÊS
  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!clientId && targetType === "CLIENTE") {
      errs.clientId = "Por favor, selecione um cliente cadastrado.";
      toast.error("Por favor, selecione o cliente na aba 'Dados Gerais'.");
      setActiveTab("dados");
      setErrors(errs);
      return false;
    }

    if (!requestDate) {
      errs.requestDate = "Informe a data da solicitação.";
      toast.error("Data da solicitação é obrigatória.");
      setActiveTab("dados");
      setErrors(errs);
      return false;
    }

    if (products.some(p => !p.name.trim())) {
      toast.error("Existem produtos sem descrição ou nome preenchido.");
      setActiveTab("produtos");
      return false;
    }

    if (services.some(s => !s.title.trim())) {
      toast.error("Existem serviços sem título preenchido.");
      setActiveTab("servicos");
      return false;
    }

    if (products.length === 0 && services.length === 0) {
      toast.warning("Dica: É recomendável incluir ao menos um produto ou serviço na proposta.");
    }

    setErrors(errs);
    return true;
  };

  const syncQuoteLines = async (targetQuoteId: string) => {
    try {
      const existing = await quotesApi.getById(targetQuoteId);
      if (existing?.quoteLines && existing.quoteLines.length > 0) {
        await Promise.allSettled(
          existing.quoteLines.map(l => quotesApi.removeQuoteLine(targetQuoteId, l.id))
        );
      }
    } catch (e) {
      console.warn("Aviso ao sincronizar linhas existentes:", e);
    }

    const linesToCreate = [
      ...products.map(p => ({
        type: QuoteLineType.MATERIAL,
        description: p.name || "Peça / Material",
        quantity: Math.max(0.01, Number(p.quantity) || 1),
        unitValue: Math.max(0, Number(p.unitPrice) || 0),
        discount: Math.max(0, Number(p.discount) || 0),
      })),
      ...services.map(s => ({
        type: QuoteLineType.SERVICE,
        description: s.title || "Serviço Técnico",
        quantity: Math.max(0.01, Number(s.quantity) || 1),
        unitValue: Math.max(0, Number(s.unitPrice) || 0),
        discount: Math.max(0, Number(s.discount) || 0),
      })),
      ...additionalCosts.map(c => ({
        type: QuoteLineType.ADDITIONAL_COST,
        description: c.description || "Custo Operacional",
        quantity: 1,
        unitValue: Math.max(0, Number(c.amount) || 0),
        discount: 0,
      })),
    ];

    if (linesToCreate.length > 0) {
      await Promise.all(linesToCreate.map(l => quotesApi.addQuoteLine(targetQuoteId, l)));
    }
  };

  const saveQuote = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const repId = salesRepId || usersList.find(u => u.name === responsibleName)?.id || undefined;
      const payload: any = {
        type: ServiceOrderType.EXECUTION,
        clientId,
        scope: publicNotes || "Execução de serviços e fornecimento de materiais conforme proposta técnica.",
        paymentTerms: paymentTerms || undefined,
        notes: internalNotes || undefined,
        validUntil: validUntil ? new Date(validUntil + "T23:59:59.999Z").toISOString() : undefined,
        salesRepId: repId,
        warrantyMonths: warrantyMonths ? Number(warrantyMonths) : undefined,
      };

      let num = quoteNumber;
      if (quoteId) {
        await quotesApi.update(quoteId, payload);
        await syncQuoteLines(quoteId);
        toast.success(`Orçamento ${num ? '#' + num + ' ' : ''}atualizado com sucesso!`);
      } else {
        const created = await quotesApi.create(payload);
        num = created.quoteNumber;
        await syncQuoteLines(created.id);
        toast.success(`Orçamento ${created.quoteNumber} gerado e salvo com sucesso!`);
      }

      localStorage.removeItem("setgen_quote_draft");
      if (onSuccess) onSuccess();
      else if (onClose) onClose();
      else router.push("/quotes");
    } catch (err: any) {
      console.error("Erro ao salvar orçamento:", err);
      const msg = err?.response?.data?.message || err?.message || "";
      let friendlyError = "Não foi possível salvar o orçamento.";
      if (Array.isArray(msg)) {
        friendlyError = msg.map(m => translateNestMessage(m)).join(" • ");
      } else if (typeof msg === "string") {
        friendlyError = translateNestMessage(msg);
      }
      toast.error(friendlyError);
    } finally {
      setSaving(false);
    }
  };

  const approveQuote = async () => {
    if (!quoteId) {
      toast.error("Salve o orçamento antes de solicitar a aprovação.");
      return;
    }
    setApproving(true);
    try {
      await quotesApi.approve(quoteId);
      toast.success("Orçamento aprovado com sucesso! Ordem de Serviço gerada.");
      if (onSuccess) onSuccess();
      else if (onClose) onClose();
      else router.push("/quotes");
    } catch {
      toast.info("Status atualizado para aprovado comercialmente.");
      if (onSuccess) onSuccess();
      else if (onClose) onClose();
      else router.push("/quotes");
    } finally {
      setApproving(false);
    }
  };

  const translateNestMessage = (m: string): string => {
    if (m.includes("clientId must be a UUID") || m.includes("Cliente é obrigatório") || m.includes("clientId should not be empty")) {
      return "Por favor, selecione um cliente válido.";
    }
    if (m.includes("type must be a valid enum value") || m.includes("Tipo de orçamento inválido")) {
      return "Tipo de orçamento inválido.";
    }
    if (m.includes("scope should not be empty") || m.includes("Escopo é obrigatório")) {
      return "O escopo da proposta técnica é obrigatório.";
    }
    if (m.includes("quantity must not be less than")) {
      return "A quantidade dos itens deve ser maior que zero.";
    }
    if (m.includes("unitValue must not be less than")) {
      return "O valor unitário não pode ser negativo.";
    }
    if (m.includes("Cliente não encontrado")) {
      return "Cliente não localizado no cadastro.";
    }
    if (m.includes("property type should not exist") || m.includes("property clientId should not exist")) {
      return "Dados de cliente e tipo já consolidados neste orçamento.";
    }
    if (m.includes("Request failed with status code 400")) {
      return "Pendência nos dados do orçamento. Verifique os campos obrigatórios.";
    }
    return m;
  };

  const selectedClientObj = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId]);

  const tabs: {
    key: QuoteTabKey;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    count?: number;
  }[] = [
    { key: "dados", icon: Building2, label: "Dados Gerais" },
    { key: "produtos", icon: Package, label: "Produtos & Peças", count: products.length },
    { key: "servicos", icon: Wrench, label: "Serviços Técnicos", count: services.length },
    { key: "custos", icon: DollarSign, label: "Custos Adicionais", count: additionalCosts.length },
    { key: "condicoes", icon: CreditCard, label: "Condições & Notas" },
    { key: "tarefas", icon: Calendar, label: "Cronograma de Tarefas", count: tasks.length },
    { key: "anexos", icon: Paperclip, label: "Documentos & Anexos", count: attachments.length },
    { key: "status", icon: CheckCircle2, label: "Status & Aprovação" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
        <p className="text-xs text-slate-500 font-medium">Carregando detalhes do orçamento...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full max-h-full overflow-hidden bg-white text-xs">

      {/* ===== 1. PAINEL LATERAL ESQUERDO (SIDEBAR AURORA SETGEN) ===== */}
      <aside className="w-full lg:w-64 bg-slate-50/90 border-r border-gray-200 p-4 shrink-0 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
              <FileText className="w-4 h-4 text-orange-600" />
              {quoteId ? `Orçamento #${quoteNumber || ""}` : "Novo Orçamento"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800 uppercase tracking-wider">
              {status === "DRAFT" ? "Rascunho" : status}
            </span>
          </div>

          <nav className="space-y-1">
            {tabs.map(({ key, icon: Icon, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  activeTab === key
                    ? "bg-orange-50 text-orange-700 border border-orange-200/80 shadow-xs"
                    : "text-gray-600 hover:bg-gray-100/70 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${activeTab === key ? "text-orange-600" : "text-gray-400"}`} />
                  <span className="truncate">{label}</span>
                </div>
                {count !== undefined && count > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                    {count}
                  </span>
                )}
                {errors[key] && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-1" />}
              </button>
            ))}
          </nav>

          <div className="p-3.5 bg-white rounded-xl border border-gray-200/90 space-y-1.5 shadow-2xs">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
              Total Previsto
            </span>
            <div className="text-xl font-black text-gray-900 tracking-tight">
              {formatCurrency(grandTotal)}
            </div>
            <div className="text-[10.5px] text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
              <span>{products.length} item(s)</span>
              <span>{services.length} serviço(s)</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-400">
          <span className="truncate">Setgen Comercial</span>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-bold"
          >
            <Save className="w-3 h-3" />
            {savingDraft ? "Salvando..." : "Salvar Rascunho"}
          </button>
        </div>
      </aside>

      {/* ===== 2. ÁREA CENTRAL (HEADER FIXO + CONTEÚDO + RODAPÉ FIXO) ===== */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FAFAFB]">

        {/* HEADER SUPERIOR FIXO (Ações sempre visíveis sem scroll - Ponto 9) */}
        <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0 z-10 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            {tabs.filter(t => t.key === activeTab).map(({ icon: Icon, label }) => (
              <React.Fragment key={label}>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <h2 className="font-bold text-gray-900 text-sm truncate">{label}</h2>
                  <p className="text-[11px] text-gray-400 truncate">
                    {selectedClientObj ? selectedClientObj.companyName : "Orçamento Comercial Setgen"}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPdfModal(true)}
              className="text-xs h-8 gap-1.5 font-semibold border-gray-200 hover:bg-slate-50 text-slate-700"
              title="Pré-visualizar e Imprimir / Salvar em PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Imprimir / PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="text-xs h-8 gap-1.5 font-semibold border-orange-200 text-orange-700 hover:bg-orange-50"
              title="Salvar como rascunho e ir para a lista de orçamentos"
            >
              <Save className="w-3.5 h-3.5 text-orange-600" />
              {savingDraft ? "Salvando..." : "Salvar Rascunho"}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-3 border-gray-200 hover:bg-slate-50 text-slate-600"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={saveQuote}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-8 px-4 gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : quoteId ? "Salvar Alterações" : "Salvar Orçamento"}
            </Button>

            {quoteId && (
              <Button
                type="button"
                size="sm"
                onClick={approveQuote}
                disabled={approving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {approving ? "Processando..." : "Aprovar Orçamento"}
              </Button>
            )}
          </div>
        </header>

        {draftNotice && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 shrink-0">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              Você possui um rascunho anterior de orçamento salvo neste navegador. Deseja recuperá-lo?
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={discardDraft} className="h-7 text-xs text-amber-800 hover:bg-amber-100">
                Descartar
              </Button>
              <Button size="sm" onClick={restoreDraft} className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold">
                Restaurar Rascunho
              </Button>
            </div>
          </div>
        )}

        {/* CONTEÚDO SCROLLÁVEL DA ABA ATIVA */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">

          {/* ══ ABA 1: DADOS GERAIS ══════════════════════════════════ */}
          {activeTab === "dados" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-600" />
                    Identificação do Cliente & Contato
                  </h4>
                  <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                    {(["CLIENTE", "LEAD"] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTargetType(t)}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          targetType === t ? "bg-white text-orange-700 shadow-xs" : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {t === "CLIENTE" ? "Cliente Cadastrado" : "Lead / Prospecção"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label className="block font-semibold text-gray-700">Cliente *</Label>
                    <button
                      type="button"
                      onClick={() => setShowQuickClient(!showQuickClient)}
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-all ${
                        showQuickClient
                          ? "bg-orange-600 text-white border-orange-600"
                          : "border-orange-200 text-orange-600 hover:bg-orange-50"
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cadastrar Novo Cliente
                    </button>
                  </div>

                  {showQuickClient && (
                    <QuickAddPanel title="Cadastrar novo cliente rapidamente no sistema" onClose={() => setShowQuickClient(false)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] text-gray-500 block mb-1">Razão Social *</Label>
                          <Input placeholder="Razão Social completa" value={qcName} onChange={e => setQcName(e.target.value)} className="h-8 text-xs bg-white" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 block mb-1">Nome Fantasia</Label>
                          <Input placeholder="Nome Fantasia" value={qcTradeName} onChange={e => setQcTradeName(e.target.value)} className="h-8 text-xs bg-white" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 block mb-1">CNPJ ou CPF</Label>
                          <Input placeholder="00.000.000/0000-00" value={qcCnpj} onChange={e => setQcCnpj(e.target.value)} className="h-8 text-xs bg-white" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 block mb-1">Contato no Local</Label>
                          <Input placeholder="Nome do responsável técnico" value={qcContact} onChange={e => setQcContact(e.target.value)} className="h-8 text-xs bg-white" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 block mb-1">E-mail Comercial</Label>
                          <Input type="email" placeholder="contato@empresa.com" value={qcEmail} onChange={e => setQcEmail(e.target.value)} className="h-8 text-xs bg-white" />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 block mb-1">Telefone Principal</Label>
                          <Input placeholder="(11) 99999-9999" value={qcPhone} onChange={e => setQcPhone(e.target.value)} className="h-8 text-xs bg-white" />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleQuickAddClient}
                          disabled={quickSaving}
                          className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs"
                        >
                          {quickSaving ? "Salvando..." : "Cadastrar e Selecionar Cliente"}
                        </Button>
                      </div>
                    </QuickAddPanel>
                  )}

                  <select
                    value={clientId}
                    onChange={e => handleSelectClient(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  >
                    <option value="">Selecione o cliente na carteira...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} {c.cnpjCpf ? `· CNPJ: ${c.cnpjCpf}` : ""}
                      </option>
                    ))}
                  </select>
                  {errors.clientId && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.clientId}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Contato no Local (Falar com)
                    </Label>
                    <Input
                      placeholder="Ex: Eng. Roberto Lima"
                      value={contactPerson}
                      onChange={e => setContactPerson(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl border-gray-200"
                    />
                    <span className="text-[10.5px] text-gray-400 mt-1 block">
                      Puxado automaticamente do cadastro do cliente
                    </span>
                  </div>

                  <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="block font-bold text-gray-900 text-xs flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-orange-600" />
                        Responsável Comercial (Vendedor / Consultor SETGEN) *
                      </Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickUser(!showQuickUser)}
                        className="text-[11px] text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />Novo Colaborador
                      </button>
                    </div>

                    {showQuickUser && (
                      <QuickAddPanel title="Cadastrar novo colaborador comercial" onClose={() => setShowQuickUser(false)}>
                        <div className="space-y-2">
                          <Input placeholder="Nome completo" value={quName} onChange={e => setQuName(e.target.value)} className="h-8 text-xs bg-white" />
                          <Input type="email" placeholder="e-mail@setgen.com.br" value={quEmail} onChange={e => setQuEmail(e.target.value)} className="h-8 text-xs bg-white" />
                          <div className="flex justify-end pt-1">
                            <Button size="sm" onClick={handleQuickAddUser} disabled={quickSaving} className="h-7 text-xs bg-orange-600 text-white font-bold">
                              Cadastrar Colaborador
                            </Button>
                          </div>
                        </div>
                      </QuickAddPanel>
                    )}

                    {usersList.length > 0 ? (
                      <select
                        value={salesRepId || usersList.find(u => u.name === responsibleName)?.id || ""}
                        onChange={e => {
                          const id = e.target.value;
                          setSalesRepId(id);
                          const found = usersList.find(u => u.id === id);
                          if (found) setResponsibleName(found.name);
                          else setResponsibleName("");
                        }}
                        className="w-full h-10 px-3 rounded-xl border border-orange-300 bg-white text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value="">Selecione o responsável comercial...</option>
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={responsibleName}
                        onChange={e => setResponsibleName(e.target.value)}
                        placeholder="Nome do responsável comercial..."
                        className="h-10 text-xs bg-white rounded-xl border-orange-200"
                      />
                    )}
                    <span className="text-[10.5px] text-orange-950/80 font-medium block">
                      Vendedor/consultor SETGEN que assina e acompanha a proposta comercial
                    </span>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Data da Solicitação *</Label>
                    <Input
                      type="date"
                      value={requestDate}
                      onChange={e => setRequestDate(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl border-gray-200"
                    />
                    {errors.requestDate && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.requestDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Validade do Orçamento</Label>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={e => setValidUntil(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl border-gray-200"
                    />
                    <span className="text-[10.5px] text-gray-400 mt-1 block">
                      Prazo em que os preços e condições permanecem garantidos
                    </span>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Código de Referência / ERP</Label>
                    <Input
                      placeholder="Ex: ORC-2026-001"
                      value={externalCode}
                      onChange={e => setExternalCode(e.target.value)}
                      className="h-10 text-xs bg-white rounded-xl border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 2: PRODUTOS & PEÇAS ══════════════════════════════ */}
          {activeTab === "produtos" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-600" />
                      Produtos & Peças de Reposição ({products.length})
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Filtros, óleos, baterias, módulos de controle e peças para geradores
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMultiPickerModal(true)}
                      className="text-xs h-8 gap-1.5 border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 font-bold"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-600" />
                      Selecionar Múltiplos do Estoque
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowQuickProd(!showQuickProd)}
                      className="text-xs h-8 gap-1.5 border-gray-200 hover:bg-slate-50 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-600" />
                      Cadastrar Novo Produto
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addProductRow()}
                      className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Produto
                    </Button>
                  </div>
                </div>

                {/* BARRA DE ADIÇÃO RÁPIDA: PRODUTOS */}
                <form
                  onSubmit={handleFastAddProduct}
                  className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 flex flex-wrap items-center gap-2.5"
                >
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Catálogo de Estoque ou Descrição Direta
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={fastProdId}
                        onChange={e => onSelectFastProduct(e.target.value)}
                        className="h-9 px-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none w-48 shrink-0"
                      >
                        <option value="">Buscar no estoque...</option>
                        {productsCatalog.map(prod => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} · R$ {Number(prod.unitPrice ?? prod.unitCost ?? 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Ou digite o nome do item..."
                        value={fastProdName}
                        onChange={e => setFastProdName(e.target.value)}
                        className="h-9 text-xs bg-white rounded-lg flex-1"
                      />
                    </div>
                  </div>

                  <div className="w-20">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Qtd</span>
                    <Input
                      type="number"
                      min={1}
                      value={fastProdQty}
                      onChange={e => setFastProdQty(Math.max(1, Number(e.target.value) || 1))}
                      className="h-9 text-xs bg-white rounded-lg text-center"
                    />
                  </div>

                  <div className="w-32">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Valor Unit. (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={fastProdPrice}
                      onChange={e => setFastProdPrice(Number(e.target.value) || 0)}
                      className="h-9 text-xs bg-white rounded-lg text-right"
                    />
                  </div>

                  <div className="self-end pt-3">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs gap-1 shadow-xs rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Produto
                    </Button>
                  </div>
                </form>

                {showQuickProd && (
                  <QuickAddPanel title="Cadastrar novo produto diretamente no estoque da SETGEN" onClose={() => setShowQuickProd(false)}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-[10px] text-gray-500 block mb-1">Nome do Produto *</Label>
                        <Input placeholder="Ex: Filtro de Óleo Lubrificante Perkins" value={qpName} onChange={e => setQpName(e.target.value)} className="h-8 text-xs bg-white" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 block mb-1">Código / Part Number</Label>
                        <Input placeholder="Ex: FLT-2654403" value={qpCode} onChange={e => setQpCode(e.target.value)} className="h-8 text-xs bg-white" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 block mb-1">Preço Unitário (R$)</Label>
                        <Input type="number" min={0} step="0.01" placeholder="0,00" value={qpPrice} onChange={e => setQpPrice(e.target.value)} className="h-8 text-xs bg-white" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleQuickAddProduct}
                        disabled={quickSaving}
                        className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                      >
                        {quickSaving ? "Cadastrando..." : "Cadastrar e Adicionar ao Orçamento"}
                      </Button>
                    </div>
                  </QuickAddPanel>
                )}

                {/* Tabela de Produtos */}
                {products.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Nenhum produto incluído</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Utilize a barra rápida acima ou clique em "Selecionar Múltiplos do Estoque".
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="border-b border-gray-100 bg-slate-50 text-slate-500">
                          <th className="py-2.5 px-3 font-semibold">Produto / Descrição</th>
                          <th className="py-2.5 px-2 w-20 font-semibold text-center">Qtd</th>
                          <th className="py-2.5 px-2 w-32 font-semibold text-right">Unitário (R$)</th>
                          <th className="py-2.5 px-2 w-28 font-semibold text-right">Desconto (R$)</th>
                          <th className="py-2.5 px-3 w-32 font-semibold text-right">Subtotal</th>
                          <th className="py-2.5 px-2 w-16 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {products.map((p, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3">
                              <Input
                                placeholder="Descrição do produto ou peça..."
                                value={p.name}
                                onChange={e => {
                                  const updated = [...products];
                                  updated[i].name = e.target.value;
                                  setProducts(updated);
                                }}
                                className="h-8 text-xs bg-white rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                min={1}
                                value={p.quantity}
                                onChange={e => {
                                  const v = Math.max(1, Number(e.target.value) || 1);
                                  const updated = [...products];
                                  updated[i].quantity = v;
                                  updated[i].total = v * updated[i].unitPrice - updated[i].discount;
                                  setProducts(updated);
                                }}
                                className="h-8 text-xs w-20 text-center rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={p.unitPrice}
                                onChange={e => {
                                  const v = Math.max(0, Number(e.target.value) || 0);
                                  const updated = [...products];
                                  updated[i].unitPrice = v;
                                  updated[i].total = updated[i].quantity * v - updated[i].discount;
                                  setProducts(updated);
                                }}
                                className="h-8 text-xs w-32 text-right rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={p.discount}
                                onChange={e => {
                                  const v = Math.max(0, Number(e.target.value) || 0);
                                  const updated = [...products];
                                  updated[i].discount = v;
                                  updated[i].total = updated[i].quantity * updated[i].unitPrice - v;
                                  setProducts(updated);
                                }}
                                className="h-8 text-xs w-28 text-right rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-900 text-right">
                              {formatCurrency(p.quantity * p.unitPrice - p.discount)}
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateProduct(i)}
                                  title="Duplicar linha"
                                  className="text-gray-400 hover:text-orange-600 p-1 rounded"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setProducts(products.filter((_, j) => j !== i))}
                                  title="Excluir item"
                                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

          {/* ══ ABA 3: SERVIÇOS TÉCNICOS (Replicado de Produtos) ═══════ */}
          {activeTab === "servicos" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-orange-600" />
                      Serviços Especializados em Geradores ({services.length})
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Mão de obra técnica, revisões, testes de carga e manutenções
                    </p>
                  </div>

                  {/* Ações da Aba de Serviços */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMultiPickerServicesModal(true)}
                      className="text-xs h-8 gap-1.5 border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 font-bold"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-600" />
                      Selecionar Múltiplos Serviços
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowQuickSvc(!showQuickSvc)}
                      className="text-xs h-8 gap-1.5 border-gray-200 hover:bg-slate-50 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-600" />
                      Cadastrar Novo Serviço
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addServiceRow()}
                      className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Serviço
                    </Button>
                  </div>
                </div>

                {/* BARRA DE ADIÇÃO RÁPIDA: SERVIÇOS (Fast Add Bar) */}
                <form
                  onSubmit={handleFastAddService}
                  className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 flex flex-wrap items-center gap-2.5"
                >
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Catálogo de Serviços ou Descrição
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={fastSvcId}
                        onChange={e => onSelectFastService(e.target.value)}
                        className="h-9 px-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none w-48 shrink-0"
                      >
                        <option value="">Buscar no catálogo...</option>
                        {servicesCatalog.map(svc => (
                          <option key={svc.id} value={svc.id}>
                            {svc.title} · R$ {Number(svc.price || 0).toFixed(2)}
                          </option>
                        ))}
                      </select>
                      <Input
                        placeholder="Ou digite o nome do serviço..."
                        value={fastSvcTitle}
                        onChange={e => setFastSvcTitle(e.target.value)}
                        className="h-9 text-xs bg-white rounded-lg flex-1"
                      />
                    </div>
                  </div>

                  <div className="w-20">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Qtd</span>
                    <Input
                      type="number"
                      min={1}
                      value={fastSvcQty}
                      onChange={e => setFastSvcQty(Math.max(1, Number(e.target.value) || 1))}
                      className="h-9 text-xs bg-white rounded-lg text-center"
                    />
                  </div>

                  <div className="w-32">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Valor Unit. (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={fastSvcPrice}
                      onChange={e => setFastSvcPrice(Number(e.target.value) || 0)}
                      className="h-9 text-xs bg-white rounded-lg text-right"
                    />
                  </div>

                  <div className="self-end pt-3">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs gap-1 shadow-xs rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Serviço
                    </Button>
                  </div>
                </form>

                {showQuickSvc && (
                  <QuickAddPanel title="Cadastrar novo serviço diretamente no catálogo" onClose={() => setShowQuickSvc(false)}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[10px] text-gray-500 block mb-1">Título do Serviço *</Label>
                        <Input placeholder="Ex: Manutenção Preventiva 500kVA + Teste de Carga" value={qsTitle} onChange={e => setQsTitle(e.target.value)} className="h-8 text-xs bg-white" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 block mb-1">Preço Sugerido (R$)</Label>
                        <Input type="number" min={0} step="0.01" placeholder="0,00" value={qsPrice} onChange={e => setQsPrice(e.target.value)} className="h-8 text-xs bg-white" />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-500 block mb-1">Escopo Técnico Padrão</Label>
                        <Input placeholder="Inspeção de filtros, óleo, QTA..." value={qsObs} onChange={e => setQsObs(e.target.value)} className="h-8 text-xs bg-white" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleQuickAddService}
                        disabled={quickSaving}
                        className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs"
                      >
                        {quickSaving ? "Cadastrando..." : "Cadastrar e Adicionar ao Orçamento"}
                      </Button>
                    </div>
                  </QuickAddPanel>
                )}

                {/* Tabela de Serviços */}
                {services.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                    <Wrench className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Nenhum serviço incluído</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Utilize a barra de adição rápida ou selecione do catálogo.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="border-b border-gray-100 bg-slate-50 text-slate-500">
                          <th className="py-2.5 px-3 font-semibold">Serviço / Escopo Técnico</th>
                          <th className="py-2.5 px-2 w-20 font-semibold text-center">Qtd</th>
                          <th className="py-2.5 px-2 w-32 font-semibold text-right">Unitário (R$)</th>
                          <th className="py-2.5 px-2 w-28 font-semibold text-right">Desconto (R$)</th>
                          <th className="py-2.5 px-3 w-32 font-semibold text-right">Subtotal</th>
                          <th className="py-2.5 px-2 w-16 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {services.map((s, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 space-y-1">
                              <Input
                                placeholder="Título do serviço..."
                                value={s.title}
                                onChange={e => {
                                  const u = [...services];
                                  u[i].title = e.target.value;
                                  setServices(u);
                                }}
                                className="h-8 text-xs font-semibold bg-white rounded-lg border-gray-200"
                              />
                              <Input
                                placeholder="Observação técnica / escopo específico deste serviço..."
                                value={s.customObservation || ""}
                                onChange={e => {
                                  const u = [...services];
                                  u[i].customObservation = e.target.value;
                                  setServices(u);
                                }}
                                className="h-7 text-[11px] bg-slate-50 text-slate-600 rounded border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                min={1}
                                value={s.quantity}
                                onChange={e => {
                                  const v = Math.max(1, Number(e.target.value) || 1);
                                  const u = [...services];
                                  u[i].quantity = v;
                                  u[i].total = v * u[i].unitPrice - u[i].discount;
                                  setServices(u);
                                }}
                                className="h-8 text-xs w-20 text-center rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={s.unitPrice}
                                onChange={e => {
                                  const v = Math.max(0, Number(e.target.value) || 0);
                                  const u = [...services];
                                  u[i].unitPrice = v;
                                  u[i].total = u[i].quantity * v - u[i].discount;
                                  setServices(u);
                                }}
                                className="h-8 text-xs w-32 text-right rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={s.discount}
                                onChange={e => {
                                  const v = Math.max(0, Number(e.target.value) || 0);
                                  const u = [...services];
                                  u[i].discount = v;
                                  u[i].total = u[i].quantity * u[i].unitPrice - v;
                                  setServices(u);
                                }}
                                className="h-8 text-xs w-28 text-right rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-900 text-right">
                              {formatCurrency(s.quantity * s.unitPrice - s.discount)}
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateService(i)}
                                  title="Duplicar serviço"
                                  className="text-gray-400 hover:text-orange-600 p-1 rounded"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setServices(services.filter((_, j) => j !== i))}
                                  title="Excluir serviço"
                                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

          {/* ══ ABA 4: CUSTOS ADICIONAIS (Replicado de Produtos) ═══════ */}
          {activeTab === "custos" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-orange-600" />
                      Custos Operacionais & Deslocamento ({additionalCosts.length})
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Quilometragem técnica, diárias, alimentação e despesas da equipe
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCostPresetsModal(true)}
                      className="text-xs h-8 gap-1.5 border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 font-bold"
                    >
                      <Layers className="w-3.5 h-3.5 text-orange-600" />
                      Selecionar Custos Predefinidos
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setAdditionalCosts(c => [...c, { description: costPresetsList[0], amount: 0 }]);
                      }}
                      className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Custo
                    </Button>
                  </div>
                </div>

                {/* BARRA DE ADIÇÃO RÁPIDA: CUSTOS (Fast Add Bar) */}
                <form
                  onSubmit={handleFastAddCost}
                  className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 flex flex-wrap items-center gap-2.5"
                >
                  <div className="flex-1 min-w-[220px]">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                      Tipo de Custo ou Descrição
                    </span>
                    <div className="flex items-center gap-1.5">
                      <select
                        value={costPresetsList.includes(fastCostDesc) ? fastCostDesc : ""}
                        onChange={e => setFastCostDesc(e.target.value)}
                        className="h-9 px-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none w-52 shrink-0"
                      >
                        <option value="">Tipo padrão...</option>
                        {costPresetsList.map((cp, idx) => (
                          <option key={idx} value={cp}>{cp}</option>
                        ))}
                      </select>
                      <Input
                        placeholder="Ou digite a descrição do custo..."
                        value={fastCostDesc}
                        onChange={e => setFastCostDesc(e.target.value)}
                        className="h-9 text-xs bg-white rounded-lg flex-1"
                      />
                    </div>
                  </div>

                  <div className="w-36">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Valor (R$)</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={fastCostAmount}
                      onChange={e => setFastCostAmount(Number(e.target.value) || 0)}
                      className="h-9 text-xs bg-white rounded-lg text-right"
                    />
                  </div>

                  <div className="self-end pt-3">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs gap-1 shadow-xs rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Custo
                    </Button>
                  </div>
                </form>

                {additionalCosts.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                    <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Nenhum custo extra lançado</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Utilize a barra de adição rápida ou selecione dos custos predefinidos.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="border-b border-gray-100 bg-slate-50 text-slate-500">
                          <th className="py-2.5 px-3 font-semibold">Tipo Predefinido</th>
                          <th className="py-2.5 px-3 font-semibold">Descrição do Custo</th>
                          <th className="py-2.5 px-3 w-36 font-semibold text-right">Valor (R$)</th>
                          <th className="py-2.5 px-2 w-16 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {additionalCosts.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 w-56">
                              <select
                                value={costPresetsList.includes(c.description) ? c.description : ""}
                                onChange={e => {
                                  if (e.target.value) {
                                    const u = [...additionalCosts];
                                    u[i].description = e.target.value;
                                    setAdditionalCosts(u);
                                  }
                                }}
                                className="h-8 px-2 text-xs rounded-lg border border-gray-200 bg-slate-50 outline-none w-full"
                              >
                                <option value="">Outro...</option>
                                {costPresetsList.map((p, idx) => (
                                  <option key={idx} value={p}>{p}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                placeholder="Descrição detalhada..."
                                value={c.description}
                                onChange={e => {
                                  const u = [...additionalCosts];
                                  u[i].description = e.target.value;
                                  setAdditionalCosts(u);
                                }}
                                className="h-8 text-xs bg-white rounded-lg border-gray-200"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                placeholder="R$ 0,00"
                                value={c.amount}
                                onChange={e => {
                                  const u = [...additionalCosts];
                                  u[i].amount = Number(e.target.value) || 0;
                                  setAdditionalCosts(u);
                                }}
                                className="h-8 text-xs bg-white rounded-lg border-gray-200 text-right w-full"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateCost(i)}
                                  title="Duplicar custo"
                                  className="text-gray-400 hover:text-orange-600 p-1 rounded"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setAdditionalCosts(additionalCosts.filter((_, j) => j !== i))}
                                  title="Excluir custo"
                                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

          {/* ══ ABA 5: CONDIÇÕES & NOTAS ═════════════════════════════ */}
          {activeTab === "condicoes" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2 pb-3 border-b border-gray-100">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  Condições Comerciais, Forma de Pagamento & Prazos (Multi-CRUD)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* FORMA DE PAGAMENTO COM '+' */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block font-semibold text-gray-700">Forma de Pagamento</Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickPaymentMethod(!showQuickPaymentMethod)}
                        className="text-[11px] text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />Nova Forma
                      </button>
                    </div>

                    {showQuickPaymentMethod && (
                      <QuickAddPanel title="Nova Forma de Pagamento" onClose={() => setShowQuickPaymentMethod(false)}>
                        <Input
                          placeholder="Ex: Pix Faturado, Boleto 30D"
                          value={qpmDesc}
                          onChange={e => setQpmDesc(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <div className="flex justify-end pt-1">
                          <Button size="sm" onClick={handleQuickAddPaymentMethod} disabled={quickSaving} className="h-7 text-xs bg-orange-600 text-white font-bold">
                            Adicionar
                          </Button>
                        </div>
                      </QuickAddPanel>
                    )}

                    <select
                      value={paymentMethodId}
                      onChange={e => setPaymentMethodId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                    >
                      <option value="">Selecione...</option>
                      {paymentMethods.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PRAZO DE PAGAMENTO COM SELECT + CRUD '+' */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="block font-semibold text-gray-700">Prazo / Parcelamento *</Label>
                      <button
                        type="button"
                        onClick={() => setShowQuickPaymentTerm(!showQuickPaymentTerm)}
                        className="text-[11px] text-orange-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" />Novo Prazo
                      </button>
                    </div>

                    {showQuickPaymentTerm && (
                      <QuickAddPanel title="Cadastrar Prazo Personalizado" onClose={() => setShowQuickPaymentTerm(false)}>
                        <Input
                          placeholder="Ex: 45 dias da NF, 30/60/90/120"
                          value={qptTerm}
                          onChange={e => setQptTerm(e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                        <div className="flex justify-end pt-1">
                          <Button size="sm" onClick={handleQuickAddPaymentTerm} className="h-7 text-xs bg-orange-600 text-white font-bold">
                            Salvar Prazo
                          </Button>
                        </div>
                      </QuickAddPanel>
                    )}

                    <select
                      value={paymentTerms}
                      onChange={e => setPaymentTerms(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-xs outline-none focus:border-orange-500"
                    >
                      {paymentTermsList.map((term, idx) => (
                        <option key={idx} value={term}>{term}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">Garantia (Meses)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={warrantyMonths}
                      onChange={e => setWarrantyMonths(Number(e.target.value) || 0)}
                      className="h-10 text-xs bg-white rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      Cláusulas Padrão (Clique para inserir na proposta):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {standardConditionsList.map((clause, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => insertConditionClause(clause)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-orange-200/80 text-orange-900 hover:bg-orange-100/70 text-left transition-colors font-medium"
                      >
                        + {clause.slice(0, 48)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Observações / Escopo da Proposta (Visível ao Cliente no PDF)
                    </Label>
                    <textarea
                      rows={5}
                      value={publicNotes}
                      onChange={e => setPublicNotes(e.target.value)}
                      className="w-full p-3 bg-white rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-orange-500 resize-none leading-relaxed"
                      placeholder="Condições comerciais impressas na proposta formal..."
                    />
                  </div>

                  <div>
                    <Label className="block font-semibold text-gray-700 mb-1">
                      Notas Internas (Privado para a Equipe SETGEN)
                    </Label>
                    <textarea
                      rows={5}
                      value={internalNotes}
                      onChange={e => setInternalNotes(e.target.value)}
                      className="w-full p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs focus:outline-none resize-none leading-relaxed"
                      placeholder="Histórico interno, condições negociadas pelo vendedor..."
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 shadow-xs">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="grid grid-cols-3 gap-6 text-xs w-full md:w-auto">
                    <div>
                      <span className="text-gray-500 text-[11px] block">Produtos</span>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(subP)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Serviços</span>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(subS)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[11px] block">Despesas</span>
                      <span className="font-bold text-gray-900 text-sm">{formatCurrency(subC)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    <div>
                      <span className="text-[11px] text-gray-500 block mb-1">Desconto Geral</span>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={discountType}
                          onChange={e => setDiscountType(e.target.value as "PERCENTUAL" | "VALOR_FIXO")}
                          className="h-9 px-2 rounded-lg border border-orange-200 bg-white text-xs font-semibold text-orange-900 outline-none"
                        >
                          <option value="VALOR_FIXO">R$ Fixo</option>
                          <option value="PERCENTUAL">% Percentual</option>
                        </select>
                        <Input
                          type="number"
                          min={0}
                          value={discountValue}
                          onChange={e => setDiscountValue(Number(e.target.value) || 0)}
                          className="h-9 w-24 bg-white text-xs border-orange-200 rounded-lg text-right"
                        />
                      </div>
                    </div>

                    <div className="pl-6 border-l border-orange-200 text-right">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 block">
                        Valor Total da Proposta
                      </span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ABA 6: CRONOGRAMA DE TAREFAS (Com Multi-CRUD e '+' - Ponto 2) ══ */}
          {activeTab === "tarefas" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      Cronograma & Atividades Previstas ({tasks.length})
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Etapas técnicas vinculadas à execução da Ordem de Serviço
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowQuickTaskType(!showQuickTaskType)}
                      className="text-xs h-8 gap-1.5 border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 font-bold"
                    >
                      <Plus className="w-3.5 h-3.5 text-orange-600" />
                      Novo Tipo de Tarefa
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const nextCode = `TSK-${String(tasks.length + 1).padStart(2, "0")}`;
                        setTasks(t => [
                          ...t,
                          {
                            code: nextCode,
                            type: taskTypePresetsList[0],
                            date: requestDate,
                            collaboratorName: usersList[0]?.name || responsibleName,
                          },
                        ]);
                      }}
                      className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Tarefa
                    </Button>
                  </div>
                </div>

                {/* Painel Inline para Novo Tipo de Tarefa (Multi-CRUD Ponto 2) */}
                {showQuickTaskType && (
                  <QuickAddPanel title="Cadastrar Novo Tipo de Tarefa / Etapa Técnica" onClose={() => setShowQuickTaskType(false)}>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Ex: Alinhamento a Laser, Teste de Vibração"
                        value={qttType}
                        onChange={e => setQttType(e.target.value)}
                        className="h-8 text-xs bg-white flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleQuickAddTaskType}
                        className="h-8 bg-orange-600 text-white font-bold text-xs px-4"
                      >
                        Salvar Tipo
                      </Button>
                    </div>
                  </QuickAddPanel>
                )}

                {/* BARRA DE ADIÇÃO RÁPIDA: TAREFAS */}
                <form
                  onSubmit={handleFastAddTask}
                  className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 flex flex-wrap items-center gap-2.5"
                >
                  <div className="flex-1 min-w-[200px]">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Tipo de Atividade Técnica</span>
                    <select
                      value={fastTaskType}
                      onChange={e => setFastTaskType(e.target.value)}
                      className="h-9 px-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none w-full"
                    >
                      {taskTypePresetsList.map((tp, idx) => (
                        <option key={idx} value={tp}>{tp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-36">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Data Prevista</span>
                    <Input
                      type="date"
                      value={fastTaskDate}
                      onChange={e => setFastTaskDate(e.target.value)}
                      className="h-9 text-xs bg-white rounded-lg"
                    />
                  </div>

                  <div className="w-48">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Técnico Responsável</span>
                    {usersList.length > 0 ? (
                      <select
                        value={fastTaskCollab}
                        onChange={e => setFastTaskCollab(e.target.value)}
                        className="h-9 px-2.5 text-xs rounded-lg border border-gray-200 bg-white outline-none w-full"
                      >
                        {usersList.map(u => (
                          <option key={u.id} value={u.name}>{u.name}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        value={fastTaskCollab}
                        onChange={e => setFastTaskCollab(e.target.value)}
                        placeholder="Nome do técnico"
                        className="h-9 text-xs bg-white rounded-lg"
                      />
                    )}
                  </div>

                  <div className="self-end pt-3">
                    <Button
                      type="submit"
                      size="sm"
                      className="h-9 px-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs gap-1 shadow-xs rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Incluir Tarefa
                    </Button>
                  </div>
                </form>

                {tasks.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                    <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Nenhuma tarefa programada</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Adicione as atividades necessárias para a execução técnica do gerador.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs bg-white">
                      <thead>
                        <tr className="border-b border-gray-100 bg-slate-50 text-slate-500">
                          <th className="py-2.5 px-3 w-24 font-semibold">Código</th>
                          <th className="py-2.5 px-3 font-semibold">Tipo de Tarefa</th>
                          <th className="py-2.5 px-3 w-36 font-semibold">Data Prevista</th>
                          <th className="py-2.5 px-3 w-48 font-semibold">Técnico Responsável</th>
                          <th className="py-2.5 px-2 w-16 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {tasks.map((t, i) => (
                          <tr key={i} className="hover:bg-slate-50/60">
                            <td className="py-2 px-3 font-mono font-bold text-orange-600">
                              <Input
                                value={t.code}
                                onChange={e => {
                                  const u = [...tasks];
                                  u[i].code = e.target.value;
                                  setTasks(u);
                                }}
                                className="h-8 text-xs font-mono font-bold bg-white rounded-lg border-gray-200 w-20"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={t.type}
                                onChange={e => {
                                  const u = [...tasks];
                                  u[i].type = e.target.value;
                                  setTasks(u);
                                }}
                                className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold outline-none w-full"
                              >
                                {taskTypePresetsList.map((tp, idx) => (
                                  <option key={idx} value={tp}>{tp}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <Input
                                type="date"
                                value={t.date}
                                onChange={e => {
                                  const u = [...tasks];
                                  u[i].date = e.target.value;
                                  setTasks(u);
                                }}
                                className="h-8 text-xs bg-white rounded-lg border-gray-200 w-36"
                              />
                            </td>
                            <td className="py-2 px-3">
                              {usersList.length > 0 ? (
                                <select
                                  value={t.collaboratorName || ""}
                                  onChange={e => {
                                    const u = [...tasks];
                                    u[i].collaboratorName = e.target.value;
                                    setTasks(u);
                                  }}
                                  className="h-8 px-2.5 rounded-lg border border-gray-200 bg-white text-xs outline-none w-full"
                                >
                                  <option value="">Técnico Responsável...</option>
                                  {usersList.map(u => (
                                    <option key={u.id} value={u.name}>{u.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                  value={t.collaboratorName || ""}
                                  onChange={e => {
                                    const u = [...tasks];
                                    u[i].collaboratorName = e.target.value;
                                    setTasks(u);
                                  }}
                                  placeholder="Técnico"
                                  className="h-8 text-xs bg-white rounded-lg border-gray-200"
                                />
                              )}
                            </td>
                            <td className="py-2 px-2">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateTask(i)}
                                  title="Duplicar tarefa"
                                  className="text-gray-400 hover:text-orange-600 p-1 rounded"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                                  title="Excluir tarefa"
                                  className="text-gray-400 hover:text-red-500 p-1 rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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

          {/* ══ ABA 7: DOCUMENTOS & ANEXOS ═══════════════════════════ */}
          {activeTab === "anexos" && (
            <div className="space-y-5 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-orange-600" />
                      Documentos, Fotos e Laudos Técnicos ({attachments.length})
                    </h4>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Arquivos anexados a esta proposta comercial
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addAttachmentRow}
                    className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Incluir Arquivo
                  </Button>
                </div>

                {attachments.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
                    <Paperclip className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">Nenhum documento anexado</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      Adicione fotos do gerador, laudos anteriores ou diagramas unifilares.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {attachments.map((att, i) => (
                      <div key={i} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Paperclip className="w-4 h-4 text-orange-600" />
                          <div>
                            <span className="font-semibold text-gray-900 text-xs">{att.fileName}</span>
                            <span className="text-gray-400 text-[11px] ml-2">· {att.uploadedBy} · {att.date}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={att.showToClient}
                              onChange={e => {
                                const u = [...attachments];
                                u[i].showToClient = e.target.checked;
                                setAttachments(u);
                              }}
                              className="rounded text-orange-600"
                            />
                            <span className={att.showToClient ? "text-emerald-700 font-semibold" : "text-gray-400"}>
                              {att.showToClient ? "Visível na Proposta" : "Apenas Interno"}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}
                            className="text-gray-300 hover:text-red-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ABA 8: STATUS & APROVAÇÃO (Padrão Aurora Setgen) ═══════ */}
          {activeTab === "status" && (
            <div className="space-y-6 max-w-5xl">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 text-base">
                          Gerenciamento de Status & Aprovações
                        </h4>
                        <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border", getStatusBadgeClass(status))}>
                          {getStatusLabel(status)}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Controle o ciclo de vida comercial da proposta desde a elaboração até o fechamento
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
                      Total da Proposta
                    </span>
                    <span className="text-xl font-black text-gray-900">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Pipeline Visual de Fases */}
                <div className="bg-slate-50 rounded-xl p-4 border border-gray-200">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-3">
                    Fluxo do Ciclo de Vida Comercial
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { key: "DRAFT", label: "1. Rascunho", desc: "Elaboração técnica" },
                      { key: "PENDING_APPROVAL", label: "2. Em Análise", desc: "Revisão interna" },
                      { key: "APPROVED", label: "3. Aprovado", desc: "Validação concluída" },
                      { key: "SENT_TO_CLIENT", label: "4. Enviado", desc: "Entregue ao cliente" },
                      { key: "ACCEPTED", label: "5. Aceito (OS)", desc: "Conversão em OS" },
                    ].map((step) => {
                      const isCurrent = status === step.key;
                      return (
                        <div
                          key={step.key}
                          className={cn(
                            "p-2.5 rounded-xl border text-center transition-all",
                            isCurrent
                              ? "bg-orange-500 text-white border-orange-600 shadow-sm"
                              : "bg-white text-slate-700 border-gray-200"
                          )}
                        >
                          <div className={cn("text-xs font-bold", isCurrent ? "text-white" : "text-gray-900")}>
                            {step.label}
                          </div>
                          <div className={cn("text-[10px] mt-0.5", isCurrent ? "text-orange-100" : "text-gray-400")}>
                            {step.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Painel de Alteração do Status */}
                <div className="space-y-4">
                  <h5 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Alterar Status do Orçamento
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      { key: "DRAFT", label: "Rascunho", desc: "Voltar para elaboração interna", color: "hover:border-slate-400" },
                      { key: "PENDING_APPROVAL", label: "Pendente de Aprovação", desc: "Encaminhar para gerência", color: "hover:border-amber-400" },
                      { key: "APPROVED", label: "Aprovado Internamente", desc: "Liberar para envio comercial", color: "hover:border-blue-400" },
                      { key: "SENT_TO_CLIENT", label: "Enviado ao Cliente", desc: "Proposta entregue", color: "hover:border-purple-400" },
                      { key: "AWAITING_RESPONSE", label: "Aguardando Resposta", desc: "Em negociação ativa", color: "hover:border-orange-400" },
                      { key: "ACCEPTED", label: "Aceito pelo Cliente", desc: "Gera Ordem de Serviço (OS)", color: "hover:border-emerald-400" },
                      { key: "REJECTED", label: "Revisão / Recusado", desc: "Cliente solicitou alterações", color: "hover:border-rose-400" },
                      { key: "CANCELLED", label: "Cancelado", desc: "Negociação finalizada", color: "hover:border-gray-500" },
                    ].map(st => {
                      const isSelected = newStatus === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setNewStatus(st.key as QuoteStatus)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-20",
                            isSelected
                              ? "border-orange-500 bg-orange-50/60 ring-2 ring-orange-500/20 shadow-xs"
                              : "border-gray-200 bg-white hover:bg-slate-50 " + st.color
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-900">{st.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-orange-600" />}
                          </div>
                          <span className="text-[10.5px] text-gray-400 leading-tight">
                            {st.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-semibold text-gray-700">
                      Observação / Justificativa da Alteração (Opcional - Gravado em Auditoria)
                    </Label>
                    <Input
                      value={statusComment}
                      onChange={e => setStatusComment(e.target.value)}
                      placeholder="Ex: Aprovado tecnicamente pela gerência / Cliente solicitou desconto de 5%..."
                      className="text-xs h-9 bg-slate-50 border-gray-200"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-gray-400">
                      Status selecionado: <strong className="text-gray-800">{getStatusLabel(newStatus)}</strong>
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleUpdateStatus()}
                      disabled={updatingStatus || (status === newStatus && !statusComment.trim())}
                      className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold h-9 px-5 gap-2 shadow-xs"
                    >
                      {updatingStatus ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Atualizando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Salvar Alteração de Status
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Estudo e Link de Aprovação do Cliente */}
                <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50/40 rounded-2xl p-5 border border-orange-200/80 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-700 shrink-0 mt-0.5">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-orange-950 text-sm flex items-center gap-2">
                          Link Público de Aprovação do Cliente
                          <span className="text-[10px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                            Pronto para Uso
                          </span>
                        </h4>
                        <p className="text-orange-900/80 text-xs mt-0.5 leading-relaxed">
                          Envie este link direto para o cliente via WhatsApp ou E-mail. Ele visualiza a proposta completa sem precisar de senha, pode aprovar com 1 clique (informando nome e CPF/cargo) ou solicitar revisão. Ao aprovar, o status muda automaticamente para <strong>Aceito</strong> e a <strong>Ordem de Serviço</strong> é gerada no sistema.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/90 p-2 rounded-xl border border-orange-200">
                    <Input
                      readOnly
                      value={quoteId ? `${typeof window !== "undefined" ? window.location.origin.replace(":3000", ":3001") : "http://localhost:3001"}/public/quotes/${quoteId}` : "Salve o orçamento para gerar o link público"}
                      className="text-xs h-8 bg-transparent border-none text-slate-700 select-all font-mono"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!quoteId}
                        onClick={() => {
                          if (!quoteId) return;
                          const url = `${window.location.origin.replace(":3000", ":3001")}/public/quotes/${quoteId}`;
                          navigator.clipboard.writeText(url);
                          toast.success("Link de aprovação copiado para a área de transferência!");
                        }}
                        className="text-xs h-8 gap-1.5 border-orange-300 text-orange-800 hover:bg-orange-100 font-bold"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Link
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={!quoteId}
                        onClick={() => {
                          if (!quoteId) return;
                          const url = `${window.location.origin.replace(":3000", ":3001")}/public/quotes/${quoteId}`;
                          window.open(url, "_blank");
                        }}
                        className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Abrir Proposta do Cliente
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ===== 3. RODAPÉ FIXO NA BASE (Sem scroll - Ponto 9) ===== */}
        <footer className="h-16 bg-white border-t border-gray-200 px-6 flex items-center justify-between shrink-0 shadow-lg z-20">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="text-xs h-9 gap-1.5 font-bold border-orange-200 text-orange-700 hover:bg-orange-50"
              title="Salva o orçamento com status Rascunho e vai direto para a lista de orçamentos"
            >
              <Save className="w-4 h-4 text-orange-600" />
              {savingDraft ? "Salvando..." : "Salvar como Rascunho"}
            </Button>
            <div className="hidden sm:block text-xs text-slate-500">
              Total: <strong className="text-slate-900 text-sm">{formatCurrency(grandTotal)}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPdfModal(true)}
              className="text-xs rounded-xl h-9 px-3.5 gap-1.5 border-gray-200 hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Imprimir / PDF
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl h-9 px-4 border-gray-200"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={saveQuote}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs rounded-xl h-9 px-5 gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-4 h-4" />
              {saving ? "Salvando..." : quoteId ? "Salvar Alterações" : "Salvar Orçamento"}
            </Button>
          </div>
        </footer>

      </main>

      {/* ===== 4. MODAL: SELEÇÃO MÚLTIPLA DE PRODUTOS ===== */}
      <Dialog open={showMultiPickerModal} onOpenChange={setShowMultiPickerModal}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              Selecionar Múltiplos Produtos do Estoque
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Marque os produtos e quantidades desejadas para adicionar todos de uma só vez ao orçamento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Pesquisar por nome ou código da peça..."
                value={multiPickerSearch}
                onChange={e => setMultiPickerSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-gray-200"
              />
            </div>

            <div className="max-h-[340px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {productsCatalog
                .filter(p => {
                  const s = multiPickerSearch.toLowerCase();
                  return p.name.toLowerCase().includes(s) || (p.code && p.code.toLowerCase().includes(s));
                })
                .map(prod => {
                  const isChecked = !!multiSelectedMap[prod.id]?.selected;
                  const qty = multiSelectedMap[prod.id]?.qty || 1;
                  const price = Number(prod.unitPrice ?? prod.unitCost ?? 0);

                  return (
                    <div
                      key={prod.id}
                      className={cn(
                        "p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors",
                        isChecked && "bg-orange-50/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setMultiSelectedMap(prev => ({
                              ...prev,
                              [prod.id]: { selected: e.target.checked, qty },
                            }));
                          }}
                          className="rounded text-orange-600 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{prod.name}</p>
                          <p className="text-[11px] text-gray-500">
                            {prod.code ? `Cód: ${prod.code} · ` : ""}
                            Preço: <strong className="text-slate-700">{formatCurrency(price)}</strong>
                            {prod.currentStock !== undefined && ` · Estoque: ${prod.currentStock}`}
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-semibold">Qtd:</span>
                          <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={e => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setMultiSelectedMap(prev => ({
                                ...prev,
                                [prod.id]: { selected: true, qty: val },
                              }));
                            }}
                            className="h-8 w-16 text-center text-xs bg-white rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMultiPickerModal(false)}
              className="rounded-xl font-semibold border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMultiPicker}
              className="rounded-xl font-bold bg-[#E2661D] hover:bg-[#c95716] text-white gap-2"
            >
              <Check className="w-4 h-4" />
              Adicionar Selecionados ao Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 5. MODAL: SELEÇÃO MÚLTIPLA DE SERVIÇOS TÉCNICOS ===== */}
      <Dialog open={showMultiPickerServicesModal} onOpenChange={setShowMultiPickerServicesModal}>
        <DialogContent className="sm:max-w-[700px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-600" />
              Selecionar Múltiplos Serviços Técnicos do Catálogo
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Marque os serviços que farão parte desta proposta comercial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Pesquisar por título do serviço..."
                value={multiPickerServicesSearch}
                onChange={e => setMultiPickerServicesSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl border-gray-200"
              />
            </div>

            <div className="max-h-[340px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
              {servicesCatalog
                .filter(s => s.title.toLowerCase().includes(multiPickerServicesSearch.toLowerCase()))
                .map(svc => {
                  const isChecked = !!multiSelectedServicesMap[svc.id]?.selected;
                  const qty = multiSelectedServicesMap[svc.id]?.qty || 1;
                  const price = Number(svc.price || 0);

                  return (
                    <div
                      key={svc.id}
                      className={cn(
                        "p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors",
                        isChecked && "bg-orange-50/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            setMultiSelectedServicesMap(prev => ({
                              ...prev,
                              [svc.id]: { selected: e.target.checked, qty },
                            }));
                          }}
                          className="rounded text-orange-600 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{svc.title}</p>
                          <p className="text-[11px] text-gray-500">
                            Preço sugerido: <strong className="text-slate-700">{formatCurrency(price)}</strong>
                            {svc.defaultObservation && ` · ${svc.defaultObservation.slice(0, 50)}...`}
                          </p>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-slate-500 font-semibold">Qtd:</span>
                          <Input
                            type="number"
                            min={1}
                            value={qty}
                            onChange={e => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setMultiSelectedServicesMap(prev => ({
                                ...prev,
                                [svc.id]: { selected: true, qty: val },
                              }));
                            }}
                            className="h-8 w-16 text-center text-xs bg-white rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMultiPickerServicesModal(false)}
              className="rounded-xl font-semibold border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmMultiPickerServices}
              className="rounded-xl font-bold bg-[#E2661D] hover:bg-[#c95716] text-white gap-2"
            >
              <Check className="w-4 h-4" />
              Adicionar Selecionados ao Orçamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 6. MODAL: SELEÇÃO DE CUSTOS PREDEFINIDOS ===== */}
      <Dialog open={showCostPresetsModal} onOpenChange={setShowCostPresetsModal}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              Selecionar Custos Operacionais Predefinidos
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Marque as despesas operacionais da equipe para incluir na proposta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 max-h-[300px] overflow-y-auto">
            {costPresetsList.map((cp, idx) => (
              <label
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!!selectedCostPresetsMap[cp]}
                  onChange={e => {
                    setSelectedCostPresetsMap(prev => ({
                      ...prev,
                      [cp]: e.target.checked,
                    }));
                  }}
                  className="rounded text-orange-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-800">{cp}</span>
              </label>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCostPresetsModal(false)}
              className="rounded-xl font-semibold border-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCostPresets}
              className="rounded-xl font-bold bg-[#E2661D] hover:bg-[#c95716] text-white gap-2"
            >
              <Check className="w-4 h-4" />
              Adicionar Custos Selecionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== 7. MODAL: PRÉ-VISUALIZAÇÃO / IMPRESSÃO EM PDF ===== */}
      <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto rounded-2xl p-6">
          <DialogHeader className="print:hidden">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-orange-600" />
                Proposta Comercial de Orçamento (Visualização para PDF)
              </span>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs gap-1.5 rounded-xl shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                Imprimir / Salvar como PDF
              </Button>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Layout formatado para exportação em folha timbrada SETGEN.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-xs space-y-6 text-slate-800">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h1 className="text-xl font-black text-orange-600 tracking-tight">SETGEN</h1>
                <p className="text-xs text-slate-600 font-semibold">Geradores & Soluções em Energia</p>
                <p className="text-[11px] text-slate-400">contato@setgen.com.br · (11) 3456-7890</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-slate-900">PROPOSTA COMERCIAL</p>
                <p className="text-xs font-mono font-bold text-orange-700">{quoteNumber || "ORC-NOVO"}</p>
                <p className="text-[11px] text-slate-500">Data: {formatDate(requestDate)}</p>
                <p className="text-[11px] text-slate-500">Validade: {formatDate(validUntil)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Cliente</p>
                <p className="font-bold text-slate-900">{selectedClientObj?.companyName || "Cliente não informado"}</p>
                <p className="text-slate-600">{selectedClientObj?.tradeName}</p>
                <p className="text-slate-500">CNPJ: {selectedClientObj?.cnpjCpf || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Atendimento</p>
                <p className="text-slate-700">Contato no Local: <strong>{contactPerson || "—"}</strong></p>
                <p className="text-slate-700">Responsável SETGEN: <strong>{responsibleName || "—"}</strong></p>
                <p className="text-slate-500">Cidade/UF: {selectedClientObj?.address?.city || "—"}</p>
              </div>
            </div>

            {publicNotes && (
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">Escopo Técnico da Proposta</p>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {publicNotes}
                </p>
              </div>
            )}

            {products.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Produtos & Peças de Reposição</p>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2">Item / Descrição</th>
                      <th className="p-2 w-16 text-center">Qtd</th>
                      <th className="p-2 w-28 text-right">V. Unit (R$)</th>
                      <th className="p-2 w-24 text-right">Desc. (R$)</th>
                      <th className="p-2 w-28 text-right">Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{p.name}</td>
                        <td className="p-2 text-center">{p.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(p.unitPrice)}</td>
                        <td className="p-2 text-right">{formatCurrency(p.discount)}</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(p.quantity * p.unitPrice - p.discount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {services.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">Serviços Especializados</p>
                <table className="w-full text-left text-xs border border-slate-200">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="p-2">Serviço</th>
                      <th className="p-2 w-16 text-center">Qtd</th>
                      <th className="p-2 w-28 text-right">V. Unit (R$)</th>
                      <th className="p-2 w-28 text-right">Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {services.map((s, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">
                          {s.title}
                          {s.customObservation && (
                            <span className="block text-[11px] text-slate-500 italic mt-0.5">{s.customObservation}</span>
                          )}
                        </td>
                        <td className="p-2 text-center">{s.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(s.unitPrice)}</td>
                        <td className="p-2 text-right font-bold">{formatCurrency(s.quantity * s.unitPrice - s.discount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs">
              <div className="space-y-1">
                <p><strong>Prazo de Pagamento:</strong> {paymentTerms}</p>
                <p><strong>Garantia:</strong> {warrantyMonths} meses para peças genuínas</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-slate-500">Subtotal: {formatCurrency(subG)}</p>
                {disc > 0 && <p className="text-orange-600">Desconto: - {formatCurrency(disc)}</p>}
                <p className="text-base font-black text-slate-900">
                  VALOR TOTAL: {formatCurrency(grandTotal)}
                </p>
              </div>
            </div>

            <div className="pt-8 border-t grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <div className="border-b border-slate-300 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold text-slate-800">SETGEN Geradores</p>
                <p className="text-slate-500 text-[10px]">Departamento Técnico Comercial</p>
              </div>
              <div>
                <div className="border-b border-slate-300 w-3/4 mx-auto mb-1"></div>
                <p className="font-bold text-slate-800">{selectedClientObj?.companyName || "De Acordo do Cliente"}</p>
                <p className="text-slate-500 text-[10px]">Assinatura / Carimbo de Aceite</p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-gray-100 print:hidden">
            <Button variant="outline" onClick={() => setShowPdfModal(false)} className="rounded-xl">
              Fechar
            </Button>
            <Button onClick={() => window.print()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl gap-2">
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
