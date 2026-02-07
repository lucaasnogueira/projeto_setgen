import api from './client';

export interface DashboardStats {
  pendingApprovals: number;
  activeOrders: number;
  completedThisMonth: number;
  totalRevenue: number;
  lowStockItems: number;
  overdueInvoices: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  ordersByStatus: {
    label: string;
    value: number;
  }[];
  monthlyRevenue: {
    month: string;
    value: number;
  }[];
  visitsByMonth: {
    month: string;
    value: number;
  }[];
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    try {
      const { data } = await api.get('/dashboard/stats');
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Retorna dados mock em caso de erro
      return {
        pendingApprovals: 0,
        activeOrders: 0,
        completedThisMonth: 0,
        totalRevenue: 0,
        lowStockItems: 0,
        overdueInvoices: 0,
        recentActivities: [],
        ordersByStatus: [],
        monthlyRevenue: [],
        visitsByMonth: [],
      };
    }
  },
};
