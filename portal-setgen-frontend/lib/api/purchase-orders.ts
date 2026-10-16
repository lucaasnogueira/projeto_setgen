import api from './client';
import { PurchaseOrder } from '@/types';

export const purchaseOrdersApi = {
  async getAll(params?: { search?: string; status?: string }): Promise<PurchaseOrder[]> {
    try {
      const { data } = await api.get('/purchase-orders', { params });
      return data;
    } catch (error) {
      console.error('Erro ao buscar ordens de compra:', error);
      return [];
    }
  },

  async getById(id: string): Promise<PurchaseOrder> {
    const { data } = await api.get(`/purchase-orders/${id}`);
    return data;
  },

  async create(orderData: Partial<PurchaseOrder> | FormData): Promise<PurchaseOrder> {
    const isFormData = typeof FormData !== 'undefined' && orderData instanceof FormData;
    const { data } = await api.post('/purchase-orders', orderData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return data;
  },

  async update(id: string, orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const { data } = await api.patch(`/purchase-orders/${id}`, orderData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/purchase-orders/${id}`);
  },

  async getStatistics(): Promise<any> {
    try {
      const { data } = await api.get('/purchase-orders/statistics');
      return data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de ordens de compra:', error);
      return { total: 0, pending: 0, completed: 0, cancelled: 0, totalValue: 0 };
    }
  },
};
