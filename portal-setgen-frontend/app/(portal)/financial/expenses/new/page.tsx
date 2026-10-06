"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseMultiCrudEditor } from "@/components/financial/ExpenseMultiCrudEditor";
import { expensesApi } from "@/lib/api/expenses";
import { clientsApi } from "@/lib/api/clients";
import { visitsApi } from "@/lib/api/visits";
import { ordersApi } from "@/lib/api/orders";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    categories: [],
    clients: [],
    visits: [],
    serviceOrders: [],
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [categories, clients, visits, serviceOrders] = await Promise.all([
          expensesApi.getCategories(),
          clientsApi.getAll().catch(() => []),
          visitsApi.getAll().catch(() => []),
          ordersApi.getAll().catch(() => []),
        ]);

        setData({
          categories,
          clients,
          visits,
          serviceOrders,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Não foi possível carregar os dados necessários.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleSubmit = async (expenseData: any) => {
    try {
      await expensesApi.create(expenseData);
      toast.success("Despesa registrada com sucesso!");
      router.push("/financial/expenses");
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao criar despesa:", error);
      toast.error(error?.response?.data?.message || "Não foi possível criar a despesa.");
      throw error;
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nova Despesa"
        subtitle="Registre uma nova despesa ou conta a pagar no sistema financeiro"
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

      {loading ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-gray-200">
          <Loader2 className="h-7 w-7 animate-spin text-[#E2661D]" />
        </div>
      ) : (
        <ExpenseMultiCrudEditor
          categories={data.categories}
          clients={data.clients}
          visits={data.visits}
          serviceOrders={data.serviceOrders}
          onSubmit={handleSubmit}
          onCancel={() => router.push("/financial/expenses")}
        />
      )}
    </div>
  );
}
