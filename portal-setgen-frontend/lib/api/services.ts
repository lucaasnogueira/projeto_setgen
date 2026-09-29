import api from './client';

export interface ServiceItem {
  id: string;
  title: string;
  name?: string;
  price: number;
  externalCode?: string;
  defaultObservation?: string;
  observationEditable?: boolean;
  active?: boolean;
  templates?: ServiceTemplateItem[];
}

export interface ServiceTemplateItem {
  id: string;
  serviceId: string;
  title: string;
  templateContent: string;
}

export const servicesApi = {
  async getAll(search?: string, active?: boolean): Promise<ServiceItem[]> {
    try {
      const { data } = await api.get('/services', { params: { search, active } });
      return data;
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<ServiceItem> {
    const { data } = await api.get(`/services/${id}`);
    return data;
  },

  async create(serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
    const { data } = await api.post('/services', serviceData);
    return data;
  },

  async update(id: string, serviceData: Partial<ServiceItem>): Promise<ServiceItem> {
    const { data } = await api.put(`/services/${id}`, serviceData);
    return data;
  },

  async toggleActive(id: string): Promise<ServiceItem> {
    const { data } = await api.delete(`/services/${id}`);
    return data;
  },

  async getTemplates(serviceId: string): Promise<ServiceTemplateItem[]> {
    const { data } = await api.get(`/services/${serviceId}/templates`);
    return data;
  },

  async createTemplate(serviceId: string, template: { title: string; templateContent: string }): Promise<ServiceTemplateItem> {
    const { data } = await api.post(`/services/${serviceId}/templates`, template);
    return data;
  },
};

