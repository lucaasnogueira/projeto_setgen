import api from './client';
import type { ClientTaxonomy, ClientTaxonomyKind } from '@/types';

const sortTaxonomiesAlphabetically = (list: ClientTaxonomy[]): ClientTaxonomy[] => {
  if (!Array.isArray(list)) return list;
  return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' }));
};

export const clientTaxonomiesApi = {
  getAll: async (kind?: ClientTaxonomyKind, active?: boolean): Promise<ClientTaxonomy[]> => {
    const { data } = await api.get('/client-taxonomies', { params: { kind, active } });
    return sortTaxonomiesAlphabetically(data);
  },

  getOne: async (id: string): Promise<ClientTaxonomy> => {
    const { data } = await api.get(`/client-taxonomies/${id}`);
    return data;
  },

  create: async (taxonomy: Partial<ClientTaxonomy>): Promise<ClientTaxonomy> => {
    const { data } = await api.post('/client-taxonomies', taxonomy);
    return data;
  },

  update: async (id: string, taxonomy: Partial<ClientTaxonomy>): Promise<ClientTaxonomy> => {
    const { data } = await api.patch(`/client-taxonomies/${id}`, taxonomy);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/client-taxonomies/${id}`);
  },
};
