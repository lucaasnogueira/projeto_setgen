import api from './client';
import { ServiceOrder } from '@/types';

export const ordersApi = {
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
};
