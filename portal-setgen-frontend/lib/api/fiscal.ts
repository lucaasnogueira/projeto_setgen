import api from './client';
import { Invoice } from '@/types';

export interface EmitirNotaMercadoriaDto {
  clientId: string;
  serviceOrderId?: string;
  itens: {
    productId: string;
    quantidade: number;
    valorUnitario?: number;
    fabricadoNaZfm?: boolean;
    cfop?: string;
  }[];
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
}

export const fiscalApi = {
  emitirMercadoria: async (payload: EmitirNotaMercadoriaDto): Promise<any> => {
    const { data } = await api.post('/fiscal/emitir', payload);
    return data;
  },

  getAll: async (filters?: {
    status?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    serviceOrderId?: string;
  }): Promise<Invoice[]> => {
    const { data } = await api.get('/fiscal', { params: filters });
    return data;
  },

  getOne: async (id: string): Promise<Invoice> => {
    const { data } = await api.get(`/fiscal/${id}`);
    return data;
  },

  cancelar: async (id: string, justificativa: string): Promise<{ sucesso: boolean; mensagem: string }> => {
    const { data } = await api.post(`/fiscal/${id}/cancelar`, { justificativa });
    return data;
  },

  getByServiceOrder: async (serviceOrderId: string): Promise<Invoice[]> => {
    const { data } = await api.get(`/fiscal/os/${serviceOrderId}`);
    return data;
  },
};
