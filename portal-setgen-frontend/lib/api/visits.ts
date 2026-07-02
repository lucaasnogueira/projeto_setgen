import api from './client';
import type { TechnicalVisit } from '@/types';

export interface VisitFilters {
  clientId?: string;
  technicianId?: string;
  teamId?: string;
  visitType?: string;
  startDate?: string;
  endDate?: string;
}

export interface OptimizedRoute {
  date: string;
  totalDistanceKm: number;
  stopsCount: number;
  unroutedCount: number;
  visits: (TechnicalVisit & { routeOrder: number; hasCoordinates: boolean })[];
}

export const visitsApi = {
  getAll: async (filters?: VisitFilters): Promise<TechnicalVisit[]> => {
    const { data } = await api.get('/visits', { params: filters });
    return data;
  },

  getRoute: async (params: {
    date: string;
    technicianId?: string;
    teamId?: string;
  }): Promise<OptimizedRoute> => {
    const { data } = await api.get('/visits/route', { params });
    return data;
  },

  getOne: async (id: string): Promise<TechnicalVisit> => {
    const { data } = await api.get(`/visits/${id}`);
    return data;
  },

  getByClient: async (clientId: string): Promise<TechnicalVisit[]> => {
    const { data } = await api.get(`/visits/client/${clientId}`);
    return data;
  },

  create: async (visit: Partial<TechnicalVisit> | FormData): Promise<TechnicalVisit> => {
    if (visit instanceof FormData) {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/visits`, {
        method: 'POST',
        body: visit,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!response.ok) throw new Error('Falha ao criar visita');
      return response.json();
    }

    const { data } = await api.post('/visits', visit);
    return data;
  },

  update: async (id: string, visit: Partial<TechnicalVisit>): Promise<TechnicalVisit> => {
    const { data } = await api.patch(`/visits/${id}`, visit);
    return data;
  },

  addAttachments: async (id: string, attachments: FormData): Promise<void> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/visits/${id}/attachments`, {
      method: 'POST',
      body: attachments,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    if (!response.ok) {
      throw new Error('Falha ao enviar anexos');
    }
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/visits/${id}`);
  },

  checkin: async (
    id: string,
    coords: { lat: number; lng: number; accuracy?: number },
  ): Promise<TechnicalVisit> => {
    const { data } = await api.post(`/visits/${id}/checkin`, coords);
    return data;
  },

  checkout: async (
    id: string,
    coords: { lat: number; lng: number; accuracy?: number },
  ): Promise<TechnicalVisit> => {
    const { data } = await api.post(`/visits/${id}/checkout`, coords);
    return data;
  },
};
