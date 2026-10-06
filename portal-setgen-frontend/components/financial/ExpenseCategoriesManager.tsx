"use client";

import React, { useState, useEffect } from "react";
import {
  FolderTree, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search,
  Tag, Palette, Sparkles, AlertCircle, RefreshCw, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { expensesApi } from "@/lib/api/expenses";
import { ExpenseCategory, ExpenseCategoryType, ExpenseGroup, ExpenseType } from "@/types/financial";
import { toast } from "sonner";

export const EXPENSE_TYPE_CONFIG: Record<ExpenseType, { label: string; color: string; description: string }> = {
  [ExpenseType.SERVICE]: {
    label: "Serviço Operacional",
    color: "bg-orange-50 text-[#E2661D] border-orange-200",
    description: "Despesas de atendimento em campo, peças, combustível, terceiros e viagens de O.S."
  },
  [ExpenseType.ADMINISTRATIVE]: {
    label: "Administrativa",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    description: "Custos de escritório, aluguel, energia, telefone, internet, software e materiais"
  },
  [ExpenseType.FINANCIAL]: {
    label: "Financeira",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    description: "Tarifas bancárias, juros de empréstimos, encargos e IOF"
  },
  [ExpenseType.TAX]: {
    label: "Tributária / Impostos",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    description: "DAS Simples Nacional, ICMS, ISS, GPS, PIS/COFINS e taxas municipais"
  },
  [ExpenseType.PAYROLL]: {
    label: "Folha de Pagamento",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    description: "Salários, adiantamentos, pró-labore, benefícios, FGTS e INSS"
  },
};

export const EXPENSE_CATEGORY_TYPE_CONFIG: Record<ExpenseCategoryType, { label: string }> = {
  [ExpenseCategoryType.OPERATIONAL]: { label: "Operacional (Campo & O.S.)" },
  [ExpenseCategoryType.ADMINISTRATIVE]: { label: "Administrativo" },
  [ExpenseCategoryType.FINANCIAL]: { label: "Financeiro" },
  [ExpenseCategoryType.TAX]: { label: "Tributário" },
  [ExpenseCategoryType.PAYROLL]: { label: "Folha de Pagamento" },
};

export const EXPENSE_GROUP_CONFIG: Record<ExpenseGroup, { label: string }> = {
  [ExpenseGroup.SERVICE_EXPENSES]: { label: "Despesas em Serviços / O.S." },
  [ExpenseGroup.SUPPLIERS_AND_PURCHASES]: { label: "Fornecedores e Compras" },
  [ExpenseGroup.MONTHLY_EXPENSES]: { label: "Despesas Mensais Fixas" },
  [ExpenseGroup.PRO_LABORE]: { label: "Pró-Labore & Sócios" },
  [ExpenseGroup.FINANCIAL_COMMITMENTS]: { label: "Compromissos Financeiros" },
  [ExpenseGroup.TAXES]: { label: "Impostos & Tributos" },
  [ExpenseGroup.BANK_DISBURSEMENTS]: { label: "Desembolsos Bancários" },
};

const PRESET_COLORS = [
  "#E2661D", "#2563EB", "#059669", "#D97706",
  "#7C3AED", "#DB2777", "#DC2626", "#4B5563"
];

interface ExpenseCategoriesManagerProps {
  onCategoryChange?: () => void;
}

export function ExpenseCategoriesManager({ onCategoryChange }: ExpenseCategoriesManagerProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<ExpenseCategoryType>(ExpenseCategoryType.OPERATIONAL);
  const [group, setGroup] = useState<ExpenseGroup>(ExpenseGroup.SERVICE_EXPENSES);
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#E2661D");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await expensesApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast.error("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setCode("");
    setType(ExpenseCategoryType.OPERATIONAL);
    setGroup(ExpenseGroup.SERVICE_EXPENSES);
    setDescription("");
    setColor("#E2661D");
    setModalOpen(true);
  };

  const openEditModal = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
    setCode(cat.code);
    setType(cat.type);
    setGroup(cat.group);
    setDescription(cat.description || "");
    setColor(cat.color || "#E2661D");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("O nome da categoria é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      if (editingCategory) {
        await expensesApi.updateCategory(editingCategory.id, {
          name: name.trim(),
          code: code.trim() || undefined,
          type,
          group,
          description: description.trim() || undefined,
          color,
        });
        toast.success("Categoria atualizada com sucesso!");
      } else {
        await expensesApi.createCategory({
          name: name.trim(),
          code: code.trim() || undefined,
          type,
          group,
          description: description.trim() || undefined,
          color,
          isActive: true,
        });
        toast.success("Categoria criada com sucesso!");
      }

      setModalOpen(false);
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Erro ao salvar categoria:", error);
      toast.error(error?.response?.data?.message || "Erro ao salvar categoria.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: ExpenseCategory) => {
    if (!window.confirm(`Deseja realmente remover/desativar a categoria "${cat.name}"?`)) {
      return;
    }

    try {
      await expensesApi.deleteCategory(cat.id);
      toast.success("Categoria removida ou desativada.");
      await loadCategories();
      onCategoryChange?.();
    } catch (error: any) {
      console.error("Erro ao excluir categoria:", error);
      toast.error(error?.response?.data?.message || "Erro ao excluir categoria.");
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === "ALL" || cat.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE TIPOS DE DESPESAS (NATUREZA FINANCEIRA) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-5 w-5 text-[#E2661D]" />
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 leading-tight">
              Tipos de Despesas (Naturezas Operacionais & Fiscais)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Classificação estrutural do fluxo financeiro da Setgen utilizada no DRE, fluxo de caixa e centros de custo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {Object.entries(EXPENSE_TYPE_CONFIG).map(([key, config]) => {
            const count = categories.filter((c) => c.type === (key as any)).length;
            return (
              <div
                key={key}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${config.color}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{config.label}</span>
                    <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-white/80 shadow-xs">
                      {count} categorias
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 mt-2 leading-relaxed">
                    {config.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MULTI-CRUD DE CATEGORIAS DE DESPESAS */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-[#E2661D]" />
              Categorias de Despesas
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie subcategorias personalizadas para alocação rápida nos lançamentos e contas a pagar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={openCreateModal}
              className="bg-[#E2661D] hover:bg-[#c95716] text-white text-xs font-bold h-9 rounded-lg gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="px-5 py-3 bg-gray-50/60 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar categoria ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8 pl-9 pr-3 text-xs rounded-lg border border-gray-300 bg-white outline-none focus:ring-1 focus:ring-[#E2661D]"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Filtrar por Tipo:</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] h-8 text-xs bg-white">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Tipos</SelectItem>
                {Object.entries(EXPENSE_CATEGORY_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Categorias */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Cor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Tipo Estrutural</TableHead>
              <TableHead>Grupo de Despesa</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <RefreshCw className="animate-spin h-5 w-5 text-[#E2661D] mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableEmpty colSpan={7} message="Nenhuma categoria de despesa encontrada." />
            ) : (
              filteredCategories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-gray-50/70">
                  <TableCell>
                    <div
                      className="w-5 h-5 rounded-full border border-gray-200 shadow-xs"
                      style={{ backgroundColor: cat.color || "#E2661D" }}
                    />
                  </TableCell>
                  <TableCell className="font-bold text-gray-900 text-xs">
                    {cat.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-600">
                    <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                      {cat.code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="font-medium text-gray-700">
                      {EXPENSE_CATEGORY_TYPE_CONFIG[cat.type]?.label || cat.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {EXPENSE_GROUP_CONFIG[cat.group]?.label || cat.group}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {cat.description || "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(cat)}
                      className="h-7 w-7 p-0 text-gray-600 hover:text-[#E2661D]"
                      title="Editar Categoria"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cat)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      title="Excluir Categoria"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CATEGORIA */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl border shadow-xl">
          <DialogHeader className="pb-3 border-b border-gray-100">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-[#E2661D]" />
              {editingCategory ? "Editar Categoria de Despesa" : "Nova Categoria de Despesa"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure nome, código, natureza operacional e cor identificadora.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-gray-700">Nome da Categoria *</Label>
              <Input
                required
                placeholder="Ex: Combustível Frota, Alimentação Técnica..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs mt-1"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-gray-700">Código da Categoria</Label>
                <Input
                  placeholder="Ex: COMB, REFE..."
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-9 text-xs font-mono mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-700">Tipo Operacional *</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger className="h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_TYPE_CONFIG).map(([k, cfg]) => (
                      <SelectItem key={k} value={k}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Grupo de Agrupamento</Label>
              <Select value={group} onValueChange={(val: any) => setGroup(val)}>
                <SelectTrigger className="h-9 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_GROUP_CONFIG).map(([k, cfg]) => (
                    <SelectItem key={k} value={k}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Cor de Identificação</Label>
              <div className="flex items-center gap-2 mt-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      color === c ? "border-gray-900 scale-110 shadow-sm" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-7 h-7 rounded border p-0 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-gray-700">Descrição / Observações</Label>
              <Input
                placeholder="Ex: Despesas gerais de transporte da equipe técnica..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-8 text-xs font-semibold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="h-8 text-xs font-bold bg-[#E2661D] hover:bg-[#c95716] text-white"
              >
                {saving ? "Salvando..." : editingCategory ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
