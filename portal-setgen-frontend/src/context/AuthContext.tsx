"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types/user";
import { UserPermissionsResult } from "@/types/access-control";
import api from "@/services/api";

interface AuthContextType {
  user: User | null;
  userPermissions: UserPermissionsResult | null;
  isLoading: boolean;
  refreshPermissions: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUserAndPermissions = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Buscar usuário logado
      const meResponse = await api.get("/users/me").catch(() => null);
      if (meResponse?.data) {
        setUser(meResponse.data);
        const uid = meResponse.data.id;

        // Buscar permissões resolvidas
        const permResponse = await api.get(`/access/users/${uid}/permissions`).catch(() => null);
        if (permResponse?.data) {
          setUserPermissions(permResponse.data);
        } else {
          // Fallback seguro: nenhuma permissão extra concedida se a API não retornar
          setUserPermissions({
            userId: uid,
            userName: meResponse.data.name,
            totalPermissions: 0,
            permissions: [],
          });
        }
      }
    } catch (err) {
      console.warn("Falha ao inicializar contexto de permissões:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUserAndPermissions();
  }, []);

  const refreshPermissions = async () => {
    await fetchCurrentUserAndPermissions();
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("auth-storage");
      window.location.replace("/auth/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userPermissions,
        isLoading,
        refreshPermissions,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}

