import api from './client';
import { ServiceOrder, QuoteLine, ServiceOrderAuditLogEntry } from '@/types';

export const ordersApi = {
  async uploadAttachments(id: string, files: File[]): Promise<ServiceOrder> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    const { data } = await api.post(`/service-orders/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async getAll(): Promise<ServiceOrder[]> {
    try {
      const { data } = await api.get('/service-orders');
      return data;
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      return [];
    }
  },

  async getById(id: string): Promise<ServiceOrder> {
    const { data } = await api.get(`/service-orders/${id}`);
    return data;
  },

  async create(orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const { data } = await api.post('/service-orders', orderData);
    return data;
  },

  async update(id: string, orderData: Partial<ServiceOrder>): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}`, orderData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/service-orders/${id}`);
  },

  async updateStatus(id: string, newStatus: string, comments?: string): Promise<ServiceOrder> {
    const { data } = await api.patch(`/service-orders/${id}/status`, { 
      status: newStatus,
      comments 
    });
    return data;
  },

  async getStatusHistory(id: string): Promise<any[]> {
    try {
      const { data } = await api.get(`/service-orders/${id}/status-history`);
      return data;
    } catch (error) {
      console.error('Erro ao buscar histórico de status:', error);
      return [];
    }
  },

  async addQuoteLine(id: string, line: Partial<QuoteLine>): Promise<QuoteLine> {
    const { data } = await api.post(`/service-orders/${id}/lines`, line);
    return data;
  },

  async updateQuoteLine(id: string, lineId: string, line: Partial<QuoteLine>): Promise<QuoteLine> {
    const { data } = await api.patch(`/service-orders/${id}/lines/${lineId}`, line);
    return data;
  },

  async removeQuoteLine(id: string, lineId: string): Promise<void> {
    await api.delete(`/service-orders/${id}/lines/${lineId}`);
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
