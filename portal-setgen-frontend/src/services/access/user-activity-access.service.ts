import api from "../api";
import { BulkConfigureActivitiesDto } from "@/types/access-control";

export const userActivityAccessService = {
  async configureBulkActivities(
    userId: string,
    moduleId: number,
    data: BulkConfigureActivitiesDto
  ): Promise<{ success: boolean; updatedCount: number; message?: string }> {
    const response = await api.put(
      `/access/users/${userId}/modules/${moduleId}/activities/bulk`,
      data
    );
    return response.data;
  },

  async clonePermissions(targetUserId: string, sourceUserId: string): Promise<any> {
    const response = await api.post(
      `/access/users/${targetUserId}/clone-from/${sourceUserId}`
    );
    return response.data;
  },
};

export default userActivityAccessService;

