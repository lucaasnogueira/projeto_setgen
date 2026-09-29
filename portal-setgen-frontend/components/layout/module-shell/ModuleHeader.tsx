"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Zap } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";

interface ModuleHeaderProps {
  pageTitle?: string;
  moduleName?: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function ModuleHeader({
  pageTitle,
  moduleName = "Módulo Operacional",
  breadcrumbs,
}: ModuleHeaderProps) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  // Monta os itens do breadcrumb se não forem passados explicitamente
  const breadcrumbItems: BreadcrumbItem[] = breadcrumbs || [
    { label: "Módulos", href: "/modules" },
    { label: moduleName, href: "#" },
    ...(pageTitle ? [{ label: pageTitle }] : []),
  ];

  return (
    <header className="h-11 sticky top-0 z-30 bg-white border-b border-gray-200 text-gray-900 flex items-center justify-between px-4 sm:px-6 shrink-0 select-none">
      {/* Lado Esquerdo: Logo + Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <div
          onClick={() => router.push("/modules")}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          title="Ir para o Hub de Módulos"
        >
          <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center text-white shadow-2xs">
            <Zap className="w-3 h-3 fill-white text-white" />
          </div>
          <span className="font-bold text-xs tracking-wider uppercase hidden sm:inline text-gray-900">
            SETGEN
          </span>
        </div>

        {/* Separador vertical sutil */}
        <span className="h-4 w-px bg-gray-200 shrink-0" />

        {/* Componente Breadcrumb */}
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* Lado Direito: Nome do Usuário + Botão de Logout */}
      <div className="flex items-center gap-3 shrink-0 text-xs">
        <span className="font-medium text-gray-600 hidden sm:inline">
          {user?.name || "Lucas Silva"}
        </span>

        <button
          onClick={handleLogout}
          title="Encerrar Sessão"
          className="w-7 h-7 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-900 flex items-center justify-center transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
