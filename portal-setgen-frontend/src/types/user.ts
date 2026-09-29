import { UserRole } from "./auth";
import { Company } from "./company";
import { UserModuleAccess } from "./access-control";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  position: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company;
  moduleAccess?: UserModuleAccess[];
  isActive?: boolean;
  active?: boolean;
  authProvider?: "LOCAL" | "AD" | string;
  adSamAccountName?: string | null;
  roleTitle?: string | null;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  companyId?: string;
  position?: string;
  authProvider?: "LOCAL" | "AD";
  adSamAccountName?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  companyId?: string;
  position?: string;
  isActive?: boolean;
}

