import api from './client';
import type { ProcurementOrder, ProcurementOrderStatus } from '@/types';

export interface CreateProcurementOrderPayload {
  supplierId?: string;
  materialRequestId?: string;
  expectedDeliveryDate?: string;
  invoiceNumber?: string;
  invoiceAccessKey?: string;
  invoiceUrl?: string;
  notes?: string;
  items: {
    productId: string;
    requestedQuantity?: number;
    quantity: number;
    unitCost: number;
  }[];
}

export interface UpdateProcurementOrderPayload {
  supplierId?: string;
  expectedDeliveryDate?: string;
  invoiceNumber?: string;
  invoiceAccessKey?: string;
  invoiceUrl?: string;
  notes?: string;
  items?: {
    productId: string;
    requestedQuantity?: number;
    quantity: number;
    unitCost?: number;
  }[];
}

export const procurementOrdersApi = {
  getAll: async (filters?: { status?: ProcurementOrderStatus; supplierId?: string; search?: string }): Promise<ProcurementOrder[]> => {
    const { data } = await api.get('/procurement-orders', { params: filters });
    return data;
  },

  getOne: async (id: string): Promise<ProcurementOrder> => {
    const { data } = await api.get(`/procurement-orders/${id}`);
    return data;
  },

  create: async (payload: CreateProcurementOrderPayload): Promise<ProcurementOrder> => {
    const { data } = await api.post('/procurement-orders', payload);
    return data;
  },

  update: async (id: string, payload: UpdateProcurementOrderPayload): Promise<ProcurementOrder> => {
    const { data } = await api.patch(`/procurement-orders/${id}`, payload);
    return data;
  },

  uploadInvoice: async (id: string, file: File): Promise<ProcurementOrder> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/procurement-orders/${id}/invoice-file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateStatus: async (id: string, status: ProcurementOrderStatus): Promise<ProcurementOrder> => {
    const { data } = await api.patch(`/procurement-orders/${id}/status`, { status });
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/procurement-orders/${id}`);
  },
};
