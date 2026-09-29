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

  async approve(id: string): Promise<{ quote: Quote; serviceOrder: any }> {
    const { data } = await api.post(`/quotes/${id}/approve`);
    return data;
  },

  async addItemProduct(quoteId: string, item: { productId: string; quantity: number; unitPrice: number; discountAmount?: number }) {
    const { data } = await api.post(`/quotes/${quoteId}/item-products`, item);
    return data;
  },

  async removeItemProduct(quoteId: string, itemId: string) {
    const { data } = await api.delete(`/quotes/${quoteId}/item-products/${itemId}`);
    return data;
  },

  async addItemService(quoteId: string, item: { serviceId: string; quantity: number; unitPrice: number; discountAmount?: number; customObservation?: string }) {
    const { data } = await api.post(`/quotes/${quoteId}/item-services`, item);
    return data;
  },

  async removeItemService(quoteId: string, itemId: string) {
    const { data } = await api.delete(`/quotes/${quoteId}/item-services/${itemId}`);
    return data;
  },

  async addAdditionalCost(quoteId: string, cost: { description: string; amount: number }) {
    const { data } = await api.post(`/quotes/${quoteId}/additional-costs`, cost);
    return data;
  },

  async removeAdditionalCost(quoteId: string, costId: string) {
    const { data } = await api.delete(`/quotes/${quoteId}/additional-costs/${costId}`);
    return data;
  },

  async addTask(quoteId: string, task: { taskCode?: string; taskType: string; executionDate: string; assignedCollaboratorId?: string }) {
    const { data } = await api.post(`/quotes/${quoteId}/tasks`, task);
    return data;
  },

  async removeTask(quoteId: string, taskId: string) {
    const { data } = await api.delete(`/quotes/${quoteId}/tasks/${taskId}`);
    return data;
  },

  async addAttachment(quoteId: string, attachment: { fileName: string; fileUrl: string; showToClient?: boolean }) {
    const { data } = await api.post(`/quotes/${quoteId}/attachments`, attachment);
    return data;
  },

  async removeAttachment(quoteId: string, attachmentId: string) {
    const { data } = await api.delete(`/quotes/${quoteId}/attachments/${attachmentId}`);
    return data;
  },
};
