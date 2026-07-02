import api from './client';
import type { ChecklistTemplate, ServiceOrderType } from '@/types';

export const checklistTemplatesApi = {
  getAll: async (
    serviceOrderType?: ServiceOrderType,
    active?: boolean,
  ): Promise<ChecklistTemplate[]> => {
    const { data } = await api.get('/checklist-templates', {
      params: { serviceOrderType, active },
    });
    return data;
  },

  getOne: async (id: string): Promise<ChecklistTemplate> => {
    const { data } = await api.get(`/checklist-templates/${id}`);
    return data;
  },

  create: async (template: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> => {
    const { data } = await api.post('/checklist-templates', template);
    return data;
  },

  update: async (id: string, template: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> => {
    const { data } = await api.patch(`/checklist-templates/${id}`, template);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/checklist-templates/${id}`);
  },
};
