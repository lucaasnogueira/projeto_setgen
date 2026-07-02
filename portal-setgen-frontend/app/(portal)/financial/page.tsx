'use client';

import { useEffect, useState } from 'react';
import { expensesApi } from '@/lib/api/expenses';
import { DashboardData } from '@/types/financial';
import { DashboardCards } from '@/components/financial/DashboardCards';
import { ExpensesByCategory } from '@/components/financial/ExpensesByCategory';
import { CashFlowChart } from '@/components/financial/CashFlowChart';
import { Loader2, Calendar as CalendarIcon, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

const MONTHS = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year.toString(), label: year.toString() };
});

export default function FinancialDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, selectedYear]);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const dashboardData = await expensesApi.getDashboardData(
        Number(selectedYear),
        Number(selectedMonth)
      );
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-extrabold text-foreground leading-tight">Financeiro</h1>
          <p className="text-sm text-text-secondary mt-1">Visão geral das finanças do período</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-[11px] border border-border">
          <div className="flex items-center gap-2 px-2 border-r border-border pr-3">
            <CalendarIcon className="h-4 w-4 text-text-muted" />
            <span className="text-[12.5px] font-semibold text-text-secondary">Período:</span>
          </div>

          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[135px] h-8 border-none focus:ring-0 shadow-none font-semibold text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[95px] h-8 border-none focus:ring-0 shadow-none font-semibold text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={loadDashboard}
            className="text-text-muted hover:text-primary h-8 w-8"
          >
            <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="flex gap-2">
            <Link href="/financial/expenses">
                <Button variant="outline" className="rounded-[9px] font-bold">Ver Despesas</Button>
            </Link>
            <Link href="/financial/expenses/new">
                <Button className="rounded-[9px] font-bold">Nova Despesa</Button>
            </Link>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : data ? (
        <>
          <DashboardCards data={data.summary} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CashFlowChart data={data.cashFlow} />
            <ExpensesByCategory data={data.byCategory} />
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-[14px] border border-dashed border-border">
          <p className="text-text-secondary text-sm">Nenhum dado encontrado para este período.</p>
        </div>
      )}
    </div>
  );
}
