"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ExpenseMultiCrudEditor } from "@/components/financial/ExpenseMultiCrudEditor";
import { expensesApi } from "@/lib/api/expenses";
import { clientsApi } from "@/lib/api/clients";
import { visitsApi } from "@/lib/api/visits";
import { ordersApi } from "@/lib/api/orders";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toDateInputValue } from "@/lib/date";
import { toast } from "sonner";

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState<any>(null);
  const [data, setData] = useState<any>({
    categories: [],
    clients: [],
    visits: [],
    serviceOrders: [],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const id = params?.id as string;
        if (!id) return;

        const [expenseData, categories, clients, visits, serviceOrders] = await Promise.all([
          expensesApi.getOne(id),
          expensesApi.getCategories(),
          clientsApi.getAll().catch(() => []),
          visitsApi.getAll().catch(() => []),
          ordersApi.getAll().catch(() => []),
        ]);

        setExpense(expenseData);
        setData({
          categories,
          clients,
          visits,
          serviceOrders,
        });
      } catch (error) {
        console.error("Erro ao carregar dados da despesa:", error);
        toast.error("Não foi possível carregar os dados da despesa.");
        router.push("/financial/expenses");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params?.id, router]);

  const handleSubmit = async (expenseData: any) => {
    try {
      const id = params?.id as string;
      await expensesApi.update(id, expenseData);
      toast.success("Despesa atualizada com sucesso!");
      router.push("/financial/expenses");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao atualizar despesa:", error);
      toast.error(error?.response?.data?.message || "Não foi possível atualizar a despesa.");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-gray-200">
        <Loader2 className="h-7 w-7 animate-spin text-[#E2661D]" />
      </div>
    );
  }

  const formattedInitialData = expense ? {
    ...expense,
    amount: Number(expense.amount),
    date: toDateInputValue(expense.date),
    dueDate: toDateInputValue(expense.dueDate),
    competenceDate: toDateInputValue(expense.competenceDate),
  } : undefined;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Editar Despesa: ${expense?.code || ""}`}
        subtitle={`Atualize as informações do lançamento financeiro`}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/financial/expenses")}
            className="rounded-[9px] font-bold text-xs gap-1.5 h-9"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Despesas
          </Button>
        }
      />

      <ExpenseMultiCrudEditor
        categories={data.categories}
        clients={data.clients}
        visits={data.visits}
        serviceOrders={data.serviceOrders}
        initialData={formattedInitialData}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/financial/expenses")}
      />
    </div>
  );
}
