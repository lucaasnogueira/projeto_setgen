import api from './client';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  clientId?: string;
  status?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

export const reportsApi = {
  async getVisitsByMonth(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/visits-by-month', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async getOrdersByStatus(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/orders-by-status', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async getMonthlyRevenue(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/monthly-revenue', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async getTechnicianPerformance(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/technician-performance', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async exportPDF(filters?: ReportFilters): Promise<Blob> {
    const { data } = await api.get('/reports/export-pdf', {
      params: filters,
      responseType: 'blob',
    });
    return data;
  },
};
