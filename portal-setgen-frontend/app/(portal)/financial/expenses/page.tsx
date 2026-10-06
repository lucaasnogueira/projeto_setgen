"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { expensesApi } from "@/lib/api/expenses";
import { clientsApi } from "@/lib/api/clients";
import { visitsApi } from "@/lib/api/visits";
import { ordersApi } from "@/lib/api/orders";
import { Expense, FilterExpenseDto, ExpenseCategory, ExpenseStatus, ExpenseType } from "@/types/financial";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusCard } from "@/components/ui/status-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, RefreshCw, CheckCircle, Clock, DollarSign,
  AlertCircle, XCircle, Trash2, Edit2, FolderTree, Receipt, FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { ExpenseCategoriesManager, EXPENSE_TYPE_CONFIG } from "@/components/financial/ExpenseCategoriesManager";
import { ExpenseMultiCrudEditor } from "@/components/financial/ExpenseMultiCrudEditor";

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PARTIALLY_PAID: "bg-emerald-50 text-emerald-600 border-emerald-100",
  OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
  REJECTED: "bg-rose-50 text-rose-600 border-rose-100",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovada",
  PAID: "Paga",
  PARTIALLY_PAID: "Parcial",
  OVERDUE: "Atrasada",
  CANCELLED: "Cancelada",
  REJECTED: "Rejeitada",
};

type ViewMode = "list" | "categories" | "new" | "edit";

