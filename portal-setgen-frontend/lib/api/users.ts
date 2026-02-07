import api from './client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ADMINISTRATIVE' | 'WAREHOUSE' | 'TECHNICIAN';
  active: boolean;
  createdAt: string;
  updatedAt: string;
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

  async create(userData: Partial<User> & { password: string }): Promise<User> {
    const { data } = await api.post('/users', userData);
    return data;
  },

  async update(id: string, userData: Partial<User>): Promise<User> {
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
};
