"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  DollarSign, Calendar, Tag, FileText, User, Receipt, Info,
  Plus, CheckCircle2, Clock, Building2, Wrench, Shield, ChevronRight,
  Layers, AlertCircle, Save, Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ExpenseType, PaymentMethod, ExpenseCategory, ExpenseCategoryType, ExpenseGroup } from "@/types/financial";
import { expensesApi } from "@/lib/api/expenses";
import { toDateInputValue } from "@/lib/date";
import { toast } from "sonner";
import { EXPENSE_TYPE_CONFIG } from "./ExpenseCategoriesManager";

const expenseSchema = z.object({
  description: z.string().min(3, "Descrição deve ter no mínimo 3 caracteres"),
  type: z.nativeEnum(ExpenseType),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  competenceDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  costCenterId: z.string().optional(),
  visitId: z.string().optional(),
  serviceOrderId: z.string().optional(),
  clientId: z.string().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  documentNumber: z.string().optional(),
  notes: z.string().optional(),
  supplier: z.string().optional(),
  isFixed: z.boolean(),
  totalInstallments: z.number().min(1).optional(),
  installmentDaysOffsetsText: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseMultiCrudEditorProps {
  categories: ExpenseCategory[];
  clients?: any[];
  visits?: any[];
  serviceOrders?: any[];
  onSubmit: (data: any) => Promise<void>;
  initialData?: Partial<ExpenseFormValues>;
  isLoading?: boolean;
  onCategoryCreated?: () => void;
  onCancel?: () => void;
}

type TabKey = "dados" | "prazos" | "vinculos";

export function ExpenseMultiCrudEditor({
  categories: initialCategories,
  clients = [],
  visits = [],
  serviceOrders = [],
  onSubmit,
  initialData,
  isLoading = false,
  onCategoryCreated,
  onCancel,
}: ExpenseMultiCrudEditorProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("dados");
  const [categoriesList, setCategoriesList] = useState<ExpenseCategory[]>(initialCategories);

  // Modal para cadastro rápido de nova categoria (+) sem sair da tela
  const [quickCatOpen, setQuickCatOpen] = useState(false);
  const [quickCatName, setQuickCatName] = useState("");
  const [quickCatCode, setQuickCatCode] = useState("");
  const [quickCatType, setQuickCatType] = useState<ExpenseCategoryType>(ExpenseCategoryType.OPERATIONAL);
  const [quickCatSaving, setQuickCatSaving] = useState(false);

  useEffect(() => {
    setCategoriesList(initialCategories);
  }, [initialCategories]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      type: initialData?.type || ExpenseType.SERVICE,
      date: initialData?.date || toDateInputValue(new Date()),
      dueDate: initialData?.dueDate || toDateInputValue(new Date()),
      competenceDate: initialData?.competenceDate || toDateInputValue(new Date()),
      isFixed: initialData?.isFixed === undefined ? false : initialData.isFixed,
      amount: initialData?.amount || 0,
      description: initialData?.description || "",
      categoryId: initialData?.categoryId || "",
      costCenterId: initialData?.costCenterId || "",
      visitId: initialData?.visitId || "",
      serviceOrderId: initialData?.serviceOrderId || "",
      clientId: initialData?.clientId || "",
      documentNumber: initialData?.documentNumber || "",
      notes: initialData?.notes || "",
      supplier: initialData?.supplier || "",
      totalInstallments: initialData?.totalInstallments || 1,
      installmentDaysOffsetsText: initialData?.installmentDaysOffsetsText || "",
      ...initialData,
    },
  });

  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = form;
  const currentExpenseType = watch("type");
  const isFixed = watch("isFixed");
  const selectedCategoryId = watch("categoryId");

  // Filtra categorias sugeridas conforme o tipo de despesa selecionado
  const filteredCategories = categoriesList.filter((c) => {
    if (!c.isActive) return false;
    // Mapeamento inteligente de categoria correspondente ao tipo
    if (currentExpenseType === ExpenseType.SERVICE) return c.type === ExpenseCategoryType.OPERATIONAL;
    if (currentExpenseType === ExpenseType.ADMINISTRATIVE) return c.type === ExpenseCategoryType.ADMINISTRATIVE;
    if (currentExpenseType === ExpenseType.FINANCIAL) return c.type === ExpenseCategoryType.FINANCIAL;
    if (currentExpenseType === ExpenseType.TAX) return c.type === ExpenseCategoryType.TAX;
    if (currentExpenseType === ExpenseType.PAYROLL) return c.type === ExpenseCategoryType.PAYROLL;
    return true;
  });

  // Se não encontrar nenhuma para o filtro exato, exibe todas
  const displayedCategories = filteredCategories.length > 0 ? filteredCategories : categoriesList;

  const handleQuickCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCatName.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }

    setQuickCatSaving(true);
    try {
      const created = await expensesApi.createCategory({
        name: quickCatName.trim(),
        code: quickCatCode.trim() || undefined,
        type: quickCatType,
        group: ExpenseGroup.SERVICE_EXPENSES,
        isActive: true,
      });

      setCategoriesList((prev) => [...prev, created]);
      setValue("categoryId", created.id);
      setQuickCatOpen(false);
      setQuickCatName("");
      setQuickCatCode("");
      toast.success(`Categoria "${created.name}" criada e selecionada!`);
      onCategoryCreated?.();
    } catch (err: any) {
      console.error("Erro ao criar categoria rápida:", err);
      toast.error(err?.response?.data?.message || "Erro ao criar categoria.");
    } finally {
      setQuickCatSaving(false);
    }
  };

  const onFormSubmit = async (data: ExpenseFormValues) => {
    const { installmentDaysOffsetsText, ...rest } = data;
    const installmentDaysOffsets = installmentDaysOffsetsText
      ?.split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .map(Number);

    await onSubmit({
      ...rest,
      amount: Number(rest.amount),
      costCenterId: rest.costCenterId || undefined,
      visitId: rest.visitId || undefined,
      serviceOrderId: rest.serviceOrderId || undefined,
      clientId: rest.clientId || undefined,
      paymentMethod: rest.paymentMethod || undefined,
      documentNumber: rest.documentNumber || undefined,
      notes: rest.notes || undefined,
      supplier: rest.supplier || undefined,
      totalInstallments: rest.totalInstallments ? Number(rest.totalInstallments) : undefined,
      ...(installmentDaysOffsets?.length ? { installmentDaysOffsets } : {}),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
      {/* 1. Header do Multi-CRUD */}
      <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/80 to-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200/60 flex items-center justify-center text-[#E2661D]">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {initialData ? "Editar Lançamento de Despesa" : "Novo Lançamento de Despesa"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estruturação e rateio operacional com classificação rápida por tipos e categorias
            </p>
          </div>
        </div>

        {/* Abas Superiores Padrão Setgen */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl border border-gray-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("dados")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "dados"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            1. Dados & Valores
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prazos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "prazos"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            2. Vencimento & Parcelas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("vinculos")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "vinculos"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            3. Vínculos Operacionais
          </button>
        </div>
      </div>

      {/* 2. Formulário Principal */}
      <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
        {/* ABA 1: DADOS & CLASSIFICAÇÃO */}
        {activeTab === "dados" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Card de Tipo de Despesa com Visual Moderno */}
            <div>
              <Label className="text-xs font-bold text-gray-700 block mb-2">
                Tipo de Despesa (Natureza Financeira) *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {Object.entries(EXPENSE_TYPE_CONFIG).map(([typeKey, cfg]) => {
                  const isSelected = currentExpenseType === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setValue("type", typeKey as ExpenseType)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-[#E2661D] bg-orange-50/70 shadow-xs ring-1 ring-[#E2661D]"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? "text-[#E2661D]" : "text-gray-800"}`}>
                          {cfg.label}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#E2661D]" />}
                      </div>
                      <p className="text-[10.5px] text-gray-500 line-clamp-2 leading-tight">
                        {cfg.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              {errors.type && <p className="text-xs font-semibold text-red-600 mt-1">{errors.type.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Categoria com Botão Inline (+) */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-bold text-gray-700">Categoria de Despesa *</Label>
                  <button
                    type="button"
                    onClick={() => {
                      setQuickCatType(
                        currentExpenseType === ExpenseType.SERVICE
                          ? ExpenseCategoryType.OPERATIONAL
                          : currentExpenseType === ExpenseType.ADMINISTRATIVE
                          ? ExpenseCategoryType.ADMINISTRATIVE
                          : currentExpenseType === ExpenseType.FINANCIAL
                          ? ExpenseCategoryType.FINANCIAL
                          : currentExpenseType === ExpenseType.TAX
                          ? ExpenseCategoryType.TAX
                          : ExpenseCategoryType.PAYROLL
                      );
                      setQuickCatOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E2661D] hover:text-[#c95716] bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Nova Categoria
                  </button>
                </div>

                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-xs rounded-lg mt-1 bg-white">
                        <SelectValue placeholder="Selecione a categoria..." />
                      </SelectTrigger>
                      <SelectContent>
                        {displayedCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: cat.color || "#E2661D" }}
                              />
                              <span>{cat.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({cat.code})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && <p className="text-xs font-semibold text-red-600 mt-1">{errors.categoryId.message}</p>}
              </div>

              {/* Valor */}
              <div>
                <Label htmlFor="amount" className="text-xs font-bold text-gray-700">
                  Valor da Despesa (R$) *
                </Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="h-9 pl-8 text-xs font-semibold rounded-lg"
                    {...register("amount", { valueAsNumber: true })}
                  />
                </div>
                {errors.amount && <p className="text-xs font-semibold text-red-600 mt-1">{errors.amount.message}</p>}
              </div>

              {/* Descrição Curta */}
              <div>
                <Label htmlFor="description" className="text-xs font-bold text-gray-700">
                  Descrição do Lançamento *
                </Label>
                <Input
                  id="description"
                  placeholder="Ex: Abastecimento Gerador Stemac, Compra de Filtro..."
                  className="h-9 text-xs rounded-lg mt-1"
                  {...register("description")}
                />
                {errors.description && <p className="text-xs font-semibold text-red-600 mt-1">{errors.description.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Fornecedor / Favorecido */}
              <div>
                <Label htmlFor="supplier" className="text-xs font-bold text-gray-700">Fornecedor / Favorecido</Label>
                <Input
                  id="supplier"
                  placeholder="Ex: Posto Equador, Distribuidora XYZ"
                  className="h-9 text-xs rounded-lg mt-1"
                  {...register("supplier")}
                />
              </div>

              {/* Nº Documento / Nota Fiscal */}
              <div>
                <Label htmlFor="documentNumber" className="text-xs font-bold text-gray-700">Nº Documento / NF / Recibo</Label>
                <Input
                  id="documentNumber"
                  placeholder="Ex: NF-e 88912, Cupom 442"
                  className="h-9 text-xs rounded-lg mt-1 font-mono"
                  {...register("documentNumber")}
                />
              </div>

              {/* Forma de Pagamento */}
              <div>
                <Label className="text-xs font-bold text-gray-700">Forma de Pagamento</Label>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-9 text-xs rounded-lg mt-1 bg-white">
                        <SelectValue placeholder="Selecione a forma..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PaymentMethod.PIX}>PIX</SelectItem>
                        <SelectItem value={PaymentMethod.BANK_SLIP}>Boleto Bancário</SelectItem>
                        <SelectItem value={PaymentMethod.CREDIT_CARD}>Cartão de Crédito</SelectItem>
                        <SelectItem value={PaymentMethod.DEBIT_CARD}>Cartão de Débito</SelectItem>
                        <SelectItem value={PaymentMethod.BANK_TRANSFER}>Transferência / TED</SelectItem>
                        <SelectItem value={PaymentMethod.CASH}>Dinheiro</SelectItem>
                        <SelectItem value={PaymentMethod.CHECK}>Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: VENCIMENTO & PARCELAS */}
        {activeTab === "prazos" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date" className="text-xs font-bold text-gray-700">Data da Despesa / Emissão *</Label>
                <Input type="date" className="h-9 text-xs rounded-lg mt-1" {...register("date")} />
                {errors.date && <p className="text-xs font-semibold text-red-600 mt-1">{errors.date.message}</p>}
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-xs font-bold text-gray-700">Data de Vencimento *</Label>
                <Input type="date" className="h-9 text-xs rounded-lg mt-1 font-semibold text-[#E2661D]" {...register("dueDate")} />
                {errors.dueDate && <p className="text-xs font-semibold text-red-600 mt-1">{errors.dueDate.message}</p>}
              </div>

              <div>
                <Label htmlFor="competenceDate" className="text-xs font-bold text-gray-700">Mês de Competência *</Label>
                <Input type="date" className="h-9 text-xs rounded-lg mt-1" {...register("competenceDate")} />
                <p className="text-[10px] text-gray-400 mt-0.5">Referência contábil no DRE mensal</p>
              </div>
            </div>

            {/* Configuração de Parcelamento e Recorrência */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFixed"
                  className="w-4 h-4 rounded border-gray-300 text-[#E2661D] focus:ring-[#E2661D] cursor-pointer"
                  {...register("isFixed")}
                />
                <label htmlFor="isFixed" className="text-xs font-bold text-gray-800 cursor-pointer select-none">
                  Despesa Parcelada ou Recorrente / Fixa
                </label>
              </div>

              {isFixed && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 animate-in fade-in">
                  <div>
                    <Label htmlFor="totalInstallments" className="text-xs font-bold text-gray-700">
                      Total de Parcelas
                    </Label>
                    <Input
                      id="totalInstallments"
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Ex: 3"
                      className="h-9 text-xs rounded-lg mt-1 bg-white"
                      {...register("totalInstallments", { valueAsNumber: true })}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="installmentDaysOffsetsText" className="text-xs font-bold text-gray-700">
                      Vencimentos Específicos (Dias corridos)
                    </Label>
                    <Input
                      id="installmentDaysOffsetsText"
                      placeholder="Ex: 15,30,45,60 (deixe vazio p/ intervalo mensal padrão)"
                      className="h-9 text-xs rounded-lg mt-1 bg-white font-mono"
                      {...register("installmentDaysOffsetsText")}
                    />
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Offsets a partir da data de emissão para cada parcela subsequente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA 3: VÍNCULOS OPERACIONAIS */}
        {activeTab === "vinculos" && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="p-4 rounded-xl border border-orange-200/70 bg-orange-50/40">
              <div className="flex items-center gap-2 mb-3">
                <Wrench className="w-4 h-4 text-[#E2661D]" />
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Vínculo com Operação em Campo & O.S. (DRE Automático)
                </h4>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Ao associar uma O.S. ou visita técnica, este lançamento é debitado diretamente no DRE da ordem de serviço.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Cliente */}
                <div>
                  <Label className="text-xs font-bold text-gray-700">Cliente Solicitante</Label>
                  <Controller
                    name="clientId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-9 text-xs rounded-lg mt-1 bg-white">
                          <SelectValue placeholder="Nenhum (Despesa interna)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum (Despesa interna)</SelectItem>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Ordem de Serviço */}
                <div>
                  <Label className="text-xs font-bold text-gray-700">Ordem de Serviço (O.S.)</Label>
                  <Controller
                    name="serviceOrderId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-9 text-xs rounded-lg mt-1 bg-white font-mono">
                          <SelectValue placeholder="Selecione a O.S..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma O.S. vinculada</SelectItem>
                          {serviceOrders.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.orderNumber} - {o.client?.companyName || "Cliente"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Visita Técnica */}
                <div>
                  <Label className="text-xs font-bold text-gray-700">Visita Técnica</Label>
                  <Controller
                    name="visitId"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="h-9 text-xs rounded-lg mt-1 bg-white">
                          <SelectValue placeholder="Selecione a visita..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhuma visita vinculada</SelectItem>
                          {visits.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.location} ({new Date(v.visitDate).toLocaleDateString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Observações Gerais */}
            <div>
              <Label htmlFor="notes" className="text-xs font-bold text-gray-700">Observações & Anotações Internas</Label>
              <textarea
                id="notes"
                rows={3}
                placeholder="Insira detalhes adicionais, justificativas ou notas fiscais anexadas..."
                className="w-full text-xs rounded-xl border border-gray-300 bg-white p-3 mt-1 outline-none focus:ring-1 focus:ring-[#E2661D]"
                {...register("notes")}
              />
            </div>
          </div>
        )}

        {/* 3. Rodapé de Ações Fixo / Limpo */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== "dados" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(activeTab === "vinculos" ? "prazos" : "dados")}
                className="text-xs h-9 font-semibold"
              >
                Voltar
              </Button>
            )}
            {activeTab !== "vinculos" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab(activeTab === "dados" ? "prazos" : "vinculos")}
                className="text-xs h-9 font-semibold gap-1 text-[#E2661D] hover:bg-orange-50 border-orange-200"
              >
                Avançar <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold h-9 px-5 rounded-xl shadow-xs gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Despesa
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* MODAL DE CADASTRO RÁPIDO DE CATEGORIA (+) */}
      <Dialog open={quickCatOpen} onOpenChange={setQuickCatOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border shadow-xl">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#E2661D]" />
              Criar Nova Categoria de Despesa
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Crie a categoria sem sair do formulário de despesa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickCreateCategory} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Nome da Categoria *</Label>
              <Input
                required
                placeholder="Ex: Peças Emergenciais, Alimentação Técnica..."
                value={quickCatName}
                onChange={(e) => setQuickCatName(e.target.value)}
                className="h-9 text-xs mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Código</Label>
                <Input
                  placeholder="Ex: PEC, ALIM..."
                  value={quickCatCode}
                  onChange={(e) => setQuickCatCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Tipo *</Label>
                <Select value={quickCatType} onValueChange={(v: any) => setQuickCatType(v)}>
                  <SelectTrigger className="h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ExpenseCategoryType.OPERATIONAL}>Operacional</SelectItem>
                    <SelectItem value={ExpenseCategoryType.ADMINISTRATIVE}>Administrativo</SelectItem>
                    <SelectItem value={ExpenseCategoryType.FINANCIAL}>Financeiro</SelectItem>
                    <SelectItem value={ExpenseCategoryType.TAX}>Tributário</SelectItem>
                    <SelectItem value={ExpenseCategoryType.PAYROLL}>Folha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickCatOpen(false)}
                className="h-8 text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={quickCatSaving}
                className="h-8 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white"
              >
                {quickCatSaving ? "Salvando..." : "Criar e Selecionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

