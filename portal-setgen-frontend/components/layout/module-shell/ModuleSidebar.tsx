"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Building2,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import {
  useNavigationWithPermissions,
  NavItem,
} from "@/hooks/useNavigationWithPermissions";
import { cn } from "@/lib/utils";

interface ModuleSidebarProps {
  moduleName?: string;
  moduleRoute?: string;
  navigationItems: NavItem[];
}

export function ModuleSidebar({
  moduleName = "Módulo Atual",
  moduleRoute = "/modules",
  navigationItems,
}: ModuleSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Filtra itens e sub-rotas conforme as permissões do usuário
  const filteredNavigation = useNavigationWithPermissions(navigationItems);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full shrink-0 select-none",
        "bg-[#0C111D] border-r border-slate-800/80 text-slate-300",
        "transition-all duration-300 ease-in-out z-20",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Botão de alternância Retrátil */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center shadow-xs transition-colors z-30"
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Cabeçalho da Sidebar: Identificação do Módulo */}
      <div className="h-12 px-4 flex items-center gap-2.5 border-b border-slate-800/60 shrink-0 overflow-hidden">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 truncate">
              {moduleName}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              Setgen Operacional
            </span>
          </div>
        )}
      </div>

      {/* Card de Identificação do Usuário */}
      <div className="p-3 border-b border-slate-800/60 shrink-0">
        <div
          onClick={() => router.push("/profile")}
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 cursor-pointer transition-colors group",
            collapsed && "justify-center p-2"
          )}
          title={collapsed ? (user?.name || "Usuário") : "Minha Conta"}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-xs font-bold text-slate-100 truncate group-hover:text-orange-400 transition-colors">
                {user?.name || "Lucas Silva"}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                Minha Conta
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Navegação com Scroll */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {/* Item Fixo do Topo: Início / Módulos (Retorna ao Hub) */}
        <div className="relative group">
          <Link
            href="/modules"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300",
              "hover:bg-slate-800 hover:text-white transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <Home className="w-4 h-4 text-orange-400 shrink-0" />
            {!collapsed && <span>Início / Módulos</span>}
          </Link>
          {/* Tooltip no modo colapsado */}
          {collapsed && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
              Início / Módulos
            </div>
          )}
        </div>

        <div className="my-2 border-t border-slate-800/80" />

        {/* Itens do Módulo */}
        {filteredNavigation.map((item) => {
          const ItemIcon = item.icon;
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isGroupOpen = expandedGroups[item.label] ?? true;
          const isDirectActive = item.href ? pathname === item.href : false;
          const isAnyChildActive = item.children?.some(
            (child) => pathname === child.href
          );
          const isActive = isDirectActive || isAnyChildActive;

          // Se tem sub-rotas/filhos: renderiza como grupo colapsável
          if (hasChildren) {
            return (
              <div key={item.label} className="space-y-1">
                <div className="relative group">
                  <button
                    onClick={() => toggleGroup(item.label)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      isActive
                        ? "text-white bg-slate-800/70"
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <ItemIcon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate">
                          {item.label}
                        </span>
                        {isGroupOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </>
                    )}
                  </button>

                  {collapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </div>

                {/* Sub-itens indentados (quando expandido) */}
                {!collapsed && isGroupOpen && item.children && (
                  <div className="space-y-1 pl-9 pr-1 py-1">
                    {item.children.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={cn(
                            "relative flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all truncate",
                            isSubActive
                              ? "bg-orange-500/15 text-white border border-orange-500/30"
                              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/30"
                          )}
                        >
                          {/* Barra indicadora lateral brilhante */}
                          {isSubActive && (
                            <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                          )}
                          <span className="truncate">{sub.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Item Simples sem filhos
          return (
            <div key={item.label} className="relative group">
              <Link
                href={item.href || "#"}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  isDirectActive
                    ? "bg-orange-500/15 text-white border border-orange-500/30 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                  collapsed && "justify-center px-2"
                )}
              >
                {/* Barra indicadora lateral brilhante na borda esquerda */}
                {isDirectActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-500 rounded-r-full shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                )}
                <ItemIcon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors",
                    isDirectActive ? "text-orange-400" : "text-slate-400"
                  )}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>

              {/* Tooltip flutuante no modo colapsado */}
              {collapsed && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
