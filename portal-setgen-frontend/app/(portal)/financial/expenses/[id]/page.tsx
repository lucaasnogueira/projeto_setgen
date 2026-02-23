'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ExpenseForm } from '@/components/financial/ExpenseForm';
import { expensesApi } from '@/lib/api/expenses';
import { clientsApi } from '@/lib/api/clients';
import { visitsApi } from '@/lib/api/visits';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ExpenseCategory } from '@/types/financial';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams(); // params.id should be the ID
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [expense, setExpense] = useState<any>(null);
  const [data, setData] = useState<any>({
    categories: [],
    clients: [],
    visits: [],
    serviceOrders: [],
    bankAccounts: []
  });

  useEffect(() => {
    async function loadData() {
      try {
        const id = params?.id as string;
        if (!id) return;

        const [expenseData, categories, clients, visits, serviceOrders, bankAccounts] = await Promise.all([
            expensesApi.getOne(id),
            expensesApi.getCategories(),
            clientsApi.getAll(),
            visitsApi.getAll(),
            serviceOrdersApi.getAll(),
            expensesApi.getBankAccounts()
        ]);

        setExpense(expenseData);
        setData({
          categories,
          clients,
          visits,
          serviceOrders,
          bankAccounts
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da despesa.',
          variant: 'destructive',
        });
        router.push('/financial/expenses');
      } finally {
        setIsFetching(false);
      }
    }

    loadData();
  }, [params?.id, toast, router]);

  const handleSubmit = async (expenseData: any) => {
    setIsLoading(true);
    try {
      const id = params?.id as string;
      await expensesApi.update(id, expenseData);
      toast({
        title: 'Sucesso',
        description: 'Despesa atualizada com sucesso!',
      });
      router.push('/financial/expenses');
      router.refresh(); 
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a despesa.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
      return (
          <div className="flex h-screen items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      )
  }

  // Format initial data dates
  const formattedInitialData = expense ? {
      ...expense,
      date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
      dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
      competenceDate: expense.competenceDate ? new Date(expense.competenceDate).toISOString().split('T')[0] : '',
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/financial/expenses" 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Despesa</h1>
          <p className="text-gray-500">Alterar informações da despesa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <ExpenseForm
          categories={data.categories}
          clients={data.clients}
          visits={data.visits}
          serviceOrders={data.serviceOrders}
          bankAccounts={data.bankAccounts}
          onSubmit={handleSubmit}
          initialData={formattedInitialData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
