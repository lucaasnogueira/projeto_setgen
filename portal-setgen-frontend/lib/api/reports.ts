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

// Remove campos vazios ('') antes de enviar como query param — o backend
// valida startDate/endDate com @IsDateString(), que rejeita string vazia
// (IsOptional só pula validação pra undefined/null, não pra '').
function cleanFilters(filters?: ReportFilters): ReportFilters | undefined {
  if (!filters) return undefined;
  const entries = Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export const reportsApi = {
  async getVisitsByMonth(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/visits-by-month', { params: cleanFilters(filters) });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async getOrdersByStatus(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/orders-by-status', { params: cleanFilters(filters) });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async getMonthlyRevenue(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/monthly-revenue', { params: cleanFilters(filters) });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async getTechnicianPerformance(filters?: ReportFilters): Promise<ChartData> {
    try {
      const { data } = await api.get('/reports/technician-performance', { params: cleanFilters(filters) });
      return data;
    } catch (error) {
      console.error('Erro:', error);
      return { labels: [], datasets: [] };
    }
  },

  async exportPDF(filters?: ReportFilters): Promise<Blob> {
    const { data } = await api.get('/reports/export-pdf', {
      params: cleanFilters(filters),
      responseType: 'blob',
    });
    return data;
  },
};
