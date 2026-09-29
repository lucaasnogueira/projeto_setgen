"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { ModuleHeader } from "./ModuleHeader";
import { ModuleSidebar } from "./ModuleSidebar";
import { NavItem } from "@/hooks/useNavigationWithPermissions";
import { useAuthStore } from "@/store/auth";

export interface ModuleGuardOptions {
  moduleRoute?: string;
  requiredPermissions?: string[];
  mode?: "AND" | "OR";
}

export interface ModuleHeaderOptions {
  pageTitle?: string;
}

interface ModuleRouteShellProps {
  guard?: ModuleGuardOptions;
  header?: ModuleHeaderOptions;
  moduleName?: string;
  navigationItems?: NavItem[];
  children: React.ReactNode;
}

export function ModuleRouteShell({
  guard,
  header,
  moduleName = "Módulo Setgen",
  navigationItems = [],
  children,
}: ModuleRouteShellProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  // Verificação de permissões do Guard
  const isAuthorized = useMemo(() => {
    if (!guard || !guard.requiredPermissions || guard.requiredPermissions.length === 0) {
      return true;
    }
    if (isAdmin) {
      return true;
    }

    const userPerms = new Set(user?.permissions || []);
    const mode = guard.mode || "OR";

    return mode === "AND"
      ? guard.requiredPermissions.every((p) => userPerms.has(p))
      : guard.requiredPermissions.some((p) => userPerms.has(p));
  }, [guard, isAdmin, user?.permissions]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50">
      {/* 1. Header Superior */}
      <ModuleHeader
        pageTitle={header?.pageTitle}
        moduleName={moduleName}
      />

      {/* 2. Corpo: Sidebar Retrátil Dark + Área de Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar Lateral */}
        <ModuleSidebar
          moduleName={moduleName}
          moduleRoute={guard?.moduleRoute || "/modules"}
          navigationItems={navigationItems}
        />

        {/* Área Principal (<main>) */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6 md:p-8">
          {isAuthorized ? (
            children
          ) : (
            /* Bloqueio de Acesso Elegante caso o usuário não tenha permissão */
            <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                Seu perfil não possui autorização para acessar esta funcionalidade
                específica. Se você necessita deste recurso, solicite permissão ao
                administrador do sistema.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => router.push(guard?.moduleRoute || "/modules")}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao Início do Módulo
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
