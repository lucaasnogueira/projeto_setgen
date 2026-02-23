import { api } from './client';
import { Employee, ASO, EmployeeDocument, EmployeeStatus, PaginatedResponse } from '@/types';

export const employeeApi = {
  getAll: async (status?: EmployeeStatus, page: number = 1, limit: number = 20) => {
    const response = await api.get<PaginatedResponse<Employee>>('/employees', {
      params: { status, page, limit },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  create: async (data: Partial<Employee>) => {
    const response = await api.post<Employee>('/employees', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Employee>) => {
    const response = await api.patch<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },

  // ASO
  getAsos: async (employeeId: string, page: number = 1, limit: number = 20) => {
    const response = await api.get<PaginatedResponse<ASO>>(`/employees/${employeeId}/asos`, {
      params: { page, limit },
    });
    return response.data;
  },

  addAso: async (employeeId: string, formData: FormData) => {
    const response = await api.post<ASO>(`/employees/${employeeId}/asos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAso: async (asoId: string) => {
    const response = await api.delete(`/employees/asos/${asoId}`);
    return response.data;
  },

  getExpiringAsos: async (days: number = 30) => {
    const response = await api.get<ASO[]>('/employees/asos/expiring', {
      params: { days },
    });
    return response.data;
  },

  // Documents
  getDocuments: async (employeeId: string, page: number = 1, limit: number = 20) => {
    const response = await api.get<PaginatedResponse<EmployeeDocument>>(`/employees/${employeeId}/documents`, {
      params: { page, limit },
    });
    return response.data;
  },

  addDocument: async (employeeId: string, formData: FormData) => {
    const response = await api.post<EmployeeDocument>(`/employees/${employeeId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDocument: async (docId: string) => {
    const response = await api.delete(`/employees/documents/${docId}`);
    return response.data;
  },
};
