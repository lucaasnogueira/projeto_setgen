import api from './client';
import type { MaterialRequest, MaterialRequestStatus } from '@/types';

export const materialRequestsApi = {
  getAll: async (status?: MaterialRequestStatus): Promise<MaterialRequest[]> => {
    const { data } = await api.get('/material-requests', { params: { status } });
    return data;
  },

  getOne: async (id: string): Promise<MaterialRequest> => {
    const { data } = await api.get(`/material-requests/${id}`);
    return data;
  },

  update: async (id: string, payload: { priority?: number; expectedExecutionDate?: string }): Promise<MaterialRequest> => {
    const { data } = await api.patch(`/material-requests/${id}`, payload);
    return data;
  },

  separate: async (id: string): Promise<MaterialRequest> => {
    const { data } = await api.post(`/material-requests/${id}/separate`);
    return data;
  },

  release: async (id: string): Promise<MaterialRequest> => {
    const { data } = await api.post(`/material-requests/${id}/release`);
    return data;
  },
};