export default function ExpensesListPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [{ data }, cats, cls, vsts, ords] = await Promise.all([
        expensesApi.getAll({ page: 1, limit: 100 }),
        expensesApi.getCategories(),
        clientsApi.getAll().catch(() => []),
        visitsApi.getAll().catch(() => []),
        ordersApi.getAll().catch(() => []),
      ]);

      setExpenses(data);
      setCategories(cats);
      setClients(cls);
      setVisits(vsts);
      setServiceOrders(ords);
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
      toast.error("Não foi possível carregar os lançamentos de despesas.");
    } finally {
      setLoading(false);
    }
  };

  const reloadExpenses = async () => {
    try {
      const { data } = await expensesApi.getAll({ page: 1, limit: 100 });
      setExpenses(data);
    } catch (e) {
      console.error(e);
    }
  };

  const reloadCategories = async () => {
    try {
      const cats = await expensesApi.getCategories();
      setCategories(cats);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!window.confirm("Marcar esta despesa como paga hoje?")) return;
    try {
      await expensesApi.markAsPaid(id, { paymentDate: new Date().toISOString() });
      toast.success("Despesa marcada como paga com sucesso!");
      await reloadExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao marcar despesa como paga.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta despesa?")) return;
    try {
      await expensesApi.delete(id);
      toast.success("Despesa excluída com sucesso.");
      await reloadExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao excluir despesa.");
    }
  };

  const handleCreateExpenseSubmit = async (formData: any) => {
    try {
      await expensesApi.create(formData);
      toast.success("Despesa registrada com sucesso!");
      setViewMode("list");
      await reloadExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao registrar despesa.");
      throw error;
    }
  };

  const handleEditExpenseSubmit = async (formData: any) => {
    if (!editingExpense) return;
    try {
      await expensesApi.update(editingExpense.id, formData);
      toast.success("Despesa atualizada com sucesso!");
      setEditingExpense(null);
      setViewMode("list");
      await reloadExpenses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atualizar despesa.");
      throw error;
    }
  };

  // KPIs
  const totalPaid = expenses.filter((e) => e.status === ExpenseStatus.PAID).length;
  const totalPending = expenses.filter((e) => e.status === ExpenseStatus.PENDING || e.status === ExpenseStatus.APPROVED).length;
  const totalOverdue = expenses.filter((e) => e.status === ExpenseStatus.OVERDUE).length;

  const filteredExpenses = expenses.filter((e) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      e.description.toLowerCase().includes(term) ||
      e.code.toLowerCase().includes(term) ||
      (e.supplier && e.supplier.toLowerCase().includes(term)) ||
      (e.category && e.category.name.toLowerCase().includes(term));

    const matchesStatus = statusFilter === "ALL" || e.status === statusFilter;
    const matchesType = typeFilter === "ALL" || e.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-5">
      {/* 1. PageHeader Padrão Aurora Setgen */}
      <PageHeader
        title="Despesas & Contas a Pagar"
        subtitle={`${expenses.length} lançamentos financeiros de saídas registrados`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "categories" ? "default" : "outline"}
              onClick={() => setViewMode(viewMode === "categories" ? "list" : "categories")}
              className={`rounded-[9px] font-bold text-xs gap-1.5 h-9 ${
                viewMode === "categories"
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FolderTree className="h-4 w-4 text-[#E2661D]" />
              Tipos & Categorias (Multi-CRUD)
            </Button>

            <Button
              onClick={() => {
                setEditingExpense(null);
                setViewMode("new");
              }}
              className="rounded-[9px] font-bold text-xs gap-1.5 bg-[#E2661D] hover:bg-[#c95716] text-white h-9 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              Nova Despesa
            </Button>
          </div>
        }
      />

      {/* 2. 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Despesas" value={expenses.length} icon={DollarSign} variant="orange" />
        <StatusCard label="Pagas / Baixadas" value={totalPaid} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Aguardando Pagamento" value={totalPending} icon={Clock} variant="amber" />
        <StatusCard label="Despesas Atrasadas" value={totalOverdue} icon={AlertCircle} variant="red" />
      </div>

      {/* 3. MODO: CRIAÇÃO OU EDIÇÃO VIA MULTI-CRUD */}
      {(viewMode === "new" || viewMode === "edit") && (
        <ExpenseMultiCrudEditor
          categories={categories}
          clients={clients}
          visits={visits}
          serviceOrders={serviceOrders}
          initialData={editingExpense ? (editingExpense as any) : undefined}
          onSubmit={editingExpense ? handleEditExpenseSubmit : handleCreateExpenseSubmit}
          onCategoryCreated={reloadCategories}
          onCancel={() => {
            setEditingExpense(null);
            setViewMode("list");
          }}
        />
      )}

      {/* 4. MODO: MULTI-CRUD DE TIPOS E CATEGORIAS DE DESPESAS */}
      {viewMode === "categories" && (
        <ExpenseCategoriesManager onCategoryChange={reloadCategories} />
      )}

      {/* 5. MODO: TABELA PRINCIPAL DE DESPESAS */}
      {viewMode === "list" && (
        <Card className="overflow-hidden p-0 border border-gray-200 rounded-2xl shadow-xs bg-white">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b border-gray-200 bg-gray-50/50">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por descrição, código ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-gray-300 bg-white outline-none focus:ring-1 focus:ring-[#E2661D]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[170px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Tipo de despesa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Tipos</SelectItem>
                  {Object.entries(EXPENSE_TYPE_CONFIG).map(([k, cfg]) => (
                    <SelectItem key={k} value={k}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-9 text-xs bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os Status</SelectItem>
                  {Object.entries(statusLabels).map(([k, lbl]) => (
                    <SelectItem key={k} value={k}>
                      {lbl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={reloadExpenses}
                className="h-9 px-3 text-xs text-gray-700 bg-white"
                title="Recarregar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Tabela de Despesas */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Código / Descrição</TableHead>
                <TableHead>Tipo & Categoria</TableHead>
                <TableHead>Vínculo Operacional</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-28">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <RefreshCw className="animate-spin h-6 w-6 text-[#E2661D] mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableEmpty colSpan={7} message="Nenhuma despesa encontrada para os filtros selecionados." />
              ) : (
                filteredExpenses.map((expense) => {
                  const typeCfg = EXPENSE_TYPE_CONFIG[expense.type] || {
                    label: expense.type,
                    color: "bg-gray-50 text-gray-700",
                  };

                  return (
                    <TableRow key={expense.id} className="hover:bg-gray-50/70">
                      {/* Vencimento */}
                      <TableCell className="text-xs">
                        <div className="font-bold text-gray-900">
                          {format(new Date(expense.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Emissão: {format(new Date(expense.date), "dd/MM/yy", { locale: ptBR })}
                        </div>
                      </TableCell>

                      {/* Código e Descrição */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-[#E2661D]">
                            {expense.code}
                          </span>
                          {expense.isFixed && (
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded">
                              Fixa
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-gray-900 mt-0.5">
                          {expense.description}
                        </div>
                        {expense.supplier && (
                          <div className="text-[11px] text-gray-500">
                            Favorecido: {expense.supplier}
                          </div>
                        )}
                      </TableCell>

                      {/* Tipo & Categoria */}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: expense.category?.color || "#E2661D" }}
                          />
                          <span className="font-bold text-gray-800">
                            {expense.category?.name || "Sem categoria"}
                          </span>
                        </div>
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold ${typeCfg.color}`}>
                          {typeCfg.label}
                        </span>
                      </TableCell>

                      {/* Vínculo Operacional */}
                      <TableCell className="text-xs text-gray-600">
                        {expense.serviceOrder ? (
                          <div className="font-semibold text-[#E2661D] font-mono">
                            O.S. {expense.serviceOrder.orderNumber}
                          </div>
                        ) : expense.client ? (
                          <div className="font-medium text-gray-800 truncate max-w-[140px]">
                            {expense.client.companyName}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      {/* Valor */}
                      <TableCell className="text-xs font-black text-gray-900">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(expense.amount)}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-xs">
                        <Badge
                          variant="outline"
                          className={`font-bold text-[11px] px-2 py-0.5 border ${
                            statusColors[expense.status] || "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {statusLabels[expense.status] || expense.status}
                        </Badge>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right space-x-1">
                        {expense.status !== ExpenseStatus.PAID && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(expense.id)}
                            className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold"
                            title="Marcar como Paga"
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pagar
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingExpense(expense);
                            setViewMode("edit");
                          }}
                          className="h-7 w-7 p-0 text-gray-600 hover:text-[#E2661D]"
                          title="Editar Despesa"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                          className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                          title="Excluir Despesa"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
