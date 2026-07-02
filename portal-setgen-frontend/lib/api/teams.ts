import api from './client';
import type { Team } from '@/types';

export const teamsApi = {
  getAll: async (active?: boolean): Promise<Team[]> => {
    const { data } = await api.get('/teams', { params: { active } });
    return data;
  },

  getOne: async (id: string): Promise<Team> => {
    const { data } = await api.get(`/teams/${id}`);
    return data;
  },

  create: async (team: Partial<Team> & { memberIds?: string[] }): Promise<Team> => {
    const { data } = await api.post('/teams', team);
    return data;
  },

  update: async (id: string, team: Partial<Team> & { memberIds?: string[] }): Promise<Team> => {
    const { data } = await api.patch(`/teams/${id}`, team);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },
};
