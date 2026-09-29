import api from './client';
import type { NotificationPrefs } from '@/types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ADMINISTRATIVE' | 'WAREHOUSE' | 'TECHNICIAN';
  roleId?: string;
  login?: string;
  jobTitle?: string;
  company?: string;
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
  /**
   * Lista enxuta (id/nome/perfil) dos usuarios ativos, para dropdown.
   * getAll() exige ADMIN/MANAGER — quem e ADMINISTRATIVE tomava 403 e ficava
   * com a combo vazia sem entender por que.
   */
  async getSelectable(): Promise<User[]> {
    try {
      const { data } = await api.get('/users/selectable');
      return data;
    } catch (error) {
      console.error('Erro ao buscar usuarios para selecao:', error);
      return [];
    }
  },

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

  async getPermissions(id: string): Promise<any> {
    const { data } = await api.get(`/users/${id}/permissions`);
    return data;
  },

  async updatePermissions(id: string, permissions: Record<string, boolean>): Promise<any> {
    const { data } = await api.patch(`/users/${id}/permissions`, permissions);
    return data;
  },

  async updateOperational(id: string, opData: any): Promise<any> {
    const { data } = await api.patch(`/users/${id}/operational`, opData);
    return data;
  },

  async getAttachments(id: string): Promise<any[]> {
    const { data } = await api.get(`/users/${id}/attachments`);
    return data;
  },

  async addAttachment(id: string, fileData: { fileName: string; fileUrl: string; fileSize?: number; fileType?: string }): Promise<any> {
    const { data } = await api.post(`/users/${id}/attachments`, fileData);
    return data;
  },

  async deleteAttachment(id: string, attachmentId: string): Promise<void> {
    await api.delete(`/users/${id}/attachments/${attachmentId}`);
  },
};
