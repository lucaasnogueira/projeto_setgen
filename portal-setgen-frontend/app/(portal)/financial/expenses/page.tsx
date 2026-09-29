'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { expensesApi } from '@/lib/api/expenses';
import { Expense, FilterExpenseDto } from '@/types/financial';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Loader2, Edit, Trash2, CheckCircle, DollarSign, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusCard } from '@/components/ui/status-card';
import { Card } from '@/components/ui/card';

export default function ExpensesListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterExpenseDto>({
    page: 1,
    limit: 50,
    sortBy: 'date',
    sortOrder: 'desc'
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadExpenses();
  }, [filters]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const { data, meta } = await expensesApi.getAll(filters);
      setExpenses(data);
      setTotal(meta.total);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as despesas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    console.log('Search term:', term);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await expensesApi.delete(id);
      toast({ title: 'Sucesso', description: 'Despesa excluída com sucesso.' });
      loadExpenses();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir.',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!confirm('Marcar esta despesa como paga hoje?')) return;
    try {
      await expensesApi.markAsPaid(id, { paymentDate: new Date().toISOString() });
      toast({ title: 'Sucesso', description: 'Despesa marcada como paga.' });
      loadExpenses();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao marcar como paga.',
        variant: 'destructive',
      });
    }
  };

  const statusColors: any = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIALLY_PAID: 'bg-green-50 text-green-600',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-muted text-foreground',
    REJECTED: 'bg-red-50 text-red-600',
  };

  const statusLabels: any = {
    PENDING: 'Pendente',
    APPROVED: 'Aprovada',
    PAID: 'Paga',
    PARTIALLY_PAID: 'Parcial',
    OVERDUE: 'Atrasada',
    CANCELLED: 'Cancelada',
    REJECTED: 'Rejeitada',
  };

  const totalPaid = expenses.filter(e => e.status === 'PAID').length;
  const totalPending = expenses.filter(e => e.status === 'PENDING' || e.status === 'APPROVED').length;
  const totalOverdue = expenses.filter(e => e.status === 'OVERDUE').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Despesas & Contas a Pagar"
        subtitle={`${total} lançamentos financeiros de saídas registrados`}
        actions={
          <Button
            onClick={() => router.push('/financial/expenses/new')}
            className="rounded-[9px] font-bold gap-2 bg-[#E2661D] hover:bg-[#c95716] text-white"
          >
            <Plus className="h-4 w-4" />
            Nova Despesa
          </Button>
        }
      />

      {/* 4 StatusCards KPI Padrão Setgen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatusCard label="Total de Despesas" value={total} icon={DollarSign} variant="orange" />
        <StatusCard label="Pagas / Baixadas" value={totalPaid} icon={CheckCircle} variant="emerald" />
        <StatusCard label="Aguardando Pagamento" value={totalPending} icon={Clock} variant="amber" />
        <StatusCard label="Despesas Atrasadas" value={totalOverdue} icon={AlertCircle} variant="red" />
      </div>

      <Card className="overflow-hidden p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, fornecedor..."
              className="pl-9 h-9 text-xs"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadExpenses} className="text-xs h-9">
            Atualizar
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <tr>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Descrição</th>
                <th className="px-5 py-3">Categoria</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <Loader2 className="animate-spin h-6 w-6 text-[#E2661D] mx-auto" />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-gray-600">
                      {format(new Date(expense.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">
                      {expense.description}
                      {expense.isFixed && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Fixa</span>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {expense.category?.name || '—'}
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${statusColors[expense.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[expense.status] || expense.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-1">
                      {expense.status !== 'PAID' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsPaid(expense.id)}
                          className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[11px]"
                          title="Marcar como Paga"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pagar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(expense.id)}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
