'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { expensesApi } from '@/lib/api/expenses';
import { Expense, FilterExpenseDto } from '@/types/financial';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Filter, Loader2, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

export default function ExpensesListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterExpenseDto>({
    page: 1,
    limit: 20,
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
    // Basic implementation - API needs tags or description search support
    // For now assuming backend implemented description search or we filter client side if not supported
    // But FilterExpenseDto doesn't have search term. I added tags.
    // I won't implement text search right now unless I add 'search' to DTO.
    // Let's just assume we reload for now or add filters later.
    console.log('Search not implemented in backend yet', term);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      await expensesApi.delete(id);
      toast({ title: 'Sucesso', description: 'Despesa excluída.' });
      loadExpenses();
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao excluir.', variant: 'destructive' });
    }
  };

  const statusColors: any = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIALLY_PAID: 'bg-green-50 text-green-600',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Despesas</h1>
          <p className="text-gray-500">Gerencie todas as despesas da empresa</p>
        </div>
        <Link href="/financial/expenses/new">
          <Button className="bg-orange-600 hover:bg-orange-700">
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar..."
              className="pl-10"
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={loadExpenses}>
             Atualizar
          </Button>
        </div>

        <div className="rounded-md border">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase">
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {format(new Date(expense.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-xs text-gray-500">
                        {expense.client?.companyName || expense.supplier}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {expense.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(Number(expense.amount))}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          statusColors[expense.status] || 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {statusLabels[expense.status] || expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => router.push(`/financial/expenses/${expense.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
