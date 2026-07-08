import api from './client';
import type { StockLocation } from '@/types';

export const stockLocationsApi = {
  getAll: async (): Promise<StockLocation[]> => {
    const { data } = await api.get('/stock-locations');
    return data;
  },

  create: async (location: { code: string; description?: string }): Promise<StockLocation> => {
    const { data } = await api.post('/stock-locations', location);
    return data;
  },
};
