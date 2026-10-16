import api from './client';

export interface ServiceItem {
  id: string;
  title: string;
  name?: string;
  category?: string;
  unit?: string;
  price: number;
  externalCode?: string;
  defaultObservation?: string;
  observationEditable?: boolean;
  active?: boolean;
  templates?: ServiceTemplateItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceTemplateItem {
  id: string;
  serviceId: string;
  title: string;
  templateContent: string;
}

export const servicesApi = {
  async getAll(params?: { search?: string; active?: boolean; category?: string } | string, active?: boolean): Promise<ServiceItem[]> {
    try {
      let queryParams: any = {};
      if (typeof params === 'string') {
        queryParams = { search: params, active };
      } else if (params) {
        queryParams = params;
      }
      const { data } = await api.get('/services', { params: queryParams });
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

  async delete(id: string): Promise<void> {
    await api.delete(`/services/${id}/hard`);
  },

  async bulkImport(services: Partial<ServiceItem>[]): Promise<{ count: number }> {
    const { data } = await api.post('/services/bulk-import', { services });
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
