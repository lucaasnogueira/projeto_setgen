import api from './client';

export interface SystemModule {
  id: string;
  code: string;
  name: string;
  description?: string;
  route: string;
  icon: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    permissions: number;
  };
}

export interface CreateSystemModuleDto {
  name: string;
  code?: string;
  description?: string;
  route: string;
  icon?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface UpdateSystemModuleDto extends Partial<CreateSystemModuleDto> {}

export const systemModulesApi = {
  getAll: async (onlyActive = false): Promise<SystemModule[]> => {
    const res = await api.get('/system-modules', { params: { onlyActive } });
    return res.data;
  },
  getById: async (id: string): Promise<SystemModule> => {
    const res = await api.get(`/system-modules/${id}`);
    return res.data;
  },
  create: async (data: CreateSystemModuleDto): Promise<SystemModule> => {
    const res = await api.post('/system-modules', data);
    return res.data;
  },
  update: async (id: string, data: UpdateSystemModuleDto): Promise<SystemModule> => {
    const res = await api.patch(`/system-modules/${id}`, data);
    return res.data;
  },
  toggleStatus: async (id: string): Promise<SystemModule> => {
    const res = await api.patch(`/system-modules/${id}/toggle-status`);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/system-modules/${id}`);
  },
};
