"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MacroModule } from "@/lib/modules-config";

// Interface retrocompatível caso outros componentes importem ModuleItem
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
  module: MacroModule | (ModuleItem & { badge?: string });
  iconComponent?: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

export function ModuleCard({ module, iconComponent: CustomIcon, isActive = false }: ModuleCardProps) {
  const router = useRouter();

  const isMacro = "primaryHref" in module;
  const targetRoute = isMacro ? (module as MacroModule).primaryHref : (module as ModuleItem).route;
  const Icon = isMacro ? (module as MacroModule).icon : CustomIcon;
  const title = module.name;
  const description = module.description;

  const handleClick = () => {
    if (isMacro) {
      try {
        sessionStorage.setItem("setgen_active_macro_module", (module as MacroModule).id);
      } catch {}
    }
    router.push(targetRoute);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "bg-white rounded-2xl border p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between min-h-[160px] shadow-2xs hover:shadow-md hover:border-[#E2661D]/60 hover:-translate-y-0.5 relative overflow-hidden",
        isActive
          ? "border-[#E2661D] ring-2 ring-[#E2661D]/15"
          : "border-gray-200/80"
      )}
    >
      <div>
        {/* Ícone */}
        <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#E2661D] flex items-center justify-center transition-all duration-200 group-hover:bg-[#E2661D] group-hover:text-white shadow-xs mb-4">
          {Icon && <Icon className="w-6 h-6" />}
        </div>

        {/* Título com seta indicadora */}
        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#E2661D] transition-colors leading-snug flex items-center justify-between">
          <span>{title}</span>
          <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#E2661D] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </h3>

        {/* Legenda */}
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
