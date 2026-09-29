"use client";

import { useMemo } from "react";
import { usePermissions } from "./usePermissions";
import { useAuthContext } from "@/context/AuthContext";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  permission?: string;
  moduleName?: string;
  children?: NavItem[];
}

export function useNavigationWithPermissions(items: NavItem[]) {
  const { hasPermission, hasModuleAccess } = usePermissions();
  const { user } = useAuthContext();

  const filteredItems = useMemo(() => {
    // Administradores têm acesso irrestrito
    if (user?.role === "ADMIN") return items;

    return items
      .filter((item) => {
        if (item.permission && !hasPermission(item.permission)) return false;
        if (item.moduleName && !hasModuleAccess(item.moduleName)) return false;
        return true;
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter((sub) => {
              if (sub.permission && !hasPermission(sub.permission)) return false;
              if (sub.moduleName && !hasModuleAccess(sub.moduleName)) return false;
              return true;
            }),
          };
        }
        return item;
      });
  }, [items, user?.role, hasPermission, hasModuleAccess]);

  return { filteredItems };
}

export default useNavigationWithPermissions;

