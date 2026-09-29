import api from "../api";
import { User, CreateUserDto, UpdateUserDto } from "@/types/user";

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  roles?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedUsersResult {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usersService = {
  async findAll(params: UsersQueryParams = {}): Promise<PaginatedUsersResult> {
    try {
      const response = await api.get("/users", { params });
      const raw = response.data;
      if (Array.isArray(raw)) {
        return {
          data: raw,
          pagination: {
            total: raw.length,
            page: params.page || 1,
            limit: params.limit || raw.length || 10,
            totalPages: 1,
          },
        };
      }
      return {
        data: raw.data || [],
        pagination: raw.pagination || {
          total: (raw.data || []).length,
          page: params.page || 1,
          limit: params.limit || 10,
          totalPages: 1,
        },
      };
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return {
        data: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  },

  async findById(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data;
  },

  async create(payload: CreateUserDto): Promise<User> {
    const { data } = await api.post("/users", payload);
    return data;
  },

  async update(id: string, payload: UpdateUserDto): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleStatus(id: string, isActive: boolean): Promise<User> {
    const { data } = await api.patch(`/users/${id}/toggle-active`, { isActive });
    return data;
  },

  async resetPassword(id: string): Promise<{ success: boolean; message?: string }> {
    const { data } = await api.post(`/users/${id}/reset-password`);
    return data;
  },
};

export default usersService;

