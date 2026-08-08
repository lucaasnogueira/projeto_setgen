import api from './client';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderAuditLogEntry } from '@/types';

export interface CreateServiceOrderPayload {
  quoteId: string;
  items?: Array<{ productId: string; quantity: number; unitPrice: number }>;
  requiredResources?: { team?: string[] };
  deadline?: string;
  responsibleIds?: string[];
  checklist?: Array<{ item: string; completed: boolean }>;
  checklistTemplateId?: string;
}

export const ordersApi = {
  async uploadAttachments(id: string, files: File[]): Promise<ServiceOrder> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const { data } = await api.post(`/service-orders/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getAll(filters?: { clientId?: string; status?: ServiceOrderStatus; createdById?: string }): Promise<ServiceOrder[]> {
    try {
      const { data } = await api.get('/service-orders', { params: filters });
      return data;
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ServiceOrder> {
    const { data } = await api.get(`/service-orders/${id}`);
    return data;
  },

  /** Gera a OS de execução a partir de um orçamento aceito (status ACCEPTED). */
  async createFromQuote(payload: CreateServiceOrderPayload): Promise<ServiceOrder> {
    const { data } = await api.post('/service-orders', payload);
    return data;
  },

  async update(id: string, orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}`, orderData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/service-orders/${id}`);
  },

  async updateStatus(id: string, newStatus: ServiceOrderStatus, comments?: string): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}/status`, {
      status: newStatus,
      comments,
    });
    return data;
  },

  async updateProgress(id: string, progress: number): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}/progress/${progress}`);
    return data;
  },

  async updatePaymentStatus(id: string, paymentStatus: 'PENDING' | 'RECEIVED'): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}/payment-status`, { paymentStatus });
    return data;
  },

  async linkVisit(id: string, visitId: string): Promise<void> {
    await api.post(`/service-orders/${id}/visits/${visitId}`);
  },

  async unlinkVisit(id: string, visitId: string): Promise<void> {
    await api.delete(`/service-orders/${id}/visits/${visitId}`);
  },

  async getAuditLog(id: string): Promise<ServiceOrderAuditLogEntry[]> {
    try {
      const { data } = await api.get(`/service-orders/${id}/audit-log`);
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico da OS:', error);
      return [];
    }
  },
};
