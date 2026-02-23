'use client';

import { useEffect, useState } from 'react';
import { expensesApi } from '@/lib/api/expenses';
import { DashboardData } from '@/types/financial';
import { DashboardCards } from '@/components/financial/DashboardCards';
import { ExpensesByCategory } from '@/components/financial/ExpensesByCategory';
import { CashFlowChart } from '@/components/financial/CashFlowChart';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function FinancialDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboardData = await expensesApi.getDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return null; // Or error state
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-gray-500">Visão geral das finanças</p>
        </div>
        <div className="flex gap-2">
            <Link href="/financial/expenses">
                <Button variant="outline">Ver Despesas</Button>
            </Link>
            <Link href="/financial/expenses/new">
                <Button className="bg-orange-600 hover:bg-orange-700">Nova Despesa</Button>
            </Link>
        </div>
      </div>

      <DashboardCards data={data.summary} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CashFlowChart data={data.cashFlow} />
        <ExpensesByCategory data={data.byCategory} />
      </div>
    </div>
  );
}
