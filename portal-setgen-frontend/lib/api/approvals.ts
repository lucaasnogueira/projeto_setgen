import api from './client';
import { ServiceOrder } from '@/types';

export const approvalsApi = {
  async getPending(): Promise<ServiceOrder[]> {
    try {
      const { data } = await api.get('/service-orders', {
        params: { status: 'PENDING_APPROVAL' }
      });
      return data;
    } catch (error) {
      console.error('Erro ao buscar aprovações:', error);
      return [];
    }
  },

  async approve(id: string, comments?: string): Promise<ServiceOrder> {
    const { data } = await api.post(`/approvals/approve/${id}`, { comments });
    return data;
  },

  async reject(id: string, comments: string): Promise<ServiceOrder> {
    const { data } = await api.post(`/approvals/reject/${id}`, { comments });
    return data;
  },
};
