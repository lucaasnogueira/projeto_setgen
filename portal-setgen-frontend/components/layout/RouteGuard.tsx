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
  if (user && !isUserAuthorizedForRoute(user.role, pathname)) {
    const defaultRoute = getDefaultRouteForRole(user.role);

    return (
      <div className="flex items-center justify-center min-h-[75vh] px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-100 p-8 text-center shadow-lg shadow-red-950/5 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200/60 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Acesso Restrito
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              O seu perfil de acesso (<strong>{user.role}</strong>) não possui permissão para visualizar este módulo ou rota do sistema.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <Button
              onClick={() => router.push(defaultRoute)}
              className="w-full rounded-xl bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs h-10 gap-2 shadow-xs"
            >
              <LayoutGrid className="w-4 h-4" />
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
