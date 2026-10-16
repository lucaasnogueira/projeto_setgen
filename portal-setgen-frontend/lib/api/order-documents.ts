import api from './client';
import { ServiceOrderDocument, DocumentType, DocumentStatus } from '@/types';

export interface CreateOrderDocumentPayload {
  serviceOrderId: string;
  type: DocumentType;
  code?: string;
  title: string;
  status?: DocumentStatus;
  data: Record<string, any>;
  signatures?: Record<string, any>;
  pdfUrl?: string;
  notes?: string;
}

export interface UpdateOrderDocumentPayload {
  code?: string;
  title?: string;
  status?: DocumentStatus;
  data?: Record<string, any>;
  signatures?: Record<string, any>;
  pdfUrl?: string;
  notes?: string;
}

export const orderDocumentsApi = {
  create: async (payload: CreateOrderDocumentPayload): Promise<ServiceOrderDocument> => {
    const { data } = await api.post('/order-documents', payload);
    return data;
  },

  getAll: async (filters?: {
    clientId?: string;
    serviceOrderId?: string;
    type?: DocumentType;
    status?: DocumentStatus;
    search?: string;
  }): Promise<ServiceOrderDocument[]> => {
    const { data } = await api.get('/order-documents', { params: filters });
    return data;
  },

  getByOrder: async (serviceOrderId: string): Promise<ServiceOrderDocument[]> => {
    const { data } = await api.get(`/order-documents/order/${serviceOrderId}`);
    return data;
  },

  getByClient: async (clientId: string): Promise<ServiceOrderDocument[]> => {
    const { data } = await api.get(`/order-documents/client/${clientId}`);
    return data;
  },

  getById: async (id: string): Promise<ServiceOrderDocument> => {
    const { data } = await api.get(`/order-documents/${id}`);
    return data;
  },

  update: async (id: string, payload: UpdateOrderDocumentPayload): Promise<ServiceOrderDocument> => {
    const { data } = await api.patch(`/order-documents/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/order-documents/${id}`);
  },
};

