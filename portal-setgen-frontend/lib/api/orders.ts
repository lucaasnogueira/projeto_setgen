import api from './client';
import { ServiceOrder, ServiceOrderStatus, ServiceOrderAuditLogEntry } from '@/types';

export interface CreateServiceOrderPayload {
  quoteId: string;
  equipmentId?: string | null;
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

  async getClientView(id: string): Promise<any> {
    const { data } = await api.get(`/service-orders/${id}/client-view`);
    return data;
  },

  async collectClientSignature(
    id: string,
    signatureData: {
      signerName: string;
      signerDocument: string;
      signatureImageUrl: string;
      ipAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ): Promise<any> {
    const { data } = await api.post(`/service-orders/${id}/client-signature`, signatureData);
    return data;
  },

  async getInternalView(id: string): Promise<any> {
    const { data } = await api.get(`/service-orders/${id}/internal-view`);
    return data;
  },

  async startDisplacement(id: string, payload?: { latitude?: number; longitude?: number; odometerKm?: number; notes?: string }): Promise<any> {
    const { data } = await api.post(`/service-orders/${id}/start-displacement`, payload || {});
    return data;
  },

  async checkin(id: string, payload?: { latitude?: number; longitude?: number; notes?: string }): Promise<any> {
    const { data } = await api.post(`/service-orders/${id}/checkin`, payload || {});
    return data;
  },

  async checkout(id: string, payload?: { latitude?: number; longitude?: number; odometerKm?: number; notes?: string; totalKmTraveled?: number }): Promise<any> {
    const { data } = await api.post(`/service-orders/${id}/checkout`, payload || {});
    return data;
  },

  async addExpense(id: string, payload: { description: string; amount: number; categoryName?: string }): Promise<any> {
    const { data } = await api.post(`/service-orders/${id}/expenses`, payload);
    return data;
  },

  async updateKm(id: string, km: number, kmRate?: number): Promise<any> {
    const { data } = await api.patch(`/service-orders/${id}/km`, { km, kmRate });
    return data;
  },

  async updateWorkedHours(id: string, hours: number, hourlyRate?: number): Promise<any> {
    const { data } = await api.patch(`/service-orders/${id}/hours`, { hours, hourlyRate });
    return data;
  },

  // Multi-CRUD Despesas
  async updateExpense(orderId: string, expenseId: string, payload: { description?: string; amount?: number; categoryName?: string }): Promise<any> {
    const { data } = await api.patch(`/service-orders/${orderId}/expenses/${expenseId}`, payload);
    return data;
  },

  async deleteExpense(orderId: string, expenseId: string): Promise<any> {
    const { data } = await api.delete(`/service-orders/${orderId}/expenses/${expenseId}`);
    return data;
  },

  // Multi-CRUD Peças / Materiais (CMV)
  async addItem(orderId: string, payload: { productId: string; quantity: number; unitPrice: number }): Promise<any> {
    const { data } = await api.post(`/service-orders/${orderId}/items`, payload);
    return data;
  },

  async updateItem(orderId: string, itemId: string, payload: { quantity?: number; unitPrice?: number }): Promise<any> {
    const { data } = await api.patch(`/service-orders/${orderId}/items/${itemId}`, payload);
    return data;
  },

  async deleteItem(orderId: string, itemId: string): Promise<any> {
    const { data } = await api.delete(`/service-orders/${orderId}/items/${itemId}`);
    return data;
  },

  // Multi-CRUD Serviços Técnicos
  async addService(orderId: string, payload: { serviceId: string; quantity: number; unitPrice: number; scopeObservation?: string }): Promise<any> {
    const { data } = await api.post(`/service-orders/${orderId}/services`, payload);
    return data;
  },

  async updateService(orderId: string, serviceId: string, payload: { quantity?: number; unitPrice?: number; scopeObservation?: string }): Promise<any> {
    const { data } = await api.patch(`/service-orders/${orderId}/services/${serviceId}`, payload);
    return data;
  },

  async deleteService(orderId: string, serviceId: string): Promise<any> {
    const { data } = await api.delete(`/service-orders/${orderId}/services/${serviceId}`);
    return data;
  },

  // Multi-CRUD Mão de Obra e Frota
  async addLaborLog(orderId: string, payload: { userId: string; hours: number; hourlyRate: number; description: string }): Promise<any> {
    const { data } = await api.post(`/service-orders/${orderId}/labor-logs`, payload);
    return data;
  },

  async addDisplacementLog(orderId: string, payload: { route: string; km: number; kmRate: number; notes?: string }): Promise<any> {
    const { data } = await api.post(`/service-orders/${orderId}/displacement-logs`, payload);
    return data;
  },

  async deleteExecutionLog(orderId: string, logId: string): Promise<any> {
    const { data } = await api.delete(`/service-orders/${orderId}/execution-logs/${logId}`);
    return data;
  },
  async setEquipment(id: string, equipmentId: string | null): Promise<any> {
    const { data } = await api.patch(`/service-orders/${id}/equipment`, { equipmentId });
    return data;
  },

  async updateExecutionLog(orderId: string, logId: string, payload: { userId?: string; hours?: number; hourlyRate?: number; description?: string; route?: string; km?: number; kmRate?: number; notes?: string }): Promise<any> {
    const { data } = await api.patch(`/service-orders/${orderId}/execution-logs/${logId}`, payload);
    return data;
  },

  async resetLabor(orderId: string): Promise<any> {
    const { data } = await api.post(`/service-orders/${orderId}/labor-logs/reset`);
    return data;
  },

  async resetDisplacement(orderId: string): Promise<any> {
    const { data } = await api.post(`/service-orders/${orderId}/displacement-logs/reset`);
    return data;
  },
};
