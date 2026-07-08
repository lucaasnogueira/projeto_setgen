import api from './client';
import type { ProcurementOrder, ProcurementOrderStatus } from '@/types';

export const procurementOrdersApi = {
  getAll: async (filters?: { status?: ProcurementOrderStatus; supplierId?: string }): Promise<ProcurementOrder[]> => {
    const { data } = await api.get('/procurement-orders', { params: filters });
    return data;
  },

  getOne: async (id: string): Promise<ProcurementOrder> => {
    const { data } = await api.get(`/procurement-orders/${id}`);
    return data;
  },

  update: async (id: string, payload: { supplierId?: string; expectedDeliveryDate?: string }): Promise<ProcurementOrder> => {
    const { data } = await api.patch(`/procurement-orders/${id}`, payload);
    return data;
  },

  updateStatus: async (id: string, status: ProcurementOrderStatus): Promise<ProcurementOrder> => {
    const { data } = await api.patch(`/procurement-orders/${id}/status`, { status });
    return data;
  },
};
