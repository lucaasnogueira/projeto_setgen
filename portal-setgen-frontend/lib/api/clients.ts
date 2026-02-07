import api from './client';
import type { Client, ClientStatus, CNPJData } from '@/types';

export const clientsApi = {
  getAll: async (status?: ClientStatus): Promise<Client[]> => {
    const { data } = await api.get('/clients', {
      params: { status },
    });
    return data;
  },

  getOne: async (id: string): Promise<Client> => {
    const { data} = await api.get(`/clients/${id}`);
    return data;
  },

  search: async (query: string): Promise<Client[]> => {
    const { data } = await api.get('/clients/search', {
      params: { q: query },
    });
    return data;
  },

  fetchCNPJ: async (cnpj: string): Promise<CNPJData> => {
    const { data } = await api.get(`/clients/cnpj/${cnpj}`);
    return data;
  },

  create: async (client: Partial<Client>): Promise<Client> => {
    const { data } = await api.post('/clients', client);
    return data;
  },

  update: async (id: string, client: Partial<Client>): Promise<Client> => {
    const { data } = await api.patch(`/clients/${id}`, client);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },
};
