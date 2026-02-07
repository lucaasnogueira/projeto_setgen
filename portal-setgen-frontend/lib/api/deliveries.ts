import api from './client';
import { Delivery } from '@/types';

export const deliveriesApi = {
  async getAll(): Promise<Delivery[]> {
    try {
      const { data } = await api.get('/deliveries');
      return data;
    } catch (error) {
      console.error('Erro ao buscar entregas:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Delivery> {
    const { data } = await api.get(`/deliveries/${id}`);
    return data;
  },

  async create(deliveryData: Partial<Delivery>): Promise<Delivery> {
    const { data } = await api.post('/deliveries', deliveryData);
    return data;
  },

  async update(id: string, deliveryData: Partial<Delivery>): Promise<Delivery> {
    const { data } = await api.patch(`/deliveries/${id}`, deliveryData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/deliveries/${id}`);
  },
};
