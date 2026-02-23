import { usersApi } from './users';
import { api } from './client';

export interface Permission {
  id: string;
  name?: string;
  description?: string;
}

export interface PermissionGroup {
  name: string;
  permissions: {
    id: string;
    label: string;
    description: string;
  }[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    users: number;
    permissions: number;
  };
  permissions?: {
    permission: Permission;
  }[];
}

export const rolesApi = {
  getAll: async (): Promise<Role[]> => {
    const response = await api.get('/roles');
    return response.data;
  },

  getOne: async (id: string): Promise<Role> => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  create: async (data: Partial<Role> & { permissionIds: string[] }): Promise<Role> => {
    const response = await api.post('/roles', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Role> & { permissionIds?: string[] }): Promise<Role> => {
    const response = await api.patch(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },

  getAvailablePermissions: async (): Promise<PermissionGroup[]> => {
    const response = await api.get('/permissions');
    return response.data;
  },
};
