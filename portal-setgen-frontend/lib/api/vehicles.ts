import api from './client';
import type { Vehicle, VehicleTrip } from '@/types';

export const vehiclesApi = {
  getAll: async (): Promise<Vehicle[]> => {
    const { data } = await api.get('/vehicles');
    return data;
  },

  getOne: async (id: string): Promise<Vehicle> => {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  },

  create: async (vehicle: Partial<Vehicle>): Promise<Vehicle> => {
    const { data } = await api.post('/vehicles', vehicle);
    return data;
  },

  update: async (id: string, vehicle: Partial<Vehicle>): Promise<Vehicle> => {
    const { data } = await api.patch(`/vehicles/${id}`, vehicle);
    return data;
  },

  uploadPhoto: async (id: string, file: File): Promise<Vehicle> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post(`/vehicles/${id}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateOil: async (id: string, oil: { lastOilChangeKm: number; oilChangeIntervalKm: number }): Promise<Vehicle> => {
    const { data } = await api.patch(`/vehicles/${id}/oil`, oil);
    return data;
  },

  createTrip: async (
    vehicleId: string,
    trip: { driverId: string; destination: string; startKm: number },
  ): Promise<VehicleTrip> => {
    const { data } = await api.post(`/vehicles/${vehicleId}/trips`, trip);
    return data;
  },

  finishTrip: async (tripId: string, endKm: number): Promise<VehicleTrip> => {
    const { data } = await api.patch(`/vehicles/trips/${tripId}/finish`, { endKm });
    return data;
  },

  getOpenTrips: async (): Promise<VehicleTrip[]> => {
    const { data } = await api.get('/vehicles/trips/open');
    return data;
  },

  getTrips: async (filters?: { vehicleId?: string; driverId?: string; from?: string; to?: string }): Promise<VehicleTrip[]> => {
    const { data } = await api.get('/vehicles/trips', { params: filters });
    return data;
  },
};
