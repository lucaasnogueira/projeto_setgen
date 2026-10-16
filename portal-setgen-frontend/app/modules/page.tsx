"use client"

import React from "react";
import { ModulePage } from "@/components/pages/modules/ModulePage";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import Image from "next/image";
import { LogOut } from "lucide-react";

export default function ModulesSelectionPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  return (
    <main className="fixed inset-0 flex flex-col bg-[#FAFAFB] overflow-hidden">
      
      {/* Topbar Global Minimalista (Presente no Hub de Módulos) */}
      <header className="h-14 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          <Image
            src="/images/setgen-logo.png"
            alt="SETGEN - Serviços Técnicos em Geradores de Energia"
            width={180}
            height={64}
            className="h-9 w-auto object-contain"
            priority
            unoptimized
          />
        </div>

        {/* Lado Direito: Nome do Usuário + Cargo + Logout Minimalista */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{user?.name || "Lucas Silva"}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
              {user?.roleName || (user?.role === "ADMIN" ? "Administrador" : "Operacional")}
            </span>
          </div>
          <button onClick={handleLogout} className="px-2.5 h-7 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 flex items-center gap-1.5 font-medium transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      {/* Grade de Módulos */}
      <div className="flex-1 overflow-y-auto">
        <ModulePage />
      </div>

    </main>
  );
}