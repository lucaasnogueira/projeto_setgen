"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { isUserAuthorizedForRoute, getDefaultRouteForRole } from "@/lib/permissions";
import { ShieldAlert, ArrowLeft, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteGuardProps {
  children: React.ReactNode;
}

export function RouteGuard({ children }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  // Se o usuário estiver autenticado e não tiver autorização para a rota atual
  const effectiveRoleName = user?.roleName || (user as any)?.roleRef?.name;
  if (user && !isUserAuthorizedForRoute(user.role, pathname, effectiveRoleName, user.permissions)) {
    const defaultRoute = getDefaultRouteForRole(user.role, effectiveRoleName);

    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4">
        <div className="max-w-md w-full bg-white rounded-xl border border-red-100 p-6 text-center shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200/60 shadow-2xs">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-gray-900">
              Acesso Restrito
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              O seu perfil de acesso (<strong>{effectiveRoleName || user.role}</strong>) não possui permissão para visualizar este módulo ou rota do sistema.
            </p>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <Button
              onClick={() => router.push(defaultRoute)}
              className="w-full rounded-lg bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-9 gap-2 shadow-2xs"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Ir para Meus Módulos Autorizados
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full rounded-xl border-gray-200 text-gray-600 font-bold text-xs h-10 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar à Página Anterior
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
