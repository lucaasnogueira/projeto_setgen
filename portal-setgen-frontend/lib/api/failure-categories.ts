import api from './client';
import type { FailureCategory } from '@/types';

const sortCategoriesAlphabetically = (list: FailureCategory[]): FailureCategory[] => {
  if (!Array.isArray(list)) return list;
  return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
};

export const failureCategoriesApi = {
  getAll: async (active?: boolean): Promise<FailureCategory[]> => {
    const { data } = await api.get('/failure-categories', { params: { active } });
    return sortCategoriesAlphabetically(data);
  },

  getOne: async (id: string): Promise<FailureCategory> => {
    const { data } = await api.get(`/failure-categories/${id}`);
    return data;
  },

  create: async (category: Partial<FailureCategory>): Promise<FailureCategory> => {
    const { data } = await api.post('/failure-categories', category);
    return data;
  },

  update: async (id: string, category: Partial<FailureCategory>): Promise<FailureCategory> => {
    const { data } = await api.patch(`/failure-categories/${id}`, category);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/failure-categories/${id}`);
  },
};
