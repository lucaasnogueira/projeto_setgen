"use client";

import React, { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthContext } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface RouteGuardProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredModule?: string;
  fallback?: ReactNode;
}

export function RouteGuard({
  children,
  requiredPermission,
  requiredModule,
  fallback,
}: RouteGuardProps) {
  const { hasPermission, hasModuleAccess, isLoading } = usePermissions();
  const { user } = useAuthContext();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-xs text-muted-foreground">Validando credenciais e acessos...</p>
      </div>
    );
  }

  // Administrador tem bypass de segurança
  if (user?.role === "ADMIN") {
    return <>{children}</>;
  }

  const isModuleAllowed = !requiredModule || hasModuleAccess(requiredModule);
  const isPermissionAllowed = !requiredPermission || hasPermission(requiredPermission);

  if (!isModuleAllowed || !isPermissionAllowed) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="max-w-md mx-auto my-16 p-6 border rounded-2xl bg-card text-center shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-foreground">Acesso Não Autorizado (403)</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Seu perfil não possui autorização para acessar esta funcionalidade ou módulo no Portal.
        </p>
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/modules")}
            className="rounded-xl text-xs gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RouteGuard;

