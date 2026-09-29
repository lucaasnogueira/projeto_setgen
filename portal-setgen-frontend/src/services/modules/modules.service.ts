import api from "../api";
import { AppModule, ModuleGroup } from "@/types/module";

export const modulesService = {
  async findAll(): Promise<AppModule[]> {
    try {
      const { data } = await api.get("/modules-catalog/modules");
      return Array.isArray(data) ? data : data.modules || [];
    } catch {
      const { data } = await api.get("/access-control/me/modules").catch(() => ({ data: [] }));
      return Array.isArray(data) ? data : data.modules || [];
    }
  },

  async findGroups(): Promise<ModuleGroup[]> {
    try {
      const { data } = await api.get("/modules-catalog/groups");
      return data;
    } catch {
      return [
        { id: 1, name: "Operações", icon: "Layers", sortOrder: 1, active: true },
        { id: 2, name: "Comercial", icon: "Receipt", sortOrder: 2, active: true },
        { id: 3, name: "Estoque", icon: "Package", sortOrder: 3, active: true },
        { id: 4, name: "Configurações", icon: "Shield", sortOrder: 4, active: true },
      ];
    }
  },

  async create(payload: Partial<AppModule>): Promise<AppModule> {
    const { data } = await api.post("/modules-catalog/modules", payload);
    return data;
  },

  async update(id: number | string, payload: Partial<AppModule>): Promise<AppModule> {
    const { data } = await api.patch(`/modules-catalog/modules/${id}`, payload);
    return data;
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/modules-catalog/modules/${id}`);
  },
};

export default modulesService;

