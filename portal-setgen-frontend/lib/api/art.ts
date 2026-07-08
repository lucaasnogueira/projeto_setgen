import api from './client';
import type { ART } from '@/types';

export interface CreateArtPayload {
  serviceOrderId: string;
  number: string;
  engineerName: string;
  creaNumber: string;
  issueDate: string;
  file?: File;
}

function toFormData(payload: Partial<CreateArtPayload>): FormData {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value as string | Blob);
    }
  });
  return formData;
}

export const artApi = {
  create: async (payload: CreateArtPayload): Promise<ART> => {
    const { data } = await api.post('/art', toFormData(payload), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getByServiceOrder: async (serviceOrderId: string): Promise<ART | null> => {
    try {
      const { data } = await api.get(`/art/service-order/${serviceOrderId}`);
      return data;
    } catch {
      return null;
    }
  },

  getOne: async (id: string): Promise<ART> => {
    const { data } = await api.get(`/art/${id}`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/art/${id}`);
  },
};
