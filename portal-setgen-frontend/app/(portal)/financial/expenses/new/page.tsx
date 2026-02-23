'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExpenseForm } from '@/components/financial/ExpenseForm';
import { expensesApi } from '@/lib/api/expenses';
import { clientsApi } from '@/lib/api/clients';
import { visitsApi } from '@/lib/api/visits';
import { serviceOrdersApi } from '@/lib/api/service-orders';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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
          serviceOrdersApi.getAll()
        ]);

        setData({
          categories,
          clients,
          visits,
          serviceOrders // Ensure serviceOrdersApi.getAll returns data as expected
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
      console.log('🚀 Submitting expense data (raw):', JSON.stringify(expenseData, null, 2));
      
      // Sanitize data: convert empty strings to undefined for optional fields
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
        recurringId: expenseData.recurringId || undefined,
        totalInstallments: expenseData.totalInstallments || undefined,
      };
      
      console.log('🧹 Sanitized data:', JSON.stringify(sanitizedData, null, 2));
      console.log('📊 Data types:', {
        description: typeof sanitizedData.description,
        type: typeof sanitizedData.type,
        amount: typeof sanitizedData.amount,
        categoryId: typeof sanitizedData.categoryId,
        date: typeof sanitizedData.date,
        dueDate: typeof sanitizedData.dueDate,
        competenceDate: typeof sanitizedData.competenceDate,
      });
      
      await expensesApi.create(sanitizedData);
      
      toast({
        title: 'Sucesso',
        description: 'Despesa criada com sucesso!',
      });
      router.push('/financial/expenses');
      router.refresh(); // Refresh to show new item in list
    } catch (error: any) {
      console.error('❌ Error creating expense:', error);
      console.error('📋 Error response:', error.response?.data);
      console.error('📋 Error status:', error.response?.status);
      console.error('📋 Error message:', error.response?.data?.message);
      
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
      <div className="flex items-center gap-4">
        <Link 
          href="/financial/expenses" 
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Despesa</h1>
          <p className="text-gray-500">Registre uma nova despesa no sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
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
