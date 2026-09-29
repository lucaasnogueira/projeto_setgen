export interface ModuleGroup {
  id: number | string;
  name: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface AppModule {
  id: number;
  name: string;
  code?: string;
  description: string;
  route: string;
  icon?: string;
  sortOrder?: number;
  active: boolean;
  groupId?: number | string | null;
  group?: ModuleGroup | null;
  activitiesCount?: number;
}

