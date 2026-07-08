import api from './client';
import type { Equipment, EquipmentType } from '@/types';

export const equipmentApi = {
  getAll: async (filters?: { clientId?: string; type?: EquipmentType }): Promise<Equipment[]> => {
    const { data } = await api.get('/equipment', { params: filters });
    return data;
  },

  getOne: async (id: string): Promise<Equipment> => {
    const { data } = await api.get(`/equipment/${id}`);
    return data;
  },

  create: async (equipment: Partial<Equipment>): Promise<Equipment> => {
    const { data } = await api.post('/equipment', equipment);
    return data;
  },

  update: async (id: string, equipment: Partial<Equipment>): Promise<Equipment> => {
    const { data } = await api.patch(`/equipment/${id}`, equipment);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/equipment/${id}`);
  },
};
