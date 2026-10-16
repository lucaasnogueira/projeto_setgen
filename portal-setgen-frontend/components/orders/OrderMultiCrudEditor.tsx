"use client";

// =================================================================
// OrderMultiCrudEditor — Padrão Modular Setgen
// Horizontal Stepper + Layout Espaçoso (Zero Squeeze) + Resumo em Tempo Real + Modais Centralizados
// =================================================================

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Wrench,
  Calendar,
  CalendarDays,
  Package,
  ClipboardCheck,
  PenTool,
  Clock,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Users,
  Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ordersApi, CreateServiceOrderPayload } from "@/lib/api/orders";
import { quotesApi } from "@/lib/api/quotes";
import { Quote, QuoteStatus } from "@/types";
import { inventoryApi } from "@/lib/api/inventory";
import { usersApi, User } from "@/lib/api/users";
import { checklistTemplatesApi } from "@/lib/api/checklist-templates";
import {
  ServiceOrder,
  ChecklistTemplate,
  Product,
  ChecklistFieldType,
  ScheduleTask,
} from "@/types";
import { toDateInputValue, endOfBusinessDayISO } from "@/lib/date";

export const DEFAULT_TASK_TYPES = [
  "Preventiva Mecânica",
  "Corretiva Elétrica",
  "Inspeção Termográfica",
  "Comissionamento / Start-up",
  "Instalação / Cabeamento de Força",
  "Análise de Óleo / Coleta Laboratorial",
  "Treinamento Operacional",
  "Visita Técnica Diagnóstica",
  "Testes com Carga em Vazio",
  "Testes com Transferência em Carga Real",
];

// Componentes modulares comuns
import {
  HorizontalStepper,
  StepItem,
  WizardHeader,
  WizardFooter,
  SubEntityModal,
  CreatedSubEntity,
  MultiCrudInlineTable,
  MultiCrudItem,
  CatalogOption,
  FormLiveSummary,
  ModuleSwitcherModal,
} from "@/components/common";

