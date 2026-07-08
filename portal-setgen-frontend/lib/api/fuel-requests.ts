import api from './client';
import type { FuelRequest, FuelRequestStatus } from '@/types';

export const fuelRequestsApi = {
  getAll: async (filters?: { status?: FuelRequestStatus; vehicleId?: string }): Promise<FuelRequest[]> => {
    const { data } = await api.get('/fuel-requests', { params: filters });
    return data;
  },

  getOne: async (id: string): Promise<FuelRequest> => {
    const { data } = await api.get(`/fuel-requests/${id}`);
    return data;
  },

  create: async (fuelRequest: {
    vehicleId: string;
    liters: number;
    unitPrice: number;
    currentKm?: number;
    fuelStation?: string;
  }): Promise<FuelRequest> => {
    const { data } = await api.post('/fuel-requests', fuelRequest);
    return data;
  },

  approve: async (id: string): Promise<FuelRequest> => {
    const { data } = await api.post(`/fuel-requests/${id}/approve`);
    return data;
  },

  reject: async (id: string, rejectionReason: string): Promise<FuelRequest> => {
    const { data } = await api.post(`/fuel-requests/${id}/reject`, { rejectionReason });
    return data;
  },
};
