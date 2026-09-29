"use client";

import { useMemo } from "react";
import { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth";

export interface NavSubItem {
  label: string;
  href: string;
  requiredPermissions?: string[];
}

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  requiredPermissions?: string[];
  children?: NavSubItem[];
}

export function useNavigationWithPermissions(items: NavItem[]): NavItem[] {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const userPermissions = useMemo(
    () => new Set(user?.permissions || []),
    [user?.permissions]
  );

  const checkPermission = (required?: string[]) => {
    if (isAdmin) return true;
    if (!required || required.length === 0) return true;
    return required.some((perm) => userPermissions.has(perm));
  };

  return useMemo(() => {
    if (isAdmin) return items;

    return items
      .map((item) => {
        // Se o item tem sub-itens, filtra os sub-itens autorizados
        if (item.children && item.children.length > 0) {
          const visibleChildren = item.children.filter((sub) =>
            checkPermission(sub.requiredPermissions)
          );

          // Se tiver pelo menos 1 sub-item liberado, mantém o grupo
          if (visibleChildren.length > 0) {
            return {
              ...item,
              children: visibleChildren,
            };
          }

          // Se nenhum sub-item estiver liberado e não tiver rota própria, descarta
          if (!item.href || !checkPermission(item.requiredPermissions)) {
            return null;
          }
        }

        // Item simples sem filhos
        if (checkPermission(item.requiredPermissions)) {
          return item;
        }

        return null;
      })
      .filter((item): item is NavItem => item !== null);
  }, [items, isAdmin, userPermissions]);
}

