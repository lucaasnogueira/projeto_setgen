"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleItem {
  id: string;
  name: string;
  code: string;
  description: string;
  route: string;
  icon: string;
  isEnabled?: boolean;
}

interface ModuleCardProps {
  module: ModuleItem;
  iconComponent: LucideIcon;
  isActive?: boolean;
}

export function ModuleCard({ module, iconComponent: Icon, isActive = false }: ModuleCardProps) {
  const router = useRouter();
  const isEnabled = module.isEnabled !== false;

  const handleNavigate = () => {
    if (!isEnabled) return;
    router.push(module.route);
  };

  return (
    <div
      onClick={handleNavigate}
      className={cn(
        "bg-white rounded-2xl border p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[175px] shadow-xs",
        isActive
          ? "border-2 border-[#E2661D] shadow-md"
          : "border-slate-200/80 hover:border-[#E2661D] hover:shadow-md"
      )}
    >
      <div>
        {/* Ícone com container arredondado pêssego/laranja */}
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors mb-3.5",
            isActive
              ? "bg-[#E2661D] text-white shadow-xs"
              : "bg-[#FFF3EC] text-[#E2661D] group-hover:bg-[#E2661D] group-hover:text-white"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Título do Módulo */}
        <h3 className="text-base font-bold text-slate-800 group-hover:text-[#E2661D] transition-colors">
          {module.name}
        </h3>

        {/* Descrição Operacional */}
        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
          {module.description}
        </p>
      </div>

      {/* Ação Inferior: Acessar Módulo > */}
      <div className="mt-5 flex items-center text-xs font-semibold text-[#E2661D] group-hover:translate-x-0.5 transition-transform">
        <span>Acessar Módulo</span>
        <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
      </div>
    </div>
  );
}
