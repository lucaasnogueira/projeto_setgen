"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthStore } from "@/store/auth";
import { getRoleLabel, cn } from "@/lib/utils";
import { UserRole } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { usersApi } from "@/lib/api/users";
import { isUserAuthorizedForRoute } from "@/lib/permissions";
import { MACRO_MODULES, MacroModule, ModuleSubItem } from "@/lib/modules-config";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, updateUser } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showModuleSwitcher, setShowModuleSwitcher] = useState(false);

  useEffect(() => {
    usersApi
      .getMe()
      .then((fresh: any) => {
        updateUser({
          role: fresh.role as unknown as UserRole,
          roleId: fresh.roleId,
          roleName: fresh.roleName || fresh.roleRef?.name,
          roleRef: fresh.roleRef,
          permissions: fresh.permissions,
        });
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  const roleName = user?.roleName || (user as any)?.roleRef?.name;
  const normRoleName = (roleName || "").toLowerCase().trim();
  const isAdmin =
    user?.role === UserRole.ADMIN &&
    !normRoleName.includes("administrativo") &&
    !normRoleName.includes("compras");

  // Filtra apenas módulos e itens aos quais o usuário tem permissão
  const allowedModules = useMemo(() => {
    if (!user?.role && !roleName) return [];

    return MACRO_MODULES.map((mod) => {
      // Bloqueio rigoroso de configurações para não-admins
      if (mod.id === "settings" && !isAdmin) {
        return null;
      }

      // Filtra itens permitidos do módulo
      const visibleItems = mod.items.filter((item) => {
        if (isAdmin) return true;
        if (!isUserAuthorizedForRoute(user?.role, item.href, roleName, user?.permissions)) {
          return false;
        }
        if (item.permissions?.length) {
          return item.permissions.some((p) => user?.permissions?.includes(p));
        }
        return true;
      });

      if (visibleItems.length === 0) return null;

      return {
        ...mod,
        items: visibleItems,
      };
    }).filter(Boolean) as (MacroModule & { items: ModuleSubItem[] })[];
  }, [user?.role, roleName, isAdmin, user?.permissions]);

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Prioridade: Se houver ?module= no URL e for válido
    const searchMod = new URLSearchParams(window.location.search).get("module");
    if (searchMod && allowedModules.some((m) => m.id === searchMod)) {
      setActiveModuleId(searchMod);
      try {
        sessionStorage.setItem("setgen_active_macro_module", searchMod);
      } catch {}
      return;
    }

    // 2. Se a rota atual pertence de forma exclusiva a um módulo
    const currentPath = pathname.split("?")[0];
    const matchingMods = allowedModules.filter((mod) => {
      // Ignora rotas compartilhadas como /operations na detecção estrita de exclusividade
      const exclusivePrefixes = mod.prefixes.filter((p) => p !== "/operations");
      return exclusivePrefixes.some((prefix) => currentPath === prefix || currentPath.startsWith(prefix + "/"));
    });

    if (matchingMods.length === 1) {
      setActiveModuleId(matchingMods[0].id);
      try {
        sessionStorage.setItem("setgen_active_macro_module", matchingMods[0].id);
      } catch {}
      return;
    }

    // 3. Se estiver em /operations sem parâmetro explícito, recupera do sessionStorage ou usa padrão
    if (currentPath === "/operations") {
      let saved: string | null = null;
      try {
        saved = sessionStorage.getItem("setgen_active_macro_module");
      } catch {}
      if (saved && (saved === "commercial" || saved === "operational") && allowedModules.some((m) => m.id === saved)) {
        setActiveModuleId(saved);
        return;
      }
      // Padrão se não houver histórico anterior: operacional
      setActiveModuleId("operational");
      try {
        sessionStorage.setItem("setgen_active_macro_module", "operational");
      } catch {}
    }
  }, [pathname, allowedModules]);

  // Identifica o módulo ativo com base no contexto ativo e no pathname
  const currentModule = useMemo(() => {
    if (!allowedModules.length) return null;

    if (activeModuleId) {
      const match = allowedModules.find((m) => m.id === activeModuleId);
      if (match) return match;
    }

    const currentPath = pathname.split("?")[0];
    let bestMatch: (MacroModule & { items: ModuleSubItem[] }) | null = null;
    let longestPrefix = "";

    for (const mod of allowedModules) {
      for (const prefix of mod.prefixes) {
        if (currentPath === prefix || currentPath.startsWith(prefix + "/")) {
          if (prefix.length > longestPrefix.length) {
            longestPrefix = prefix;
            bestMatch = mod;
          }
        }
      }
    }

    return bestMatch || allowedModules[0] || null;
  }, [pathname, allowedModules, activeModuleId]);

  const CurrentModIcon = currentModule?.icon;

  return (
    <div
      className={cn(
        "flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden bg-sidebar text-sidebar-fg transition-[width] duration-200 ease-out z-30 select-none",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      {/* 1. Topo: Logo Setgen + Botão de Recolher/Expandir */}
      <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-sidebar-border whitespace-nowrap">
        <button
          onClick={() => router.push("/modules")}
          className="flex items-center gap-2 min-w-0 text-left group transition-opacity hover:opacity-90"
          title="Ir para Todos os Módulos"
        >
          {collapsed ? (
            <div className="w-8 h-8 rounded-[8px] bg-[#E2661D] flex items-center justify-center shrink-0 shadow-sm shadow-orange-950/30">
              <span className="font-black text-white text-xs">S</span>
            </div>
          ) : (
            <Image
              src="/images/setgen-logo-white.png"
              alt="SETGEN"
              width={130}
              height={36}
              className="h-7 w-auto object-contain"
              priority
              unoptimized
            />
          )}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-[26px] h-[26px] rounded-[7px] bg-sidebar-hover text-sidebar-fg-muted flex items-center justify-center shrink-0 hover:text-white transition-colors"
          title={collapsed ? "Expandir Menu" : "Recolher Menu"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* 2. Botão de Atalho "Todos os Módulos" */}
      <div className="px-3 pt-3">
        <button
          onClick={() => router.push("/modules")}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 rounded-[9px] text-[12px] font-semibold bg-white/5 hover:bg-white/10 text-white transition-colors border border-sidebar-border/40",
            collapsed && "justify-center px-0"
          )}
          title="Voltar para a seleção de módulos"
        >
          <ArrowLeft className="w-4 h-4 text-[#E2661D] shrink-0" />
          {!collapsed && <span>Todos os Módulos</span>}
        </button>
      </div>

      {/* 3. Identificação do Módulo Atual com Switcher */}
      {currentModule && !collapsed && (
        <div className="px-3 pt-2.5 pb-2 border-b border-sidebar-border/60">
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-sidebar-hover/60 border border-sidebar-border/40">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#E2661D] text-white flex items-center justify-center shrink-0 shadow-xs">
                {CurrentModIcon && <CurrentModIcon className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#E2661D]">
                  {currentModule.badge}
                </div>
                <h3 className="text-[12.5px] font-bold text-white truncate leading-tight">
                  {currentModule.name}
                </h3>
              </div>
            </div>

            <button
              onClick={() => setShowModuleSwitcher(!showModuleSwitcher)}
              className="text-sidebar-fg-dim hover:text-white p-1 rounded transition-colors"
              title="Trocar de Módulo"
            >
              <ChevronDown
                className={cn("w-3.5 h-3.5 transition-transform duration-200", showModuleSwitcher && "rotate-180")}
              />
            </button>
          </div>

          {/* Dropdown de Troca Rápida de Módulo */}
          {showModuleSwitcher && (
            <div className="mt-2 p-1.5 bg-[#0C111D] border border-sidebar-border rounded-xl shadow-xl space-y-1">
              <div className="text-[10px] font-semibold text-sidebar-fg-dim px-2 py-1">
                Ambientes do Sistema:
              </div>
              {allowedModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    setShowModuleSwitcher(false);
                    setActiveModuleId(mod.id);
                    try {
                      sessionStorage.setItem("setgen_active_macro_module", mod.id);
                    } catch {}
                    router.push(mod.primaryHref);
                  }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors flex items-center justify-between",
                    mod.id === currentModule.id
                      ? "bg-[#E2661D] text-white font-bold"
                      : "text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <span className="truncate">{mod.name}</span>
                  <span className="text-[9px] opacity-70 ml-1">{mod.badge}</span>
                </button>
              ))}
              <div className="pt-1 border-t border-sidebar-border/40">
                <button
                  onClick={() => {
                    setShowModuleSwitcher(false);
                    router.push("/modules");
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#E2661D] hover:bg-sidebar-hover flex items-center gap-1.5"
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Ver Todos os Módulos
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Navegação do Módulo Específico Ativo */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 whitespace-nowrap scrollbar-thin-sidebar space-y-1">
        {currentModule?.items.map((item) => {
          const itemPath = item.href.split("?")[0];
          const currentPath = pathname.split("?")[0];
          const isActive = currentPath === itemPath || (itemPath !== "/" && currentPath.startsWith(itemPath + "/"));
          const SubIcon = item.icon;

          if (collapsed) {
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "w-full h-10 rounded-[9px] flex items-center justify-center transition-all relative group mb-1",
                  isActive
                    ? "bg-[#E2661D] text-white shadow-xs"
                    : "text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-white"
                )}
                title={item.name}
              >
                <SubIcon className="w-4 h-4 shrink-0" />
                {isActive && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r bg-white" />
                )}
              </button>
            );
          }

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12.5px] font-medium transition-colors text-left",
                isActive
                  ? "bg-[#E2661D] text-white font-bold shadow-2xs"
                  : "text-sidebar-fg-muted hover:bg-sidebar-hover hover:text-white"
              )}
              title={item.name}
            >
              <SubIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* 5. Perfil do Usuário e Logout */}
      <div className="border-t border-sidebar-border p-3 whitespace-nowrap bg-[#0C111D]/40">
        {user && (
          <div className="flex items-center gap-2.5 p-1.5 rounded-[9px] mb-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#E2661D] text-white font-bold text-[12px] flex items-center justify-center shrink-0 shadow-xs">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="min-w-0 overflow-hidden">
                <div className="text-white text-[12px] font-bold truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-sidebar-fg-dim text-[10.5px] truncate">
                  {roleName || getRoleLabel(user.role)}
                </div>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[9px] text-sidebar-fg-muted text-[12px] font-semibold hover:bg-sidebar-hover hover:text-white transition-colors"
          title={collapsed ? "Sair" : ""}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sair do Sistema</span>}
        </button>
      </div>
    </div>
  );
}
