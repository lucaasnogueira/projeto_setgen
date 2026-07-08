import api from './client';
import type { Supplier } from '@/types';

export const suppliersApi = {
  getAll: async (active?: boolean): Promise<Supplier[]> => {
    const { data } = await api.get('/suppliers', { params: { active } });
    return data;
  },

  getOne: async (id: string): Promise<Supplier> => {
    const { data } = await api.get(`/suppliers/${id}`);
    return data;
  },

  create: async (supplier: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await api.post('/suppliers', supplier);
    return data;
  },

  update: async (id: string, supplier: Partial<Supplier>): Promise<Supplier> => {
    const { data } = await api.patch(`/suppliers/${id}`, supplier);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/suppliers/${id}`);
  },
};
