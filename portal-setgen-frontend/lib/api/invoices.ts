import api from './client';
import { Invoice } from '@/types';

export const invoicesApi = {
  async getAll(): Promise<Invoice[]> {
    try {
      const { data } = await api.get('/invoices');
      return data;
    } catch (error) {
      console.error('Erro ao buscar notas fiscais:', error);
      return [];
    }
  },

  async getById(id: string): Promise<Invoice> {
    const { data } = await api.get(`/invoices/${id}`);
    return data;
  },

  async create(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.post('/invoices', invoiceData);
    return data;
  },

  async update(id: string, invoiceData: Partial<Invoice>): Promise<Invoice> {
    const { data } = await api.patch(`/invoices/${id}`, invoiceData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
};
