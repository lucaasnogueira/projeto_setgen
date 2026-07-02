import api from './client';
import { Invoice, FiscalStatus } from '@/types';

export interface EmitirNotaDualDto {
  serviceOrderId: string;
  clientCnpj: string;
  emitenteCnpj: string;
  itensServico: {
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    issAliquota?: number;
    codigoServico?: string;
  }[];
  itensPecas: {
    ncm: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    fabricadoNaZfm?: boolean;
    cfop?: string;
  }[];
  ambiente: 'PRODUCAO' | 'HOMOLOGACAO';
}

export const fiscalApi = {
  emitirDual: async (payload: EmitirNotaDualDto): Promise<any> => {
    const { data } = await api.post('/fiscal/emitir', payload);
    return data;
  },

  getAll: async (filters?: {
    status?: string;
    tipo?: string;
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
