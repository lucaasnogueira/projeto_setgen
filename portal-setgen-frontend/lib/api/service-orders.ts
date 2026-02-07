import api from './client';
import type { ServiceOrder, ServiceOrderStatus } from '@/types';

export const serviceOrdersApi = {
  getAll: async (status?: ServiceOrderStatus): Promise<ServiceOrder[]> => {
    const { data } = await api.get('/service-orders', {
      params: { status },
    });
    return data;
  },

  getOne: async (id: string): Promise<ServiceOrder> => {
    const { data } = await api.get(`/service-orders/${id}`);
    return data;
  },

  create: async (order: Partial<ServiceOrder>): Promise<ServiceOrder> => {
    const { data } = await api.post('/service-orders', order);
    return data;
  },

  update: async (id: string, order: Partial<ServiceOrder>): Promise<ServiceOrder> => {
    const { data } = await api.patch(`/service-orders/${id}`, order);
    return data;
  },

  updateProgress: async (id: string, progress: number): Promise<ServiceOrder> => {
    const { data } = await api.patch(`/service-orders/${id}/progress`, { progress });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/service-orders/${id}`);
  },
};
