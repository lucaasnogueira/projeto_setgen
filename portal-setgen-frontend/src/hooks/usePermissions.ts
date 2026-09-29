"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useMemo } from "react";

export function usePermissions() {
  const { userPermissions } = useAuthContext();

  const permissions = useMemo(() => {
    if (!userPermissions) return [];
    return userPermissions.permissions || [];
  }, [userPermissions]);

  const hasPermission = (permissionKey: string): boolean => {
    return permissions.some((p) => p.key === permissionKey);
  };

  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    return permissionKeys.some((key) => hasPermission(key));
  };

  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    return permissionKeys.every((key) => hasPermission(key));
  };

  const hasModuleAccess = (moduleName: string): boolean => {
    return permissions.some((p) => p.moduleName === moduleName);
  };

  const hasActivityAccess = (activityName: string): boolean => {
    return permissions.some((p) => p.activityName === activityName);
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    hasActivityAccess,
    isLoading: !userPermissions,
  };
}

export default usePermissions;

