import api from './client';
import type { Client, ClientStatus, CNPJData } from '@/types';

const sortClientsAlphabetically = (list: Client[]): Client[] => {
  if (!Array.isArray(list)) return list;
  return [...list].sort((a, b) => {
    const nameA = a.companyName || a.tradeName || '';
    const nameB = b.companyName || b.tradeName || '';
    return nameA.localeCompare(nameB, 'pt-BR', { sensitivity: 'base' });
  });
};

export const clientsApi = {
  getAll: async (status?: ClientStatus): Promise<Client[]> => {
    const { data } = await api.get('/clients', {
      params: { status },
    });
    return sortClientsAlphabetically(data);
  },

  getOne: async (id: string): Promise<Client> => {
    const { data } = await api.get(`/clients/${id}`);
    return data;
  },

  search: async (query: string): Promise<Client[]> => {
    const { data } = await api.get('/clients/search', {
      params: { q: query },
    });
    return sortClientsAlphabetically(data);
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

  bulkImport: async (items: any[]): Promise<{ total: number; created: number; updated: number; skipped: number; errors: string[] }> => {
    const { data } = await api.post('/clients/bulk-import', { items }, { timeout: 120000 });
    return data;
  },
};
