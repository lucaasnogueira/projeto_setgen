export interface UserModuleAccess {
  id: number | string;
  userId: string;
  moduleId: number;
  isEnabled: boolean;
  module: {
    id: number;
    name: string;
    description: string;
    active: boolean;
  };
  activityAccess?: Array<{
    id: number | string;
    activityId: number;
    isEnabled: boolean;
    activity: {
      id: number;
      name: string;
      moduleId: number;
      isMandatory: boolean;
    };
  }>;
}

export interface ActivityAccess {
  id: number;
  name: string;
  isMandatory: boolean;
  isActive: boolean;
  permissions: string[];
  route?: string;
  label?: string;
  icon?: string;
  sortOrder?: number;
}

export interface ModuleAccess {
  id: number;
  name: string;
  description: string;
  isEnabled: boolean;
  userModuleAccessId: number | string | null;
  activities: ActivityAccess[];
  totalActivities: number;
  activeActivities: number;
  route?: string;
  icon?: string;
}

export interface UserModulesAccessStatus {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  modules: ModuleAccess[];
  summary: {
    totalModules: number;
    enabledModules: number;
    totalActivities: number;
    activeActivities: number;
  };
}

export interface ToggleModuleDto {
  isEnabled: boolean;
}

export interface BulkConfigureActivitiesDto {
  activities: Array<{
    activityId: number;
    isEnabled: boolean;
  }>;
}

export interface UserPermissionResponse {
  id: number | string;
  key: string;
  description: string;
  category: string;
  source: "mandatory_activity" | "optional_activity";
  activityName: string;
  moduleName: string;
}

export interface UserPermissionsResult {
  userId: string;
  userName: string;
  totalPermissions: number;
  permissions: UserPermissionResponse[];
}

