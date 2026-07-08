import api from './client';
import type { VisitTaskType } from '@/types';

export const visitTaskTypesApi = {
  getAll: async (active?: boolean): Promise<VisitTaskType[]> => {
    const { data } = await api.get('/visit-task-types', { params: { active } });
    return data;
  },

  getOne: async (id: string): Promise<VisitTaskType> => {
    const { data } = await api.get(`/visit-task-types/${id}`);
    return data;
  },

  create: async (taskType: Partial<VisitTaskType>): Promise<VisitTaskType> => {
    const { data } = await api.post('/visit-task-types', taskType);
    return data;
  },

  update: async (id: string, taskType: Partial<VisitTaskType>): Promise<VisitTaskType> => {
    const { data } = await api.patch(`/visit-task-types/${id}`, taskType);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/visit-task-types/${id}`);
  },
};
