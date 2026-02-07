import api from './client';
import { PurchaseOrder } from '@/types';

export const purchaseOrdersApi = {
  async getAll(): Promise<PurchaseOrder[]> {
    try {
      const { data } = await api.get('/purchase-orders');
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

  async create(formData: FormData): Promise<PurchaseOrder> {
    const { data } = await api.post('/purchase-orders', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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
};
