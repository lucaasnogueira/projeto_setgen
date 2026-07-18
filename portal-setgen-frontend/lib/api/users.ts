import api from './client';
import type { NotificationPrefs } from '@/types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ADMINISTRATIVE' | 'WAREHOUSE' | 'TECHNICIAN';
  roleId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  notifyPrefs?: NotificationPrefs | null;
  roleRef?: {
    name?: string;
    permissions?: { permission: { id: string; name: string } }[];
  };
  permissions?: { permission: { id: string; name: string } }[];
}

/** Shape returned by GET /users/me: permissions here are already flattened to effective permission names. */
export interface CurrentUser extends Omit<User, 'permissions'> {
  permissions?: string[];
}

export const usersApi = {
  async getAll(): Promise<User[]> {
    try {
      const { data } = await api.get('/users');
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  },

  async getById(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async create(userData: Partial<User> & { password: string, permissionIds?: string[] }): Promise<User> {
    const { data } = await api.post('/users', userData);
    return data;
  },

  async update(id: string, userData: Partial<User> & { permissionIds?: string[] }): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, userData);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleActive(id: string): Promise<User> {
    const { data } = await api.patch(`/users/${id}/toggle-active`);
    return data;
  },

  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.patch(`/users/${id}/reset-password`, { password: newPassword });
  },

  async getMe(): Promise<CurrentUser> {
    const { data } = await api.get('/users/me');
    return data;
  },

  async updateMe(profileData: { name?: string; email?: string }): Promise<User> {
    const { data } = await api.patch('/users/me', profileData);
    return data;
  },

  async updateMyNotifications(prefs: {
    approvals?: boolean;
    lowStock?: boolean;
    fuelRequests?: boolean;
    materialRequests?: boolean;
  }): Promise<User> {
    const { data } = await api.patch('/users/me/notifications', prefs);
    return data;
  },
};
