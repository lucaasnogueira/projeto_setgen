"use client"

import React from "react";
import { ModulePage } from "@/components/pages/modules/ModulePage";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
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
      <header className="h-12 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#E2661D] flex items-center justify-center text-white font-black text-xs">
            S
          </div>
          <span className="font-bold text-xs tracking-wider text-gray-900 uppercase">SETGEN</span>
        </div>

        {/* Lado Direito: Nome do Usuário + Logout Minimalista */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-medium text-gray-600">{user?.name || "Admin Setgen"}</span>
          <button onClick={handleLogout} className="px-3 h-8 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 flex items-center gap-2 font-medium transition-colors"><LogOut className="w-3.5 h-3.5" /> Sair</button>
        </div>
      </header>

      {/* Grade de Módulos */}
      <div className="flex-1 overflow-y-auto">
        <ModulePage />
      </div>

    </main>
  );
}