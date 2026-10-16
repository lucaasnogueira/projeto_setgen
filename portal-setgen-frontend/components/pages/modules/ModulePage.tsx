"use client";

import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  Search,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { ModuleCard } from "./ModuleCard";
import { useAuthStore } from "@/store/auth";
import { isUserAuthorizedForRoute } from "@/lib/permissions";
import { MACRO_MODULES, MacroModule } from "@/lib/modules-config";
import { UserRole } from "@/types";

export function ModulePage() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [persistedActiveId, setPersistedActiveId] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      setPersistedActiveId(sessionStorage.getItem("setgen_active_macro_module"));
    } catch {}
  }, []);

  const roleName = user?.roleName || (user as any)?.roleRef?.name;
  const normRoleName = (roleName || "").toLowerCase().trim();
  const isAdmin =
    user?.role === UserRole.ADMIN &&
    !normRoleName.includes("administrativo") &&
    !normRoleName.includes("compras");

  // Filtra apenas os macro-módulos com itens autorizados para o usuário
  const userModules = useMemo(() => {
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
    }).filter(Boolean) as MacroModule[];
  }, [user?.role, roleName, isAdmin, user?.permissions]);

  // Filtro de busca inteligente (busca no título do módulo, descrição e nos nomes dos sub-itens)
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return userModules;
    const q = searchQuery.toLowerCase().trim();

    return userModules.filter((m) => {
      const nameMatch = m.name?.toLowerCase().includes(q) || m.shortName?.toLowerCase().includes(q);
      const descMatch = m.description?.toLowerCase().includes(q);
      const badgeMatch = m.badge?.toLowerCase().includes(q);
      const subItemMatch = m.items.some(
        (sub) => sub.name.toLowerCase().includes(q) || sub.description?.toLowerCase().includes(q)
      );

      return nameMatch || descMatch || badgeMatch || subItemMatch;
    });
  }, [userModules, searchQuery]);

  const formattedDate = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return formatter.format(new Date()).toUpperCase();
    } catch {
      return "PORTAL SETGEN";
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#F8FAFC]">
      <section className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* Cabeçalho do Hub */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#E2661D] text-xs font-bold mb-2">
            <Layers className="w-3.5 h-3.5" />
            Ecossistema de Gestão Setgen
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            Ambientes e Módulos Operacionais
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-lg mx-auto">
            Acesse as áreas de trabalho organizadas por competência operacional, financeira e comercial.
          </p>
          <p className="text-[10.5px] font-semibold tracking-wider text-gray-400 mt-1 uppercase">
            {formattedDate}
          </p>
        </div>

        {/* BARRA DE PESQUISA INTELIGENTE */}
        <div className="mb-8 max-w-xl mx-auto space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar módulo ou funcionalidade (ex: Orçamentos, Estoque, NF-e, O.S., Frotas)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E2661D]/30 focus:border-[#E2661D] transition-all shadow-2xs placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpar pesquisa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
            <span>
              {filteredModules.length === userModules.length
                ? `${userModules.length} módulos estruturais ativos`
                : `${filteredModules.length} de ${userModules.length} módulos encontrados`}
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[#E2661D] hover:underline font-semibold"
              >
                Limpar filtro
              </button>
            )}
          </div>
        </div>

        {/* EMPTY STATE - SEM RESULTADOS NA BUSCA */}
        {userModules.length > 0 && filteredModules.length === 0 && (
          <div className="max-w-md mx-auto bg-white border border-gray-200/80 rounded-2xl p-6 text-center shadow-2xs my-6">
            <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-2.5">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">Nenhum módulo encontrado</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">
              Não encontramos nenhum módulo ou funcionalidade correspondente a &quot;<strong>{searchQuery}</strong>&quot;.
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="px-4 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Ver todos os módulos
            </button>
          </div>
        )}

        {/* GRID DOS 6 MACRO-MÓDULOS */}
        {filteredModules.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                iconComponent={module.icon}
                isActive={persistedActiveId ? module.id === persistedActiveId : false}
              />
            ))}
          </div>
        )}

        {/* EMPTY STATE - SEM MÓDULOS PARA O PERFIL */}
        {userModules.length === 0 && (
          <div className="max-w-sm mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-xs my-10">
            <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">Nenhum Módulo Liberado</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Seu perfil de usuário ainda não possui permissões atribuídas para os módulos do sistema. Solicite acesso ao administrador.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
