export interface Activity {
  id: number;
  moduleId: number;
  name: string;
  label?: string;
  route?: string;
  isMandatory: boolean;
  active: boolean;
  sortOrder?: number;
  icon?: string;
  permissions?: string[];
}

