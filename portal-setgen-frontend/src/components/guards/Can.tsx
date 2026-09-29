"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthContext } from "@/context/AuthContext";

interface CanProps {
  access?: string;
  anyAccess?: string[];
  allAccess?: string[];
  module?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({
  access,
  anyAccess,
  allAccess,
  module,
  children,
  fallback = null,
}: CanProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasModuleAccess } = usePermissions();
  const { user } = useAuthContext();

  if (user?.role === "ADMIN") {
    return <>{children}</>;
  }

  if (module && !hasModuleAccess(module)) {
    return <>{fallback}</>;
  }

  if (access && !hasPermission(access)) {
    return <>{fallback}</>;
  }

  if (anyAccess && !hasAnyPermission(anyAccess)) {
    return <>{fallback}</>;
  }

  if (allAccess && !hasAllPermissions(allAccess)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default Can;

