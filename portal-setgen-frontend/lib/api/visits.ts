import api from './client';
import type { TechnicalVisit } from '@/types';

export const visitsApi = {
  getAll: async (): Promise<TechnicalVisit[]> => {
    const { data } = await api.get('/visits');
    return data;
  },

  getOne: async (id: string): Promise<TechnicalVisit> => {
    const { data } = await api.get(`/visits/${id}`);
    return data;
  },

  getByClient: async (clientId: string): Promise<TechnicalVisit[]> => {
    const { data } = await api.get(`/visits/client/${clientId}`);
    return data;
  },

  create: async (visit: Partial<TechnicalVisit>): Promise<TechnicalVisit> => {
    const { data } = await api.post('/visits', visit);
    return data;
  },

  update: async (id: string, visit: Partial<TechnicalVisit>): Promise<TechnicalVisit> => {
    const { data } = await api.patch(`/visits/${id}`, visit);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/visits/${id}`);
  },
};
