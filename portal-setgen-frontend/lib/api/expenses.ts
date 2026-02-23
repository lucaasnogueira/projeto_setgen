import api from './client';
import type { 
  Expense, 
  CreateExpenseDto, 
  FilterExpenseDto, 
  DashboardData,
  ExpenseCategory,
  BankAccount
} from '@/types/financial';

export const expensesApi = {
  // Despesas
  getAll: async (filters?: FilterExpenseDto): Promise<{ data: Expense[]; meta: any }> => {
    const { data } = await api.get('/expenses', {
      params: filters,
    });
    return data;
  },

  getOne: async (id: string): Promise<Expense> => {
    const { data } = await api.get(`/expenses/${id}`);
    return data;
  },

  create: async (expense: CreateExpenseDto): Promise<Expense> => {
    const { data } = await api.post('/expenses', expense);
    return data;
  },

  update: async (id: string, expense: Partial<CreateExpenseDto>): Promise<Expense> => {
    const { data } = await api.patch(`/expenses/${id}`, expense);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/expenses/${id}`);
  },

  approve: async (id: string, comments?: string): Promise<Expense> => {
    const { data } = await api.post(`/expenses/${id}/approve`, { comments });
    return data;
  },

  reject: async (id: string, reason: string): Promise<Expense> => {
    const { data } = await api.post(`/expenses/${id}/reject`, { reason });
    return data;
  },

  markAsPaid: async (id: string, paymentData: { paymentDate: string; paidAmount?: number }): Promise<Expense> => {
    const { data } = await api.post(`/expenses/${id}/pay`, paymentData);
    return data;
  },

  // Dashboard
  getDashboardData: async (year?: number, month?: number): Promise<DashboardData> => {
    const { data } = await api.get('/expenses/dashboard', {
      params: { year, month },
    });
    return data;
  },

  getCategories: async (): Promise<ExpenseCategory[]> => {
    const { data } = await api.get('/expense-categories');
    return data;
  },

  getBankAccounts: async (): Promise<BankAccount[]> => {
    const { data } = await api.get('/expenses/bank-accounts');
    return data;
  }
};