const SignaturePad = dynamic(
  () => import("@/app/(portal)/orders/components/SignaturePad").then((m) => m.SignaturePad),
  { ssr: false }
);

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
  const [currentStep, setCurrentStep] = useState(1);

  // === 1. Planejamento & Prazos ===
  const [deadline, setDeadline] = useState(toDateInputValue(initialData?.deadline));
  const [responsibleIds, setResponsibleIds] = useState<string[]>(initialData?.responsibleIds || []);
  const [team, setTeam] = useState<string>((initialData?.requiredResources?.team || []).join(", "));
  const [priority, setPriority] = useState<"baixa" | "media" | "alta" | "urgente">("media");

  // === Cronograma & Tarefas Operacionais ===
  const [tasks, setTasks] = useState<ScheduleTask[]>(
    Array.isArray(initialData?.requiredResources?.schedule)
      ? initialData!.requiredResources.schedule
      : []
  );
  const [taskPresets, setTaskPresets] = useState<string[]>(DEFAULT_TASK_TYPES);
  const [fastTaskType, setFastTaskType] = useState<string>(DEFAULT_TASK_TYPES[0]);
  const [fastTaskDate, setFastTaskDate] = useState<string>(
    toDateInputValue(initialData?.deadline) || new Date().toISOString().split("T")[0]
  );
  const [fastTaskCollab, setFastTaskCollab] = useState<string>("");
  const [customTaskTypeInput, setCustomTaskTypeInput] = useState<string>("");
  const [showCustomTaskType, setShowCustomTaskType] = useState<boolean>(false);

  // === 2. Peças & Itens Multi-CRUD ===
  const [items, setItems] = useState<MultiCrudItem[]>(
    initialData?.items?.map((i) => ({
      id: i.productId,
      code: i.product?.code || "SKU-AUTO",
      name: i.product?.name || "Item do Estoque",
      category: (i.product as any)?.category || "Material",
      quantity: Number(i.quantity) || 1,
      unitPrice: Number(i.unitPrice) || 0,
      availableStock: i.product?.currentStock,
    })) || []
  );

  // === 3. Checklist ===
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialData?.checklistTemplateId || "");
  const [checklistItems, setChecklistItems] = useState<LocalChecklistItem[]>(
    (initialData?.checklist || []).map((c: any) => ({
      item: c.item || c.description || c.label || "Item",
      completed: !!c.completed,
    }))
  );

  // === 4. Assinatura & Horímetro ===
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [notes, setNotes] = useState(
    (initialData?.requiredResources as any)?.notes || (initialData as any)?.notes || ""
  );
  const [initialHorimeter, setInitialHorimeter] = useState("");
  const [finalHorimeter, setFinalHorimeter] = useState("");

  // === Vínculo com Orçamentos Aprovados ===
  const [quotesList, setQuotesList] = useState<Quote[]>([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>(quoteId || initialData?.quoteId || "");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Catálogos e listas auxiliares
  const [productsCatalog, setProductsCatalog] = useState<Product[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Modais centralizados
  const [isSubEntityModalOpen, setIsSubEntityModalOpen] = useState(false);
  const [isModuleSwitcherOpen, setIsModuleSwitcherOpen] = useState(false);

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
        if (u.length > 0 && !fastTaskCollab) {
          setFastTaskCollab(u[0].name);
        }
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
  }, [quoteId]);

  // Verificar Rascunho se for criação
  useEffect(() => {
    if (!orderId && typeof window !== "undefined") {
      const saved = localStorage.getItem("setgen_order_draft");
      if (saved) setDraftNotice(true);
    }
  }, [orderId]);

  const handleFastAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const nextCode = `TSK-${String(tasks.length + 1).padStart(2, "0")}`;
    const newTask: ScheduleTask = {
      code: nextCode,
      type: fastTaskType,
      date: fastTaskDate || deadline || new Date().toISOString().split("T")[0],
      collaboratorName: fastTaskCollab || (usersList[0]?.name ?? "Equipe Técnica Setgen"),
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleIncludeTask = () => {
    const nextCode = `TSK-${String(tasks.length + 1).padStart(2, "0")}`;
    setTasks((prev) => [
      ...prev,
      {
        code: nextCode,
        type: taskPresets[0] || "Execução Técnica",
        date: deadline || new Date().toISOString().split("T")[0],
        collaboratorName: usersList[0]?.name ?? "Equipe Técnica Setgen",
        completed: false,
      },
    ]);
  };

  const duplicateTask = (index: number) => {
    const item = tasks[index];
    const nextCode = `TSK-${String(tasks.length + 1).padStart(2, "0")}`;
    setTasks((prev) => [
      ...prev.slice(0, index + 1),
      { ...item, code: nextCode },
      ...prev.slice(index + 1),
    ]);
  };

  const handleAddCustomTaskType = () => {
    if (!customTaskTypeInput.trim()) return;
    const val = customTaskTypeInput.trim();
    if (!taskPresets.includes(val)) {
      setTaskPresets((prev) => [...prev, val]);
    }
    setFastTaskType(val);
    setCustomTaskTypeInput("");
    setShowCustomTaskType(false);
  };

  const restoreDraft = () => {
    try {
      const raw = localStorage.getItem("setgen_order_draft");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.deadline) setDeadline(d.deadline);
      if (d.responsibleIds) setResponsibleIds(d.responsibleIds);
      if (d.team) setTeam(d.team);
      if (d.items) setItems(d.items);
      if (Array.isArray(d.tasks)) setTasks(d.tasks);
      if (d.selectedTemplateId) setSelectedTemplateId(d.selectedTemplateId);
      if (d.notes) setNotes(d.notes);
      if (d.initialHorimeter) setInitialHorimeter(d.initialHorimeter);
      if (d.finalHorimeter) setFinalHorimeter(d.finalHorimeter);
      if (d.priority) setPriority(d.priority);
    } catch {
      // Ignora falha de parse
    } finally {
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
        deadline,
        responsibleIds,
        team,
        items,
        tasks,
        selectedTemplateId,
        notes,
        initialHorimeter,
        finalHorimeter,
        priority,
      })
    );
    alert("Rascunho da Ordem de Serviço salvo com sucesso!");
  };

  // Quando seleciona um orçamento
  const handleSelectQuote = async (id: string) => {
    setSelectedQuoteId(id);
    if (!id) {
      setSelectedQuote(null);
      return;
    }
    try {
      const q = await quotesApi.getById(id);
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
        setNotes((prev: string) => (prev ? `${prev}\n\nEscopo do Orçamento:\n${q.scope}` : q.scope));
      }

      // Auto-inicia atividade técnica se a lista estiver vazia
      if (tasks.length === 0) {
        setTasks([
          {
            code: "TSK-01",
            type: "Execução Técnica / Atendimento",
            date: q.validUntil ? toDateInputValue(q.validUntil) : new Date().toISOString().split("T")[0],
            collaboratorName: q.salesRep?.name || "Equipe Técnica Setgen",
            completed: false,
          },
        ]);
      }
    } catch (err) {
      console.error("Erro ao carregar orçamento selecionado:", err);
    }
  };

  // Callback ao criar sub-entidade centralizada
  const handleSubEntityCreated = (entity: CreatedSubEntity) => {
    if (entity.type === "part") {
      const newItem: MultiCrudItem = {
        id: entity.id,
        code: entity.code,
        name: entity.name,
        category: entity.category,
        quantity: 1,
        unitPrice: entity.unitPrice || 0,
        availableStock: entity.stockQty,
      };
      setItems((prev) => [...prev, newItem]);

      // Atualiza catálogo em memória
      setProductsCatalog((prev) => [
        ...prev,
        {
          id: entity.id,
          code: entity.code,
          name: entity.name,
          currentStock: entity.stockQty || 0,
          unitPrice: entity.unitPrice || 0,
        } as any,
      ]);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl && tmpl.fields) {
      setChecklistItems(
        tmpl.fields.map((f: any) => ({
          item: f.label || f.name,
          completed: false,
        }))
      );
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!deadline) e.deadline = "Data limite é obrigatória";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setCurrentStep(1);
      return;
    }
    setSaving(true);

    try {
      const teamArray = team.split(",").map((s) => s.trim()).filter(Boolean);
      const payload: CreateServiceOrderPayload = {
        quoteId: selectedQuoteId || quoteId || initialData?.quoteId || "",
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        requiredResources: {
          team: teamArray,
          schedule: tasks,
        },
        deadline: deadline ? endOfBusinessDayISO(deadline) : undefined,
        responsibleIds: responsibleIds.length > 0 ? responsibleIds : undefined,
        checklist: checklistItems.length > 0 ? checklistItems : undefined,
        checklistTemplateId: selectedTemplateId || undefined,
      };

      let result: ServiceOrder;
      if (orderId) {
        result = await ordersApi.update(orderId, {
          requiredResources: {
            team: teamArray,
            schedule: tasks,
          },
          deadline: deadline ? endOfBusinessDayISO(deadline) : undefined,
          responsibleIds: responsibleIds.length > 0 ? responsibleIds : undefined,
          checklist: checklistItems.map((c) => ({
            id: "",
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

      alert(orderId ? "Ordem de Serviço atualizada com sucesso!" : "Ordem de Serviço criada com sucesso!");
      onSuccess?.(result);
      onClose?.();
    } catch (err: any) {
      alert(`Erro: ${err?.response?.data?.message || err?.message || "Tente novamente."}`);
    } finally {
      setSaving(false);
    }
  };

  // Configuração das etapas do Stepper
  const steps: StepItem[] = [
    {
      id: 1,
      title: "Cronograma & Prazos",
      subtitle: tasks.length > 0 ? `${tasks.length} atividades no cronograma` : "Vínculo, prazos e cronograma",
      badge: "Etapa 1",
      isCompleted: Boolean(deadline),
    },
    {
      id: 2,
      title: "Peças & Almoxarifado",
      subtitle: `${items.length} peças alocadas`,
      badge: "Etapa 2",
      isCompleted: items.length > 0,
    },
    {
      id: 3,
      title: "Checklist Técnico",
      subtitle: `${checklistItems.filter((c) => c.completed).length}/${checklistItems.length} verificados`,
      badge: "Etapa 3",
      isCompleted: checklistItems.length > 0 && checklistItems.every((c) => c.completed),
    },
    {
      id: 4,
      title: "Fechamento & Assinatura",
      subtitle: signatureData ? "Assinatura coletada" : "Horímetro e validação",
      badge: "Etapa 4",
      isCompleted: Boolean(signatureData),
    },
  ];

  // Cálculo financeiro
  const materialCost = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const laborCost = responsibleIds.length * 350; // Estimativa padrão Setgen por técnico
  const totalCost = materialCost + laborCost;

  const catalogOptions: CatalogOption[] = productsCatalog.map((p) => ({
    id: p.id,
    code: p.code || "SKU-AUTO",
    name: p.name,
    unitPrice: Number(p.unitPrice) || 0,
    availableStock: p.currentStock || 0,
    category: "Almoxarifado",
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-[#E2661D]" />
          <span className="text-xs font-semibold text-slate-500">Carregando ambiente operacional...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* 1. Header Modular com Ações Rápidas */}
      <WizardHeader
        title={orderId ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
        subtitle="Gerencie o fluxo completo com requisição de peças, equipe de campo e checklist técnico."
        code={orderId ? `#OS-${orderId.slice(0, 6)}` : "OS-2026-0891"}
        statusBadge={orderId ? "Em Execução" : "Em Elaboração"}
        currentStep={currentStep}
        totalSteps={steps.length}
        onSaveDraft={handleSaveDraft}
        onDiscardDraft={discardDraft}
        extraActions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsModuleSwitcherOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Módulos</span>
          </Button>
        }
      />

      {/* 2. Top Stepper Horizontal (Sem aperto lateral) */}
      <HorizontalStepper
        steps={steps}
        currentStep={currentStep}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* Banner de Rascunho Detectado */}
      {draftNotice && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between text-xs text-amber-900 max-w-[1360px] mx-auto w-full">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            Existe um rascunho anterior desta Ordem de Serviço armazenado localmente. Deseja recuperá-lo?
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={discardDraft} className="text-amber-800 text-xs h-7">
              Descartar
            </Button>
            <Button size="sm" onClick={restoreDraft} className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7">
              Restaurar Dados
            </Button>
          </div>
        </div>
      )}

      {/* 3. Área Principal de Conteúdo em 2 Colunas Espaçosas */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Coluna Central do Formulário (8 colunas) */}
          <div className="lg:col-span-8 space-y-6">
            {/* ETAPA 1: PLANEJAMENTO & PRAZOS */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* Vínculo com Orçamento */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-[#E2661D]" />
                        Vincular Orçamento Aprovado
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Importe automaticamente dados de cliente, usina e peças aprovadas.
                      </p>
                    </div>
                    {selectedQuote && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Vinculado com Sucesso
                      </span>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                      Selecionar Orçamento do Cliente
                    </Label>
                    <select
                      value={selectedQuoteId}
                      onChange={(e) => handleSelectQuote(e.target.value)}
                      className="w-full h-11 rounded-xl border border-slate-200 text-sm bg-white px-3.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">Selecione um orçamento para importar dados automaticamente...</option>
                      {quotesList.map((q) => (
                        <option key={q.id} value={q.id}>
                          #{q.quoteNumber} — {q.client?.companyName} ({q.status === "ACCEPTED" ? "Aceito" : "Aprovado"})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedQuote && (
                    <div className="text-xs text-slate-700 bg-orange-50/60 p-4 rounded-xl border border-orange-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Cliente: <span className="text-[#E2661D]">{selectedQuote.client?.companyName}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {items.length} itens importados
                        </span>
                      </div>
                      {selectedQuote.scope && (
                        <p className="text-xs text-slate-600">
                          <strong>Escopo:</strong> {selectedQuote.scope}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Agendamento e Equipe */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#E2661D]" />
                      Agendamento & Equipe Técnica
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Defina o prazo de atendimento e aloque os profissionais responsáveis.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label htmlFor="deadline" className="text-xs font-bold text-slate-700 uppercase">
                        Data Limite de Conclusão *
                      </Label>
                      <Input
                        id="deadline"
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className={`h-11 ${errors.deadline ? "border-red-500 ring-1 ring-red-500" : ""}`}
                      />
                      {errors.deadline && (
                        <p className="text-xs text-red-600 font-semibold">{errors.deadline}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="priority" className="text-xs font-bold text-slate-700 uppercase">
                        Grau de Prioridade
                      </Label>
                      <select
                        id="priority"
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full h-11 rounded-xl border border-slate-200 text-sm bg-white px-3.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      >
                        <option value="baixa">Baixa (Rotina)</option>
                        <option value="media">Média (Padrão)</option>
                        <option value="alta">Alta (Prioritária)</option>
                        <option value="urgente">Urgente (Parada Crítica)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="team" className="text-xs font-bold text-slate-700 uppercase">
                      Equipe Complementar / Terceirizados
                    </Label>
                    <Input
                      id="team"
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      placeholder="Ex: Carlos Mecânico, Robson Apoio (separados por vírgula)"
                      className="h-11"
                    />
                  </div>

                  {/* Seleção de Técnicos Cadastrados */}
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-500" />
                      Técnicos Efetivos Setgen ({responsibleIds.length} selecionados)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-3 bg-slate-50/70 border border-slate-200 rounded-xl">
                      {usersList.map((u) => {
                        const isSelected = responsibleIds.includes(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs select-none ${
                              isSelected
                                ? "bg-orange-50 border border-orange-200 text-[#E2661D] font-bold"
                                : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setResponsibleIds((prev) => [...prev, u.id]);
                                } else {
                                  setResponsibleIds((prev) => prev.filter((id) => id !== u.id));
                                }
                              }}
                              className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                            <span className="truncate">{u.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Cronograma de Atividades Operacionais */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-[#E2661D]" />
                        Cronograma de Atividades & Tarefas ({tasks.length})
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Defina as etapas técnicas de campo, prazos específicos e técnicos responsáveis.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCustomTaskType(!showCustomTaskType)}
                        className="text-xs h-8 gap-1.5 border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5 text-orange-600" />
                        Novo Tipo de Tarefa
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleIncludeTask}
                        className="text-xs h-8 gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Incluir Atividade
                      </Button>
                    </div>
                  </div>

                  {/* Painel Inline para Novo Tipo de Tarefa */}
                  {showCustomTaskType && (
                    <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2 animate-in fade-in-50">
                      <Label className="text-xs font-bold text-orange-950 uppercase">
                        Cadastrar Novo Tipo de Tarefa / Etapa Técnica
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Ex: Alinhamento a Laser, Teste de Vibração, Megômetro"
                          value={customTaskTypeInput}
                          onChange={(e) => setCustomTaskTypeInput(e.target.value)}
                          className="h-9 text-xs bg-white flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomTaskType();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddCustomTaskType}
                          className="h-9 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs px-4"
                        >
                          Salvar Tipo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCustomTaskType(false)}
                          className="h-9 text-xs text-slate-500"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* BARRA DE ADIÇÃO RÁPIDA: TAREFAS */}
                  <form
                    onSubmit={handleFastAddTask}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2.5"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                        Tipo de Atividade Técnica
                      </span>
                      <select
                        value={fastTaskType}
                        onChange={(e) => setFastTaskType(e.target.value)}
                        className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white outline-none w-full font-medium"
                      >
                        {taskPresets.map((tp, idx) => (
                          <option key={idx} value={tp}>
                            {tp}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-36">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Data Prevista</span>
                      <Input
                        type="date"
                        value={fastTaskDate}
                        onChange={(e) => setFastTaskDate(e.target.value)}
                        className="h-9 text-xs bg-white rounded-lg border-slate-200"
                      />
                    </div>

                    <div className="w-48">
                      <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Técnico Responsável</span>
                      {usersList.length > 0 ? (
                        <select
                          value={fastTaskCollab}
                          onChange={(e) => setFastTaskCollab(e.target.value)}
                          className="h-9 px-2.5 text-xs rounded-lg border border-slate-200 bg-white outline-none w-full font-medium"
                        >
                          {usersList.map((u) => (
                            <option key={u.id} value={u.name}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          value={fastTaskCollab}
                          onChange={(e) => setFastTaskCollab(e.target.value)}
                          placeholder="Nome do técnico"
                          className="h-9 text-xs bg-white rounded-lg border-slate-200"
                        />
                      )}
                    </div>

                    <div className="self-end pt-3">
                      <Button
                        type="submit"
                        size="sm"
                        className="h-9 px-3.5 bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs gap-1 shadow-xs rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Adicionar ao Cronograma
                      </Button>
                    </div>
                  </form>

                  {/* LISTA / TABELA DE TAREFAS */}
                  {tasks.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">Nenhuma atividade no cronograma</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Adicione as etapas e datas previstas para guiar a equipe técnica em campo.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs bg-white">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                            <th className="py-2.5 px-3 w-24 font-semibold">Código</th>
                            <th className="py-2.5 px-3 font-semibold">Atividade / Tipo de Tarefa</th>
                            <th className="py-2.5 px-3 w-36 font-semibold">Data Prevista</th>
                            <th className="py-2.5 px-3 w-48 font-semibold">Técnico Responsável</th>
                            <th className="py-2.5 px-2 w-16 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tasks.map((t, i) => (
                            <tr key={i} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3 font-mono font-bold text-[#E2661D]">
                                <Input
                                  value={t.code}
                                  onChange={(e) => {
                                    const u = [...tasks];
                                    u[i].code = e.target.value;
                                    setTasks(u);
                                  }}
                                  className="h-8 text-xs font-mono font-bold bg-white rounded-lg border-slate-200 w-20"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={t.type}
                                  onChange={(e) => {
                                    const u = [...tasks];
                                    u[i].type = e.target.value;
                                    setTasks(u);
                                  }}
                                  className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold outline-none w-full"
                                >
                                  {taskPresets.map((tp, idx) => (
                                    <option key={idx} value={tp}>
                                      {tp}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  type="date"
                                  value={t.date}
                                  onChange={(e) => {
                                    const u = [...tasks];
                                    u[i].date = e.target.value;
                                    setTasks(u);
                                  }}
                                  className="h-8 text-xs bg-white rounded-lg border-slate-200 w-36"
                                />
                              </td>
                              <td className="py-2 px-3">
                                {usersList.length > 0 ? (
                                  <select
                                    value={t.collaboratorName || ""}
                                    onChange={(e) => {
                                      const u = [...tasks];
                                      u[i].collaboratorName = e.target.value;
                                      setTasks(u);
                                    }}
                                    className="h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs outline-none w-full font-medium"
                                  >
                                    <option value="">Técnico Responsável...</option>
                                    {usersList.map((u) => (
                                      <option key={u.id} value={u.name}>
                                        {u.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <Input
                                    value={t.collaboratorName || ""}
                                    onChange={(e) => {
                                      const u = [...tasks];
                                      u[i].collaboratorName = e.target.value;
                                      setTasks(u);
                                    }}
                                    placeholder="Técnico"
                                    className="h-8 text-xs bg-white rounded-lg border-slate-200"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => duplicateTask(i)}
                                    title="Duplicar atividade"
                                    className="text-slate-400 hover:text-[#E2661D] p-1 rounded"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setTasks(tasks.filter((_, j) => j !== i))}
                                    title="Excluir atividade"
                                    className="text-slate-400 hover:text-red-500 p-1 rounded"
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

            {/* ETAPA 2: PEÇAS & ALMOXARIFADO (MULTI-CRUD MODULAR) */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs animate-in fade-in-50 duration-200">
                <MultiCrudInlineTable
                  items={items}
                  onChange={(updated) => setItems(updated)}
                  catalogOptions={catalogOptions}
                  onOpenQuickCreateModal={() => setIsSubEntityModalOpen(true)}
                  title="Materiais e Peças da Ordem"
                  subtitle="Adicione itens do estoque à ordem de serviço com controle automático de saldo e custo."
                />
              </div>
            )}

            {/* ETAPA 3: CHECKLIST TÉCNICO */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4 animate-in fade-in-50 duration-200">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#E2661D]" />
                    Checklist Operacional & Inspeção
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selecione um procedimento padronizado de inspeção técnica ou marque os itens conferidos.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase mb-1.5 block">
                    Modelo de Checklist
                  </Label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full max-w-md h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">Selecione um checklist padrão...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {checklistItems.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 uppercase">
                        Itens de Verificação Obrigatória
                      </Label>
                      <span className="text-xs font-semibold text-slate-500">
                        {checklistItems.filter((c) => c.completed).length} de {checklistItems.length} concluídos
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                      {checklistItems.map((c, i) => (
                        <label
                          key={i}
                          className="flex items-center gap-3 py-2.5 text-xs sm:text-sm text-slate-800 cursor-pointer select-none"
                        >
                          <input
                            type="checkbox"
                            checked={c.completed}
                            onChange={(e) => {
                              const updated = [...checklistItems];
                              updated[i].completed = e.target.checked;
                              setChecklistItems(updated);
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                          />
                          <span className={c.completed ? "line-through text-slate-400" : "font-medium"}>
                            {c.item}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Selecione um template acima para carregar os itens de verificação.
                  </div>
                )}
              </div>
            )}

            {/* ETAPA 4: FECHAMENTO & ASSINATURA */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in-50 duration-200">
                {/* Horímetro e Notas */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="pb-3 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-[#E2661D]" />
                      Apontamento de Horímetro & Observações de Campo
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Registre as medições de operação e observações finais da execução.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <Label htmlFor="initialHorimeter" className="text-xs font-semibold text-gray-700">
                        Horímetro Inicial (Horas)
                      </Label>
                      <Input
                        id="initialHorimeter"
                        type="number"
                        placeholder="Ex: 1250.5"
                        value={initialHorimeter}
                        onChange={(e) => setInitialHorimeter(e.target.value)}
                        className="h-9 rounded-lg text-xs border-gray-200 bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="finalHorimeter" className="text-xs font-semibold text-gray-700">
                        Horímetro Final (Horas)
                      </Label>
                      <Input
                        id="finalHorimeter"
                        type="number"
                        placeholder="Ex: 1258.0"
                        value={finalHorimeter}
                        onChange={(e) => setFinalHorimeter(e.target.value)}
                        className="h-9 rounded-lg text-xs border-gray-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-semibold text-gray-700">
                      Relatório Técnico / Recomendações
                    </Label>
                    <textarea
                      id="notes"
                      rows={4}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Descreva as condições encontradas, testes realizados e orientações passadas ao cliente..."
                      className="w-full p-3 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] resize-none"
                    />
                  </div>
                </div>

                {/* Assinatura Digital do Responsável */}
                <div className="bg-white rounded-xl border border-gray-200/80 p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-[#E2661D]" />
                        Assinatura Digital de Entrega
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Coleta da assinatura do cliente ou técnico responsável no local.
                      </p>
                    </div>
                    {signatureData && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Assinatura Coletada
                      </span>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 max-w-xl">
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
          </div>

          {/* Coluna Direita: Resumo Operacional em Tempo Real (4 colunas) */}
          <div className="lg:col-span-4">
            <FormLiveSummary
              orderCode={orderId ? `#OS-${orderId.slice(0, 6)}` : "OS-2026-0891"}
              statusBadge={orderId ? "Em Execução" : "Em Elaboração"}
              clientName={selectedQuote?.client?.companyName || "Cliente a Definir"}
              plantName="Usina Central Solar"
              priority={priority}
              techniciansCount={responsibleIds.length}
              deadline={deadline || "Não definido"}
              breakdown={[
                { label: `Peças & Materiais (${items.length} un)`, amount: materialCost },
                { label: `Mão de Obra Técnica (${responsibleIds.length} téc)`, amount: laborCost },
                { label: "Deslocamento e Logística", amount: 150.0 },
              ]}
              totalAmount={totalCost + 150.0}
              currentStep={currentStep}
              totalSteps={steps.length}
              isAutoSaved={true}
            />
          </div>
        </div>
      </main>

      {/* 4. Rodapé Fixo de Navegação Modular */}
      <WizardFooter
        currentStep={currentStep}
        totalSteps={steps.length}
        stepName={steps[currentStep - 1]?.title}
        onPrev={() => setCurrentStep((s) => Math.max(1, s - 1))}
        onNext={() => setCurrentStep((s) => Math.min(steps.length, s + 1))}
        onSubmit={handleSave}
        onSaveDraft={handleSaveDraft}
        isSubmitting={saving}
        submitLabel={orderId ? "Salvar Alterações da O.S." : "Finalizar e Emitir Ordem de Serviço"}
      />

      {/* 5. Modal Centralizado: Nova Peça / Usina sem sair da tela */}
      <SubEntityModal
        open={isSubEntityModalOpen}
        onOpenChange={setIsSubEntityModalOpen}
        defaultType="part"
        onCreated={handleSubEntityCreated}
      />

      {/* 6. Modal Centralizado: Alternador Rápido de Módulos */}
      <ModuleSwitcherModal
        open={isModuleSwitcherOpen}
        onOpenChange={setIsModuleSwitcherOpen}
        currentModuleId="orders"
      />
    </div>
  );
}
