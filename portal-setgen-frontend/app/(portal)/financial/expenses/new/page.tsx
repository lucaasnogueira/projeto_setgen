'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseForm } from '@/components/financial/ExpenseForm';
import { expensesApi } from '@/lib/api/expenses';
import { clientsApi } from '@/lib/api/clients';
import { visitsApi } from '@/lib/api/visits';
import { ordersApi } from '@/lib/api/orders';
import { useToast } from '@/components/ui/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';

export default function NewExpensePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any>({
    categories: [],
    clients: [],
    visits: [],
    serviceOrders: []
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [categories, clients, visits, serviceOrders] = await Promise.all([
          expensesApi.getCategories(),
          clientsApi.getAll(),
          visitsApi.getAll(),
          ordersApi.getAll()
        ]);

        setData({
          categories,
          clients,
          visits,
          serviceOrders
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados necessários.',
          variant: 'destructive',
        });
      }
    }

    loadData();
  }, [toast]);

  const handleSubmit = async (expenseData: any) => {
    setIsLoading(true);
    try {
      const sanitizedData = {
        ...expenseData,
        costCenterId: expenseData.costCenterId || undefined,
        visitId: expenseData.visitId || undefined,
        serviceOrderId: expenseData.serviceOrderId || undefined,
        clientId: expenseData.clientId || undefined,
        paymentMethod: expenseData.paymentMethod || undefined,
        documentNumber: expenseData.documentNumber || undefined,
        notes: expenseData.notes || undefined,
        supplier: expenseData.supplier || undefined,
        totalInstallments: expenseData.totalInstallments ? Number(expenseData.totalInstallments) : undefined,
        installmentDaysOffsetsText: expenseData.installmentDaysOffsetsText || undefined,
      };

      await expensesApi.create(sanitizedData);
      toast({
        title: 'Sucesso',
        description: 'Despesa criada com sucesso!',
      });
      router.push('/financial/expenses');
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Não foi possível criar a despesa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Despesa"
        subtitle="Registre uma nova despesa ou conta a pagar no sistema financeiro"
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
        <ExpenseForm
          categories={data.categories}
          clients={data.clients}
          visits={data.visits}
          serviceOrders={data.serviceOrders}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
