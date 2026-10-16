"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CenteredModal } from "../modal/CenteredModal";
import {
  Wrench,
  Package,
  Calendar,
  FileSpreadsheet,
  Factory,
  Users,
  BarChart3,
  Settings,
  Search,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { MACRO_MODULES } from "@/lib/modules-config";

export interface PortalModule {
  id: string;
  name: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  color: string;
}

const defaultModules: PortalModule[] = MACRO_MODULES.map((m) => ({
  id: m.id,
  name: m.name,
  description: m.description,
  href: m.primaryHref,
  icon: m.icon,
  badge: m.badge,
  color: m.bgLight,
}));

export interface ModuleSwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modules?: PortalModule[];
  currentModuleId?: string;
}

export function ModuleSwitcherModal({
  open,
  onOpenChange,
  modules = defaultModules,
  currentModuleId = "orders",
}: ModuleSwitcherModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CenteredModal
      open={open}
      onOpenChange={onOpenChange}
      title="Navegador de Módulos Setgen"
      description="Acesse diretamente qualquer área operacional do sistema sem perder seu contexto."
      badge="8 Módulos"
      size="3xl"
    >
      <div className="space-y-4">
        {/* Barra de Pesquisa Rápida */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar módulo por nome ou funcionalidade..."
            className="pl-10 h-11 text-sm bg-slate-50/70 border-slate-200"
            autoFocus
          />
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {filteredModules.map((mod) => {
            const IconComponent = mod.icon;
            const isCurrent = mod.id === currentModuleId;

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleSelect(mod.href)}
                className={cn(
                  "flex items-start gap-3.5 p-3.5 rounded-xl border text-left transition-all group",
                  isCurrent
                    ? "bg-orange-50/50 border-orange-300 ring-2 ring-orange-200"
                    : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105",
                    mod.color
                  )}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-sm text-slate-900 group-hover:text-[#E2661D] transition-colors">
                      {mod.name}
                    </span>
                    {mod.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#E2661D]">
                        {mod.badge}
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    {mod.description}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#E2661D] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </div>
    </CenteredModal>
  );
}

