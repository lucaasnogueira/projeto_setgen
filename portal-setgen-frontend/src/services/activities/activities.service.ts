import api from "../api";
import { Activity } from "@/types/activity";

export const activitiesService = {
  async findAll(): Promise<Activity[]> {
    try {
      const { data } = await api.get("/modules-catalog/activities");
      return data;
    } catch {
      return [];
    }
  },

  async findByModule(moduleId: number | string): Promise<Activity[]> {
    try {
      const { data } = await api.get(`/modules-catalog/modules/${moduleId}/activities`);
      return data;
    } catch {
      return [];
    }
  },

  async create(payload: Partial<Activity>): Promise<Activity> {
    const { data } = await api.post("/modules-catalog/activities", payload);
    return data;
  },

  async update(id: number | string, payload: Partial<Activity>): Promise<Activity> {
    const { data } = await api.patch(`/modules-catalog/activities/${id}`, payload);
    return data;
  },

  async delete(id: number | string): Promise<void> {
    await api.delete(`/modules-catalog/activities/${id}`);
  },
};

export default activitiesService;

