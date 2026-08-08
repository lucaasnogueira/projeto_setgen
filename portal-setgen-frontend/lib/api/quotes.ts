import api from './client';
import { Quote, QuoteLine, QuoteStatus, ServiceOrderType, ServiceOrderAuditLogEntry } from '@/types';

export const quotesApi = {
  async getAll(filters?: {
    clientId?: string;
    status?: QuoteStatus;
    type?: ServiceOrderType;
    createdById?: string;
  }): Promise<Quote[]> {
    try {
      const { data } = await api.get('/quotes', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Quote> {
    const { data } = await api.get(`/quotes/${id}`);
    return data;
  },

  async create(quoteData: Partial<Quote>): Promise<Quote> {
    const { data } = await api.post('/quotes', quoteData);
    return data;
  },

  async update(id: string, quoteData: Partial<Quote>): Promise<Quote> {
    const { data } = await api.patch(`/quotes/${id}`, quoteData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/quotes/${id}`);
  },

  async updateStatus(id: string, status: QuoteStatus, comments?: string): Promise<Quote> {
    const { data } = await api.patch(`/quotes/${id}/status`, { status, comments });
    return data;
  },

  async addQuoteLine(id: string, line: Partial<QuoteLine>): Promise<QuoteLine> {
    const { data } = await api.post(`/quotes/${id}/lines`, line);
    return data;
  },

  async updateQuoteLine(id: string, lineId: string, line: Partial<QuoteLine>): Promise<QuoteLine> {
    const { data } = await api.patch(`/quotes/${id}/lines/${lineId}`, line);
    return data;
  },

  async removeQuoteLine(id: string, lineId: string): Promise<void> {
    await api.delete(`/quotes/${id}/lines/${lineId}`);
  },

  async getAuditLog(id: string): Promise<ServiceOrderAuditLogEntry[]> {
    try {
      const { data } = await api.get(`/quotes/${id}/audit-log`);
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico do orçamento:', error);
      return [];
    }
  },

  async getStatistics(): Promise<any> {
    const { data } = await api.get('/quotes/statistics');
    return data;
  },
};
